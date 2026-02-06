/**
 * Meta WhatsApp Cloud API Service
 *
 * Encapsulates all interactions with Meta's WhatsApp Business Cloud API.
 * Provides type-safe methods for sending messages and managing connections.
 *
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/
 */

const META_GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || "v23.0";
const META_GRAPH_API_BASE = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface MetaApiCredentials {
  accessToken: string;
  phoneNumberId: string;
}

export interface MetaSendMessageRequest {
  to: string;
  message: string;
}

export interface MetaSendMessageResponse {
  messaging_product: "whatsapp";
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export interface MetaApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
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
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalize phone number to E.164 format for Brazil
 * Handles various input formats and adds country code if missing
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // Add Brazil country code if not present
  if (!digits.startsWith("55") && digits.length <= 11) {
    digits = `55${digits}`;
  }

  // Handle 9th digit for mobile numbers (São Paulo and other regions)
  // Brazilian mobile numbers: 55 + DDD (2 digits) + 9 + number (8 digits) = 13 digits
  // If we have 12 digits and DDD indicates mobile range, add 9th digit
  if (digits.length === 12) {
    const ddd = digits.substring(2, 4);
    const mobileAreas = [
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19", // SP
      "21",
      "22",
      "24", // RJ
      "27",
      "28", // ES
      "31",
      "32",
      "33",
      "34",
      "35",
      "37",
      "38", // MG
    ];
    if (mobileAreas.includes(ddd)) {
      digits = `${digits.substring(0, 4)}9${digits.substring(4)}`;
    }
  }

  return digits;
}

/**
 * Build Authorization header for Meta API requests
 */
function buildHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

/**
 * Build URL for Meta Graph API endpoint
 */
function buildUrl(phoneNumberId: string, endpoint: string): string {
  return `${META_GRAPH_API_BASE}/${phoneNumberId}/${endpoint}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// API METHODS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send a text message via Meta WhatsApp Cloud API
 */
export async function sendTextMessage(
  credentials: MetaApiCredentials,
  { to, message }: MetaSendMessageRequest
): Promise<MetaSendMessageResponse> {
  const url = buildUrl(credentials.phoneNumberId, "messages");
  const normalizedPhone = normalizePhoneNumber(to);

  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(credentials.accessToken),
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedPhone,
      type: "text",
      text: { body: message },
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as MetaApiError;
    throw new Error(
      `Meta API request failed (${response.status}): ${errorData.error?.message || "Unknown error"}`
    );
  }

  return response.json();
}

/**
 * Send a template message via Meta WhatsApp Cloud API
 * Templates must be pre-approved in Meta Business Manager
 */
export async function sendTemplateMessage(
  credentials: MetaApiCredentials,
  to: string,
  templateName: string,
  languageCode = "pt_BR",
  components?: Array<{
    type: "header" | "body" | "button";
    parameters: Array<{ type: string; text?: string; image?: { link: string } }>;
  }>
): Promise<MetaSendMessageResponse> {
  const url = buildUrl(credentials.phoneNumberId, "messages");
  const normalizedPhone = normalizePhoneNumber(to);

  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(credentials.accessToken),
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as MetaApiError;
    throw new Error(
      `Meta API template request failed (${response.status}): ${errorData.error?.message || "Unknown error"}`
    );
  }

  return response.json();
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(
  credentials: MetaApiCredentials,
  messageId: string
): Promise<{ success: boolean }> {
  const url = buildUrl(credentials.phoneNumberId, "messages");

  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(credentials.accessToken),
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as MetaApiError;
    throw new Error(
      `Meta API mark-read failed (${response.status}): ${errorData.error?.message || "Unknown error"}`
    );
  }

  return response.json();
}

/**
 * Get phone number details from Meta API
 */
export async function getPhoneNumberDetails(credentials: MetaApiCredentials): Promise<{
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating: string;
}> {
  const url = `${META_GRAPH_API_BASE}/${credentials.phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating`;

  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(credentials.accessToken),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as MetaApiError;
    throw new Error(
      `Meta API phone details failed (${response.status}): ${errorData.error?.message || "Unknown error"}`
    );
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const metaApiService = {
  sendTextMessage,
  sendTemplateMessage,
  markMessageAsRead,
  getPhoneNumberDetails,
  normalizePhoneNumber,
};
