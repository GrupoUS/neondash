/**
 * Seed script for initializing the 15 gamification badges
 *
 * This script populates the badges table with the Core Flows spec badges.
 * It uses onConflictDoNothing to prevent duplicate insertions (idempotent).
 *
 * Run with: bun run server/seeds/initializeBadges.ts
 */

import { badges } from "../../drizzle/schema";
import { createLogger } from "../_core/logger";
import { getDb } from "../db";
import { BADGES_CONFIG } from "../gamificacao";

const logger = createLogger({ service: "seeds/initializeBadges" });

/**
 * Initialize all 15 badges in the database
 * Uses onConflictDoNothing for idempotent execution
 */
export async function initializeBadges() {
  const db = await getDb();
  if (!db) {
    logger.error("database_connection_failed", new Error("Failed to connect to database"));
    process.exit(1);
  }

  logger.info("seed_started", { badgeCount: BADGES_CONFIG.length });

  for (const badge of BADGES_CONFIG) {
    try {
      await db.insert(badges).values(badge).onConflictDoNothing();
      logger.info("badge_ready", { codigo: badge.codigo });
    } catch (error) {
      logger.error("badge_insert_failed", error, { codigo: badge.codigo });
    }
  }

  logger.info("seed_completed");
}

// Allow running as standalone script
if (import.meta.main) {
  initializeBadges()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error("seed_error", error);
      process.exit(1);
    });
}
