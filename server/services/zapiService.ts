/**
 * Z-API Client Service
 * Handles all interactions with Z-API for WhatsApp integration
 *
 * API Documentation: https://developer.z-api.io/
 */

const ZAPI_BASE_URL = "https://api.z-api.io";

export interface ZApiCredentials {
  instanceId: string;
  token: string;
  clientToken?: string; // Account Security Token from Z-API dashboard (optional)
}

export interface ZApiQRCodeResponse {
  value: string; // Base64 encoded QR code image
  connected: boolean;
}

export interface ZApiConnectionStatus {
  connected: boolean;
  smartphoneConnected?: boolean;
  session?: string;
  phoneNumber?: string;
  error?: string;
}

export interface ZApiSendMessageRequest {
  phone: string;
  message: string;
}

export interface ZApiSendMessageResponse {
  zapiMessageId: string;
  messageId: string;
  id: string;
}

export interface ZApiWebhookPayload {
  instanceId: string;
  phone: string;
  messageId?: string;
  text?: {
    message: string;
  };
  isGroup?: boolean;
  momment?: number; // Timestamp in ms
  status?: "SENT" | "DELIVERED" | "READ" | "FAILED";
  isFromMe?: boolean;
}

/**
 * Build headers for Z-API requests
 * Note: Authentication is done via URL path (token in URL).
 * Client-Token header is required when "Account Security Token" is enabled in Z-API dashboard.
 */
function buildHeaders(clientToken?: string): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (clientToken) {
    headers["Client-Token"] = clientToken;
  }

  return headers;
}

/**
 * Build Z-API URL for a specific endpoint
 */
function buildUrl(credentials: ZApiCredentials, endpoint: string): string {
  return `${ZAPI_BASE_URL}/instances/${credentials.instanceId}/token/${credentials.token}/${endpoint}`;
}

/**
 * Generic Z-API request handler with error handling
 */
async function zapiRequest<T>(
  credentials: ZApiCredentials,
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: unknown
): Promise<T> {
  const url = buildUrl(credentials, endpoint);
  const options: RequestInit = {
    method,
    headers: buildHeaders(credentials.clientToken),
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Z-API request failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Get QR Code for WhatsApp connection
 */
export async function getQRCode(credentials: ZApiCredentials): Promise<ZApiQRCodeResponse> {
  return zapiRequest<ZApiQRCodeResponse>(credentials, "qr-code/image");
}

/**
 * Get connection status
 */
export async function getConnectionStatus(
  credentials: ZApiCredentials
): Promise<ZApiConnectionStatus> {
  try {
    const response = await zapiRequest<{
      connected: boolean;
      smartphoneConnected?: boolean;
      session?: string;
      phone?: string;
    }>(credentials, "status");

    return {
      connected: response.connected,
      smartphoneConnected: response.smartphoneConnected,
      session: response.session,
      phoneNumber: response.phone,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Disconnect WhatsApp session
 */
export async function disconnect(credentials: ZApiCredentials): Promise<boolean> {
  try {
    await zapiRequest(credentials, "disconnect", "POST");
    return true;
  } catch {
    return false;
  }
}

/**
 * Send a text message via WhatsApp
 */
export async function sendTextMessage(
  credentials: ZApiCredentials,
  { phone, message }: ZApiSendMessageRequest
): Promise<ZApiSendMessageResponse> {
  // Normalize phone number (remove non-digits, ensure country code)
  const normalizedPhone = normalizePhoneNumber(phone);

  return zapiRequest<ZApiSendMessageResponse>(credentials, "send-text", "POST", {
    phone: normalizedPhone,
    message,
  });
}

/**
 * Normalize phone number for Z-API
 * - Removes non-digit characters
 * - Adds Brazil country code (55) if not present
 * - Handles 9th digit for mobile numbers
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // If starts with +, remove it (already handled by regex above)
  // If less than 10 digits, likely incomplete
  if (digits.length < 10) {
    return digits;
  }

  // If doesn't start with country code, add Brazil's
  if (!digits.startsWith("55") && digits.length <= 11) {
    digits = `55${digits}`;
  }

  return digits;
}

/**
 * Parse incoming webhook phone number to match with leads
 * Returns phone in format: +55 (XX) XXXXX-XXXX
 */
export function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 13) {
    // 55 + DDD + 9 + 8 digits
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 12) {
    // 55 + DDD + 8 digits
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  if (digits.length === 11) {
    // DDD + 9 + 8 digits
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    // DDD + 8 digits
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return phone;
}

/**
 * Check if two phone numbers match (accounting for format differences)
 */
export function phonesMatch(phone1: string, phone2: string): boolean {
  const normalized1 = normalizePhoneNumber(phone1);
  const normalized2 = normalizePhoneNumber(phone2);

  // Direct match
  if (normalized1 === normalized2) return true;

  // Match ignoring 9th digit differences
  // Some numbers have 9 digits after DDD, some have 8
  const last8_1 = normalized1.slice(-8);
  const last8_2 = normalized2.slice(-8);

  // Check if they share the same last 8 digits and same DDD
  const ddd1 = normalized1.length >= 12 ? normalized1.slice(-10, -8) : normalized1.slice(-10, -8);
  const ddd2 = normalized2.length >= 12 ? normalized2.slice(-10, -8) : normalized2.slice(-10, -8);

  return last8_1 === last8_2 && ddd1 === ddd2;
}

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATOR API FUNCTIONS
// For managing instances programmatically via the Z-API Integrator Partner program
// ═══════════════════════════════════════════════════════════════════════════

const ZAPI_INTEGRATOR_URL = "https://api.z-api.io/instances/integrator";

export interface ZApiCreateInstanceResponse {
  id: string;
  token: string;
  due?: string; // Trial expiration date
}

export interface ZApiInstanceInfo {
  id: string;
  token: string;
  phone?: string;
  connected?: boolean;
  due?: string;
}

/**
 * Get the Integrator Token from environment variables
 * @throws Error if token is not configured
 */
export function getIntegratorToken(): string {
  const token = process.env.ZAPI_INTEGRATOR_TOKEN;
  if (!token) {
    throw new Error(
      "ZAPI_INTEGRATOR_TOKEN not configured. Contact Z-API to become an Integrator partner."
    );
  }
  return token;
}

/**
 * Check if integrator mode is available (token is configured)
 */
export function isIntegratorModeAvailable(): boolean {
  return Boolean(process.env.ZAPI_INTEGRATOR_TOKEN);
}

/**
 * Build headers for Integrator API requests
 */
function buildIntegratorHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "Integrator-Token": getIntegratorToken(),
  };
}

/**
 * Create a new Z-API instance via the Integrator API
 * The instance starts in trial mode (2 days free)
 *
 * @param name - Name for the new instance (visible in Z-API dashboard)
 * @param options - Optional configuration for webhooks and device type
 */
export async function createInstance(
  name: string,
  options?: {
    sessionName?: string;
    deliveryCallbackUrl?: string;
    receivedCallbackUrl?: string;
    disconnectedCallbackUrl?: string;
    connectedCallbackUrl?: string;
    messageStatusCallbackUrl?: string;
    isDevice?: boolean;
    businessDevice?: boolean;
  }
): Promise<ZApiCreateInstanceResponse> {
  const response = await fetch(`${ZAPI_INTEGRATOR_URL}/on-demand`, {
    method: "POST",
    headers: buildIntegratorHeaders(),
    body: JSON.stringify({
      name,
      ...options,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create Z-API instance (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<ZApiCreateInstanceResponse>;
}

/**
 * Subscribe to an instance (convert trial to paid)
 * This activates billing through the Integrator's account
 *
 * @param instanceId - The instance ID to subscribe
 * @param token - The instance token
 */
export async function subscribeInstance(instanceId: string, token: string): Promise<boolean> {
  const url = `${ZAPI_BASE_URL}/instances/${instanceId}/token/${token}/subscription`;

  const response = await fetch(url, {
    method: "POST",
    headers: buildIntegratorHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to subscribe Z-API instance (${response.status}): ${errorText}`);
  }

  return true;
}

/**
 * Cancel an instance subscription
 * The instance remains active until the end of the current billing period
 *
 * @param instanceId - The instance ID to cancel
 * @param token - The instance token
 */
export async function cancelInstance(instanceId: string, token: string): Promise<boolean> {
  const url = `${ZAPI_BASE_URL}/instances/${instanceId}/token/${token}/cancel`;

  const response = await fetch(url, {
    method: "POST",
    headers: buildIntegratorHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to cancel Z-API instance (${response.status}): ${errorText}`);
  }

  return true;
}

/**
 * List all instances managed by this Integrator account
 */
export async function listIntegratorInstances(): Promise<ZApiInstanceInfo[]> {
  const response = await fetch(`${ZAPI_INTEGRATOR_URL}/list`, {
    method: "GET",
    headers: buildIntegratorHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list Z-API instances (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { instances?: ZApiInstanceInfo[] };
  return data.instances ?? [];
}

export const zapiService = {
  // Connection & Messaging
  getQRCode,
  getConnectionStatus,
  disconnect,
  sendTextMessage,

  // Phone utilities
  normalizePhoneNumber,
  formatPhoneForDisplay,
  phonesMatch,

  // Integrator API (Partner mode)
  getIntegratorToken,
  isIntegratorModeAvailable,
  createInstance,
  subscribeInstance,
  cancelInstance,
  listIntegratorInstances,
};
