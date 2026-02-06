import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import type { Boom } from "@hapi/boom";
import type { ConnectionState, WAMessageContent, WAProto, WASocket } from "@whiskeysockets/baileys";
import { DisconnectReason, makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys";
import pino from "pino";

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null) return defaultValue;

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on", "sim"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off", "nao", "não"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

const SESSION_DIR_ENV = process.env.BAILEYS_SESSION_DIR?.trim();
const SESSIONS_DIR = path.resolve(
  __dirname,
  SESSION_DIR_ENV && SESSION_DIR_ENV.length > 0 ? SESSION_DIR_ENV : "../../.baileys-sessions"
);
const BAILEYS_ENABLE_LOGGING = parseBooleanEnv(process.env.BAILEYS_ENABLE_LOGGING, false);
const BAILEYS_LOG_LEVEL = BAILEYS_ENABLE_LOGGING ? "warn" : "silent";
const DEFAULT_RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

export type BaileysConnectionStatus = "connecting" | "connected" | "disconnected";

export interface BaileysSessionStatus {
  connected: boolean;
  status: BaileysConnectionStatus;
  qr?: string;
  phone?: string;
  jid?: string;
  lastDisconnectReason?: string;
  reconnectAttempts: number;
}

export interface BaileysConnectionEventPayload {
  event: "connection.update";
  mentoradoId: number;
  status: BaileysConnectionStatus;
  connected: boolean;
  qr?: string;
  phone?: string;
  jid?: string;
  reason?: string;
  reconnectAttempts: number;
  timestamp: string;
}

export interface BaileysQrEventPayload {
  event: "qr";
  mentoradoId: number;
  status: "connecting";
  connected: false;
  qr: string;
  reconnectAttempts: number;
  timestamp: string;
}

export interface BaileysMessageEventPayload {
  event: "message";
  mentoradoId: number;
  message: WAProto.IWebMessageInfo;
  phone: string;
  jid: string;
  content: string;
  timestamp: string;
}

export interface BaileysContactEventPayload {
  event: "contacts";
  mentoradoId: number;
  contacts: Array<{ phone: string; name: string | null }>;
  timestamp: string;
}

interface SessionRuntime {
  socket: WASocket;
  qr?: string;
  status: BaileysConnectionStatus;
  phone?: string;
  jid?: string;
  reconnectAttempts: number;
  reconnectTimer?: ReturnType<typeof setTimeout>;
  connectPromise?: Promise<void>;
  shouldRun: boolean;
  generation: number;
  lastDisconnectReason?: string;
}

const DISCONNECTED_SOCKET = {
  end: () => undefined,
} as unknown as WASocket;

const logger = pino({ level: BAILEYS_LOG_LEVEL, name: "baileys" });

class BaileysService extends EventEmitter {
  private sessions = new Map<number, SessionRuntime>();

  private generations = new Map<number, number>();

  private getSessionPath(mentoradoId: number) {
    return path.join(SESSIONS_DIR, `session-${mentoradoId}`);
  }

  normalizePhone(phoneOrJid: string): string {
    const jid = this.normalizeJid(phoneOrJid);
    return jid.replace(/@s\.whatsapp\.net$/, "").replace(/\D/g, "");
  }

  normalizeJid(phoneOrJid: string): string {
    const trimmed = phoneOrJid.trim();
    if (trimmed.includes("@")) {
      const [local] = trimmed.split("@");
      const [localWithoutDevice] = local.split(":");
      const normalizedLocal = localWithoutDevice.replace(/\D/g, "");
      return `${normalizedLocal}@s.whatsapp.net`;
    }

    return `${trimmed.replace(/\D/g, "")}@s.whatsapp.net`;
  }

  extractPhoneFromJid(jid?: string | null): string | undefined {
    if (!jid) return undefined;
    const [local] = jid.split("@");
    const [localWithoutDevice] = local.split(":");
    const normalized = localWithoutDevice.replace(/\D/g, "");
    return normalized.length > 0 ? normalized : undefined;
  }

  private extractTextContent(content?: WAMessageContent | null): string {
    if (!content) return "";

    const normalizedContent: WAMessageContent =
      content.ephemeralMessage?.message ??
      content.viewOnceMessage?.message ??
      content.viewOnceMessageV2?.message ??
      content;

    if (normalizedContent.conversation) {
      return normalizedContent.conversation;
    }

    if (normalizedContent.extendedTextMessage?.text) {
      return normalizedContent.extendedTextMessage.text;
    }

    if (normalizedContent.imageMessage?.caption) {
      return normalizedContent.imageMessage.caption;
    }

    if (normalizedContent.videoMessage?.caption) {
      return normalizedContent.videoMessage.caption;
    }

    if (normalizedContent.documentMessage?.caption) {
      return normalizedContent.documentMessage.caption;
    }

    if (normalizedContent.buttonsResponseMessage?.selectedDisplayText) {
      return normalizedContent.buttonsResponseMessage.selectedDisplayText;
    }

    if (normalizedContent.listResponseMessage?.title) {
      return normalizedContent.listResponseMessage.title;
    }

    if (normalizedContent.templateButtonReplyMessage?.selectedDisplayText) {
      return normalizedContent.templateButtonReplyMessage.selectedDisplayText;
    }

    if (normalizedContent.imageMessage) {
      return "[📷 Image]";
    }

    if (normalizedContent.audioMessage) {
      return "[🎵 Audio]";
    }

    if (normalizedContent.videoMessage) {
      return "[🎬 Video]";
    }

    if (normalizedContent.documentMessage) {
      return "[📄 Document]";
    }

    if (normalizedContent.stickerMessage) {
      return "[Sticker]";
    }

    return "";
  }

  private nextGeneration(mentoradoId: number): number {
    const current = this.generations.get(mentoradoId) ?? 0;
    const next = current + 1;
    this.generations.set(mentoradoId, next);
    return next;
  }

  private emitQrEvent(session: SessionRuntime, mentoradoId: number, qr: string): void {
    const payload: BaileysQrEventPayload = {
      event: "qr",
      mentoradoId,
      status: "connecting",
      connected: false,
      qr,
      reconnectAttempts: session.reconnectAttempts,
      timestamp: new Date().toISOString(),
    };

    this.emit("qr", payload);
  }

  private emitConnectionEvent(session: SessionRuntime, mentoradoId: number, reason?: string): void {
    const payload: BaileysConnectionEventPayload = {
      event: "connection.update",
      mentoradoId,
      status: session.status,
      connected: session.status === "connected",
      qr: session.qr,
      phone: session.phone,
      jid: session.jid,
      reason,
      reconnectAttempts: session.reconnectAttempts,
      timestamp: new Date().toISOString(),
    };

    this.emit("connection.update", payload);
  }

  private emitMessageEvent(payload: BaileysMessageEventPayload): void {
    this.emit("message", payload);
  }

  private clearReconnectTimer(session?: SessionRuntime): void {
    if (!session?.reconnectTimer) return;
    clearTimeout(session.reconnectTimer);
    session.reconnectTimer = undefined;
  }

  private getReconnectDelayMs(reconnectAttempts: number): number {
    const delay = DEFAULT_RECONNECT_DELAY_MS * Math.max(1, reconnectAttempts);
    return Math.min(delay, MAX_RECONNECT_DELAY_MS);
  }

  private scheduleReconnect(mentoradoId: number, session: SessionRuntime): void {
    if (!session.shouldRun) return;

    this.clearReconnectTimer(session);
    const delayMs = this.getReconnectDelayMs(session.reconnectAttempts);
    const expectedGeneration = session.generation;

    session.reconnectTimer = setTimeout(() => {
      const active = this.sessions.get(mentoradoId);
      if (!active || !active.shouldRun || active.generation !== expectedGeneration) {
        return;
      }

      void this.connect(mentoradoId).catch((error) => {
        const current = this.sessions.get(mentoradoId);
        if (!current || !current.shouldRun || current.generation !== expectedGeneration) {
          return;
        }

        current.status = "disconnected";
        current.lastDisconnectReason = error instanceof Error ? error.message : "reconnect_failed";
        current.reconnectAttempts += 1;
        this.emitConnectionEvent(current, mentoradoId, current.lastDisconnectReason);
        this.scheduleReconnect(mentoradoId, current);
      });
    }, delayMs);
  }

  private isSessionPersisted(mentoradoId: number): boolean {
    const authPath = this.getSessionPath(mentoradoId);
    if (!fs.existsSync(authPath)) return false;

    try {
      return fs.readdirSync(authPath).length > 0;
    } catch {
      return false;
    }
  }

  getSessionIds(): number[] {
    return Array.from(this.sessions.keys());
  }

  getAllSessionStatuses(): Record<number, BaileysSessionStatus> {
    const entries = this.getSessionIds().map((mentoradoId) => {
      const status = this.getSessionStatusSync(mentoradoId);
      return [mentoradoId, status] as const;
    });

    return Object.fromEntries(entries);
  }

  private getSessionStatusSync(mentoradoId: number): BaileysSessionStatus {
    const session = this.sessions.get(mentoradoId);
    if (!session) {
      return {
        connected: false,
        status: "disconnected",
        reconnectAttempts: 0,
      };
    }

    return {
      connected: session.status === "connected",
      status: session.status,
      qr: session.qr,
      phone: session.phone,
      jid: session.jid,
      lastDisconnectReason: session.lastDisconnectReason,
      reconnectAttempts: session.reconnectAttempts,
    };
  }

  async getSessionStatus(mentoradoId: number): Promise<BaileysSessionStatus> {
    const current = this.getSessionStatusSync(mentoradoId);
    if (current.status !== "disconnected") {
      return current;
    }

    if (this.isSessionPersisted(mentoradoId)) {
      try {
        await this.connect(mentoradoId);
      } catch {
        return this.getSessionStatusSync(mentoradoId);
      }
      return {
        connected: false,
        status: "connecting",
        reconnectAttempts: 0,
      };
    }

    return current;
  }

  async connect(mentoradoId: number): Promise<void> {
    const existing = this.sessions.get(mentoradoId);
    if (existing?.status === "connected") {
      return;
    }

    if (
      existing?.status === "connecting" &&
      existing.shouldRun &&
      existing.socket !== DISCONNECTED_SOCKET
    ) {
      return;
    }

    if (existing?.connectPromise) {
      return existing.connectPromise;
    }

    const generation = this.nextGeneration(mentoradoId);
    const connectPromise = this.createConnection(mentoradoId, generation);

    if (existing) {
      existing.status = "connecting";
      existing.connectPromise = connectPromise;
      existing.shouldRun = true;
      existing.generation = generation;
      this.clearReconnectTimer(existing);
      this.emitConnectionEvent(existing, mentoradoId);
    } else {
      const pendingSession: SessionRuntime = {
        socket: DISCONNECTED_SOCKET,
        status: "connecting",
        reconnectAttempts: 0,
        shouldRun: true,
        generation,
        connectPromise,
      };
      this.sessions.set(mentoradoId, pendingSession);
      this.emitConnectionEvent(pendingSession, mentoradoId);
    }

    return connectPromise;
  }

  private async createConnection(mentoradoId: number, generation: number): Promise<void> {
    try {
      // biome-ignore lint/correctness/useHookAtTopLevel: useMultiFileAuthState is not a React hook
      const { state, saveCreds } = await useMultiFileAuthState(this.getSessionPath(mentoradoId));

      const socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger,
        browser: ["Neon Dash", "Chrome", "1.0.0"],
      });

      const previous = this.sessions.get(mentoradoId);
      if (
        previous?.socket &&
        previous.socket !== socket &&
        previous.socket !== DISCONNECTED_SOCKET
      ) {
        this.clearReconnectTimer(previous);
        try {
          previous.socket.end(undefined);
        } catch {
          // no-op
        }
      }

      const session: SessionRuntime = {
        socket,
        status: "connecting",
        reconnectAttempts: previous?.reconnectAttempts ?? 0,
        shouldRun: true,
        generation,
        connectPromise: undefined,
        phone: previous?.phone,
        jid: previous?.jid,
      };

      this.sessions.set(mentoradoId, session);
      this.emitConnectionEvent(session, mentoradoId);

      socket.ev.on("creds.update", saveCreds);

      socket.ev.on("connection.update", (update: Partial<ConnectionState>) => {
        const active = this.sessions.get(mentoradoId);
        if (!active || active.socket !== socket || active.generation !== generation) {
          return;
        }

        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          active.qr = qr;
          active.status = "connecting";
          this.emitQrEvent(active, mentoradoId, qr);
        }

        if (connection === "connecting") {
          active.status = "connecting";
          this.emitConnectionEvent(active, mentoradoId);
          return;
        }

        if (connection === "open") {
          this.clearReconnectTimer(active);
          active.status = "connected";
          active.qr = undefined;
          active.reconnectAttempts = 0;
          active.lastDisconnectReason = undefined;
          active.jid = socket.user?.id;
          active.phone = this.extractPhoneFromJid(socket.user?.id) ?? active.phone;
          this.emitConnectionEvent(active, mentoradoId);
          return;
        }

        if (connection === "close") {
          active.status = "disconnected";
          active.qr = undefined;

          const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut && active.shouldRun;
          const reason =
            typeof statusCode === "number"
              ? `disconnect:${statusCode}`
              : ((lastDisconnect?.error as Error | undefined)?.message ?? "disconnect:unknown");

          active.lastDisconnectReason = reason;
          active.reconnectAttempts += 1;
          this.emitConnectionEvent(active, mentoradoId, reason);

          logger.info(
            {
              mentoradoId,
              statusCode,
              shouldReconnect,
              reconnectAttempts: active.reconnectAttempts,
            },
            "baileys connection closed"
          );

          if (!shouldReconnect) {
            void this.disconnect(mentoradoId, {
              clearAuth: statusCode === DisconnectReason.loggedOut,
            });
            return;
          }

          this.scheduleReconnect(mentoradoId, active);
        }
      });

      socket.ev.on("messages.upsert", (m) => {
        const active = this.sessions.get(mentoradoId);
        if (!active || active.socket !== socket || m.type !== "notify") {
          return;
        }

        for (const msg of m.messages) {
          if (msg.key.fromMe) continue;
          const jid = msg.key.remoteJid;
          if (!jid) continue;
          if (jid.endsWith("@g.us")) continue;

          const normalizedJid = this.normalizeJid(jid);
          const phone = this.extractPhoneFromJid(normalizedJid);
          if (!phone) continue;

          const payload: BaileysMessageEventPayload = {
            event: "message",
            mentoradoId,
            message: msg,
            phone,
            jid: normalizedJid,
            content: this.extractTextContent(msg.message),
            timestamp: new Date().toISOString(),
          };

          this.emitMessageEvent(payload);
        }
      });

      // Handle contact updates (names, push names)
      socket.ev.on("contacts.upsert", (contacts) => {
        const active = this.sessions.get(mentoradoId);
        if (!active || active.socket !== socket) {
          return;
        }

        const contactList: Array<{ phone: string; name: string | null }> = [];
        for (const contact of contacts) {
          if (!contact.id) continue;
          // Skip groups
          if (contact.id.endsWith("@g.us")) continue;

          const phone = this.extractPhoneFromJid(contact.id);
          if (!phone) continue;

          // Use notify (push name) or name
          const name = contact.notify || contact.name || null;
          if (name) {
            contactList.push({ phone, name });
          }
        }

        if (contactList.length > 0) {
          const payload: BaileysContactEventPayload = {
            event: "contacts",
            mentoradoId,
            contacts: contactList,
            timestamp: new Date().toISOString(),
          };
          this.emit("contacts", payload);
        }
      });
    } catch (error) {
      const active = this.sessions.get(mentoradoId);
      if (active && active.generation === generation) {
        active.status = "disconnected";
        active.lastDisconnectReason = error instanceof Error ? error.message : "connect_failed";
        active.reconnectAttempts += 1;
        this.emitConnectionEvent(active, mentoradoId, active.lastDisconnectReason);
      }
      throw error;
    } finally {
      const active = this.sessions.get(mentoradoId);
      if (active && active.generation === generation) {
        active.connectPromise = undefined;
      }
    }
  }

  async disconnect(mentoradoId: number, options?: { clearAuth?: boolean }): Promise<void> {
    const session = this.sessions.get(mentoradoId);
    if (session) {
      session.shouldRun = false;
      this.clearReconnectTimer(session);

      try {
        session.socket.end(undefined);
      } catch {
        // no-op
      }

      this.sessions.delete(mentoradoId);
    }

    if (options?.clearAuth) {
      const sessionPath = this.getSessionPath(mentoradoId);
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
      }
    }

    const disconnectedStatus: SessionRuntime = {
      socket: session?.socket ?? DISCONNECTED_SOCKET,
      status: "disconnected",
      reconnectAttempts: session?.reconnectAttempts ?? 0,
      shouldRun: false,
      generation: session?.generation ?? this.nextGeneration(mentoradoId),
      phone: session?.phone,
      jid: session?.jid,
      lastDisconnectReason: session?.lastDisconnectReason,
    };

    this.emitConnectionEvent(
      disconnectedStatus,
      mentoradoId,
      disconnectedStatus.lastDisconnectReason
    );
  }

  async logout(mentoradoId: number): Promise<void> {
    await this.disconnect(mentoradoId, { clearAuth: true });

    const persistedPath = this.getSessionPath(mentoradoId);
    if (fs.existsSync(persistedPath)) {
      fs.rmSync(persistedPath, { recursive: true, force: true });
    }
  }

  async sendMessage(mentoradoId: number, phone: string, text: string) {
    const session = this.sessions.get(mentoradoId);
    if (!session || session.status !== "connected") {
      throw new Error("WhatsApp not connected");
    }

    const jid = this.normalizeJid(phone);
    return await session.socket.sendMessage(jid, { text });
  }
}

export const baileysService = new BaileysService();
