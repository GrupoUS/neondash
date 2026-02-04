/**
 * Notifications Router
 * Admin-configurable notification settings management
 *
 * @module notificationsRouter
 */

import { eq } from "drizzle-orm";
import { z } from "zod";
import { type NotificationSetting, notificationSettings } from "../drizzle/schema";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

const reminderDaysSchema = z.array(z.number().min(1).max(31));

const updateSettingsSchema = z.object({
  reminderDays: reminderDaysSchema.optional(),
  metricsRemindersEnabled: z.enum(["sim", "nao"]).optional(),
  badgeNotificationsEnabled: z.enum(["sim", "nao"]).optional(),
  rankingNotificationsEnabled: z.enum(["sim", "nao"]).optional(),
  emailTemplates: z
    .record(
      z.string(),
      z.object({
        subject: z.string().optional(),
        body: z.string().optional(),
      })
    )
    .optional(),
  inAppTemplates: z
    .record(
      z.string(),
      z.object({
        title: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_SETTINGS: Omit<NotificationSetting, "id" | "updatedAt" | "updatedBy"> = {
  reminderDays: "[1,3,6,11]",
  metricsRemindersEnabled: "sim",
  badgeNotificationsEnabled: "sim",
  rankingNotificationsEnabled: "sim",
  emailTemplates: null,
  inAppTemplates: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════════

export const notificationsRouter = router({
  /**
   * Get current notification settings
   * Returns default settings if none exist
   */
  getSettings: publicProcedure.query(async () => {
    const db = getDb();
    const [settings] = await db.select().from(notificationSettings).limit(1);

    if (!settings) {
      return {
        id: 0,
        reminderDays: JSON.parse(DEFAULT_SETTINGS.reminderDays) as number[],
        metricsRemindersEnabled: DEFAULT_SETTINGS.metricsRemindersEnabled === "sim",
        badgeNotificationsEnabled: DEFAULT_SETTINGS.badgeNotificationsEnabled === "sim",
        rankingNotificationsEnabled: DEFAULT_SETTINGS.rankingNotificationsEnabled === "sim",
        emailTemplates: {},
        inAppTemplates: {},
        updatedAt: new Date(),
      };
    }

    return {
      id: settings.id,
      reminderDays: JSON.parse(settings.reminderDays) as number[],
      metricsRemindersEnabled: settings.metricsRemindersEnabled === "sim",
      badgeNotificationsEnabled: settings.badgeNotificationsEnabled === "sim",
      rankingNotificationsEnabled: settings.rankingNotificationsEnabled === "sim",
      emailTemplates: settings.emailTemplates ? JSON.parse(settings.emailTemplates) : {},
      inAppTemplates: settings.inAppTemplates ? JSON.parse(settings.inAppTemplates) : {},
      updatedAt: settings.updatedAt,
    };
  }),

  /**
   * Update notification settings (admin only)
   */
  updateSettings: adminProcedure.input(updateSettingsSchema).mutation(async ({ ctx, input }) => {
    const db = getDb();

    // Check if settings exist
    const [existing] = await db.select().from(notificationSettings).limit(1);

    const updateData = {
      ...(input.reminderDays && { reminderDays: JSON.stringify(input.reminderDays) }),
      ...(input.metricsRemindersEnabled && {
        metricsRemindersEnabled: input.metricsRemindersEnabled,
      }),
      ...(input.badgeNotificationsEnabled && {
        badgeNotificationsEnabled: input.badgeNotificationsEnabled,
      }),
      ...(input.rankingNotificationsEnabled && {
        rankingNotificationsEnabled: input.rankingNotificationsEnabled,
      }),
      ...(input.emailTemplates && { emailTemplates: JSON.stringify(input.emailTemplates) }),
      ...(input.inAppTemplates && { inAppTemplates: JSON.stringify(input.inAppTemplates) }),
      updatedAt: new Date(),
      updatedBy: ctx.user?.id,
    };

    if (existing) {
      await db
        .update(notificationSettings)
        .set(updateData)
        .where(eq(notificationSettings.id, existing.id));
    } else {
      await db.insert(notificationSettings).values({
        reminderDays: input.reminderDays
          ? JSON.stringify(input.reminderDays)
          : DEFAULT_SETTINGS.reminderDays,
        metricsRemindersEnabled:
          input.metricsRemindersEnabled ?? DEFAULT_SETTINGS.metricsRemindersEnabled,
        badgeNotificationsEnabled:
          input.badgeNotificationsEnabled ?? DEFAULT_SETTINGS.badgeNotificationsEnabled,
        rankingNotificationsEnabled:
          input.rankingNotificationsEnabled ?? DEFAULT_SETTINGS.rankingNotificationsEnabled,
        emailTemplates: input.emailTemplates ? JSON.stringify(input.emailTemplates) : null,
        inAppTemplates: input.inAppTemplates ? JSON.stringify(input.inAppTemplates) : null,
        updatedBy: ctx.user?.id,
      });
    }

    return { success: true };
  }),

  /**
   * Get reminder days for scheduler (internal use)
   */
  getReminderDays: publicProcedure.query(async () => {
    const db = getDb();
    const [settings] = await db.select().from(notificationSettings).limit(1);

    if (!settings) {
      return JSON.parse(DEFAULT_SETTINGS.reminderDays) as number[];
    }

    return JSON.parse(settings.reminderDays) as number[];
  }),
});
