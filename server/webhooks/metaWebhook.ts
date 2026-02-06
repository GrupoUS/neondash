/**
 * Meta WhatsApp Cloud API Webhook Handler
 *
 * Receives webhook notifications from Meta for WhatsApp events:
 * - messages: Incoming messages from users
 * - statuses: Delivery and read receipts
 *
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/
 */
import { and, eq } from "drizzle-orm";
import type { Router } from "express";
import type { Lead } from "../../drizzle/schema";
import { leads, mentorados, statusLeadEnum, whatsappMessages } from "../../drizzle/schema";
import { createLogger } from "../_core/logger";
import { getDb } from "../db";
import { sseService } from "../services/sseService";

const logger = createLogger({ service: "metaWebhook" });

// ═══════════════════════════════════════════════════════════════════════════
// TYPES - Meta WhatsApp Cloud API Webhook Payloads
// ═══════════════════════════════════════════════════════════════════════════

export interface MetaWebhookPayload {
  object: "whatsapp_business_account";
  entry: Array<{
    id: string;
    changes: Array<{
      field: "messages";
      value: MetaWebhookValue;
    }>;
  }>;
}

export interface MetaWebhookValue {
  messaging_product: "whatsapp";
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: Array<{
    profile: { name: string };
    wa_id: string;
  }>;
  messages?: Array<MetaIncomingMessage>;
  statuses?: Array<MetaMessageStatus>;
}

export interface MetaIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: "text" | "image" | "audio" | "video" | "document" | "sticker" | "reaction" | "interactive";
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string };
  audio?: { id: string; mime_type: string };
  video?: { id: string; mime_type: string };
  document?: { id: string; filename: string; mime_type: string };
  reaction?: {
    message_id: string;
    emoji: string;
  };
  interactive?: {
    type: "button_reply" | "list_reply";
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description: string };
  };
}

export interface MetaMessageStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

import crypto from "node:crypto";

/**
 * Validate X-Hub-Signature-256 from Meta webhook request
 * @see https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
 *
 * @param signature - The X-Hub-Signature-256 header value
 * @param rawBody - The raw request body as a string/buffer
 * @returns true if signature is valid, false otherwise
 */
function validateWebhookSignature(
  signature: string | undefined,
  rawBody: string | Buffer
): boolean {
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    logger.error("META_APP_SECRET not configured - cannot validate webhook signature", null);
    return false;
  }

  if (!signature) {
    logger.warn("Missing X-Hub-Signature-256 header");
    return false;
  }

  // Signature format: "sha256=<hex_signature>"
  const expectedPrefix = "sha256=";
  if (!signature.startsWith(expectedPrefix)) {
    logger.warn("Invalid signature format - missing sha256= prefix");
    return false;
  }

  const signatureHash = signature.slice(expectedPrefix.length);
  const bodyString = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");

  // Compute HMAC-SHA256 of the body using APP_SECRET
  const expectedHash = crypto.createHmac("sha256", appSecret).update(bodyString).digest("hex");

  // Constant-time comparison to prevent timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signatureHash, "hex"),
    Buffer.from(expectedHash, "hex")
  );

  if (!isValid) {
    logger.warn("Webhook signature mismatch - possible tampering");
  }

  return isValid;
}

/**

 * Find mentorado by Meta Phone Number ID
 */
async function findMentoradoByPhoneNumberId(phoneNumberId: string) {
  const db = getDb();
  const [mentorado] = await db
    .select()
    .from(mentorados)
    .where(eq(mentorados.metaPhoneNumberId, phoneNumberId))
    .limit(1);

  return mentorado ?? null;
}

/**
 * Find lead by phone number for a specific mentorado
 */
async function findLeadByPhone(mentoradoId: number, phone: string) {
  const db = getDb();
  const allLeads = await db.select().from(leads).where(eq(leads.mentoradoId, mentoradoId));

  // Normalize both phones and compare last 8 digits
  const normalizedPhone = phone.replace(/\D/g, "");
  return (
    allLeads.find((lead: Lead) => {
      if (!lead.telefone) return false;
      const leadPhone = lead.telefone.replace(/\D/g, "");
      return leadPhone.slice(-8) === normalizedPhone.slice(-8);
    }) ?? null
  );
}

async function findOrCreateLead(mentoradoId: number, phone: string, contactName?: string) {
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
      nome: contactName?.trim() || `Novo Contato WhatsApp ${phone.slice(-4)}`,
      email: `${phone}@whatsapp.local`,
      telefone: phone,
      origem: "whatsapp",
      status: targetStatus,
    })
    .returning();

  return created ?? null;
}

/**
 * Extract text content from various message types
 */
function extractMessageContent(message: MetaIncomingMessage): string {
  switch (message.type) {
    case "text":
      return message.text?.body ?? "";
    case "interactive":
      return (
        message.interactive?.button_reply?.title ??
        message.interactive?.list_reply?.title ??
        "[Interactive message]"
      );
    case "image":
      return "[📷 Image]";
    case "audio":
      return "[🎵 Audio]";
    case "video":
      return "[🎬 Video]";
    case "document":
      return `[📄 ${message.document?.filename ?? "Document"}]`;
    case "sticker":
      return "[Sticker]";
    case "reaction":
      return "[Reaction]";
    default:
      return `[${message.type} message]`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle incoming message from webhook
 */
async function handleIncomingMessage(
  message: MetaIncomingMessage,
  metadata: MetaWebhookValue["metadata"],
  contactName?: string
): Promise<void> {
  // Find mentorado by phone_number_id
  const mentorado = await findMentoradoByPhoneNumberId(metadata.phone_number_id);
  if (!mentorado) {
    logger.warn("Mentorado not found for phone_number_id", {
      phoneNumberId: metadata.phone_number_id,
    });
    return;
  }

  // Extract message content
  const content = extractMessageContent(message);
  const normalizedPhone = message.from;

  // Find associated lead
  const lead = await findOrCreateLead(mentorado.id, normalizedPhone, contactName);

  let quotedMessageId: number | null = null;
  if (message.reaction?.message_id) {
    const db = getDb();
    const [quoted] = await db
      .select({ id: whatsappMessages.id })
      .from(whatsappMessages)
      .where(
        and(
          eq(whatsappMessages.mentoradoId, mentorado.id),
          eq(whatsappMessages.zapiMessageId, message.reaction.message_id)
        )
      )
      .limit(1);
    quotedMessageId = quoted?.id ?? null;
  }

  const mediaType = ["text", "interactive"].includes(message.type) ? null : message.type;

  // Store message
  const db = getDb();
  const [savedMessage] = await db
    .insert(whatsappMessages)
    .values({
      mentoradoId: mentorado.id,
      leadId: lead?.id ?? null,
      phone: normalizedPhone,
      direction: "inbound",
      content,
      zapiMessageId: message.id, // Reuse field for Meta message ID
      status: "delivered",
      isFromAi: "nao",
      mediaType,
      quotedMessageId,
    })
    .returning();

  // Broadcast via SSE
  sseService.broadcastToPhone(mentorado.id, normalizedPhone, "new-message", {
    id: savedMessage?.id,
    phone: normalizedPhone,
    leadId: lead?.id ?? null,
    direction: "inbound",
    content,
    status: "delivered",
    mediaType,
    quotedMessageId,
    senderName: contactName,
    createdAt: savedMessage?.createdAt ?? new Date().toISOString(),
  });

  sseService.broadcastToPhone(mentorado.id, normalizedPhone, "typing-stop", {
    phone: normalizedPhone,
    at: new Date().toISOString(),
    provider: "meta",
  });

  logger.info("Meta message saved", {
    messageId: message.id,
    mentoradoId: mentorado.id,
    type: message.type,
  });

  // TODO: AI SDR integration for Meta API
  // The aiSdrService currently expects ZApiCredentials.
  // This will be enabled once aiSdrService is updated to support Meta API credentials.
  // For now, incoming messages are stored and broadcast via SSE, but AI responses
  // will only work with Z-API until the service is updated.
}

/**
 * Handle message status update from webhook
 */
async function handleMessageStatus(status: MetaMessageStatus): Promise<void> {
  const db = getDb();
  const normalizedRecipientPhone = status.recipient_id.replace(/\D/g, "");

  // Update message status in database
  const [updated] = await db
    .update(whatsappMessages)
    .set({
      status: status.status,
      readAt: status.status === "read" ? new Date() : null,
    })
    .where(
      and(
        eq(whatsappMessages.zapiMessageId, status.id),
        eq(whatsappMessages.direction, "outbound"),
        eq(whatsappMessages.phone, normalizedRecipientPhone)
      )
    )
    .returning({
      mentoradoId: whatsappMessages.mentoradoId,
      id: whatsappMessages.id,
      phone: whatsappMessages.phone,
      readAt: whatsappMessages.readAt,
    });

  // Broadcast status update via SSE
  if (updated) {
    const event = status.status === "read" ? "message-read" : "status_update";
    sseService.broadcastToPhone(updated.mentoradoId, updated.phone, event, {
      messageId: updated.id,
      zapiMessageId: status.id,
      phone: updated.phone,
      status: status.status,
      readAt: updated.readAt,
    });
  }

  logger.debug("Meta message status updated", {
    messageId: status.id,
    status: status.status,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOK ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Webhook verification handler (GET request)
 * Meta sends a challenge that must be echoed back
 */
function verifyWebhook(req: Express.Request, res: Express.Response): void {
  const mode = (req as any).query["hub.mode"];
  const token = (req as any).query["hub.verify_token"];
  const challenge = (req as any).query["hub.challenge"];

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    logger.info("Meta webhook verified successfully");
    (res as any).status(200).send(challenge);
  } else {
    logger.error("Meta webhook verification failed", { mode, tokenMatch: token === verifyToken });
    (res as any).sendStatus(403);
  }
}

/**
 * Webhook event handler (POST request)
 * Validates X-Hub-Signature-256 before processing events
 */
async function handleWebhook(req: Express.Request, res: Express.Response): Promise<void> {
  try {
    // Validate X-Hub-Signature-256 to prevent unauthorized requests
    const signature = (req as any).headers["x-hub-signature-256"] as string | undefined;

    // Get raw body for signature validation
    // Note: This requires express.json({ verify: (req, res, buf) => { req.rawBody = buf; }})
    // or similar middleware to preserve the raw body
    const rawBody = (req as any).rawBody || JSON.stringify((req as any).body);

    if (!validateWebhookSignature(signature, rawBody)) {
      logger.error("Webhook signature validation failed - rejecting request", null);
      (res as any).sendStatus(403);
      return;
    }

    const body = (req as any).body as MetaWebhookPayload;

    // Verify this is a WhatsApp webhook
    if (body.object !== "whatsapp_business_account") {
      (res as any).sendStatus(404);
      return;
    }

    // Process all entries
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.field === "messages") {
          const value = change.value;

          // Process incoming messages
          if (value.messages) {
            const contactName = value.contacts?.[0]?.profile?.name;
            for (const message of value.messages) {
              await handleIncomingMessage(message, value.metadata, contactName);
            }
          }

          // Process status updates
          if (value.statuses) {
            for (const status of value.statuses) {
              await handleMessageStatus(status);
            }
          }
        }
      }
    }

    // Always respond quickly to avoid Meta retrying
    (res as any).sendStatus(200);
  } catch (error) {
    logger.error("Error processing Meta webhook", { error });
    (res as any).sendStatus(500);
  }
}

/**
 * Register Meta WhatsApp webhook routes
 */
export function registerMetaWebhooks(router: Router): void {
  // Webhook verification (GET)
  router.get("/webhooks/meta/whatsapp", verifyWebhook as any);

  // Webhook events (POST)
  router.post("/webhooks/meta/whatsapp", handleWebhook as any);

  logger.info("Meta WhatsApp webhooks registered");
}
