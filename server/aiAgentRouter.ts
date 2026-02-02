/**
 * AI Agent Configuration tRPC Router
 * Manages AI SDR settings per mentorado
 */
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { aiAgentConfig } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { aiSdrService } from "./services/aiSdrService";

export const aiAgentRouter = router({
  /**
   * Get AI agent configuration for current mentorado
   */
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    // Get mentorado from user
    const db = getDb();
    const [config] = await db
      .select()
      .from(aiAgentConfig)
      .where(eq(aiAgentConfig.mentoradoId, ctx.mentoradoId ?? 0))
      .limit(1);

    if (!config) {
      // Return default config if none exists
      return {
        exists: false,
        ...aiSdrService.getDefaultConfig(),
      };
    }

    return {
      exists: true,
      ...config,
    };
  }),

  /**
   * Create or update AI agent configuration
   */
  upsertConfig: protectedProcedure
    .input(
      z.object({
        enabled: z.enum(["sim", "nao"]).optional(),
        systemPrompt: z.string().optional(),
        greetingMessage: z.string().optional(),
        qualificationQuestions: z.string().optional(),
        workingHoursStart: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .optional(),
        workingHoursEnd: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .optional(),
        workingDays: z.string().optional(), // CSV format: "0,1,2,3,4,5,6"
        responseDelayMs: z.number().min(1000).max(10000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mentoradoId = ctx.mentoradoId;
      if (!mentoradoId) {
        throw new Error("Mentorado não encontrado");
      }

      const db = getDb();

      // Check if config exists
      const [existing] = await db
        .select({ id: aiAgentConfig.id })
        .from(aiAgentConfig)
        .where(eq(aiAgentConfig.mentoradoId, mentoradoId))
        .limit(1);

      if (existing) {
        // Update existing
        await db
          .update(aiAgentConfig)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(aiAgentConfig.id, existing.id));
      } else {
        // Create new with defaults
        const defaults = aiSdrService.getDefaultConfig();
        await db.insert(aiAgentConfig).values({
          mentoradoId,
          enabled: input.enabled ?? defaults.enabled ?? "nao",
          systemPrompt: input.systemPrompt ?? defaults.systemPrompt,
          greetingMessage: input.greetingMessage ?? defaults.greetingMessage,
          qualificationQuestions: input.qualificationQuestions ?? null,
          workingHoursStart: input.workingHoursStart ?? defaults.workingHoursStart,
          workingHoursEnd: input.workingHoursEnd ?? defaults.workingHoursEnd,
          workingDays: input.workingDays ?? defaults.workingDays,
          responseDelayMs: input.responseDelayMs ?? defaults.responseDelayMs,
        });
      }

      return { success: true };
    }),

  /**
   * Toggle AI agent enabled/disabled
   */
  toggleEnabled: protectedProcedure.mutation(async ({ ctx }) => {
    const mentoradoId = ctx.mentoradoId;
    if (!mentoradoId) {
      throw new Error("Mentorado não encontrado");
    }

    const db = getDb();

    // Get current config
    const [config] = await db
      .select()
      .from(aiAgentConfig)
      .where(eq(aiAgentConfig.mentoradoId, mentoradoId))
      .limit(1);

    if (!config) {
      // Create new config with enabled
      const defaults = aiSdrService.getDefaultConfig();
      await db.insert(aiAgentConfig).values({
        mentoradoId,
        enabled: "sim",
        systemPrompt: defaults.systemPrompt,
        greetingMessage: defaults.greetingMessage,
        workingHoursStart: defaults.workingHoursStart,
        workingHoursEnd: defaults.workingHoursEnd,
        workingDays: defaults.workingDays,
        responseDelayMs: defaults.responseDelayMs,
      });
      return { enabled: true };
    }

    // Toggle current state
    const newEnabled = config.enabled === "sim" ? "nao" : "sim";
    await db
      .update(aiAgentConfig)
      .set({ enabled: newEnabled, updatedAt: new Date() })
      .where(eq(aiAgentConfig.id, config.id));

    return { enabled: newEnabled === "sim" };
  }),

  /**
   * Reset configuration to defaults
   */
  resetToDefaults: protectedProcedure.mutation(async ({ ctx }) => {
    const mentoradoId = ctx.mentoradoId;
    if (!mentoradoId) {
      throw new Error("Mentorado não encontrado");
    }

    const defaults = aiSdrService.getDefaultConfig();
    const db = getDb();

    await db
      .update(aiAgentConfig)
      .set({
        systemPrompt: defaults.systemPrompt,
        greetingMessage: defaults.greetingMessage,
        workingHoursStart: defaults.workingHoursStart,
        workingHoursEnd: defaults.workingHoursEnd,
        workingDays: defaults.workingDays,
        responseDelayMs: defaults.responseDelayMs,
        updatedAt: new Date(),
      })
      .where(eq(aiAgentConfig.mentoradoId, mentoradoId));

    return { success: true };
  }),
});
