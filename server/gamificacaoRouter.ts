import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  initializeBadges,
  checkAndAwardBadges,
  calculateMonthlyRanking,
  updateProgressiveGoals,
  sendMetricsReminders,
  checkUnmetGoalsAlerts,
  getMentoradoBadges,
  getRanking,
  getNotificacoes,
  markNotificationRead,
  getAllBadges,
  getProgressiveGoals,
} from "./gamificacao";
import { getMentoradoByUserId, getMentoradoByEmail } from "./mentorados";

export const gamificacaoRouter = router({
  // Initialize badges in database (admin only, run once)
  initBadges: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Acesso negado");
    }
    await initializeBadges();
    return { success: true };
  }),

  // Get all available badges
  allBadges: protectedProcedure.query(async () => {
    return await getAllBadges();
  }),

  // Get current user's badges
  myBadges: protectedProcedure.query(async ({ ctx }) => {
    let mentorado = await getMentoradoByUserId(ctx.user.id);
    if (!mentorado && ctx.user.email) {
      mentorado = await getMentoradoByEmail(ctx.user.email);
    }
    if (!mentorado) return [];
    return await getMentoradoBadges(mentorado.id);
  }),

  // Get badges for a specific mentorado (admin)
  mentoradoBadges: protectedProcedure
    .input(z.object({ mentoradoId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        // Users can only see their own badges
        let mentorado = await getMentoradoByUserId(ctx.user.id);
        if (!mentorado && ctx.user.email) {
          mentorado = await getMentoradoByEmail(ctx.user.email);
        }
        if (!mentorado || mentorado.id !== input.mentoradoId) {
          throw new Error("Acesso negado");
        }
      }
      return await getMentoradoBadges(input.mentoradoId);
    }),

  // Get ranking for a specific month
  ranking: protectedProcedure
    .input(
      z.object({
        ano: z.number(),
        mes: z.number().min(1).max(12),
        turma: z.enum(["neon_estrutura", "neon_escala"]).optional(),
      })
    )
    .query(async ({ input }) => {
      return await getRanking(input.ano, input.mes, input.turma);
    }),

  // Get current user's notifications
  myNotificacoes: protectedProcedure
    .input(z.object({ apenasNaoLidas: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      let mentorado = await getMentoradoByUserId(ctx.user.id);
      if (!mentorado && ctx.user.email) {
        mentorado = await getMentoradoByEmail(ctx.user.email);
      }
      if (!mentorado) return [];
      return await getNotificacoes(mentorado.id, input.apenasNaoLidas);
    }),

  // Mark notification as read
  markRead: protectedProcedure
    .input(z.object({ notificacaoId: z.number() }))
    .mutation(async ({ input }) => {
      await markNotificationRead(input.notificacaoId);
      return { success: true };
    }),

  // Get current user's progressive goals
  myProgressiveGoals: protectedProcedure.query(async ({ ctx }) => {
    let mentorado = await getMentoradoByUserId(ctx.user.id);
    if (!mentorado && ctx.user.email) {
      mentorado = await getMentoradoByEmail(ctx.user.email);
    }
    if (!mentorado) return [];
    return await getProgressiveGoals(mentorado.id);
  }),

  // Admin: Process gamification for a specific month
  processMonth: protectedProcedure
    .input(
      z.object({
        ano: z.number(),
        mes: z.number().min(1).max(12),
        mentoradoId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Acesso negado");
      }

      // If mentoradoId provided, process only that mentorado
      if (input.mentoradoId) {
        const newBadges = await checkAndAwardBadges(
          input.mentoradoId,
          input.ano,
          input.mes
        );
        await updateProgressiveGoals(input.mentoradoId, input.ano, input.mes);
        return { badgesAwarded: newBadges.length };
      }

      // Otherwise, process all and calculate ranking
      await calculateMonthlyRanking(input.ano, input.mes);
      await checkUnmetGoalsAlerts(input.ano, input.mes);
      return { success: true };
    }),

  // Admin: Send metrics reminders
  sendReminders: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Acesso negado");
    }
    await sendMetricsReminders();
    return { success: true };
  }),
});
