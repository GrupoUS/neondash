import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { mentorados, notificacoes } from "../drizzle/schema";
import { adminProcedure, mentoradoProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  calculateMonthlyRanking,
  calculateStreak,
  checkAndAwardBadges,
  checkUnmetGoalsAlerts,
  getAllBadges,
  getMentoradoBadges,
  getNotificacoes,
  getProgressiveGoals,
  getRanking,
  initializeBadges,
  markNotificationRead,
  sendMetricsReminders,
  updateProgressiveGoals,
} from "./gamificacao";
import { notificationService } from "./services/notificationService";

export const gamificacaoRouter = router({
  // Initialize badges in database (admin only, run once)
  initBadges: adminProcedure.mutation(async () => {
    await initializeBadges();
    return { success: true };
  }),

  // Get all available badges
  allBadges: protectedProcedure.query(async () => {
    return await getAllBadges();
  }),

  // Get current user's badges
  myBadges: mentoradoProcedure.query(async ({ ctx }) => {
    return await getMentoradoBadges(ctx.mentorado.id);
  }),

  // Get badges for a specific mentorado (admin or self)
  mentoradoBadges: mentoradoProcedure
    .input(z.object({ mentoradoId: z.number() }))
    .query(async ({ ctx, input }) => {
      // If user is admin, allow
      if (ctx.user.role === "admin") {
        return await getMentoradoBadges(input.mentoradoId);
      }

      // If user is NOT admin, ensure they are requesting THEIR OWN badges
      if (ctx.mentorado.id !== input.mentoradoId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado: você só pode ver suas próprias badges",
        });
      }

      return await getMentoradoBadges(input.mentoradoId);
    }),

  // Get ranking for a specific month
  ranking: protectedProcedure
    .input(
      z.object({
        ano: z.number(),
        mes: z.number().min(1).max(12),
      })
    )
    .query(async ({ input }) => {
      return await getRanking(input.ano, input.mes);
    }),

  // Get current user's notifications
  myNotificacoes: mentoradoProcedure
    .input(z.object({ apenasNaoLidas: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      return await getNotificacoes(ctx.mentorado.id, input.apenasNaoLidas);
    }),

  // Mark notification as read (with strict ownership check)
  markRead: mentoradoProcedure
    .input(z.object({ notificacaoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // 1. Fetch notification to verify ownership
      const [notificacao] = await db
        .select()
        .from(notificacoes)
        .where(eq(notificacoes.id, input.notificacaoId))
        .limit(1);

      if (!notificacao) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notificação não encontrada",
        });
      }

      // 2. Strict Ownership Check
      if (notificacao.mentoradoId !== ctx.mentorado.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Esta notificação não pertence a você",
        });
      }

      // 3. Update
      await markNotificationRead(input.notificacaoId);
      return { success: true };
    }),

  // Get current user's progressive goals
  myProgressiveGoals: mentoradoProcedure.query(async ({ ctx }) => {
    return await getProgressiveGoals(ctx.mentorado.id);
  }),

  // Admin: Process gamification for a specific month
  processMonth: adminProcedure
    .input(
      z.object({
        ano: z.number(),
        mes: z.number().min(1).max(12),
        mentoradoId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // If mentoradoId provided, process only that mentorado
      if (input.mentoradoId) {
        const newBadges = await checkAndAwardBadges(input.mentoradoId, input.ano, input.mes);
        await updateProgressiveGoals(input.mentoradoId, input.ano, input.mes);
        return { badgesAwarded: newBadges.length };
      }

      // Otherwise, process all and calculate ranking
      await calculateMonthlyRanking(input.ano, input.mes);
      await checkUnmetGoalsAlerts(input.ano, input.mes);
      return { success: true };
    }),

  // Admin: Send metrics reminders (uses legacy function for compatibility)
  sendReminders: adminProcedure.mutation(async () => {
    await sendMetricsReminders();
    return { success: true };
  }),

  /**
   * Get streak information for a mentorado
   * @returns currentStreak and longestStreak counts only (per contract)
   */
  getStreak: mentoradoProcedure
    .input(z.object({ mentoradoId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Authorization: allow if admin OR requesting own streak
      if (ctx.user.role !== "admin" && ctx.mentorado.id !== input.mentoradoId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você só pode ver seu próprio streak",
        });
      }

      // Project only contract-specified fields
      const streak = await calculateStreak(input.mentoradoId);
      return {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
      };
    }),

  /**
   * Check and award new badges for a mentorado
   * Triggers badge checking for the current month
   * @returns Array of newly awarded badges
   */
  checkNewBadges: mentoradoProcedure
    .input(z.object({ mentoradoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Authorization: allow if admin OR checking own badges
      if (ctx.user.role !== "admin" && ctx.mentorado.id !== input.mentoradoId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você só pode verificar suas próprias badges",
        });
      }

      const now = new Date();
      const ano = now.getFullYear();
      const mes = now.getMonth() + 1;

      const newBadges = await checkAndAwardBadges(input.mentoradoId, ano, mes);
      return { newBadges };
    }),

  /**
   * Admin: Send a reminder notification immediately to a specific mentorado
   * Creates in-app notification and sends email using notification service
   */
  sendReminderNow: adminProcedure
    .input(z.object({ mentoradoId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [mentorado] = await db
        .select()
        .from(mentorados)
        .where(eq(mentorados.id, input.mentoradoId));

      if (!mentorado) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mentorado não encontrado",
        });
      }

      // Align with scheduled reminder logic: remind for PREVIOUS month (pending metrics)
      const now = new Date();
      const currentMonth = now.getMonth(); // 0-indexed (0 = January)
      const mesAnterior = currentMonth === 0 ? 12 : currentMonth;
      const anoAnterior = currentMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();

      // Use notification service for dual-channel delivery
      const result = await notificationService.sendMetricsReminder(
        input.mentoradoId,
        mesAnterior,
        anoAnterior,
        "manual"
      );

      return {
        success: result.inAppSuccess,
        emailSent: result.emailSuccess,
      };
    }),
});
