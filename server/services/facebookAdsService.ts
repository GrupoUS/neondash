/**
 * Facebook Marketing API Service
 * Handles OAuth2 flow, token management, and Facebook Ads API interactions
 * for syncing mentorado advertising metrics.
 *
 * @module facebookAdsService
 */

import { and, desc, eq } from "drizzle-orm";
import {
  facebookAdAccounts,
  facebookAdsInsights,
  facebookAdsSyncLog,
  facebookAdsTokens,
  type InsertFacebookAdsInsight,
  type InsertFacebookAdsSyncLog,
  type InsertFacebookAdsToken,
} from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { createLogger, type Logger, measureAsync } from "../_core/logger";
import { getDb } from "../db";

// ═══════════════════════════════════════════════════════════════════════════
// ENVIRONMENT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const FACEBOOK_ADS_APP_ID = ENV.facebookAdsAppId;
const FACEBOOK_ADS_APP_SECRET = ENV.facebookAdsAppSecret;
const FACEBOOK_ADS_REDIRECT_URI = ENV.facebookAdsRedirectUri;

// Facebook Marketing API OAuth scopes required for Ads insights
const SCOPES = [
  "ads_read", // Read ad insights
  "business_management", // Access Business Manager
  "pages_show_list", // List pages (required for some flows)
];

// Facebook Graph API version
const GRAPH_API_VERSION = "v24.0";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/** OAuth token response from Facebook */
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

/** Long-lived token exchange response */
interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // 60 days typically
}

/** Facebook Ad Account from /me/adaccounts */
interface AdAccountInfo {
  id: string; // act_XXXXX
  name: string;
  currency: string;
  timezone_name: string;
  account_status: number; // 1 = active
}

/** Insights data from Facebook Marketing API */
interface AdsInsightsData {
  impressions: number;
  clicks: number;
  spend: string; // float as string from API
  reach: number;
  cpm: string;
  cpc: string;
  ctr: string;
  actions?: Array<{ action_type: string; value: string }>;
}

/** Result of a single mentorado sync operation */
interface SyncResult {
  success: boolean;
  status: "success" | "failed" | "partial";
  campaignsCount: number;
  errorMessage?: string;
}

/** Summary of batch sync operation */
interface SyncSummary {
  totalMentorados: number;
  successful: number;
  failed: number;
  partial: number;
  errors: Array<{ mentoradoId: number; error: string }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// OAUTH FLOW FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if Facebook Ads OAuth is properly configured
 * @returns true if both FACEBOOK_ADS_APP_ID and FACEBOOK_ADS_APP_SECRET are set
 */
export function isFacebookAdsConfigured(): boolean {
  return Boolean(FACEBOOK_ADS_APP_ID && FACEBOOK_ADS_APP_SECRET);
}

/**
 * Generate Facebook Ads OAuth authorization URL
 *
 * @param mentoradoId - The mentorado ID to pass as state for callback handling
 * @returns Authorization URL to redirect user to
 * @throws Error if Facebook Ads OAuth is not configured
 */
export function getAuthUrl(mentoradoId: number): string {
  if (!FACEBOOK_ADS_APP_ID) {
    throw new Error("FACEBOOK_ADS_APP_ID not configured");
  }

  const params = new URLSearchParams({
    client_id: FACEBOOK_ADS_APP_ID,
    redirect_uri: FACEBOOK_ADS_REDIRECT_URI,
    scope: SCOPES.join(","),
    response_type: "code",
    state: String(mentoradoId),
  });

  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;
}

/**
 * Exchange authorization code for short-lived access token
 *
 * @param code - Authorization code from OAuth callback
 * @returns Token response with access_token
 * @throws Error if exchange fails
 */
export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  if (!FACEBOOK_ADS_APP_ID || !FACEBOOK_ADS_APP_SECRET) {
    throw new Error("Facebook Ads OAuth not configured");
  }

  const params = new URLSearchParams({
    client_id: FACEBOOK_ADS_APP_ID,
    client_secret: FACEBOOK_ADS_APP_SECRET,
    redirect_uri: FACEBOOK_ADS_REDIRECT_URI,
    code,
  });

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Facebook token exchange failed: ${error}`);
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
  if (!FACEBOOK_ADS_APP_ID || !FACEBOOK_ADS_APP_SECRET) {
    throw new Error("Facebook Ads OAuth not configured");
  }

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: FACEBOOK_ADS_APP_ID,
    client_secret: FACEBOOK_ADS_APP_SECRET,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Long-lived token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Refresh a long-lived access token before expiration
 *
 * @param accessToken - Current long-lived access token (must be valid)
 * @returns New token response with updated expires_in
 * @throws Error if refresh fails
 */
export async function refreshAccessToken(accessToken: string): Promise<LongLivedTokenResponse> {
  if (!FACEBOOK_ADS_APP_ID || !FACEBOOK_ADS_APP_SECRET) {
    throw new Error("Facebook Ads OAuth not configured");
  }

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: FACEBOOK_ADS_APP_ID,
    client_secret: FACEBOOK_ADS_APP_SECRET,
    fb_exchange_token: accessToken,
  });

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}

/**
 * Revoke Facebook Ads access for a mentorado
 * Deletes all related data: tokens, ad accounts, insights, and sync logs
 *
 * @param mentoradoId - The mentorado to revoke access for
 * @param logger - Optional logger instance
 * @returns true if revocation was successful
 */
export async function revokeAccess(mentoradoId: number, logger?: Logger): Promise<boolean> {
  const log = logger ?? createLogger({ service: "facebook-ads" });
  const db = getDb();

  try {
    // Delete all related data in order (insights and logs before tokens)
    await db.delete(facebookAdsInsights).where(eq(facebookAdsInsights.mentoradoId, mentoradoId));
    await db.delete(facebookAdsSyncLog).where(eq(facebookAdsSyncLog.mentoradoId, mentoradoId));
    await db.delete(facebookAdAccounts).where(eq(facebookAdAccounts.mentoradoId, mentoradoId));
    await db.delete(facebookAdsTokens).where(eq(facebookAdsTokens.mentoradoId, mentoradoId));

    log.info("revoke_success", { mentoradoId });
    return true;
  } catch (error) {
    log.error("revoke_failed", error, { mentoradoId });
    throw new Error(
      `Failed to delete Facebook Ads data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// API CALL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch ad accounts available to the user
 *
 * @param accessToken - Valid access token
 * @returns Array of ad accounts
 */
export async function getAdAccounts(accessToken: string): Promise<AdAccountInfo[]> {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/me/adaccounts` +
      `?fields=id,name,currency,timezone_name,account_status` +
      `&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch ad accounts: ${error}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Fetch campaign insights for a date range
 *
 * @param adAccountId - Facebook Ad Account ID (act_XXXXX)
 * @param accessToken - Valid access token
 * @param startDate - Start of date range (YYYY-MM-DD)
 * @param endDate - End of date range (YYYY-MM-DD)
 * @param logger - Optional logger instance
 * @returns Aggregated insights data
 */
export async function getCampaignInsights(
  adAccountId: string,
  accessToken: string,
  startDate: string,
  endDate: string,
  logger?: Logger
): Promise<AdsInsightsData | null> {
  const log = logger ?? createLogger({ service: "facebook-ads" });

  try {
    const params = new URLSearchParams({
      fields: "impressions,clicks,spend,reach,cpm,cpc,ctr,actions",
      time_range: JSON.stringify({ since: startDate, until: endDate }),
      level: "account",
      access_token: accessToken,
    });

    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${adAccountId}/insights?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.text();
      log.warn("insights_fetch_failed", error, { adAccountId });
      return null;
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      log.info("no_insights_data", { adAccountId, startDate, endDate });
      return null;
    }

    return data.data[0] as AdsInsightsData;
  } catch (error) {
    log.error("insights_fetch_error", error, { adAccountId });
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC LOGIC FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sync Facebook Ads metrics for a specific mentorado and month
 *
 * @param mentoradoId - The mentorado to sync
 * @param ano - Year (e.g., 2024)
 * @param mes - Month (1-12)
 * @returns Sync result with campaign count
 */
export async function syncMentoradoAdsMetrics(
  mentoradoId: number,
  ano: number,
  mes: number
): Promise<SyncResult> {
  const logger = createLogger({ service: "facebook-ads", requestId: `sync-${mentoradoId}` });
  const db = getDb();

  return measureAsync(logger, "sync_mentorado_ads", async () => {
    try {
      // 1. Get Facebook Ads token for mentorado
      const [token] = await db
        .select()
        .from(facebookAdsTokens)
        .where(eq(facebookAdsTokens.mentoradoId, mentoradoId))
        .limit(1);

      if (!token) {
        const result: SyncResult = {
          success: false,
          status: "failed",
          campaignsCount: 0,
          errorMessage: "No Facebook Ads token found for this mentorado",
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
            .update(facebookAdsTokens)
            .set({
              accessToken: refreshed.access_token,
              expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
              updatedAt: new Date(),
            })
            .where(eq(facebookAdsTokens.mentoradoId, mentoradoId));

          logger.info("token_refreshed", { mentoradoId });
        } catch (refreshError) {
          const result: SyncResult = {
            success: false,
            status: "failed",
            campaignsCount: 0,
            errorMessage: `Token refresh failed: ${refreshError instanceof Error ? refreshError.message : "Unknown error"}`,
          };
          await logSyncResult(mentoradoId, ano, mes, result);
          return result;
        }
      }

      // 3. Calculate date range for the month
      const { startDate, endDate } = getMonthDateRange(ano, mes);

      // 4. Get ad account from token
      const adAccountId = token.adAccountId;
      if (!adAccountId) {
        const result: SyncResult = {
          success: false,
          status: "failed",
          campaignsCount: 0,
          errorMessage: "No Ad Account ID stored",
        };
        await logSyncResult(mentoradoId, ano, mes, result);
        return result;
      }

      // 5. Fetch insights
      const insights = await getCampaignInsights(
        adAccountId,
        accessToken,
        startDate,
        endDate,
        logger
      );

      if (!insights) {
        // No data for this period (not an error)
        const result: SyncResult = {
          success: true,
          status: "success",
          campaignsCount: 0,
        };
        await logSyncResult(mentoradoId, ano, mes, result);
        return result;
      }

      // 6. Convert spend from string to centavos (BRL)
      const spendValue = Math.round(parseFloat(insights.spend || "0") * 100);
      const cpmValue = Math.round(parseFloat(insights.cpm || "0") * 100);
      const cpcValue = Math.round(parseFloat(insights.cpc || "0") * 100);
      const ctrValue = Math.round(parseFloat(insights.ctr || "0") * 10000); // e.g., 1.5% = 150

      // Extract conversions from actions array
      const conversions =
        insights.actions?.find((a) => a.action_type === "omni_purchase" || a.action_type === "lead")
          ?.value ?? "0";

      // 7. Upsert facebookAdsInsights
      const insightData: InsertFacebookAdsInsight = {
        mentoradoId,
        adAccountId,
        ano,
        mes,
        impressions: Number(insights.impressions) || 0,
        clicks: Number(insights.clicks) || 0,
        spend: spendValue,
        reach: Number(insights.reach) || 0,
        cpm: cpmValue,
        cpc: cpcValue,
        ctr: ctrValue,
        conversions: Number(conversions),
      };

      // Check if exists
      const [existing] = await db
        .select({ id: facebookAdsInsights.id })
        .from(facebookAdsInsights)
        .where(
          and(
            eq(facebookAdsInsights.mentoradoId, mentoradoId),
            eq(facebookAdsInsights.adAccountId, adAccountId),
            eq(facebookAdsInsights.ano, ano),
            eq(facebookAdsInsights.mes, mes)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(facebookAdsInsights)
          .set({ ...insightData, updatedAt: new Date() })
          .where(eq(facebookAdsInsights.id, existing.id));
      } else {
        await db.insert(facebookAdsInsights).values(insightData);
      }

      // 8. Log success
      const result: SyncResult = {
        success: true,
        status: "success",
        campaignsCount: 1, // Account-level aggregation
      };
      await logSyncResult(mentoradoId, ano, mes, result);

      logger.info("sync_complete", {
        mentoradoId,
        ano,
        mes,
        impressions: insightData.impressions,
        spend: insightData.spend,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error during sync";

      const result: SyncResult = {
        success: false,
        status: "failed",
        campaignsCount: 0,
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
 */
export async function syncAllMentorados(): Promise<SyncSummary> {
  const logger = createLogger({ service: "facebook-ads", requestId: "sync-all" });
  const db = getDb();

  return measureAsync(logger, "sync_all_ads", async () => {
    // Get all mentorados with Facebook Ads connected
    const connectedMentorados = await db
      .select({ id: facebookAdsTokens.mentoradoId })
      .from(facebookAdsTokens);

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

    // Get current month and year
    const now = new Date();
    const ano = now.getFullYear();
    const mes = now.getMonth() + 1;

    // Sync each mentorado
    const syncPromises = connectedMentorados.map((m) =>
      syncMentoradoAdsMetrics(m.id, ano, mes).then((result) => ({
        mentoradoId: m.id,
        result,
      }))
    );

    const results = await Promise.allSettled(syncPromises);

    // Aggregate results
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
            error: result.errorMessage || "Unknown error",
          });
        }
      } else {
        summary.failed++;
      }
    }

    logger.info("sync_all_complete", { ...summary });
    return summary;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get Facebook Ads token for a mentorado
 */
export async function getFacebookAdsToken(mentoradoId: number) {
  const db = getDb();
  const [token] = await db
    .select()
    .from(facebookAdsTokens)
    .where(eq(facebookAdsTokens.mentoradoId, mentoradoId))
    .limit(1);
  return token ?? null;
}

/**
 * Upsert Facebook Ads token
 */
export async function upsertFacebookAdsToken(data: InsertFacebookAdsToken) {
  const db = getDb();

  const [existing] = await db
    .select({ id: facebookAdsTokens.id })
    .from(facebookAdsTokens)
    .where(eq(facebookAdsTokens.mentoradoId, data.mentoradoId))
    .limit(1);

  if (existing) {
    await db
      .update(facebookAdsTokens)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(facebookAdsTokens.id, existing.id));
    return existing.id;
  }

  const [result] = await db
    .insert(facebookAdsTokens)
    .values(data)
    .returning({ id: facebookAdsTokens.id });
  return result.id;
}

/**
 * Delete Facebook Ads token for a mentorado
 */
export async function deleteFacebookAdsToken(mentoradoId: number) {
  const db = getDb();
  await db.delete(facebookAdsTokens).where(eq(facebookAdsTokens.mentoradoId, mentoradoId));
}

/**
 * Get insights history for a mentorado (last N months)
 */
export async function getInsightsHistory(mentoradoId: number, months: number = 6) {
  const db = getDb();

  // Order by year/month descending and limit to requested months
  const insights = await db
    .select()
    .from(facebookAdsInsights)
    .where(eq(facebookAdsInsights.mentoradoId, mentoradoId))
    .orderBy(desc(facebookAdsInsights.ano), desc(facebookAdsInsights.mes))
    .limit(months);

  return insights;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function isTokenExpired(expiresAt: Date): boolean {
  // Consider expired if less than 24 hours remaining
  const buffer = 24 * 60 * 60 * 1000; // 24 hours in ms
  return Date.now() + buffer > expiresAt.getTime();
}

function getMonthDateRange(ano: number, mes: number): { startDate: string; endDate: string } {
  const start = new Date(ano, mes - 1, 1);
  const end = new Date(ano, mes, 0); // Last day of month

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

async function logSyncResult(
  mentoradoId: number,
  ano: number,
  mes: number,
  result: SyncResult
): Promise<void> {
  const db = getDb();

  const logData: InsertFacebookAdsSyncLog = {
    mentoradoId,
    ano,
    mes,
    campaignsCount: result.campaignsCount,
    syncStatus: result.status,
    errorMessage: result.errorMessage,
  };

  // Upsert sync log
  const [existing] = await db
    .select({ id: facebookAdsSyncLog.id })
    .from(facebookAdsSyncLog)
    .where(
      and(
        eq(facebookAdsSyncLog.mentoradoId, mentoradoId),
        eq(facebookAdsSyncLog.ano, ano),
        eq(facebookAdsSyncLog.mes, mes)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(facebookAdsSyncLog)
      .set({ ...logData, syncedAt: new Date() })
      .where(eq(facebookAdsSyncLog.id, existing.id));
  } else {
    await db.insert(facebookAdsSyncLog).values(logData);
  }
}

// Export service object for convenience
export const facebookAdsService = {
  isFacebookAdsConfigured,
  getAuthUrl,
  exchangeCodeForTokens,
  exchangeForLongLivedToken,
  refreshAccessToken,
  revokeAccess,
  getAdAccounts,
  getCampaignInsights,
  syncMentoradoAdsMetrics,
  syncAllMentorados,
  getFacebookAdsToken,
  upsertFacebookAdsToken,
  deleteFacebookAdsToken,
  getInsightsHistory,
};
