/**
 * WhatsApp Campaign Service
 *
 * Handles bulk WhatsApp message sending via Z-API with rate limiting,
 * contact segmentation, and campaign status tracking.
 *
 * @module whatsappCampaignService
 */

import { and, eq, gte, inArray } from "drizzle-orm";
import { type leadStatusEnum, leads } from "../../drizzle/schema";
import {
  type WhatsAppCampaign,
  whatsappCampaignMessages,
  whatsappCampaigns,
} from "../../drizzle/schema-marketing";
import { createLogger, type Logger } from "../_core/logger";
import { getDb } from "../db";
import { zapiService } from "./zapiService";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Rate limiting configuration
 * WhatsApp Business API recommends max 80 messages per second.
 * For safety with Z-API (non-official), we use much lower limits.
 */
const RATE_LIMITS = {
  MIN_DELAY_MS: 2000, // Minimum delay between messages (2 seconds)
  MAX_DELAY_MS: 5000, // Maximum delay between messages (5 seconds)
  MAX_MESSAGES_PER_HOUR: 100, // Avoid account blocking
  BATCH_SIZE: 20, // Messages per batch before longer pause
  BATCH_PAUSE_MS: 30000, // 30-second pause between batches
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkSendResult {
  totalContacts: number;
  sent: number;
  failed: number;
  errors: Array<{ phone: string; error: string }>;
}

export interface CampaignSendResult {
  campaignId: number;
  success: boolean;
  totalContacts: number;
  sent: number;
  failed: number;
  errors: Array<{ phone: string; error: string }>;
}

export interface SegmentationFilters {
  status?: (typeof leadStatusEnum.enumValues)[number][];
  tags?: string[];
  lastInteractionDaysAgo?: number;
  source?: string[];
}

interface ZApiCredentials {
  instanceId: string;
  token: string;
  clientToken?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get random delay for rate limiting (adds jitter to avoid detection)
 */
function getRandomDelay(): number {
  return (
    Math.floor(Math.random() * (RATE_LIMITS.MAX_DELAY_MS - RATE_LIMITS.MIN_DELAY_MS)) +
    RATE_LIMITS.MIN_DELAY_MS
  );
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send a single WhatsApp message via Z-API
 */
export async function sendMessage(
  credentials: ZApiCredentials,
  phone: string,
  message: string,
  logger?: Logger
): Promise<SendMessageResult> {
  const log = logger ?? createLogger({ service: "whatsapp-campaign" });

  try {
    const normalizedPhone = zapiService.normalizePhoneNumber(phone);

    const result = await zapiService.sendTextMessage(credentials, {
      phone: normalizedPhone,
      message,
    });

    log.info("message_sent", { phone: normalizedPhone, messageId: result.zapiMessageId });

    return {
      success: true,
      messageId: result.zapiMessageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log.error("message_send_failed", error, { phone });
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send bulk WhatsApp messages with rate limiting
 *
 * @param credentials - Z-API credentials
 * @param contacts - Array of phone numbers
 * @param message - Message text to send
 * @param mediaUrl - Optional media URL to include
 * @returns Bulk send result with success/failure counts
 */
export async function sendBulkMessages(
  credentials: ZApiCredentials,
  contacts: string[],
  message: string,
  _mediaUrl?: string,
  logger?: Logger
): Promise<BulkSendResult> {
  const log = logger ?? createLogger({ service: "whatsapp-campaign" });

  const result: BulkSendResult = {
    totalContacts: contacts.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  log.info("bulk_send_start", { totalContacts: contacts.length });

  for (let i = 0; i < contacts.length; i++) {
    const phone = contacts[i];

    // Send message
    const sendResult = await sendMessage(credentials, phone, message, log);

    if (sendResult.success) {
      result.sent++;
    } else {
      result.failed++;
      result.errors.push({
        phone,
        error: sendResult.error ?? "Unknown error",
      });
    }

    // Rate limiting: delay between messages
    if (i < contacts.length - 1) {
      const delay = getRandomDelay();
      await sleep(delay);

      // Longer pause after each batch
      if ((i + 1) % RATE_LIMITS.BATCH_SIZE === 0) {
        log.info("batch_pause", { processed: i + 1, total: contacts.length });
        await sleep(RATE_LIMITS.BATCH_PAUSE_MS);
      }
    }
  }

  log.info("bulk_send_complete", {
    sent: result.sent,
    failed: result.failed,
    total: result.totalContacts,
  });

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// CAMPAIGN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send a WhatsApp campaign from the database
 *
 * @param campaignId - WhatsApp campaign ID
 * @param credentials - Z-API credentials
 * @param targetContacts - Array of phone numbers to send to
 * @returns Campaign send result
 */
export async function sendCampaign(
  campaignId: number,
  credentials: ZApiCredentials,
  targetContacts: string[]
): Promise<CampaignSendResult> {
  const logger = createLogger({
    service: "whatsapp-campaign",
    requestId: `campaign-${campaignId}`,
  });
  const db = getDb();

  // 1. Get campaign from database
  const [campaign] = await db
    .select()
    .from(whatsappCampaigns)
    .where(eq(whatsappCampaigns.id, campaignId))
    .limit(1);

  if (!campaign) {
    return {
      campaignId,
      success: false,
      totalContacts: 0,
      sent: 0,
      failed: 0,
      errors: [{ phone: "", error: "Campaign not found" }],
    };
  }

  if (campaign.status === "sent" || campaign.status === "failed") {
    return {
      campaignId,
      success: false,
      totalContacts: 0,
      sent: 0,
      failed: 0,
      errors: [{ phone: "", error: `Campaign already ${campaign.status}` }],
    };
  }

  if (targetContacts.length === 0) {
    return {
      campaignId,
      success: false,
      totalContacts: 0,
      sent: 0,
      failed: 0,
      errors: [{ phone: "", error: "No target contacts provided" }],
    };
  }

  // 2. Update campaign status to sending
  await db
    .update(whatsappCampaigns)
    .set({
      status: "sending",
      sentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(whatsappCampaigns.id, campaignId));

  logger.info("campaign_sending", { campaignId, contacts: targetContacts.length });

  // 3. Send messages
  const bulkResult = await sendBulkMessages(
    credentials,
    targetContacts,
    campaign.message,
    campaign.mediaUrl ?? undefined,
    logger
  );

  // 4. Log individual message results
  for (const phone of targetContacts) {
    const isSuccess = !bulkResult.errors.some((e) => e.phone === phone);
    const errorMsg = bulkResult.errors.find((e) => e.phone === phone)?.error;

    await db.insert(whatsappCampaignMessages).values({
      campaignId,
      phone,
      status: isSuccess ? "delivered" : "failed",
      sentAt: new Date(),
      errorMessage: errorMsg,
    });
  }

  // 5. Update campaign with results
  const finalStatus = bulkResult.sent > 0 ? "sent" : "failed";

  await db
    .update(whatsappCampaigns)
    .set({
      status: finalStatus,
      messagesSent: bulkResult.sent,
      messagesDelivered: bulkResult.sent, // Assume delivered if sent (Z-API doesn't report immediately)
      messagesFailed: bulkResult.failed,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(whatsappCampaigns.id, campaignId));

  logger.info("campaign_complete", {
    campaignId,
    sent: bulkResult.sent,
    failed: bulkResult.failed,
  });

  return {
    campaignId,
    success: bulkResult.sent > 0,
    totalContacts: bulkResult.totalContacts,
    sent: bulkResult.sent,
    failed: bulkResult.failed,
    errors: bulkResult.errors,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTACT SEGMENTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get contacts from CRM based on segmentation filters
 *
 * @param mentoradoId - Mentorado ID to filter leads
 * @param filters - Segmentation filters
 * @returns Array of phone numbers
 */
export async function getContactsFromSegmentation(
  mentoradoId: number,
  filters: SegmentationFilters
): Promise<string[]> {
  const db = getDb();
  const conditions = [eq(leads.mentoradoId, mentoradoId)];

  // Filter by status
  if (filters.status && filters.status.length > 0) {
    conditions.push(inArray(leads.status, filters.status));
  }

  // Filter by last interaction time
  if (filters.lastInteractionDaysAgo) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filters.lastInteractionDaysAgo);
    conditions.push(gte(leads.updatedAt, cutoffDate));
  }

  // Query leads - using telefone field from schema
  const matchingLeads = await db
    .select({ telefone: leads.telefone })
    .from(leads)
    .where(and(...conditions));

  // Filter out leads without phone numbers and return
  return matchingLeads
    .filter((lead) => lead.telefone && lead.telefone.trim().length > 0)
    .map((lead) => lead.telefone!);
}

/**
 * Get all contacts for a mentorado (no filters)
 */
export async function getAllContacts(mentoradoId: number): Promise<string[]> {
  const db = getDb();

  const allLeads = await db
    .select({ telefone: leads.telefone })
    .from(leads)
    .where(eq(leads.mentoradoId, mentoradoId));

  return allLeads
    .filter((lead) => lead.telefone && lead.telefone.trim().length > 0)
    .map((lead) => lead.telefone!);
}

/**
 * Count contacts matching segmentation filters
 */
export async function countSegmentedContacts(
  mentoradoId: number,
  filters: SegmentationFilters
): Promise<number> {
  const contacts = await getContactsFromSegmentation(mentoradoId, filters);
  return contacts.length;
}

// ═══════════════════════════════════════════════════════════════════════════
// CAMPAIGN MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new WhatsApp campaign
 */
export async function createCampaign(
  mentoradoId: number,
  name: string,
  message: string,
  targetFilter?: SegmentationFilters,
  mediaUrl?: string,
  scheduledFor?: Date
): Promise<{ id: number }> {
  const db = getDb();

  // Count target contacts based on filter
  const targetCount = targetFilter
    ? await countSegmentedContacts(mentoradoId, targetFilter)
    : await getAllContacts(mentoradoId).then((c) => c.length);

  const [campaign] = await db
    .insert(whatsappCampaigns)
    .values({
      mentoradoId,
      name,
      message,
      targetFilter,
      targetContactsCount: targetCount,
      mediaUrl,
      scheduledFor,
      status: scheduledFor ? "scheduled" : "draft",
    })
    .returning({ id: whatsappCampaigns.id });

  return campaign;
}

/**
 * Get campaign statistics
 */
export async function getCampaignStats(campaignId: number): Promise<{
  messagesSent: number;
  messagesDelivered: number;
  messagesRead: number;
  messagesFailed: number;
}> {
  const db = getDb();

  const [campaign] = await db
    .select({
      messagesSent: whatsappCampaigns.messagesSent,
      messagesDelivered: whatsappCampaigns.messagesDelivered,
      messagesRead: whatsappCampaigns.messagesRead,
      messagesFailed: whatsappCampaigns.messagesFailed,
    })
    .from(whatsappCampaigns)
    .where(eq(whatsappCampaigns.id, campaignId))
    .limit(1);

  return (
    campaign || {
      messagesSent: 0,
      messagesDelivered: 0,
      messagesRead: 0,
      messagesFailed: 0,
    }
  );
}

/**
 * Get campaigns for a mentorado
 */
export async function getCampaigns(mentoradoId: number): Promise<WhatsAppCampaign[]> {
  const db = getDb();

  return db
    .select()
    .from(whatsappCampaigns)
    .where(eq(whatsappCampaigns.mentoradoId, mentoradoId))
    .orderBy(whatsappCampaigns.createdAt);
}

/**
 * Get a single campaign by ID
 */
export async function getCampaign(campaignId: number): Promise<WhatsAppCampaign | null> {
  const db = getDb();

  const [campaign] = await db
    .select()
    .from(whatsappCampaigns)
    .where(eq(whatsappCampaigns.id, campaignId))
    .limit(1);

  return campaign || null;
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  campaignId: number,
  status: "draft" | "scheduled" | "sending" | "paused" | "sent" | "failed"
): Promise<void> {
  const db = getDb();

  await db
    .update(whatsappCampaigns)
    .set({ status, updatedAt: new Date() })
    .where(eq(whatsappCampaigns.id, campaignId));
}
