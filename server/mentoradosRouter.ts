import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { mentorados } from "../drizzle/schema";
import { sendWelcomeEmail } from "./emailService";
import {
  getMentoradoByUserId,
  getMentoradoByEmail,
  getAllMentorados,
  createMentorado,
  getMetricasMensaisByMentorado,
  getMetricaMensal,
  upsertMetricaMensal,
  getFeedback,
  upsertFeedback,
} from "./mentorados";

export const mentoradosRouter = router({
  // Get current user's mentorado profile
  // First tries to find by userId, then by email
  me: protectedProcedure.query(async ({ ctx }) => {
    // Try to find by userId first (legacy)
    let mentorado = await getMentoradoByUserId(ctx.user.id);

    // If not found and user has email, try to find by email
    if (!mentorado && ctx.user.email) {
      mentorado = await getMentoradoByEmail(ctx.user.email);
    }

    return mentorado;
  }),

  // Get all mentorados (admin only)
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Acesso negado");
    }
    return await getAllMentorados();
  }),

  // Create mentorado profile
  create: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        nomeCompleto: z.string(),
        turma: z.enum(["neon_estrutura", "neon_escala"]),
        metaFaturamento: z.number().default(16000),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createMentorado(input);
      return { id };
    }),

  // Get metrics history for a mentorado
  metricas: protectedProcedure
    .input(
      z.object({
        mentoradoId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let mentoradoId = input.mentoradoId;

      // If no mentoradoId provided, use current user's
      if (!mentoradoId) {
        const mentorado = await getMentoradoByUserId(ctx.user.id);
        if (!mentorado) {
          throw new Error("Perfil de mentorado não encontrado");
        }
        mentoradoId = mentorado.id;
      }

      // Admin can see any mentorado, users can only see their own
      if (ctx.user.role !== "admin") {
        const mentorado = await getMentoradoByUserId(ctx.user.id);
        if (!mentorado || mentorado.id !== mentoradoId) {
          throw new Error("Acesso negado");
        }
      }

      return await getMetricasMensaisByMentorado(mentoradoId);
    }),

  // Get specific month metrics
  metricaMes: protectedProcedure
    .input(
      z.object({
        mentoradoId: z.number().optional(),
        ano: z.number(),
        mes: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      let mentoradoId = input.mentoradoId;

      if (!mentoradoId) {
        const mentorado = await getMentoradoByUserId(ctx.user.id);
        if (!mentorado) {
          throw new Error("Perfil de mentorado não encontrado");
        }
        mentoradoId = mentorado.id;
      }

      if (ctx.user.role !== "admin") {
        const mentorado = await getMentoradoByUserId(ctx.user.id);
        if (!mentorado || mentorado.id !== mentoradoId) {
          throw new Error("Acesso negado");
        }
      }

      return await getMetricaMensal(mentoradoId, input.ano, input.mes);
    }),

  // Submit/update monthly metrics
  submitMetricas: protectedProcedure
    .input(
      z.object({
        ano: z.number(),
        mes: z.number().min(1).max(12),
        faturamento: z.number().min(0),
        lucro: z.number().min(0),
        postsFeed: z.number().min(0),
        stories: z.number().min(0),
        leads: z.number().min(0),
        procedimentos: z.number().min(0),
        observacoes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mentorado = await getMentoradoByUserId(ctx.user.id);
      if (!mentorado) {
        throw new Error(
          "Perfil de mentorado não encontrado. Entre em contato com o administrador."
        );
      }

      const id = await upsertMetricaMensal({
        mentoradoId: mentorado.id,
        ...input,
      });

      return { id };
    }),

  // Get feedback for specific month
  feedback: protectedProcedure
    .input(
      z.object({
        mentoradoId: z.number().optional(),
        ano: z.number(),
        mes: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      let mentoradoId = input.mentoradoId;

      if (!mentoradoId) {
        const mentorado = await getMentoradoByUserId(ctx.user.id);
        if (!mentorado) {
          return null;
        }
        mentoradoId = mentorado.id;
      }

      if (ctx.user.role !== "admin") {
        const mentorado = await getMentoradoByUserId(ctx.user.id);
        if (!mentorado || mentorado.id !== mentoradoId) {
          throw new Error("Acesso negado");
        }
      }

      return await getFeedback(mentoradoId, input.ano, input.mes);
    }),

  // Admin: Submit feedback for a mentorado
  submitFeedback: protectedProcedure
    .input(
      z.object({
        mentoradoId: z.number(),
        ano: z.number(),
        mes: z.number().min(1).max(12),
        analiseMes: z.string(),
        focoProximoMes: z.string(),
        sugestaoMentor: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Apenas administradores podem enviar feedbacks");
      }

      const id = await upsertFeedback(input);
      return { id };
    }),

  // Update mentorado profile (admin only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        nomeCompleto: z.string().optional(),
        email: z.string().email().optional().nullable(),
        fotoUrl: z.string().optional().nullable(),
        turma: z.enum(["neon_estrutura", "neon_escala"]).optional(),
        metaFaturamento: z.number().optional(),
        metaLeads: z.number().optional(),
        metaProcedimentos: z.number().optional(),
        metaPosts: z.number().optional(),
        metaStories: z.number().optional(),
        ativo: z.enum(["sim", "nao"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Acesso negado");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );

      if (Object.keys(cleanData).length === 0) {
        throw new Error("Nenhum campo para atualizar");
      }

      await db.update(mentorados).set(cleanData).where(eq(mentorados.id, id));

      return { success: true };
    }),

  // Delete mentorado (admin only)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Acesso negado");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(mentorados).where(eq(mentorados.id, input.id));

      return { success: true };
    }),

  // Create new mentorado (admin only) - enhanced version
  createNew: protectedProcedure
    .input(
      z.object({
        nomeCompleto: z.string(),
        email: z.string().email().optional(),
        fotoUrl: z.string().optional(),
        turma: z.enum(["neon_estrutura", "neon_escala"]),
        metaFaturamento: z.number().default(16000),
        metaLeads: z.number().default(50),
        metaProcedimentos: z.number().default(10),
        metaPosts: z.number().default(12),
        metaStories: z.number().default(60),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Acesso negado");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .insert(mentorados)
        .values({
          nomeCompleto: input.nomeCompleto,
          email: input.email || null,
          fotoUrl: input.fotoUrl || null,
          turma: input.turma,
          metaFaturamento: input.metaFaturamento,
          metaLeads: input.metaLeads,
          metaProcedimentos: input.metaProcedimentos,
          metaPosts: input.metaPosts,
          metaStories: input.metaStories,
        })
        .returning({ id: mentorados.id }); // MUDANÇA: returning() para Postgres

      return { id: result[0].id };
    }),

  // Get comparative stats for dashboard
  comparativeStats: protectedProcedure
    .input(
      z.object({
        ano: z.number(),
        mes: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get current user's mentorado profile
      let userMentorado = await getMentoradoByUserId(ctx.user.id);
      if (!userMentorado && ctx.user.email) {
        userMentorado = await getMentoradoByEmail(ctx.user.email);
      }

      if (!userMentorado) {
        throw new Error("Perfil de mentorado não encontrado");
      }

      // Get all mentorados from the same turma
      const turmaResult = await db
        .select()
        .from(mentorados)
        .where(eq(mentorados.turma, userMentorado.turma));

      // Get metrics for all mentorados in the turma
      const allMetrics = await Promise.all(
        turmaResult.map(async m => {
          const metric = await getMetricaMensal(m.id, input.ano, input.mes);
          return { mentoradoId: m.id, metric };
        })
      );

      // Filter out mentorados without metrics
      const validMetrics = allMetrics.filter(m => m.metric !== null);

      if (validMetrics.length === 0) {
        return {
          userMetrics: null,
          turmaAverage: null,
          percentiles: null,
          totalMentorados: turmaResult.length,
          mentoradosComDados: 0,
        };
      }

      // Calculate turma averages
      const turmaAverage = {
        faturamento:
          validMetrics.reduce(
            (acc, m) => acc + (m.metric?.faturamento || 0),
            0
          ) / validMetrics.length,
        lucro:
          validMetrics.reduce((acc, m) => acc + (m.metric?.lucro || 0), 0) /
          validMetrics.length,
        leads:
          validMetrics.reduce((acc, m) => acc + (m.metric?.leads || 0), 0) /
          validMetrics.length,
        procedimentos:
          validMetrics.reduce(
            (acc, m) => acc + (m.metric?.procedimentos || 0),
            0
          ) / validMetrics.length,
        postsFeed:
          validMetrics.reduce((acc, m) => acc + (m.metric?.postsFeed || 0), 0) /
          validMetrics.length,
        stories:
          validMetrics.reduce((acc, m) => acc + (m.metric?.stories || 0), 0) /
          validMetrics.length,
      };

      // Get user's metrics
      const userMetricData = validMetrics.find(
        m => m.mentoradoId === userMentorado!.id
      );
      const userMetrics = userMetricData?.metric || null;

      // Calculate percentiles for user
      const calculatePercentile = (value: number, allValues: number[]) => {
        const sorted = [...allValues].sort((a, b) => a - b);
        const index = sorted.findIndex(v => v >= value);
        return Math.round(((index + 1) / sorted.length) * 100);
      };

      let percentiles = null;
      if (userMetrics) {
        percentiles = {
          faturamento: calculatePercentile(
            userMetrics.faturamento,
            validMetrics.map(m => m.metric?.faturamento || 0)
          ),
          lucro: calculatePercentile(
            userMetrics.lucro,
            validMetrics.map(m => m.metric?.lucro || 0)
          ),
          leads: calculatePercentile(
            userMetrics.leads,
            validMetrics.map(m => m.metric?.leads || 0)
          ),
          procedimentos: calculatePercentile(
            userMetrics.procedimentos,
            validMetrics.map(m => m.metric?.procedimentos || 0)
          ),
        };
      }

      return {
        userMetrics,
        turmaAverage,
        percentiles,
        totalMentorados: turmaResult.length,
        mentoradosComDados: validMetrics.length,
      };
    }),

  // Link email to mentorado (admin only)
  linkEmail: protectedProcedure
    .input(
      z.object({
        mentoradoId: z.number(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Acesso negado");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get mentorado info for email
      const mentoradoResult = await db
        .select()
        .from(mentorados)
        .where(eq(mentorados.id, input.mentoradoId))
        .limit(1);

      const mentorado = mentoradoResult[0];
      if (!mentorado) {
        throw new Error("Mentorado não encontrado");
      }

      // Update email
      await db
        .update(mentorados)
        .set({ email: input.email })
        .where(eq(mentorados.id, input.mentoradoId));

      // Send welcome email notification
      try {
        await sendWelcomeEmail(
          input.email,
          mentorado.nomeCompleto,
          mentorado.turma
        );
        console.log(`[LinkEmail] Welcome email sent to ${input.email}`);
      } catch (error) {
        console.warn(`[LinkEmail] Failed to send welcome email:`, error);
        // Don't fail the mutation if email fails
      }

      return { success: true, emailSent: true };
    }),
});
