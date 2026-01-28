/**
 * MoltbotGatewayService - WebSocket communication with Moltbot Gateway
 *
 * Handles:
 * - Persistent WebSocket connection to gateway (ws://127.0.0.1:18789)
 * - Multi-session pool management (Map<sessionId, SessionContext>)
 * - User-to-sessions mapping for multiple channels per user
 * - Client WebSocket proxy for real-time messaging
 * - WhatsApp QR code pairing with promise-based resolution
 * - Automatic reconnection on failures
 */

import { WebSocket, type RawData } from "ws";
import { getDb } from "../db";
import { moltbotSessions, moltbotMessages } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

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

class MoltbotGatewayService {
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

  constructor() {
    this.gatewayUrl =
      process.env.MOLTBOT_GATEWAY_URL || "ws://127.0.0.1:18789";
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Gateway Connection
  // ─────────────────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: "info",
            service: "moltbot",
            action: "connecting",
            url: this.gatewayUrl,
          })
        );

        this.gatewayWs = new WebSocket(this.gatewayUrl);

        this.gatewayWs.on("open", () => {
          console.log(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              level: "info",
              service: "moltbot",
              action: "connected",
            })
          );
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        });

        this.gatewayWs.on("message", (data: RawData) => {
          this.handleGatewayMessage(data);
        });

        this.gatewayWs.on("close", () => {
          console.log(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              level: "warn",
              service: "moltbot",
              action: "disconnected",
            })
          );
          this.stopHeartbeat();
          this.scheduleReconnect();
        });

        this.gatewayWs.on("error", (error: Error) => {
          console.error(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              level: "error",
              service: "moltbot",
              action: "error",
              error: error.message,
            })
          );
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

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        service: "moltbot",
        action: "shutdown",
      })
    );
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "info",
          service: "moltbot",
          action: "reconnecting",
          attempt: this.reconnectAttempts,
          delay,
        })
      );

      setTimeout(() => {
        this.connect().catch(console.error);
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

  async createSession(
    userId: number,
    channelType: ChannelType
  ): Promise<string> {
    const sessionId = randomUUID();
    const db = getDb();

    // Store in database
    const [dbSession] = await db
      .insert(moltbotSessions)
      .values({
        userId,
        channelType,
        sessionId,
        isActive: "sim",
      })
      .returning({ id: moltbotSessions.id });

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
    this.userSessions.get(userId)!.add(sessionId);

    // Notify gateway
    this.sendToGateway({
      type: "SESSION_CREATE",
      sessionId,
      userId,
      channelType,
    });

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        service: "moltbot",
        action: "sessionCreated",
        userId,
        sessionId,
        channelType,
        dbId: dbSession.id,
      })
    );

    return sessionId;
  }

  async terminateSession(sessionId: string): Promise<boolean> {
    const db = getDb();

    // Update database
    await db
      .update(moltbotSessions)
      .set({ isActive: "nao", updatedAt: new Date() })
      .where(eq(moltbotSessions.sessionId, sessionId));

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

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        service: "moltbot",
        action: "sessionTerminated",
        sessionId,
      })
    );

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

  async sendMessage(
    sessionId: string,
    content: string,
    userId: number
  ): Promise<number> {
    const db = getDb();

    // Get session from database
    const [dbSession] = await db
      .select()
      .from(moltbotSessions)
      .where(eq(moltbotSessions.sessionId, sessionId))
      .limit(1);

    if (!dbSession) {
      throw new Error("Session not found");
    }

    // Save user message to database
    const [message] = await db
      .insert(moltbotMessages)
      .values({
        sessionId: dbSession.id,
        role: "user",
        content,
      })
      .returning({ id: moltbotMessages.id });

    // Send to gateway
    this.sendToGateway({
      type: "MESSAGE_SEND",
      sessionId,
      content,
      userId,
    });

    // Update session activity
    await db
      .update(moltbotSessions)
      .set({ lastActivityAt: new Date(), updatedAt: new Date() })
      .where(eq(moltbotSessions.id, dbSession.id));

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        service: "moltbot",
        action: "messageSent",
        userId,
        sessionId,
        messageId: message.id,
      })
    );

    return message.id;
  }

  async getMessageHistory(sessionDbId: number, limit = 50) {
    const db = getDb();
    return db
      .select()
      .from(moltbotMessages)
      .where(eq(moltbotMessages.sessionId, sessionDbId))
      .orderBy(moltbotMessages.createdAt)
      .limit(limit);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Client WebSocket Management
  // ─────────────────────────────────────────────────────────────────────────

  registerClientConnection(userId: number, ws: WebSocket): void {
    this.clientConnections.set(userId, ws);

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        service: "moltbot",
        action: "clientConnected",
        userId,
        activeSessions: this.userSessions.get(userId)?.size || 0,
      })
    );
  }

  unregisterClientConnection(userId: number): void {
    this.clientConnections.delete(userId);

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        service: "moltbot",
        action: "clientDisconnected",
        userId,
      })
    );
  }

  async handleClientMessage(
    userId: number,
    message: ClientMessage
  ): Promise<void> {
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

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "info",
          service: "moltbot",
          action: "qrCodeRequested",
          userId,
          channelType,
        })
      );
    });
  }

  async disconnectWhatsApp(userId: number): Promise<boolean> {
    const db = getDb();

    const sessions = await db
      .select()
      .from(moltbotSessions)
      .where(
        and(
          eq(moltbotSessions.userId, userId),
          eq(moltbotSessions.channelType, "whatsapp"),
          eq(moltbotSessions.isActive, "sim")
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
      console.warn(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "warn",
          service: "moltbot",
          action: "gatewayNotConnected",
          data,
        })
      );
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
    } catch (error) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "error",
          service: "moltbot",
          action: "parseError",
          error: String(error),
        })
      );
    }
  }

  private async handleIncomingMessage(message: GatewayMessage): Promise<void> {
    if (!message.sessionId || !message.content) return;

    const db = getDb();

    // Get session from database
    const [dbSession] = await db
      .select()
      .from(moltbotSessions)
      .where(eq(moltbotSessions.sessionId, message.sessionId))
      .limit(1);

    if (!dbSession) return;

    // Save assistant message to database
    await db.insert(moltbotMessages).values({
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
      console.warn(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "warn",
          service: "moltbot",
          action: "invalidQRCodeResponse",
          message,
        })
      );
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

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "info",
          service: "moltbot",
          action: "qrCodeReceived",
          userId,
          channelType,
        })
      );

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
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        service: "moltbot",
        action: "gatewayError",
        error: message.error,
        sessionId: message.sessionId,
      })
    );

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
      .update(moltbotSessions)
      .set({ isActive: "sim", updatedAt: new Date() })
      .where(eq(moltbotSessions.sessionId, message.sessionId));

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

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        service: "moltbot",
        action: "pairingSuccess",
        sessionId: message.sessionId,
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Status
  // ─────────────────────────────────────────────────────────────────────────

  isConnected(): boolean {
    return this.gatewayWs?.readyState === WebSocket.OPEN;
  }

  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

  getClientConnectionCount(): number {
    return this.clientConnections.size;
  }
}

// Singleton instance
export const moltbotService = new MoltbotGatewayService();
