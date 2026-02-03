/**
 * Instagram Business API Service
 * Handles OAuth2 flow, token management, and Instagram Graph API interactions
 * for syncing mentorado Instagram metrics.
 *
 * @module instagramService
 */

import { and, eq } from "drizzle-orm";
import {
  type InsertInstagramSyncLog,
  type InsertInstagramToken,
  instagramSyncLog,
  instagramTokens,
  mentorados,
  metricasMensais,
} from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { createLogger, type Logger, measureAsync } from "../_core/logger";
import { getDb } from "../db";

// ═══════════════════════════════════════════════════════════════════════════
// ENVIRONMENT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const INSTAGRAM_APP_ID = ENV.instagramAppId;
const INSTAGRAM_APP_SECRET = ENV.instagramAppSecret;
const INSTAGRAM_REDIRECT_URI = ENV.instagramRedirectUri;

// Instagram OAuth scopes required for business insights
const SCOPES = ["instagram_basic", "instagram_manage_insights", "pages_show_list"];

// Instagram Graph API version
const GRAPH_API_VERSION = "v18.0";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * OAuth token response from Instagram
 */
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  user_id?: string;
}

/**
 * Long-lived token exchange response
 */
interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // 60 days typically
}

/**
 * Token refresh response
 */
interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Instagram media insight data
 */
interface MediaInsight {
  id: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REEL";
  timestamp: string;
  likeCount?: number;
  commentsCount?: number;
  reach?: number;
  impressions?: number;
}

/**
 * Instagram story insight data
 */
interface StoryInsight {
  id: string;
  timestamp: string;
  reach?: number;
  impressions?: number;
  exits?: number;
  replies?: number;
}

/**
 * Result of a single mentorado sync operation
 */
interface SyncResult {
  success: boolean;
  status: "success" | "failed" | "partial";
  postsCount: number;
  storiesCount: number;
  errorMessage?: string;
}

/**
 * Summary of batch sync operation
 */
interface SyncSummary {
  totalMentorados: number;
  successful: number;
  failed: number;
  partial: number;
  errors: Array<{ mentoradoId: number; error: string }>;
}

/**
 * Business account validation result
 */
interface BusinessAccountInfo {
  isValid: boolean;
  accountId?: string;
  accountType?: string;
  errorMessage?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// OAUTH FLOW FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if Instagram OAuth is properly configured
 * @returns true if both INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET are set
 */
export function isInstagramConfigured(): boolean {
  return Boolean(INSTAGRAM_APP_ID && INSTAGRAM_APP_SECRET);
}

/**
 * Generate Instagram OAuth authorization URL
 *
 * @param mentoradoId - The mentorado ID to pass as state for callback handling
 * @returns Authorization URL to redirect user to
 * @throws Error if Instagram OAuth is not configured
 *
 * @example
 * const authUrl = getAuthUrl(123);
 * // Returns: https://api.instagram.com/oauth/authorize?...
 */
export function getAuthUrl(mentoradoId: number): string {
  if (!INSTAGRAM_APP_ID) {
    throw new Error("INSTAGRAM_APP_ID not configured");
  }

  const params = new URLSearchParams({
    client_id: INSTAGRAM_APP_ID,
    redirect_uri: INSTAGRAM_REDIRECT_URI,
    scope: SCOPES.join(","),
    response_type: "code",
    state: String(mentoradoId), // Pass mentoradoId for callback handling
  });

  return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for short-lived access token
 *
 * @param code - Authorization code from OAuth callback
 * @returns Token response with access_token
 * @throws Error if exchange fails
 */
export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
    throw new Error("Instagram OAuth not configured");
  }

  const response = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: INSTAGRAM_APP_ID,
      client_secret: INSTAGRAM_APP_SECRET,
      grant_type: "authorization_code",
      redirect_uri: INSTAGRAM_REDIRECT_URI,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Instagram token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Exchange short-lived token for long-lived token (60 days)
 *
 * @param shortLivedToken - Short-lived access token from initial exchange
 * @returns Long-lived token response with expires_in
 * @throws Error if exchange fails
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<LongLivedTokenResponse> {
  if (!INSTAGRAM_APP_SECRET) {
    throw new Error("Instagram OAuth not configured");
  }

  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: INSTAGRAM_APP_SECRET,
    access_token: shortLivedToken,
  });

  const response = await fetch(`https://graph.instagram.com/access_token?${params.toString()}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Long-lived token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Refresh a long-lived access token before expiration
 *
 * @param accessToken - Current long-lived access token (must be valid, not expired)
 * @returns New token response with updated expires_in
 * @throws Error if refresh fails (token may be expired or invalid)
 */
export async function refreshAccessToken(accessToken: string): Promise<RefreshTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: accessToken,
  });

  const response = await fetch(
    `https://graph.instagram.com/refresh_access_token?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}

/**
 * Revoke Instagram access for a mentorado
 *
 * @param mentoradoId - The mentorado to revoke access for
 * @param logger - Optional logger instance
 * @returns true if revocation was successful
 */
export async function revokeAccess(mentoradoId: number, logger?: Logger): Promise<boolean> {
  const log = logger ?? createLogger({ service: "instagram" });
  const db = getDb();

  try {
    // Fetch token from database
    const [token] = await db
      .select()
      .from(instagramTokens)
      .where(eq(instagramTokens.mentoradoId, mentoradoId))
      .limit(1);

    if (!token) {
      log.info("revoke_no_token", { mentoradoId });
      return true; // No token to revoke
    }

    // Delete token from database
    await db.delete(instagramTokens).where(eq(instagramTokens.mentoradoId, mentoradoId));

    // Update mentorado connection status
    await db
      .update(mentorados)
      .set({
        instagramConnected: "nao",
        instagramBusinessAccountId: null,
        updatedAt: new Date(),
      })
      .where(eq(mentorados.id, mentoradoId));

    log.info("revoke_success", { mentoradoId });
    return true;
  } catch (error) {
    log.error("revoke_failed", error, { mentoradoId });
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// API CALL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate that the connected account is a Business or Creator account
 *
 * @param accessToken - Valid Instagram access token
 * @returns Business account info with validation result
 *
 * @example
 * const result = await validateBusinessAccount(token);
 * if (!result.isValid) {
 *   console.error(result.errorMessage);
 * }
 */
export async function validateBusinessAccount(accessToken: string): Promise<BusinessAccountInfo> {
  try {
    // Get user's Facebook pages to find Instagram Business account
    const pagesResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts?access_token=${accessToken}`
    );

    if (!pagesResponse.ok) {
      const error = await pagesResponse.text();
      return {
        isValid: false,
        errorMessage: `Failed to fetch Facebook pages: ${error}`,
      };
    }

    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return {
        isValid: false,
        errorMessage:
          "No Facebook pages found. Instagram Business account requires a linked Facebook Page.",
      };
    }

    // Get Instagram Business Account ID from first page
    const pageId = pagesData.data[0].id;
    const pageAccessToken = pagesData.data[0].access_token;

    const igAccountResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );

    if (!igAccountResponse.ok) {
      const error = await igAccountResponse.text();
      return {
        isValid: false,
        errorMessage: `Failed to fetch Instagram Business Account: ${error}`,
      };
    }

    const igAccountData = await igAccountResponse.json();

    if (!igAccountData.instagram_business_account) {
      return {
        isValid: false,
        errorMessage:
          "No Instagram Business account linked to this Facebook Page. Please connect your Instagram as a Business or Creator account.",
      };
    }

    return {
      isValid: true,
      accountId: igAccountData.instagram_business_account.id,
      accountType: "business",
    };
  } catch (error) {
    return {
      isValid: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error validating account",
    };
  }
}

/**
 * Fetch media insights for a date range with pagination support
 *
 * @param accountId - Instagram Business Account ID
 * @param accessToken - Valid access token
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param logger - Optional logger instance
 * @returns Array of media insights
 *
 * @remarks
 * Instagram Graph API returns max 25 items per page.
 * Rate limit: 200 calls/hour per user.
 */
export async function getMediaInsights(
  accountId: string,
  accessToken: string,
  startDate: Date,
  endDate: Date,
  logger?: Logger
): Promise<MediaInsight[]> {
  const log = logger ?? createLogger({ service: "instagram" });
  const allMedia: MediaInsight[] = [];

  // Convert dates to Unix timestamps
  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const endTimestamp = Math.floor(endDate.getTime() / 1000);

  let nextUrl: string | null =
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${accountId}/media` +
    `?fields=id,media_type,timestamp,like_count,comments_count` +
    `&since=${startTimestamp}&until=${endTimestamp}` +
    `&limit=25&access_token=${accessToken}`;

  let pageCount = 0;
  const maxPages = 10; // Safety limit

  try {
    while (nextUrl && pageCount < maxPages) {
      const response = await fetchWithRetry(nextUrl, log);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch media: ${error}`);
      }

      const data = await response.json();
      pageCount++;

      // Process media items
      if (data.data && Array.isArray(data.data)) {
        for (const item of data.data) {
          const mediaDate = new Date(item.timestamp);
          // Filter by date range (API since/until may not be exact)
          if (mediaDate >= startDate && mediaDate <= endDate) {
            allMedia.push({
              id: item.id,
              mediaType: item.media_type,
              timestamp: item.timestamp,
              likeCount: item.like_count,
              commentsCount: item.comments_count,
            });
          }
        }
      }

      // Check for next page
      nextUrl = data.paging?.next ?? null;
    }

    log.info("media_fetched", {
      accountId,
      count: allMedia.length,
      pages: pageCount,
    });

    return allMedia;
  } catch (error) {
    log.error("media_fetch_failed", error, { accountId });
    throw error;
  }
}

/**
 * Fetch stories insights for a date range
 *
 * @param accountId - Instagram Business Account ID
 * @param accessToken - Valid access token
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param logger - Optional logger instance
 * @returns Array of story insights
 *
 * @remarks
 * Stories are only available via API for 24 hours.
 * For historical data, we track from stored metrics.
 */
export async function getStoriesInsights(
  accountId: string,
  accessToken: string,
  startDate: Date,
  endDate: Date,
  logger?: Logger
): Promise<StoryInsight[]> {
  const log = logger ?? createLogger({ service: "instagram" });
  const allStories: StoryInsight[] = [];

  try {
    // Stories endpoint - only available for last 24 hours
    const response = await fetchWithRetry(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${accountId}/stories` +
        `?fields=id,timestamp` +
        `&access_token=${accessToken}`,
      log
    );

    if (!response.ok) {
      // Stories may not be available - this is expected for historical data
      const error = await response.text();
      log.warn("stories_fetch_warning", error, { accountId });
      return allStories;
    }

    const data = await response.json();

    if (data.data && Array.isArray(data.data)) {
      for (const item of data.data) {
        const storyDate = new Date(item.timestamp);
        if (storyDate >= startDate && storyDate <= endDate) {
          allStories.push({
            id: item.id,
            timestamp: item.timestamp,
          });
        }
      }
    }

    log.info("stories_fetched", { accountId, count: allStories.length });
    return allStories;
  } catch (error) {
    // Stories not available is not a fatal error
    log.warn("stories_fetch_failed", error, { accountId });
    return allStories;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC LOGIC FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sync Instagram metrics for a specific mentorado and month
 *
 * @param mentoradoId - The mentorado to sync
 * @param ano - Year (e.g., 2024)
 * @param mes - Month (1-12)
 * @returns Sync result with posts/stories count
 *
 * @example
 * const result = await syncMentoradoMetrics(123, 2024, 1);
 * if (result.success) {
 *   console.log(`Synced ${result.postsCount} posts, ${result.storiesCount} stories`);
 * }
 */
export async function syncMentoradoMetrics(
  mentoradoId: number,
  ano: number,
  mes: number
): Promise<SyncResult> {
  const logger = createLogger({ service: "instagram", requestId: `sync-${mentoradoId}` });
  const db = getDb();

  return measureAsync(logger, "sync_mentorado", async () => {
    try {
      // 1. Get Instagram token for mentorado
      const [token] = await db
        .select()
        .from(instagramTokens)
        .where(eq(instagramTokens.mentoradoId, mentoradoId))
        .limit(1);

      if (!token) {
        const result: SyncResult = {
          success: false,
          status: "failed",
          postsCount: 0,
          storiesCount: 0,
          errorMessage: "No Instagram token found for this mentorado",
        };
        await logSyncResult(mentoradoId, ano, mes, result);
        return result;
      }

      // 2. Check if token is expired and refresh if needed
      let accessToken = token.accessToken;
      if (isTokenExpired(token.expiresAt)) {
        try {
          const refreshed = await refreshAccessToken(accessToken);
          accessToken = refreshed.access_token;

          // Update token in database
          await db
            .update(instagramTokens)
            .set({
              accessToken: refreshed.access_token,
              expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
              updatedAt: new Date(),
            })
            .where(eq(instagramTokens.mentoradoId, mentoradoId));

          logger.info("token_refreshed", { mentoradoId });
        } catch (refreshError) {
          const result: SyncResult = {
            success: false,
            status: "failed",
            postsCount: 0,
            storiesCount: 0,
            errorMessage: `Token refresh failed: ${refreshError instanceof Error ? refreshError.message : "Unknown error"}`,
          };
          await logSyncResult(mentoradoId, ano, mes, result);
          return result;
        }
      }

      // 3. Calculate date range for the month
      const { startDate, endDate } = getMonthDateRange(ano, mes);

      // 4. Get account ID from token
      const accountId = token.instagramBusinessAccountId;
      if (!accountId) {
        const result: SyncResult = {
          success: false,
          status: "failed",
          postsCount: 0,
          storiesCount: 0,
          errorMessage: "No Instagram Business Account ID stored",
        };
        await logSyncResult(mentoradoId, ano, mes, result);
        return result;
      }

      // 5. Fetch media and stories in parallel
      const [media, stories] = await Promise.all([
        getMediaInsights(accountId, accessToken, startDate, endDate, logger),
        getStoriesInsights(accountId, accessToken, startDate, endDate, logger),
      ]);

      // 6. Count posts (excluding stories from media)
      const postsCount = media.filter((m) => m.mediaType !== "REEL").length;
      const storiesCount = stories.length;

      // 7. Update metricasMensais with synced counts
      await db
        .update(metricasMensais)
        .set({
          postsFeed: postsCount,
          stories: storiesCount,
          instagramSynced: "sim",
          instagramSyncDate: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(metricasMensais.mentoradoId, mentoradoId),
            eq(metricasMensais.ano, ano),
            eq(metricasMensais.mes, mes)
          )
        );

      // 8. Log success
      const result: SyncResult = {
        success: true,
        status: "success",
        postsCount,
        storiesCount,
      };
      await logSyncResult(mentoradoId, ano, mes, result);

      logger.info("sync_complete", {
        mentoradoId,
        ano,
        mes,
        postsCount,
        storiesCount,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error during sync";

      const result: SyncResult = {
        success: false,
        status: "failed",
        postsCount: 0,
        storiesCount: 0,
        errorMessage,
      };

      await logSyncResult(mentoradoId, ano, mes, result);
      logger.error("sync_failed", error, { mentoradoId, ano, mes });

      return result;
    }
  });
}

/**
 * Sync all connected mentorados for the current month
 *
 * @returns Summary of batch sync operation
 *
 * @example
 * const summary = await syncAllMentorados();
 * console.log(`Synced ${summary.successful}/${summary.totalMentorados} mentorados`);
 */
export async function syncAllMentorados(): Promise<SyncSummary> {
  const logger = createLogger({ service: "instagram", requestId: "sync-all" });
  const db = getDb();

  return measureAsync(logger, "sync_all", async () => {
    // 1. Get all mentorados with Instagram connected
    const connectedMentorados = await db
      .select({ id: mentorados.id })
      .from(mentorados)
      .where(eq(mentorados.instagramConnected, "sim"));

    if (connectedMentorados.length === 0) {
      logger.info("sync_all_no_mentorados");
      return {
        totalMentorados: 0,
        successful: 0,
        failed: 0,
        partial: 0,
        errors: [],
      };
    }

    // 2. Get current month and year
    const now = new Date();
    const ano = now.getFullYear();
    const mes = now.getMonth() + 1;

    // 3. Sync each mentorado (using Promise.allSettled for fault tolerance)
    const syncPromises = connectedMentorados.map((m) =>
      syncMentoradoMetrics(m.id, ano, mes).then((result) => ({
        mentoradoId: m.id,
        result,
      }))
    );

    const results = await Promise.allSettled(syncPromises);

    // 4. Aggregate results
    const summary: SyncSummary = {
      totalMentorados: connectedMentorados.length,
      successful: 0,
      failed: 0,
      partial: 0,
      errors: [],
    };

    for (const settledResult of results) {
      if (settledResult.status === "fulfilled") {
        const { mentoradoId, result } = settledResult.value;
        if (result.status === "success") {
          summary.successful++;
        } else if (result.status === "partial") {
          summary.partial++;
        } else {
          summary.failed++;
          summary.errors.push({
            mentoradoId,
            error: result.errorMessage ?? "Unknown error",
          });
        }
      } else {
        summary.failed++;
        summary.errors.push({
          mentoradoId: -1,
          error: settledResult.reason?.message ?? "Promise rejected",
        });
      }
    }

    logger.info("sync_all_complete", {
      total: summary.totalMentorados,
      successful: summary.successful,
      failed: summary.failed,
      partial: summary.partial,
    });

    return summary;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get Instagram token for a mentorado
 *
 * @param mentoradoId - The mentorado ID
 * @returns Token record or null if not found
 */
export async function getInstagramToken(mentoradoId: number) {
  const db = getDb();
  const [token] = await db
    .select()
    .from(instagramTokens)
    .where(eq(instagramTokens.mentoradoId, mentoradoId))
    .limit(1);

  return token ?? null;
}

/**
 * Insert or update Instagram token for a mentorado
 *
 * @param data - Token data to insert/update
 * @returns Inserted/updated token record
 */
export async function upsertInstagramToken(data: InsertInstagramToken) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(instagramTokens)
    .where(eq(instagramTokens.mentoradoId, data.mentoradoId))
    .limit(1);

  if (existing) {
    // Update existing token
    const [updated] = await db
      .update(instagramTokens)
      .set({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
        scope: data.scope,
        instagramBusinessAccountId: data.instagramBusinessAccountId,
        instagramUsername: data.instagramUsername,
        updatedAt: new Date(),
      })
      .where(eq(instagramTokens.mentoradoId, data.mentoradoId))
      .returning();

    return updated;
  }

  // Insert new token
  const [inserted] = await db.insert(instagramTokens).values(data).returning();

  // Update mentorado connection status
  await db
    .update(mentorados)
    .set({
      instagramConnected: "sim",
      instagramBusinessAccountId: data.instagramBusinessAccountId,
      updatedAt: new Date(),
    })
    .where(eq(mentorados.id, data.mentoradoId));

  return inserted;
}

/**
 * Delete Instagram token and update mentorado status
 *
 * @param mentoradoId - The mentorado ID
 * @returns true if deleted successfully
 */
export async function deleteInstagramToken(mentoradoId: number): Promise<boolean> {
  const db = getDb();
  await db.delete(instagramTokens).where(eq(instagramTokens.mentoradoId, mentoradoId));

  await db
    .update(mentorados)
    .set({
      instagramConnected: "nao",
      instagramBusinessAccountId: null,
      updatedAt: new Date(),
    })
    .where(eq(mentorados.id, mentoradoId));

  return true;
}

/**
 * Log Instagram sync result to database
 *
 * @param mentoradoId - The mentorado ID
 * @param ano - Year
 * @param mes - Month
 * @param result - Sync result to log
 */
async function logSyncResult(
  mentoradoId: number,
  ano: number,
  mes: number,
  result: SyncResult
): Promise<void> {
  const db = getDb();
  const logData: InsertInstagramSyncLog = {
    mentoradoId,
    ano,
    mes,
    postsCount: result.postsCount,
    storiesCount: result.storiesCount,
    syncStatus: result.status,
    errorMessage: result.errorMessage ?? null,
    syncedAt: new Date(),
  };

  // Use upsert pattern with unique constraint on (mentoradoId, ano, mes)
  const [existing] = await db
    .select()
    .from(instagramSyncLog)
    .where(
      and(
        eq(instagramSyncLog.mentoradoId, mentoradoId),
        eq(instagramSyncLog.ano, ano),
        eq(instagramSyncLog.mes, mes)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(instagramSyncLog)
      .set({
        postsCount: result.postsCount,
        storiesCount: result.storiesCount,
        syncStatus: result.status,
        errorMessage: result.errorMessage ?? null,
        syncedAt: new Date(),
      })
      .where(eq(instagramSyncLog.id, existing.id));
  } else {
    await db.insert(instagramSyncLog).values(logData);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a token is expired or about to expire (within 1 hour)
 */
function isTokenExpired(expiresAt: Date): boolean {
  const now = new Date();
  const bufferMs = 60 * 60 * 1000; // 1 hour buffer
  return expiresAt.getTime() - bufferMs < now.getTime();
}

/**
 * Get start and end dates for a specific month
 */
function getMonthDateRange(ano: number, mes: number): { startDate: Date; endDate: Date } {
  const startDate = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(ano, mes, 0, 23, 59, 59, 999); // Last day of month
  return { startDate, endDate };
}

/**
 * Fetch with exponential backoff retry for rate limiting
 */
async function fetchWithRetry(url: string, logger: Logger, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      // If rate limited (429), wait and retry
      if (response.status === 429 && attempt < maxRetries) {
        const waitMs = 2 ** attempt * 1000; // Exponential backoff
        logger.warn("rate_limited", null, { attempt, waitMs });
        await sleep(waitMs);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const waitMs = 2 ** attempt * 500;
        logger.warn("fetch_retry", error, { attempt, waitMs });
        await sleep(waitMs);
      }
    }
  }

  throw lastError ?? new Error("Fetch failed after retries");
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get Instagram metrics history for a mentorado (last N months)
 *
 * @param mentoradoId - The mentorado ID
 * @param months - Number of months to fetch (default 6)
 * @returns Array of metrics ordered by date ascending
 */
async function getMetricsHistory(
  mentoradoId: number,
  months = 6
): Promise<
  Array<{
    ano: number;
    mes: number;
    postsFeed: number;
    stories: number;
    followers: number;
    engagement: number;
  }>
> {
  const db = getDb();
  const syncLogs = await db
    .select({
      ano: instagramSyncLog.ano,
      mes: instagramSyncLog.mes,
      postsCount: instagramSyncLog.postsCount,
      storiesCount: instagramSyncLog.storiesCount,
    })
    .from(instagramSyncLog)
    .where(eq(instagramSyncLog.mentoradoId, mentoradoId))
    .orderBy(instagramSyncLog.ano, instagramSyncLog.mes)
    .limit(months);

  return syncLogs.map((log) => ({
    ano: log.ano,
    mes: log.mes,
    postsFeed: log.postsCount,
    stories: log.storiesCount,
    followers: 0, // TODO: Add followers tracking
    engagement: 0, // TODO: Add engagement calculation
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Instagram Service - Handles all Instagram Business API integration
 */
export const instagramService = {
  // OAuth Flow
  isInstagramConfigured,
  getAuthUrl,
  exchangeCodeForTokens,
  exchangeForLongLivedToken,
  refreshAccessToken,
  revokeAccess,

  // API Calls
  validateBusinessAccount,
  getMediaInsights,
  getStoriesInsights,

  // Sync Operations
  syncMentoradoMetrics,
  syncAllMentorados,

  // Database Helpers
  getInstagramToken,
  upsertInstagramToken,
  deleteInstagramToken,
  getMetricsHistory,
};
