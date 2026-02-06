/**
 * Instagram Content Publishing Service
 *
 * Handles publishing posts, reels, and carousels to Instagram via Graph API.
 * Implements the 2-step container-based publishing flow required by Meta.
 *
 * Publishing Flow:
 * 1. Create media container with image_url and caption
 * 2. Wait for container to be ready (status polling)
 * 3. Publish the container to Instagram
 *
 * @module instagramPublishService
 */

import { eq } from "drizzle-orm";
import { instagramTokens } from "../../drizzle/schema";
import { marketingPosts } from "../../drizzle/schema-marketing";
import { createLogger, type Logger } from "../_core/logger";
import { getDb } from "../db";

// Instagram Graph API version
const GRAPH_API_VERSION = "v18.0";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PublishResult {
  success: boolean;
  mediaId?: string;
  containerId?: string;
  error?: string;
  errorCode?: string;
}

export interface ContainerStatus {
  id: string;
  status: "IN_PROGRESS" | "FINISHED" | "ERROR";
  statusCode?: string;
  errorMessage?: string;
}

export interface PublishingLimits {
  quotaUsage: number;
  quotaTotal: number;
  quotaRemaining: number;
  resetsAt?: Date;
}

interface InstagramTokenData {
  accessToken: string;
  instagramBusinessAccountId: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN HELPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get Instagram token and account ID for a mentorado
 */
async function getInstagramCredentials(mentoradoId: number): Promise<InstagramTokenData | null> {
  const db = getDb();

  const [token] = await db
    .select({
      accessToken: instagramTokens.accessToken,
      instagramBusinessAccountId: instagramTokens.instagramBusinessAccountId,
    })
    .from(instagramTokens)
    .where(eq(instagramTokens.mentoradoId, mentoradoId))
    .limit(1);

  return token || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTAINER CREATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a media container for a single image post
 *
 * @param igAccountId - Instagram Business Account ID
 * @param accessToken - Valid access token (Page or User)
 * @param imageUrl - Publicly accessible image URL (Meta will cURL it)
 * @param caption - Post caption (max 2200 chars)
 * @param logger - Optional logger
 * @returns Container ID if successful
 */
export async function createMediaContainer(
  igAccountId: string,
  accessToken: string,
  imageUrl: string,
  caption: string,
  logger?: Logger
): Promise<{ success: boolean; containerId?: string; error?: string }> {
  const log = logger ?? createLogger({ service: "instagram-publish" });

  try {
    const params = new URLSearchParams({
      image_url: imageUrl,
      caption,
      access_token: accessToken,
    });

    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${igAccountId}/media`,
      {
        method: "POST",
        body: params,
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || "Failed to create container";
      log.error("container_create_failed", new Error(errorMsg), {
        igAccountId,
        errorCode: data.error?.code,
      });
      return { success: false, error: errorMsg };
    }

    log.info("container_created", { containerId: data.id, igAccountId });
    return { success: true, containerId: data.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.error("container_create_error", error, { igAccountId });
    return { success: false, error: message };
  }
}

/**
 * Create a carousel container (multiple images/videos)
 *
 * @param igAccountId - Instagram Business Account ID
 * @param accessToken - Valid access token
 * @param childContainerIds - Array of child media container IDs
 * @param caption - Carousel caption
 * @param logger - Optional logger
 */
export async function createCarouselContainer(
  igAccountId: string,
  accessToken: string,
  childContainerIds: string[],
  caption: string,
  logger?: Logger
): Promise<{ success: boolean; containerId?: string; error?: string }> {
  const log = logger ?? createLogger({ service: "instagram-publish" });

  try {
    const params = new URLSearchParams({
      media_type: "CAROUSEL",
      caption,
      access_token: accessToken,
    });

    // Add children as comma-separated list
    params.append("children", childContainerIds.join(","));

    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${igAccountId}/media`,
      {
        method: "POST",
        body: params,
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || "Failed to create carousel";
      log.error("carousel_create_failed", new Error(errorMsg), {
        igAccountId,
        childCount: childContainerIds.length,
      });
      return { success: false, error: errorMsg };
    }

    log.info("carousel_created", { containerId: data.id, igAccountId });
    return { success: true, containerId: data.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.error("carousel_create_error", error, { igAccountId });
    return { success: false, error: message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTAINER STATUS POLLING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check the status of a media container
 *
 * Containers transition through states:
 * - IN_PROGRESS: Still processing
 * - FINISHED: Ready to publish
 * - ERROR: Failed (check status_code for details)
 */
export async function getContainerStatus(
  containerId: string,
  accessToken: string,
  logger?: Logger
): Promise<ContainerStatus> {
  const log = logger ?? createLogger({ service: "instagram-publish" });

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${containerId}?fields=status,status_code&access_token=${accessToken}`
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        id: containerId,
        status: "ERROR",
        errorMessage: data.error?.message || "Status check failed",
      };
    }

    return {
      id: containerId,
      status: data.status || "IN_PROGRESS",
      statusCode: data.status_code,
    };
  } catch (error) {
    log.error("status_check_error", error, { containerId });
    return {
      id: containerId,
      status: "ERROR",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Wait for a container to be ready for publishing
 *
 * @param containerId - Container ID to poll
 * @param accessToken - Access token
 * @param maxAttempts - Max polling attempts (default 30 = 5 minutes)
 * @param intervalMs - Polling interval in ms (default 10000 = 10s)
 */
export async function waitForContainerReady(
  containerId: string,
  accessToken: string,
  maxAttempts = 30,
  intervalMs = 10000,
  logger?: Logger
): Promise<{ ready: boolean; error?: string }> {
  const log = logger ?? createLogger({ service: "instagram-publish" });

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const status = await getContainerStatus(containerId, accessToken, log);

    if (status.status === "FINISHED") {
      log.info("container_ready", { containerId, attempts: attempt });
      return { ready: true };
    }

    if (status.status === "ERROR") {
      log.error("container_error", new Error(status.errorMessage || "Unknown"), {
        containerId,
        statusCode: status.statusCode,
      });
      return { ready: false, error: status.errorMessage };
    }

    // Still IN_PROGRESS - wait before next poll
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  return { ready: false, error: "Container processing timeout" };
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLISHING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Publish a ready container to Instagram
 *
 * @param igAccountId - Instagram Business Account ID
 * @param containerId - Ready container ID
 * @param accessToken - Access token
 * @returns Media ID of published post
 */
export async function publishContainer(
  igAccountId: string,
  containerId: string,
  accessToken: string,
  logger?: Logger
): Promise<PublishResult> {
  const log = logger ?? createLogger({ service: "instagram-publish" });

  try {
    const params = new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    });

    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${igAccountId}/media_publish`,
      {
        method: "POST",
        body: params,
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || "Publish failed";
      log.error("publish_failed", new Error(errorMsg), {
        igAccountId,
        containerId,
        errorCode: data.error?.code,
      });
      return {
        success: false,
        containerId,
        error: errorMsg,
        errorCode: data.error?.code?.toString(),
      };
    }

    log.info("publish_success", {
      mediaId: data.id,
      igAccountId,
      containerId,
    });

    return {
      success: true,
      mediaId: data.id,
      containerId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.error("publish_error", error, { igAccountId, containerId });
    return { success: false, containerId, error: message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HIGH-LEVEL PUBLISHING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Publish a complete post (single image) to Instagram
 *
 * Full workflow: create container → poll status → publish
 *
 * @param mentoradoId - Mentorado ID (for token lookup)
 * @param imageUrl - Public image URL
 * @param caption - Post caption
 * @returns Publish result with media ID
 */
export async function publishPost(
  mentoradoId: number,
  imageUrl: string,
  caption: string
): Promise<PublishResult> {
  const logger = createLogger({ service: "instagram-publish", requestId: `pub-${mentoradoId}` });

  // 1. Get credentials
  const creds = await getInstagramCredentials(mentoradoId);
  if (!creds || !creds.instagramBusinessAccountId) {
    return {
      success: false,
      error: "Instagram not connected or missing Business Account ID",
    };
  }

  const accessToken = creds.accessToken;
  const igAccountId = creds.instagramBusinessAccountId;

  // 2. Create container
  const containerResult = await createMediaContainer(
    igAccountId,
    accessToken,
    imageUrl,
    caption,
    logger
  );

  if (!containerResult.success || !containerResult.containerId) {
    return { success: false, error: containerResult.error };
  }

  // 3. Wait for container to be ready
  const readyResult = await waitForContainerReady(
    containerResult.containerId,
    accessToken,
    30,
    10000,
    logger
  );

  if (!readyResult.ready) {
    return {
      success: false,
      containerId: containerResult.containerId,
      error: readyResult.error,
    };
  }

  // 4. Publish
  return publishContainer(igAccountId, containerResult.containerId, accessToken, logger);
}

/**
 * Publish a marketing post from the database
 *
 * @param postId - Marketing post ID
 * @returns Publish result
 */
export async function publishMarketingPost(postId: number): Promise<PublishResult> {
  const logger = createLogger({ service: "instagram-publish", requestId: `post-${postId}` });
  const db = getDb();

  // 1. Get post from database
  const [post] = await db
    .select()
    .from(marketingPosts)
    .where(eq(marketingPosts.id, postId))
    .limit(1);

  if (!post) {
    return { success: false, error: "Post not found" };
  }

  if (!post.imageUrl) {
    return { success: false, error: "Post has no image URL" };
  }

  if (post.status === "published") {
    return { success: false, error: "Post already published" };
  }

  // 2. Publish
  const result = await publishPost(post.mentoradoId, post.imageUrl, post.caption || "");

  // 3. Update post status
  if (result.success) {
    await db
      .update(marketingPosts)
      .set({
        status: "published",
        publishedAt: new Date(),
        instagramMediaId: result.mediaId,
        updatedAt: new Date(),
      })
      .where(eq(marketingPosts.id, postId));

    logger.info("marketing_post_published", { postId, mediaId: result.mediaId });
  } else {
    await db
      .update(marketingPosts)
      .set({
        status: "failed",
        updatedAt: new Date(),
      })
      .where(eq(marketingPosts.id, postId));

    logger.error("marketing_post_failed", new Error(result.error || "Unknown"), { postId });
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check publishing rate limits for an Instagram account
 *
 * Rate limit: 25 posts per 24-hour window per Instagram User
 */
export async function getPublishingLimits(mentoradoId: number): Promise<PublishingLimits | null> {
  const logger = createLogger({ service: "instagram-publish" });

  const creds = await getInstagramCredentials(mentoradoId);
  if (!creds || !creds.instagramBusinessAccountId) {
    return null;
  }

  const accessToken = creds.accessToken;
  const igAccountId = creds.instagramBusinessAccountId;

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${igAccountId}/content_publishing_limit?fields=quota_usage,config&access_token=${accessToken}`
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      logger.warn("limits_fetch_failed", data.error, { igAccountId });
      return null;
    }

    const quotaUsage = data.quota_usage || 0;
    const quotaTotal = data.config?.quota_total || 25;

    return {
      quotaUsage,
      quotaTotal,
      quotaRemaining: quotaTotal - quotaUsage,
    };
  } catch (error) {
    logger.error("limits_error", error, { mentoradoId });
    return null;
  }
}

/**
 * Check if mentorado can publish more content today
 */
export async function canPublish(mentoradoId: number): Promise<boolean> {
  const limits = await getPublishingLimits(mentoradoId);
  return limits ? limits.quotaRemaining > 0 : false;
}
