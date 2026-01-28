import { z } from "zod";
import { 
  protectedProcedure, 
  router, 
  mentoradoProcedure, 
  adminProcedure 
} from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { notificacoes } from "../drizzle/schema";
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
          message: "Acesso negado: você só pode ver suas próprias badges"
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
        turma: z.enum(["neon_estrutura", "neon_escala"]).optional(),
      })
    )
    .query(async ({ input }) => {
      return await getRanking(input.ano, input.mes, input.turma);
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
        throw new TRPCError({ code: "NOT_FOUND", message: "Notificação não encontrada" });
      }

      // 2. Strict Ownership Check
      if (notificacao.mentoradoId !== ctx.mentorado.id) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Esta notificação não pertence a você" 
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
  sendReminders: adminProcedure.mutation(async () => {
    await sendMetricsReminders();
    return { success: true };
  }),
});
