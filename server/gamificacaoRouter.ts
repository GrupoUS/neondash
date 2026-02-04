import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { mentorados, notificacoes } from "../drizzle/schema";
import { adminProcedure, mentoradoProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { sendEmail } from "./emailService";
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

  // Admin: Send metrics reminders
  sendReminders: adminProcedure.mutation(async () => {
    await sendMetricsReminders();
    return { success: true };
  }),

  /**
   * Get streak information for a mentorado
   * @returns currentStreak and longestStreak counts
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

      return await calculateStreak(input.mentoradoId);
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
   * Creates in-app notification and sends email
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

      const now = new Date();
      const mesAnterior = now.getMonth() === 0 ? 12 : now.getMonth();
      const anoAnterior = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

      // Create notification
      await db.insert(notificacoes).values({
        mentoradoId: input.mentoradoId,
        tipo: "lembrete_metricas",
        titulo: "Lembrete: Envie suas métricas!",
        mensagem: `Não se esqueça de enviar suas métricas de ${mesAnterior}/${anoAnterior}.`,
      });

      // Send email if available
      if (mentorado.email) {
        await sendEmail({
          to: mentorado.email,
          subject: "Lembrete: Envie suas métricas mensais",
          body: `Olá ${mentorado.nomeCompleto.split(" ")[0]},\n\nNão se esqueça de enviar suas métricas de ${mesAnterior}/${anoAnterior}.\n\nAcesse o dashboard para registrar seu desempenho.\n\nAbraços,\nEquipe Neon`,
        });
      }

      return { success: true };
    }),
});
