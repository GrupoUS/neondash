/**
 * OpenClawGatewayService - WebSocket communication with OpenClaw Gateway
 *
 * Handles:
 * - Persistent WebSocket connection to gateway (ws://127.0.0.1:18789)
 * - Multi-session pool management (Map<sessionId, SessionContext>)
 * - User-to-sessions mapping for multiple channels per user
 * - Client WebSocket proxy for real-time messaging
 * - WhatsApp QR code pairing with promise-based resolution
 * - Automatic reconnection on failures
 */

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { type RawData, WebSocket } from "ws";
import { openclawMessages, openclawSessions } from "../../drizzle/schema";
import { getDb } from "../db";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ChannelType = "webchat" | "whatsapp" | "telegram" | "slack";

interface SessionContext {
  sessionId: string;
  userId: number;
  channelType: ChannelType;
  isActive: boolean;
}

interface GatewayMessage {
  type: string;
  sessionId?: string;
  userId?: number;
  content?: string;
  qrCode?: string;
  expiresAt?: string;
  error?: string;
  channelType?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ClientMessage {
  type: "message" | "ping" | "terminate";
  content?: string;
  sessionId?: string;
}

interface QRCodePendingRequest {
  resolve: (value: { qrCode: string; expiresAt: Date }) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class OpenClawGatewayService {
  private gatewayWs: WebSocket | null = null;

  // Multi-session support: indexed by sessionId
  private activeSessions: Map<string, SessionContext> = new Map();

  // User-to-sessions mapping: userId -> Set<sessionId>
  private userSessions: Map<number, Set<string>> = new Map();

  // Client WebSocket connections: userId -> WebSocket
  private clientConnections: Map<number, WebSocket> = new Map();

  // Pending QR code requests: keyed by `${userId}:${channelType}`
  private pendingQRRequests: Map<string, QRCodePendingRequest> = new Map();

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private qrCodeTimeout = 120000; // 2 minutes
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private gatewayUrl: string;
  private mockMode: boolean;

  constructor() {
    this.gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || "ws://127.0.0.1:18789";
    // Enable mock mode if no gateway URL is configured or explicitly disabled
    this.mockMode = !process.env.OPENCLAW_GATEWAY_URL || process.env.OPENCLAW_MOCK_MODE === "true";
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Gateway Connection
  // ─────────────────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.gatewayWs = new WebSocket(this.gatewayUrl);

        this.gatewayWs.on("open", () => {
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        });

        this.gatewayWs.on("message", (data: RawData) => {
          this.handleGatewayMessage(data);
        });

        this.gatewayWs.on("close", () => {
          this.stopHeartbeat();
          this.scheduleReconnect();
        });

        this.gatewayWs.on("error", (error: Error) => {
          if (this.reconnectAttempts === 0) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    this.stopHeartbeat();

    // Clear all pending QR requests
    for (const [key, pending] of Array.from(this.pendingQRRequests)) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Server shutting down"));
      this.pendingQRRequests.delete(key);
    }

    // Close all client connections
    for (const [userId, ws] of Array.from(this.clientConnections)) {
      ws.close(1001, "Server shutting down");
      this.clientConnections.delete(userId);
    }

    // Close gateway connection
    if (this.gatewayWs) {
      this.gatewayWs.close();
      this.gatewayWs = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;

      setTimeout(() => {
        this.connect().catch(() => {
          // Silently ignore reconnection errors - will retry
        });
      }, delay);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.gatewayWs && this.gatewayWs.readyState === WebSocket.OPEN) {
        this.gatewayWs.ping();
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Session Management (Multi-Session Support)
  // ─────────────────────────────────────────────────────────────────────────

  async createSession(userId: number, channelType: ChannelType): Promise<string> {
    const db = getDb();

    // Check if user already has an active session for this channel type
    const existingSession = await db
      .select()
      .from(openclawSessions)
      .where(
        and(eq(openclawSessions.userId, userId), eq(openclawSessions.channelType, channelType))
      )
      .limit(1);

    let sessionId: string;

    if (existingSession.length > 0) {
      // Reactivate existing session
      sessionId = existingSession[0].sessionId;

      // Update to active if it wasn't
      if (existingSession[0].isActive !== "sim") {
        await db
          .update(openclawSessions)
          .set({ isActive: "sim", updatedAt: new Date() })
          .where(eq(openclawSessions.id, existingSession[0].id));
      }
    } else {
      // Create new session
      sessionId = randomUUID();

      await db.insert(openclawSessions).values({
        userId,
        channelType,
        sessionId,
        isActive: "sim",
      });
    }

    // Store in memory (indexed by sessionId)
    const context: SessionContext = {
      sessionId,
      userId,
      channelType,
      isActive: true,
    };
    this.activeSessions.set(sessionId, context);

    // Add to user-sessions mapping
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)?.add(sessionId);

    // Notify gateway
    this.sendToGateway({
      type: "SESSION_CREATE",
      sessionId,
      userId,
      channelType,
    });

    return sessionId;
  }

  async terminateSession(sessionId: string): Promise<boolean> {
    const db = getDb();

    // Update database
    await db
      .update(openclawSessions)
      .set({ isActive: "nao", updatedAt: new Date() })
      .where(eq(openclawSessions.sessionId, sessionId));

    // Remove from memory
    const session = this.activeSessions.get(sessionId);
    if (session) {
      this.activeSessions.delete(sessionId);

      // Remove from user-sessions mapping
      const userSessionSet = this.userSessions.get(session.userId);
      if (userSessionSet) {
        userSessionSet.delete(sessionId);
        if (userSessionSet.size === 0) {
          this.userSessions.delete(session.userId);
        }
      }
    }

    // Notify gateway
    this.sendToGateway({
      type: "SESSION_TERMINATE",
      sessionId,
    });

    return true;
  }

  async getSession(sessionId: string): Promise<SessionContext | null> {
    return this.activeSessions.get(sessionId) || null;
  }

  async getSessionsForUser(userId: number): Promise<SessionContext[]> {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return [];

    const sessions: SessionContext[] = [];
    for (const sessionId of Array.from(sessionIds)) {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Messaging
  // ─────────────────────────────────────────────────────────────────────────

  async sendMessage(sessionId: string, content: string, userId: number): Promise<number> {
    const db = getDb();

    // Get session from database
    const [dbSession] = await db
      .select()
      .from(openclawSessions)
      .where(eq(openclawSessions.sessionId, sessionId))
      .limit(1);

    if (!dbSession) {
      throw new Error("Session not found");
    }

    // Save user message to database
    const [message] = await db
      .insert(openclawMessages)
      .values({
        sessionId: dbSession.id,
        role: "user",
        content,
      })
      .returning({ id: openclawMessages.id });

    // Update session activity
    await db
      .update(openclawSessions)
      .set({ lastActivityAt: new Date(), updatedAt: new Date() })
      .where(eq(openclawSessions.id, dbSession.id));

    // If mock mode or gateway not connected, generate mock response
    if (this.mockMode || !this.isConnected()) {
      await this.generateMockResponse(sessionId, content, userId, dbSession.id);
    } else {
      // Send to gateway
      this.sendToGateway({
        type: "MESSAGE_SEND",
        sessionId,
        content,
        userId,
      });
    }

    return message.id;
  }

  /**
   * Generate AI response using the LLM provider
   * Falls back to mock responses if LLM is not configured
   */
  private async generateMockResponse(
    sessionId: string,
    userContent: string,
    userId: number,
    dbSessionId: number
  ): Promise<void> {
    const db = getDb();
    let aiContent: string;

    try {
      // Try to use real LLM if configured
      const { invokeLLM } = await import("../_core/llm");

      // Get conversation history for context
      const history = await this.getMessageHistory(dbSessionId, 10);

      // Build messages for LLM
      const messages = [
        {
          role: "system" as const,
          content: `Você é o Assistente NEON, um assistente de IA para mentoria de negócios. 
Você ajuda mentorados a analisar suas métricas de faturamento, leads, procedimentos e desempenho em redes sociais.
Seja conciso, útil e profissional. Responda sempre em português brasileiro.
Foque em dar insights práticos e acionáveis sobre os dados do mentorado.`,
        },
        ...history.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        {
          role: "user" as const,
          content: userContent,
        },
      ];

      const result = await invokeLLM({ messages });
      const choice = result.choices[0];

      if (choice?.message?.content) {
        aiContent =
          typeof choice.message.content === "string"
            ? choice.message.content
            : choice.message.content
                .filter((c): c is { type: "text"; text: string } => c.type === "text")
                .map((c) => c.text)
                .join("\n");
      } else {
        throw new Error("No content in LLM response");
      }
    } catch (_error) {
      // Fallback to mock responses if LLM fails or is not configured
      const mockResponses = [
        "Olá! Sou o Assistente NEON. Como posso ajudar você hoje com suas métricas de mentoria?",
        "Entendi sua pergunta. Analisando seus dados de faturamento e métricas...",
        "Com base nos seus dados atuais, posso sugerir algumas estratégias para melhorar seus resultados.",
        "Você está indo bem! Continue focando em suas metas e acompanhando suas métricas.",
        "Posso te ajudar a analisar suas métricas mensais e identificar oportunidades de melhoria.",
      ];
      aiContent = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    }

    // Save assistant message to database
    await db.insert(openclawMessages).values({
      sessionId: dbSessionId,
      role: "assistant",
      content: aiContent,
    });

    // Forward to client WebSocket
    const clientWs = this.clientConnections.get(userId);
    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: "message",
          sessionId,
          role: "assistant",
          content: aiContent,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  async getMessageHistory(sessionDbId: number, limit = 50) {
    const db = getDb();
    return db
      .select()
      .from(openclawMessages)
      .where(eq(openclawMessages.sessionId, sessionDbId))
      .orderBy(openclawMessages.createdAt)
      .limit(limit);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Client WebSocket Management
  // ─────────────────────────────────────────────────────────────────────────

  registerClientConnection(userId: number, ws: WebSocket): void {
    this.clientConnections.set(userId, ws);
  }

  unregisterClientConnection(userId: number): void {
    this.clientConnections.delete(userId);
  }

  async handleClientMessage(userId: number, message: ClientMessage): Promise<void> {
    switch (message.type) {
      case "message":
        if (message.sessionId && message.content) {
          // Validate session belongs to user
          const session = this.activeSessions.get(message.sessionId);
          if (session && session.userId === userId) {
            await this.sendMessage(message.sessionId, message.content, userId);
          }
        }
        break;

      case "terminate":
        if (message.sessionId) {
          const session = this.activeSessions.get(message.sessionId);
          if (session && session.userId === userId) {
            await this.terminateSession(message.sessionId);
          }
        }
        break;

      case "ping": {
        const clientWs = this.clientConnections.get(userId);
        if (clientWs && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: "pong" }));
        }
        break;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WhatsApp Pairing (Real QR Code Flow)
  // ─────────────────────────────────────────────────────────────────────────

  async requestQRCode(
    userId: number,
    channelType: ChannelType = "whatsapp"
  ): Promise<{ qrCode: string; expiresAt: Date }> {
    const requestKey = `${userId}:${channelType}`;

    // Clear any existing pending request
    const existing = this.pendingQRRequests.get(requestKey);
    if (existing) {
      clearTimeout(existing.timeout);
      existing.reject(new Error("New QR code request started"));
      this.pendingQRRequests.delete(requestKey);
    }

    return new Promise((resolve, reject) => {
      // Set timeout for QR code response
      const timeout = setTimeout(() => {
        this.pendingQRRequests.delete(requestKey);
        reject(new Error("QR code request timed out"));
      }, this.qrCodeTimeout);

      // Store pending request
      this.pendingQRRequests.set(requestKey, { resolve, reject, timeout });

      // Send request to gateway
      this.sendToGateway({
        type: "REQUEST_PAIRING",
        userId,
        channelType,
      });
    });
  }

  async disconnectWhatsApp(userId: number): Promise<boolean> {
    const db = getDb();

    const sessions = await db
      .select()
      .from(openclawSessions)
      .where(
        and(
          eq(openclawSessions.userId, userId),
          eq(openclawSessions.channelType, "whatsapp"),
          eq(openclawSessions.isActive, "sim")
        )
      );

    for (const session of sessions) {
      await this.terminateSession(session.sessionId);
    }

    return sessions.length > 0;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Gateway Communication
  // ─────────────────────────────────────────────────────────────────────────

  private sendToGateway(data: Record<string, unknown>): void {
    if (this.gatewayWs && this.gatewayWs.readyState === WebSocket.OPEN) {
      this.gatewayWs.send(JSON.stringify(data));
    } else {
    }
  }

  private async handleGatewayMessage(data: RawData): Promise<void> {
    try {
      const message: GatewayMessage = JSON.parse(data.toString());

      switch (message.type) {
        case "MESSAGE_RESPONSE":
          await this.handleIncomingMessage(message);
          break;

        case "QR_CODE":
          this.handleQRCodeResponse(message);
          break;

        case "PAIRING_SUCCESS":
          await this.handlePairingSuccess(message);
          break;

        case "ERROR":
          this.handleGatewayError(message);
          break;
      }
    } catch (_error) {}
  }

  private async handleIncomingMessage(message: GatewayMessage): Promise<void> {
    if (!message.sessionId || !message.content) return;

    const db = getDb();

    // Get session from database
    const [dbSession] = await db
      .select()
      .from(openclawSessions)
      .where(eq(openclawSessions.sessionId, message.sessionId))
      .limit(1);

    if (!dbSession) return;

    // Save assistant message to database
    await db.insert(openclawMessages).values({
      sessionId: dbSession.id,
      role: "assistant",
      content: message.content,
      metadata: message.metadata ? JSON.stringify(message.metadata) : null,
    });

    // Forward to client WebSocket (route by sessionId's userId)
    const clientWs = this.clientConnections.get(dbSession.userId);
    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: "message",
          sessionId: message.sessionId,
          role: "assistant",
          content: message.content,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  private handleQRCodeResponse(message: GatewayMessage): void {
    const { userId, channelType, qrCode, expiresAt } = message;

    if (!userId || !qrCode) {
      return;
    }

    const requestKey = `${userId}:${channelType || "whatsapp"}`;
    const pending = this.pendingQRRequests.get(requestKey);

    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingQRRequests.delete(requestKey);

      pending.resolve({
        qrCode,
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 60000),
      });

      // Also forward to client WebSocket for real-time display
      const clientWs = this.clientConnections.get(userId as number);
      if (clientWs && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: "qr_code",
            qrCode,
            expiresAt: expiresAt || new Date(Date.now() + 60000).toISOString(),
          })
        );
      }
    }
  }

  private handleGatewayError(message: GatewayMessage): void {
    // If there's a pending QR request for this user, reject it
    if (message.userId && message.channelType) {
      const requestKey = `${message.userId}:${message.channelType}`;
      const pending = this.pendingQRRequests.get(requestKey);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingQRRequests.delete(requestKey);
        pending.reject(new Error(message.error || "Gateway error"));
      }
    }
  }

  private async handlePairingSuccess(message: GatewayMessage): Promise<void> {
    if (!message.sessionId) return;

    const db = getDb();

    // Update session in database
    await db
      .update(openclawSessions)
      .set({ isActive: "sim", updatedAt: new Date() })
      .where(eq(openclawSessions.sessionId, message.sessionId));

    // Notify client
    const session = this.activeSessions.get(message.sessionId);
    if (session) {
      const clientWs = this.clientConnections.get(session.userId);
      if (clientWs && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: "pairing_success",
            sessionId: message.sessionId,
            channelType: session.channelType,
          })
        );
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Status
  // ─────────────────────────────────────────────────────────────────────────

  isConnected(): boolean {
    // In mock mode, always return true for UI to show connected
    if (this.mockMode) return true;
    return this.gatewayWs?.readyState === WebSocket.OPEN;
  }

  isMockMode(): boolean {
    return this.mockMode;
  }

  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

  getClientConnectionCount(): number {
    return this.clientConnections.size;
  }
}

// Singleton instance
export const openclawService = new OpenClawGatewayService();
