import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import type { Boom } from "@hapi/boom";
import type { ConnectionState, WASocket } from "@whiskeysockets/baileys";
import { DisconnectReason, makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys";
import pino from "pino";

const SESSIONS_DIR = path.resolve(__dirname, "../../.baileys-sessions");

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

interface BaileysSession {
  socket: WASocket;
  qr?: string;
  status: "connecting" | "connected" | "disconnected";
}

const logger = pino({ level: "warn", name: "baileys" });

class BaileysService extends EventEmitter {
  private sessions = new Map<number, BaileysSession>();

  private getSessionPath(mentoradoId: number) {
    return path.join(SESSIONS_DIR, `session-${mentoradoId}`);
  }

  async getSessionStatus(mentoradoId: number) {
    const session = this.sessions.get(mentoradoId);
    if (!session) {
      // Check if auth file exists to see if we should try to restore
      const authPath = this.getSessionPath(mentoradoId);
      if (fs.existsSync(authPath) && fs.readdirSync(authPath).length > 0) {
        // Try to restore session
        await this.connect(mentoradoId);
        return { connected: false, status: "connecting" };
      }
      return { connected: false, status: "disconnected" };
    }
    return {
      connected: session.status === "connected",
      status: session.status,
      qr: session.qr,
    };
  }

  async connect(mentoradoId: number): Promise<void> {
    if (this.sessions.has(mentoradoId)) {
      const session = this.sessions.get(mentoradoId)!;
      if (session.status === "connected") return;
    }

    // biome-ignore lint/correctness/useHookAtTopLevel: useMultiFileAuthState is NOT a React hook, it's a Baileys library function
    const { state, saveCreds } = await useMultiFileAuthState(this.getSessionPath(mentoradoId));

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: "silent" }) as ReturnType<typeof pino>,
      browser: ["Neon Dash", "Chrome", "1.0.0"],
    });

    this.sessions.set(mentoradoId, {
      socket: sock,
      status: "connecting",
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;
      const session = this.sessions.get(mentoradoId);

      if (session) {
        if (qr) {
          session.qr = qr;
          this.emit("qr", { mentoradoId, qr });
        }
        if (connection) {
          // map connection string (open, close, connecting) to our status
          session.status =
            connection === "open"
              ? "connected"
              : connection === "close"
                ? "disconnected"
                : "connecting";
        }
      }

      if (connection === "close") {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

        logger.info({ mentoradoId, shouldReconnect }, "Connection closed, reconnecting");

        if (shouldReconnect) {
          this.connect(mentoradoId);
        } else {
          // Clean up if logged out
          this.logout(mentoradoId);
        }
      } else if (connection === "open") {
        logger.info({ mentoradoId }, "Connection opened");
        if (session) {
          session.qr = undefined;
          session.status = "connected";
        }
        this.emit("connection.update", {
          mentoradoId,
          status: "connected",
          phone: sock.user?.id.split(":")[0],
        });
      }
    });

    sock.ev.on("messages.upsert", async (m) => {
      if (m.type === "notify") {
        for (const msg of m.messages) {
          if (!msg.key.fromMe) {
            this.emit("message", { mentoradoId, message: msg });
          }
        }
      }
    });
  }

  async logout(mentoradoId: number) {
    const session = this.sessions.get(mentoradoId);
    if (session) {
      session.socket.end(undefined);
      this.sessions.delete(mentoradoId);
    }

    // Clear auth files
    const sessionPath = this.getSessionPath(mentoradoId);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
  }

  async sendMessage(mentoradoId: number, phone: string, text: string) {
    const session = this.sessions.get(mentoradoId);
    if (!session || session.status !== "connected") {
      throw new Error("WhatsApp not connected");
    }

    const jid = phone.includes("@s.whatsapp.net") ? phone : `${phone}@s.whatsapp.net`;
    return await session.socket.sendMessage(jid, { text });
  }
}

export const baileysService = new BaileysService();
