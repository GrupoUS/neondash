/**
 * Z-API Webhook Handler
 * Receives webhook notifications from Z-API for message events
 *
 * Webhook events:
 * - on-message-received: Incoming messages
 * - on-message-status: Message status updates (sent, delivered, read)
 * - on-disconnected: WhatsApp disconnection
 */

import { eq } from "drizzle-orm";
import type { Router } from "express";
import { leads, mentorados, whatsappMessages } from "../../drizzle/schema";
import { getDb } from "../db";
import { phonesMatch } from "../services/zapiService";

// Webhook payload types
export interface ZApiMessageReceivedPayload {
  instanceId: string;
  phone: string;
  messageId: string;
  text?: { message: string };
  audio?: { audioUrl: string };
  image?: { imageUrl: string };
  isGroup: boolean;
  momment: number;
  isFromMe: boolean;
  senderName?: string;
}

export interface ZApiMessageStatusPayload {
  instanceId: string;
  messageId: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
}

export interface ZApiDisconnectedPayload {
  instanceId: string;
  reason?: string;
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
  const allLeads = await db.select().from(leads).where(eq(leads.mentoradoId, mentoradoId));

  // Use phonesMatch for flexible matching
  return allLeads.find((lead) => lead.telefone && phonesMatch(lead.telefone, phone)) ?? null;
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
    console.warn(`[Z-API Webhook] Unknown instance: ${payload.instanceId}`);
    return;
  }

  // Extract message content
  const content = payload.text?.message ?? "[Media message]";

  // Find associated lead
  const lead = await findLeadByPhone(mentorado.id, payload.phone);

  // Store message
  await db.insert(whatsappMessages).values({
    mentoradoId: mentorado.id,
    leadId: lead?.id ?? null,
    phone: payload.phone,
    direction: payload.isFromMe ? "outbound" : "inbound",
    content,
    zapiMessageId: payload.messageId,
    status: payload.isFromMe ? "sent" : "delivered",
    isFromAi: "nao",
  });

  // TODO: If AI agent enabled, process and respond
  // This will be handled by aiSdrService
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

  await db
    .update(whatsappMessages)
    .set({ status })
    .where(eq(whatsappMessages.zapiMessageId, payload.messageId));
}

/**
 * Handle disconnection webhook
 */
async function handleDisconnected(payload: ZApiDisconnectedPayload): Promise<void> {
  await db
    .update(mentorados)
    .set({
      zapiConnected: "nao",
      updatedAt: new Date(),
    })
    .where(eq(mentorados.zapiInstanceId, payload.instanceId));

  console.log(
    `[Z-API Webhook] Instance ${payload.instanceId} disconnected: ${payload.reason ?? "unknown"}`
  );
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
    } catch (error) {
      console.error("[Z-API Webhook] Error processing message:", error);
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
    } catch (error) {
      console.error("[Z-API Webhook] Error processing status:", error);
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
    } catch (error) {
      console.error("[Z-API Webhook] Error processing disconnection:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
