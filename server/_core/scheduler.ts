/**
 * Bun-native Scheduler Module
 *
 * Provides daily and monthly scheduling helpers using setTimeout/setInterval.
 * Zero external dependencies, automatic recovery from downtime.
 *
 * @module scheduler
 */

import { and, desc, eq, gte } from "drizzle-orm";
import { instagramSyncLog } from "../../drizzle/schema";
import { getDb } from "../db";
import { syncAllMentorados } from "../services/instagramService";
import { notificationService } from "../services/notificationService";
import { ENV } from "./env";
import { createLogger, type Logger } from "./logger";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ScheduledTask {
  name: string;
  timerId: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>;
  type: "timeout" | "interval";
}

// Track active timers for potential cleanup on shutdown
const activeTasks: ScheduledTask[] = [];

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDULING HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate milliseconds until the next occurrence of a specific time
 *
 * @param hour - Hour of day (0-23)
 * @param minute - Minute of hour (0-59)
 * @returns Milliseconds until next occurrence
 */
function getDelayToTime(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date(now);

  target.setHours(hour, minute, 0, 0);

  // If target time has passed today, schedule for tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

/**
 * Calculate milliseconds until the next monthly occurrence
 *
 * @param day - Day of month (1-31)
 * @param hour - Hour of day (0-23)
 * @param minute - Minute of hour (0-59)
 * @returns Milliseconds until next occurrence
 */
function getDelayToMonthlyTime(day: number, hour: number, minute: number): number {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), day, hour, minute, 0, 0);

  // If target date/time has passed this month, schedule for next month
  if (target.getTime() <= now.getTime()) {
    target.setMonth(target.getMonth() + 1);
  }

  return target.getTime() - now.getTime();
}

/**
 * Schedule a task to run daily at a specific time
 *
 * @param name - Task name for logging
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @param task - Async function to execute
 * @param logger - Logger instance
 */
export function scheduleDaily(
  name: string,
  hour: number,
  minute: number,
  task: () => Promise<void>,
  logger: Logger
): void {
  const MS_IN_DAY = 24 * 60 * 60 * 1000;
  const delay = getDelayToTime(hour, minute);

  logger.info("schedule_daily", {
    name,
    scheduledFor: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    delayMs: delay,
    firstRunIn: `${Math.round(delay / 1000 / 60)} minutes`,
  });

  // Initial timeout to reach the first scheduled time
  const initialTimeout = setTimeout(async () => {
    // Run the task
    try {
      logger.info("task_start", { name });
      await task();
      logger.info("task_complete", { name });
    } catch (error) {
      logger.error("task_failed", error, { name });
    }

    // Set up interval for subsequent runs every 24 hours
    const intervalId = setInterval(async () => {
      try {
        logger.info("task_start", { name });
        await task();
        logger.info("task_complete", { name });
      } catch (error) {
        logger.error("task_failed", error, { name });
      }
    }, MS_IN_DAY);

    activeTasks.push({ name: `${name}_interval`, timerId: intervalId, type: "interval" });
  }, delay);

  activeTasks.push({ name: `${name}_initial`, timerId: initialTimeout, type: "timeout" });
}

/**
 * Schedule a task to run monthly on a specific day and time
 * (Future-proofing for notifications/reminders feature)
 *
 * @param name - Task name for logging
 * @param day - Day of month (1-31)
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @param task - Async function to execute
 * @param logger - Logger instance
 */
export function scheduleMonthly(
  name: string,
  day: number,
  hour: number,
  minute: number,
  task: () => Promise<void>,
  logger: Logger
): void {
  const delay = getDelayToMonthlyTime(day, hour, minute);

  logger.info("schedule_monthly", {
    name,
    scheduledForDay: day,
    scheduledForTime: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    delayMs: delay,
    firstRunIn: `${Math.round(delay / 1000 / 60 / 60)} hours`,
  });

  // Recursive scheduling since month lengths vary
  const scheduleNext = () => {
    const nextDelay = getDelayToMonthlyTime(day, hour, minute);

    const timerId = setTimeout(async () => {
      try {
        logger.info("task_start", { name });
        await task();
        logger.info("task_complete", { name });
      } catch (error) {
        logger.error("task_failed", error, { name });
      }

      // Schedule next month's run
      scheduleNext();
    }, nextDelay);

    activeTasks.push({ name, timerId, type: "timeout" });
  };

  scheduleNext();
}

// ═══════════════════════════════════════════════════════════════════════════
// CATCH-UP LOGIC
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if catch-up sync is needed (last sync was before today)
 *
 * @param logger - Logger instance
 * @returns true if catch-up sync was executed
 */
async function runCatchUpSyncIfNeeded(logger: Logger): Promise<boolean> {
  try {
    const db = getDb();

    // Calculate today at midnight for comparison (UTC for timezone-agnostic behavior)
    const now = new Date();
    const todayMidnight = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
    );

    // Get last SUCCESSFUL sync for today (failed/partial syncs should be retried)
    const [lastSuccessfulSync] = await db
      .select({ syncedAt: instagramSyncLog.syncedAt })
      .from(instagramSyncLog)
      .where(
        and(
          eq(instagramSyncLog.syncStatus, "success"),
          gte(instagramSyncLog.syncedAt, todayMidnight)
        )
      )
      .orderBy(desc(instagramSyncLog.syncedAt))
      .limit(1);

    // If no successful sync exists for today, run catch-up
    if (!lastSuccessfulSync) {
      // Get the most recent sync (any status) for logging purposes
      const [lastAnySync] = await db
        .select({ syncedAt: instagramSyncLog.syncedAt, status: instagramSyncLog.syncStatus })
        .from(instagramSyncLog)
        .orderBy(desc(instagramSyncLog.syncedAt))
        .limit(1);

      logger.info("catchup_sync_start", {
        lastSync: lastAnySync?.syncedAt?.toISOString() ?? "never",
        lastSyncStatus: lastAnySync?.status ?? "none",
        today: todayMidnight.toISOString(),
        reason:
          lastAnySync?.status === "failed" || lastAnySync?.status === "partial"
            ? "Retrying failed/partial sync"
            : "No sync today",
      });

      const summary = await syncAllMentorados();

      logger.info("catchup_sync_complete", {
        total: summary.totalMentorados,
        successful: summary.successful,
        failed: summary.failed,
        partial: summary.partial,
      });

      logger.info("catchup_sync_message", {
        message: `Catch-up sync completed: ${summary.successful}/${summary.totalMentorados} mentorados synced`,
      });

      return true;
    }

    logger.info("catchup_skip", {
      lastSuccessfulSync: lastSuccessfulSync.syncedAt.toISOString(),
      reason: "Successful sync already exists for today",
    });

    return false;
  } catch (error) {
    logger.error("catchup_sync_error", error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDULED TASKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Instagram daily sync task
 * Runs syncAllMentorados and logs results
 */
async function instagramDailySyncTask(logger: Logger): Promise<void> {
  logger.info("instagram_daily_sync_start", {
    timestamp: new Date().toISOString(),
  });

  const summary = await syncAllMentorados();

  logger.info("instagram_daily_sync_complete", {
    total: summary.totalMentorados,
    successful: summary.successful,
    failed: summary.failed,
    partial: summary.partial,
    errors: summary.errors.slice(0, 5), // Log first 5 errors only
  });

  logger.info("daily_sync_message", {
    message: `Daily Instagram sync: ${summary.successful}/${summary.totalMentorados} mentorados (${summary.failed} failed)`,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize all schedulers
 * Call this after database and Redis are initialized
 */
export async function initSchedulers(): Promise<void> {
  const logger = createLogger({ service: "scheduler" });

  logger.info("scheduler_init_start");

  // ═══════════════════════════════════════════════════════════════════════════
  // INSTAGRAM SYNC (requires Instagram env vars)
  // ═══════════════════════════════════════════════════════════════════════════
  const instagramEnvVars = [
    "instagramAppId",
    "instagramAppSecret",
    "instagramRedirectUri",
  ] as const;
  const missingInstagramVars: string[] = [];

  for (const envVar of instagramEnvVars) {
    if (!ENV[envVar]) {
      missingInstagramVars.push(envVar);
    }
  }

  if (missingInstagramVars.length > 0) {
    logger.warn("instagram_sync_disabled", {
      reason: "Missing Instagram environment variables",
      missingVars: missingInstagramVars,
    });
  } else {
    // Run catch-up sync if needed (handles missed syncs from server downtime)
    await runCatchUpSyncIfNeeded(logger);

    // Schedule daily Instagram sync at 6:00 AM
    scheduleDaily(
      "instagram_sync",
      6, // Hour (6 AM)
      0, // Minute
      () => instagramDailySyncTask(logger),
      logger
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MONTHLY METRICS REMINDERS (always run, no external dependencies)
  // ═══════════════════════════════════════════════════════════════════════════

  // Day 1 at 8:00 AM - First reminder of the month
  scheduleMonthly(
    "metrics_reminder_day1",
    1, // Day 1
    8, // Hour (8 AM)
    0, // Minute
    async () => {
      await notificationService.sendAllReminders("day_1");
    },
    logger
  );

  // Day 3 at 9:00 AM - Gentle nudge
  scheduleMonthly(
    "metrics_reminder_day3",
    3, // Day 3
    9, // Hour (9 AM)
    0, // Minute
    async () => {
      await notificationService.sendAllReminders("day_3");
    },
    logger
  );

  // Day 6 at 10:00 AM - Urgency reminder
  scheduleMonthly(
    "metrics_reminder_day6",
    6, // Day 6
    10, // Hour (10 AM)
    0, // Minute
    async () => {
      await notificationService.sendAllReminders("day_6");
    },
    logger
  );

  // Day 11 at 8:00 AM - Final reminder (last day to maintain streak)
  scheduleMonthly(
    "metrics_reminder_day11",
    11, // Day 11
    8, // Hour (8 AM)
    0, // Minute
    async () => {
      await notificationService.sendAllReminders("day_11");
    },
    logger
  );

  logger.info("scheduler_init_complete", {
    scheduledTasks: [
      ...(missingInstagramVars.length === 0 ? ["instagram_sync @ 06:00 daily"] : []),
      "metrics_reminder_day1 @ 08:00 monthly",
      "metrics_reminder_day3 @ 09:00 monthly",
      "metrics_reminder_day6 @ 10:00 monthly",
      "metrics_reminder_day11 @ 08:00 monthly",
    ],
  });
}

/**
 * Cleanup all scheduled tasks (for graceful shutdown)
 */
export function stopSchedulers(): void {
  const logger = createLogger({ service: "scheduler" });

  for (const task of activeTasks) {
    if (task.type === "timeout") {
      clearTimeout(task.timerId as ReturnType<typeof setTimeout>);
    } else {
      clearInterval(task.timerId as ReturnType<typeof setInterval>);
    }
    logger.info("task_stopped", { name: task.name });
  }

  activeTasks.length = 0;
  logger.info("scheduler_stopped");
}
