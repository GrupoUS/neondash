/**
 * Z-API Webhook Handler
 * Receives webhook notifications from Z-API for message events
 *
 * Webhook events:
 * - on-message-received: Incoming messages
 * - on-message-status: Message status updates (sent, delivered, read)
 * - on-disconnected: WhatsApp disconnection
 */
import { and, eq } from "drizzle-orm";
import type { Router } from "express";
import type { Lead } from "../../drizzle/schema";
import { leads, mentorados, statusLeadEnum, whatsappMessages } from "../../drizzle/schema";
import { createLogger } from "../_core/logger";
import { getDb } from "../db";
import { sseService } from "../services/sseService";
import { phonesMatch, zapiService } from "../services/zapiService";

const logger = createLogger({ service: "zapiWebhook" });

// Webhook payload types
export interface ZApiMessageReceivedPayload {
  instanceId: string;
  phone: string;
  messageId: string;
  messageType?: string;
  text?: { message: string };
  audio?: { audioUrl: string };
  image?: { imageUrl: string };
  video?: { videoUrl: string };
  document?: { documentUrl: string; fileName?: string; mimeType?: string };
  quotedMsgId?: string;
  quotedMessageId?: string;
  isGroup: boolean;
  momment: number;
  isFromMe: boolean;
  senderName?: string;
}

export interface ZApiMessageStatusPayload {
  instanceId: string;
  messageId: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  phone?: string;
}

export interface ZApiDisconnectedPayload {
  instanceId: string;
  reason?: string;
}

interface ZApiTypingPayload {
  instanceId: string;
  phone: string;
}

interface ZApiPresencePayload {
  instanceId: string;
  phone: string;
  isOnline: boolean;
  lastSeen?: number;
}

/**
 * Validate webhook request using Client-Token header
 */
function validateWebhookToken(token: string | undefined, expectedToken: string): boolean {
  return token === expectedToken;
}

/**
 * Find mentorado by Z-API instance ID
 */
async function findMentoradoByInstance(instanceId: string) {
  const db = getDb();
  const [mentorado] = await db
    .select()
    .from(mentorados)
    .where(eq(mentorados.zapiInstanceId, instanceId))
    .limit(1);

  return mentorado ?? null;
}

/**
 * Find lead by phone number for a specific mentorado
 */
async function findLeadByPhone(mentoradoId: number, phone: string) {
  const db = getDb();
  const allLeads = await db.select().from(leads).where(eq(leads.mentoradoId, mentoradoId));

  // Use phonesMatch for flexible matching
  return allLeads.find((lead: Lead) => lead.telefone && phonesMatch(lead.telefone, phone)) ?? null;
}

/**
 * Ensure lead exists for inbound WhatsApp contact
 */
async function findOrCreateLead(mentoradoId: number, phone: string, senderName?: string) {
  const existing = await findLeadByPhone(mentoradoId, phone);
  if (existing) return existing;

  const db = getDb();
  const fallbackStatus = statusLeadEnum.enumValues[0];
  const targetStatus = statusLeadEnum.enumValues.includes("primeiro_contato")
    ? "primeiro_contato"
    : fallbackStatus;

  const [created] = await db
    .insert(leads)
    .values({
      mentoradoId,
      nome: senderName?.trim() || `Novo Contato WhatsApp ${phone.slice(-4)}`,
      email: `${phone}@whatsapp.local`,
      telefone: phone,
      origem: "whatsapp",
      status: targetStatus,
    })
    .returning();

  return created ?? null;
}

/**
 * Handle incoming message webhook
 */
async function handleMessageReceived(payload: ZApiMessageReceivedPayload): Promise<void> {
  // Skip group messages
  if (payload.isGroup) return;

  // Find mentorado by instance
  const mentorado = await findMentoradoByInstance(payload.instanceId);
  if (!mentorado) {
    // Unknown instance - skip silently
    return;
  }

  // Extract message content
  const content =
    payload.text?.message ??
    (payload.image ? "[📷 Image]" : null) ??
    (payload.audio ? "[🎵 Audio]" : null) ??
    (payload.video ? "[🎬 Video]" : null) ??
    (payload.document ? `[📄 ${payload.document.fileName ?? "Document"}]` : null) ??
    "[Media message]";

  // Normalize phone for consistent storage (handles +55, 9th digit, etc.)
  const normalizedPhone = zapiService.normalizePhoneNumber(payload.phone);

  // Find associated lead using flexible matching
  const lead = payload.isFromMe
    ? await findLeadByPhone(mentorado.id, normalizedPhone)
    : await findOrCreateLead(mentorado.id, normalizedPhone, payload.senderName);

  let quotedMessageId: number | null = null;
  const quotedExternalId = payload.quotedMessageId ?? payload.quotedMsgId;
  if (quotedExternalId) {
    const db = getDb();
    const [quoted] = await db
      .select({ id: whatsappMessages.id })
      .from(whatsappMessages)
      .where(
        and(
          eq(whatsappMessages.mentoradoId, mentorado.id),
          eq(whatsappMessages.zapiMessageId, quotedExternalId)
        )
      )
      .limit(1);
    quotedMessageId = quoted?.id ?? null;
  }

  const mediaType =
    payload.messageType ??
    (payload.image
      ? "image"
      : payload.audio
        ? "audio"
        : payload.video
          ? "video"
          : payload.document
            ? "document"
            : null);
  const mediaUrl =
    payload.image?.imageUrl ??
    payload.audio?.audioUrl ??
    payload.video?.videoUrl ??
    payload.document?.documentUrl ??
    null;

  const direction = payload.isFromMe ? "outbound" : "inbound";
  const messageStatus = payload.isFromMe ? "sent" : "delivered";

  // Store message with normalized phone (dedupe by provider message id)
  const db = getDb();
  const [existingByProviderId] = await db
    .select({ id: whatsappMessages.id })
    .from(whatsappMessages)
    .where(
      and(
        eq(whatsappMessages.mentoradoId, mentorado.id),
        eq(whatsappMessages.zapiMessageId, payload.messageId)
      )
    )
    .limit(1);

  let savedMessage:
    | {
        id: number;
        createdAt: Date;
      }
    | undefined;

  if (existingByProviderId) {
    const [updated] = await db
      .update(whatsappMessages)
      .set({
        leadId: lead?.id ?? null,
        phone: normalizedPhone,
        direction,
        content,
        status: messageStatus,
        mediaType,
        mediaUrl,
        quotedMessageId,
      })
      .where(eq(whatsappMessages.id, existingByProviderId.id))
      .returning({ id: whatsappMessages.id, createdAt: whatsappMessages.createdAt });

    savedMessage = updated;
  } else {
    const [created] = await db
      .insert(whatsappMessages)
      .values({
        mentoradoId: mentorado.id,
        leadId: lead?.id ?? null,
        phone: normalizedPhone,
        direction,
        content,
        zapiMessageId: payload.messageId,
        status: messageStatus,
        isFromAi: "nao",
        mediaType,
        mediaUrl,
        quotedMessageId,
      })
      .returning({ id: whatsappMessages.id, createdAt: whatsappMessages.createdAt });

    savedMessage = created;
  }

  // Broadcast new message to connected SSE clients
  sseService.broadcastToPhone(mentorado.id, normalizedPhone, "new-message", {
    id: savedMessage?.id,
    phone: normalizedPhone,
    leadId: lead?.id ?? null,
    direction,
    content,
    status: messageStatus,
    mediaType,
    mediaUrl,
    quotedMessageId,
    createdAt: savedMessage?.createdAt ?? new Date().toISOString(),
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AI SDR: Process incoming message and generate automated response
  // ─────────────────────────────────────────────────────────────────────────
  try {
    if (payload.isFromMe) {
      return;
    }

    // Only process if mentorado has Z-API credentials configured
    if (!mentorado.zapiInstanceId || !mentorado.zapiToken) {
      return;
    }

    const { aiSdrService } = await import("../services/aiSdrService");
    const { zapiService } = await import("../services/zapiService");

    // Build credentials for Z-API
    const credentials = {
      instanceId: mentorado.zapiInstanceId,
      token: mentorado.zapiToken,
      clientToken: mentorado.zapiClientToken ?? undefined,
    };

    // If integrator mode, use admin token
    const finalCredentials =
      mentorado.zapiManagedByIntegrator === "sim"
        ? { ...credentials, useIntegrator: true as const }
        : credentials;

    // Process with AI SDR (checks if enabled, within working hours, etc.)
    const result = await aiSdrService.processIncomingMessage(
      mentorado.id,
      zapiService.normalizePhoneNumber(payload.phone),
      content,
      finalCredentials,
      lead ?? undefined
    );

    if (result.responded) {
      logger.info("AI SDR responded", {
        phone: payload.phone,
        responsePreview: result.response?.substring(0, 50),
      });
    }
  } catch (error) {
    // Don't fail the whole webhook if AI response fails
    logger.error("AI SDR error processing incoming message", { error });
  }
}

/**
 * Handle message status update webhook
 */
async function handleMessageStatus(payload: ZApiMessageStatusPayload): Promise<void> {
  const statusMap: Record<string, "sent" | "delivered" | "read" | "failed"> = {
    SENT: "sent",
    DELIVERED: "delivered",
    READ: "read",
    FAILED: "failed",
  };

  const status = statusMap[payload.status];
  if (!status) return;

  const db = getDb();
  const [updated] = await db
    .update(whatsappMessages)
    .set({
      status,
      readAt: status === "read" ? new Date() : null,
    })
    .where(eq(whatsappMessages.zapiMessageId, payload.messageId))
    .returning({
      mentoradoId: whatsappMessages.mentoradoId,
      id: whatsappMessages.id,
      phone: whatsappMessages.phone,
      readAt: whatsappMessages.readAt,
    });

  // Broadcast status update to connected SSE clients
  if (updated) {
    const event = status === "read" ? "message-read" : "status_update";
    sseService.broadcastToPhone(updated.mentoradoId, updated.phone, event, {
      messageId: updated.id,
      zapiMessageId: payload.messageId,
      phone: updated.phone,
      status,
      readAt: updated.readAt,
    });
  }
}

/**
 * Handle typing start/stop webhook
 */
async function handleTypingEvent(
  payload: ZApiTypingPayload,
  mode: "typing-start" | "typing-stop"
): Promise<void> {
  const mentorado = await findMentoradoByInstance(payload.instanceId);
  if (!mentorado) return;

  const phone = zapiService.normalizePhoneNumber(payload.phone);
  sseService.broadcastToPhone(mentorado.id, phone, mode, {
    phone,
    at: new Date().toISOString(),
  });
}

/**
 * Handle presence updates webhook
 */
async function handlePresenceEvent(payload: ZApiPresencePayload): Promise<void> {
  const mentorado = await findMentoradoByInstance(payload.instanceId);
  if (!mentorado) return;

  const phone = zapiService.normalizePhoneNumber(payload.phone);
  const eventName = payload.isOnline ? "contact-online" : "contact-offline";

  sseService.broadcastToPhone(mentorado.id, phone, eventName, {
    phone,
    isOnline: payload.isOnline,
    lastSeen: payload.lastSeen ? new Date(payload.lastSeen * 1000).toISOString() : null,
  });
}

/**
 * Handle disconnection webhook
 */
async function handleDisconnected(payload: ZApiDisconnectedPayload): Promise<void> {
  const db = getDb();
  await db
    .update(mentorados)
    .set({
      zapiConnected: "nao",
      updatedAt: new Date(),
    })
    .where(eq(mentorados.zapiInstanceId, payload.instanceId));
}

/**
 * Register Z-API webhook routes
 */
export function registerZapiWebhooks(router: Router): void {
  const webhookToken = process.env.ZAPI_WEBHOOK_TOKEN;

  // Message received webhook
  router.post("/webhooks/zapi/message-received", async (req, res) => {
    try {
      if (
        webhookToken &&
        !validateWebhookToken(req.headers["client-token"] as string, webhookToken)
      ) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const payload = req.body as ZApiMessageReceivedPayload;
      await handleMessageReceived(payload);
      res.status(200).json({ success: true });
    } catch (_error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Message status webhook
  router.post("/webhooks/zapi/message-status", async (req, res) => {
    try {
      if (
        webhookToken &&
        !validateWebhookToken(req.headers["client-token"] as string, webhookToken)
      ) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const payload = req.body as ZApiMessageStatusPayload;
      await handleMessageStatus(payload);
      res.status(200).json({ success: true });
    } catch (_error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Disconnection webhook
  router.post("/webhooks/zapi/disconnected", async (req, res) => {
    try {
      if (
        webhookToken &&
        !validateWebhookToken(req.headers["client-token"] as string, webhookToken)
      ) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const payload = req.body as ZApiDisconnectedPayload;
      await handleDisconnected(payload);
      res.status(200).json({ success: true });
    } catch (_error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Typing start webhook
  router.post("/webhooks/zapi/typing-start", async (req, res) => {
    try {
      if (
        webhookToken &&
        !validateWebhookToken(req.headers["client-token"] as string, webhookToken)
      ) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const payload = req.body as ZApiTypingPayload;
      await handleTypingEvent(payload, "typing-start");
      res.status(200).json({ success: true });
    } catch (_error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Typing stop webhook
  router.post("/webhooks/zapi/typing-stop", async (req, res) => {
    try {
      if (
        webhookToken &&
        !validateWebhookToken(req.headers["client-token"] as string, webhookToken)
      ) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const payload = req.body as ZApiTypingPayload;
      await handleTypingEvent(payload, "typing-stop");
      res.status(200).json({ success: true });
    } catch (_error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Contact presence webhook
  router.post("/webhooks/zapi/presence", async (req, res) => {
    try {
      if (
        webhookToken &&
        !validateWebhookToken(req.headers["client-token"] as string, webhookToken)
      ) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const payload = req.body as ZApiPresencePayload;
      await handlePresenceEvent(payload);
      res.status(200).json({ success: true });
    } catch (_error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
