/**
 * Baileys WhatsApp Service
 * Self-hosted WhatsApp integration using @whiskeysockets/baileys
 *
 * This service manages WhatsApp Web connections directly without external APIs
 */

import fs from "node:fs";
import path from "node:path";
import type { Boom } from "@hapi/boom";
import makeWASocket, {
  type ConnectionState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  type WASocket,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";

// Logger configuration (quiet in production)
const logger = pino({
  level: process.env.NODE_ENV === "production" ? "silent" : "warn",
});

// Store active connections per mentorado
const connections = new Map<
  number,
  {
    socket: WASocket;
    qrCode: string | null;
    status: "connecting" | "connected" | "disconnected";
    phone: string | null;
  }
>();

// Base path for auth state files
const AUTH_BASE_PATH = path.join(process.cwd(), ".baileys-auth");

/**
 * Get auth state path for a mentorado
 */
function getAuthPath(mentoradoId: number): string {
  const authPath = path.join(AUTH_BASE_PATH, `session-${mentoradoId}`);
  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }
  return authPath;
}

/**
 * Initialize or get existing WhatsApp connection for a mentorado
 */
async function initializeConnection(mentoradoId: number): Promise<{
  qrCode: string | null;
  status: "connecting" | "connected" | "disconnected";
  phone: string | null;
}> {
  // Check if already connected
  const existing = connections.get(mentoradoId);
  if (existing && existing.status === "connected") {
    return {
      qrCode: null,
      status: "connected",
      phone: existing.phone,
    };
  }

  // If connecting, return current QR
  if (existing && existing.status === "connecting") {
    return {
      qrCode: existing.qrCode,
      status: "connecting",
      phone: null,
    };
  }

  // Initialize new connection
  const authPath = getAuthPath(mentoradoId);
  // biome-ignore lint/correctness/useHookAtTopLevel: Not a React hook, Baileys auth function
  const { state, saveCreds } = await useMultiFileAuthState(authPath);

  // Fetch latest version for compatibility
  const { version } = await fetchLatestBaileysVersion();

  // Create socket
  const socket = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
    logger,
    browser: ["NeonDash", "Chrome", "1.0.0"],
    generateHighQualityLinkPreview: true,
  });

  // Store connection state
  connections.set(mentoradoId, {
    socket,
    qrCode: null,
    status: "connecting",
    phone: null,
  });

  // Handle connection updates
  socket.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
    const { connection, lastDisconnect, qr } = update;
    const conn = connections.get(mentoradoId);

    if (qr && conn) {
      // Generate QR code as data URL
      try {
        const qrDataUrl = await QRCode.toDataURL(qr, {
          width: 256,
          margin: 2,
        });
        conn.qrCode = qrDataUrl;
        conn.status = "connecting";
        connections.set(mentoradoId, conn);
      } catch (err) {
        logger.error({ err }, "Error generating QR code");
      }
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.info({ mentoradoId, statusCode }, "Baileys connection closed");

      if (shouldReconnect) {
        // Attempt reconnection
        setTimeout(() => initializeConnection(mentoradoId), 5000);
      } else {
        // User logged out, clean up
        if (conn) {
          conn.status = "disconnected";
          conn.qrCode = null;
          conn.phone = null;
          connections.set(mentoradoId, conn);
        }
      }
    }

    if (connection === "open" && conn) {
      logger.info({ mentoradoId }, "Baileys connected");
      conn.status = "connected";
      conn.qrCode = null;
      // Extract phone number from socket
      const phoneNumber = socket.user?.id?.split(":")[0] ?? null;
      conn.phone = phoneNumber;
      connections.set(mentoradoId, conn);
    }
  });

  // Save credentials on update
  socket.ev.on("creds.update", saveCreds);

  // Return initial state
  return {
    qrCode: null,
    status: "connecting",
    phone: null,
  };
}

/**
 * Get current connection status for a mentorado
 */
function getConnectionStatus(mentoradoId: number): {
  configured: boolean;
  connected: boolean;
  connecting: boolean;
  phone: string | null;
  qrCode: string | null;
} {
  const conn = connections.get(mentoradoId);
  if (!conn) {
    // Check if auth state exists
    const authPath = getAuthPath(mentoradoId);
    const credPath = path.join(authPath, "creds.json");
    const hasSession = fs.existsSync(credPath);

    return {
      configured: hasSession,
      connected: false,
      connecting: false,
      phone: null,
      qrCode: null,
    };
  }

  return {
    configured: true,
    connected: conn.status === "connected",
    connecting: conn.status === "connecting",
    phone: conn.phone,
    qrCode: conn.qrCode,
  };
}

/**
 * Get QR code for connection (triggers connection if not active)
 */
async function getQRCode(mentoradoId: number): Promise<{
  qrCode: string | null;
  connected: boolean;
}> {
  // Check existing connection
  const conn = connections.get(mentoradoId);
  if (conn) {
    if (conn.status === "connected") {
      return { qrCode: null, connected: true };
    }
    if (conn.qrCode) {
      return { qrCode: conn.qrCode, connected: false };
    }
  }

  // Initialize connection to generate QR
  await initializeConnection(mentoradoId);

  // Wait a bit for QR generation
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Get updated state
  const updated = connections.get(mentoradoId);
  return {
    qrCode: updated?.qrCode ?? null,
    connected: updated?.status === "connected",
  };
}

/**
 * Disconnect and logout WhatsApp session
 */
async function disconnect(mentoradoId: number): Promise<void> {
  const conn = connections.get(mentoradoId);
  if (conn?.socket) {
    await conn.socket.logout();
    connections.delete(mentoradoId);
  }

  // Clean up auth files
  const authPath = getAuthPath(mentoradoId);
  if (fs.existsSync(authPath)) {
    fs.rmSync(authPath, { recursive: true, force: true });
  }
}

/**
 * Send a text message
 */
async function sendTextMessage(
  mentoradoId: number,
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const conn = connections.get(mentoradoId);
  if (!conn || conn.status !== "connected") {
    return { success: false, error: "WhatsApp não conectado" };
  }

  try {
    // Format phone number (ensure @s.whatsapp.net suffix)
    const formattedPhone = formatPhoneForBaileys(phone);

    const result = await conn.socket.sendMessage(formattedPhone, {
      text: message,
    });

    return {
      success: true,
      messageId: result?.key?.id ?? undefined,
    };
  } catch (error) {
    logger.error({ error }, "Error sending message");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao enviar mensagem",
    };
  }
}

/**
 * Send media message (image/video/document)
 */
async function sendMediaMessage(
  mentoradoId: number,
  phone: string,
  mediaUrl: string,
  mediaType: "image" | "video" | "document",
  caption?: string,
  fileName?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const conn = connections.get(mentoradoId);
  if (!conn || conn.status !== "connected") {
    return { success: false, error: "WhatsApp não conectado" };
  }

  try {
    const formattedPhone = formatPhoneForBaileys(phone);

    let messageContent: Parameters<WASocket["sendMessage"]>[1];

    switch (mediaType) {
      case "image":
        messageContent = {
          image: { url: mediaUrl },
          caption,
        };
        break;
      case "video":
        messageContent = {
          video: { url: mediaUrl },
          caption,
        };
        break;
      case "document":
        messageContent = {
          document: { url: mediaUrl },
          mimetype: "application/octet-stream",
          fileName: fileName ?? "document",
          caption,
        };
        break;
    }

    const result = await conn.socket.sendMessage(formattedPhone, messageContent);

    return {
      success: true,
      messageId: result?.key?.id ?? undefined,
    };
  } catch (error) {
    logger.error({ error }, "Error sending media");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao enviar mídia",
    };
  }
}

/**
 * Get chat list
 * Note: Baileys doesn't persist chats, so we rely on database storage
 */
function getChats(_mentoradoId: number): Array<{
  phone: string;
  name: string | null;
  lastMessageTime: Date | null;
  unread: number;
}> {
  // Baileys doesn't persist chats in memory between restarts
  // Chat history is stored in the database via message handlers
  return [];
}

/**
 * Register message handler callback
 */
function onMessage(
  mentoradoId: number,
  callback: (message: {
    phone: string;
    content: string;
    messageId: string;
    timestamp: Date;
    fromMe: boolean;
  }) => void
): void {
  const conn = connections.get(mentoradoId);
  if (!conn?.socket) return;

  conn.socket.ev.on("messages.upsert", async (m) => {
    for (const msg of m.messages) {
      if (!msg.message) continue;

      const phone = msg.key.remoteJid?.replace("@s.whatsapp.net", "") ?? "";
      const content =
        msg.message.conversation || msg.message.extendedTextMessage?.text || "[Mídia]";

      callback({
        phone,
        content,
        messageId: msg.key.id ?? "",
        timestamp: new Date((msg.messageTimestamp as number) * 1000),
        fromMe: msg.key.fromMe ?? false,
      });
    }
  });
}

/**
 * Format phone number for Baileys (add @s.whatsapp.net)
 */
function formatPhoneForBaileys(phone: string): string {
  // Remove non-numeric characters
  let cleaned = phone.replace(/\D/g, "");

  // Add Brazil country code if not present
  if (!cleaned.startsWith("55") && cleaned.length <= 11) {
    cleaned = `55${cleaned}`;
  }

  return `${cleaned}@s.whatsapp.net`;
}

/**
 * Normalize phone number for comparison
 */
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Check if two phone numbers match (handling format differences)
 */
function phonesMatch(phone1: string, phone2: string): boolean {
  const n1 = normalizePhoneNumber(phone1);
  const n2 = normalizePhoneNumber(phone2);

  // Direct match
  if (n1 === n2) return true;

  // Handle Brazilian 9th digit variations
  // 55 11 9 1234 5678 vs 55 11 1234 5678
  if (n1.length === 13 && n2.length === 12) {
    return n1.slice(0, 4) + n1.slice(5) === n2;
  }
  if (n2.length === 13 && n1.length === 12) {
    return n2.slice(0, 4) + n2.slice(5) === n1;
  }

  return false;
}

// Export service
export const baileysService = {
  initializeConnection,
  getConnectionStatus,
  getQRCode,
  disconnect,
  sendTextMessage,
  sendMediaMessage,
  getChats,
  onMessage,
  normalizePhoneNumber,
  phonesMatch,
};
