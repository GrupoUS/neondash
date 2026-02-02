import { TRPCError } from "@trpc/server"; // Added import
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { diagnosticos, interacoes, mentorados, metricasMensais } from "../drizzle/schema";
import { adminProcedure, mentoradoProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { sendWelcomeEmail } from "./emailService";
import {
  createMentorado,
  getAllMentorados,
  getFeedback,
  getMetricaMensal,
  getMetricasEvolution,
  getMetricasMensaisByMentorado,
  upsertFeedback,
  upsertMetricaMensal,
} from "./mentorados";

export const mentoradosRouter = router({
  // Get current user's mentorado profile
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.mentorado || null;
  }),

  // Get specific mentorado by ID (admin only or self?)
  // Actually usually used by admin to "view as"
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const db = getDb();
    if (ctx.user?.role !== "admin") {
      // If not admin, can only see self
      if (ctx.mentorado?.id !== input.id) throw new TRPCError({ code: "FORBIDDEN" });
    }

    const [mentorado] = await db
      .select()
      .from(mentorados)
      .where(eq(mentorados.id, input.id))
      .limit(1);
    if (!mentorado) throw new TRPCError({ code: "NOT_FOUND" });
    return mentorado;
  }),

  // Get all mentorados (admin only)
  list: adminProcedure.query(async () => {
    return await getAllMentorados();
  }),

  // Create mentorado profile - Admin Only
  create: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        nomeCompleto: z.string(),
        turma: z.literal("neon").default("neon"),
        metaFaturamento: z.number().default(16000),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createMentorado(input);
      return { id };
    }),

  // Get metrics history for a mentorado
  metricas: mentoradoProcedure.query(async ({ ctx }) => {
    return await getMetricasMensaisByMentorado(ctx.mentorado.id);
  }),

  // Get metrics history sorted ASC for charts
  evolution: mentoradoProcedure
    .input(z.object({ mentoradoId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      let targetId = ctx.mentorado.id;

      // If requested specific ID, verify access
      if (input?.mentoradoId) {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem acessar dados de outros mentorados",
          });
        }
        targetId = input.mentoradoId;
      }

      return await getMetricasEvolution(targetId);
    }),

  // Get specific month metrics
  metricaMes: mentoradoProcedure
    .input(
      z.object({
        ano: z.number(),
        mes: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getMetricaMensal(ctx.mentorado.id, input.ano, input.mes);
    }),

  // Submit/update monthly metrics
  submitMetricas: mentoradoProcedure
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
      const id = await upsertMetricaMensal({
        mentoradoId: ctx.mentorado.id,
        ...input,
      });

      return { id };
    }),

  // Get feedback for specific month
  feedback: mentoradoProcedure
    .input(
      z.object({
        ano: z.number(),
        mes: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getFeedback(ctx.mentorado.id, input.ano, input.mes);
    }),

  // Admin: Submit feedback for a mentorado
  submitFeedback: adminProcedure
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
    .mutation(async ({ input }) => {
      const id = await upsertFeedback(input);
      return { id };
    }),

  // Update mentorado profile (admin only)
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        nomeCompleto: z.string().optional(),
        email: z.string().email().optional().nullable(),
        fotoUrl: z.string().optional().nullable(),
        turma: z.literal("neon").optional(),
        metaFaturamento: z.number().optional(),
        metaLeads: z.number().optional(),
        metaProcedimentos: z.number().optional(),
        metaPosts: z.number().optional(),
        metaStories: z.number().optional(),
        ativo: z.enum(["sim", "nao"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
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
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.delete(mentorados).where(eq(mentorados.id, input.id));

    return { success: true };
  }),

  // Create new mentorado (admin only) - enhanced version
  createNew: adminProcedure
    .input(
      z.object({
        nomeCompleto: z.string(),
        email: z.string().email().optional(),
        fotoUrl: z.string().optional(),
        turma: z.literal("neon").default("neon"),
        metaFaturamento: z.number().default(16000),
        metaLeads: z.number().default(50),
        metaProcedimentos: z.number().default(10),
        metaPosts: z.number().default(12),
        metaStories: z.number().default(60),
      })
    )
    .mutation(async ({ input }) => {
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
        .returning({ id: mentorados.id });

      return { id: result[0].id };
    }),

  // Get comparative stats for dashboard
  comparativeStats: mentoradoProcedure
    .input(
      z.object({
        ano: z.number(),
        mes: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userMentorado = ctx.mentorado;

      // Single optimized query with JOIN - replaces N+1 pattern
      const turmaMetrics = await db
        .select({
          mentoradoId: mentorados.id,
          faturamento: metricasMensais.faturamento,
          lucro: metricasMensais.lucro,
          leads: metricasMensais.leads,
          procedimentos: metricasMensais.procedimentos,
          postsFeed: metricasMensais.postsFeed,
          stories: metricasMensais.stories,
        })
        .from(mentorados)
        .leftJoin(
          metricasMensais,
          and(
            eq(mentorados.id, metricasMensais.mentoradoId),
            eq(metricasMensais.ano, input.ano),
            eq(metricasMensais.mes, input.mes)
          )
        )
        .where(eq(mentorados.turma, userMentorado.turma));

      // Get total count of mentorados in turma
      const totalMentorados = turmaMetrics.length;

      // Filter out mentorados without metrics (null from leftJoin)
      const validMetrics = turmaMetrics.filter((m) => m.faturamento !== null);
      const mentoradosComDados = validMetrics.length;

      if (mentoradosComDados === 0) {
        return {
          userMetrics: null,
          turmaAverage: null,
          percentiles: null,
          totalMentorados,
          mentoradosComDados: 0,
        };
      }

      // Calculate turma averages
      const turmaAverage = {
        faturamento:
          validMetrics.reduce((acc, m) => acc + (m.faturamento || 0), 0) / mentoradosComDados,
        lucro: validMetrics.reduce((acc, m) => acc + (m.lucro || 0), 0) / mentoradosComDados,
        leads: validMetrics.reduce((acc, m) => acc + (m.leads || 0), 0) / mentoradosComDados,
        procedimentos:
          validMetrics.reduce((acc, m) => acc + (m.procedimentos || 0), 0) / mentoradosComDados,
        postsFeed:
          validMetrics.reduce((acc, m) => acc + (m.postsFeed || 0), 0) / mentoradosComDados,
        stories: validMetrics.reduce((acc, m) => acc + (m.stories || 0), 0) / mentoradosComDados,
      };

      // Get user's metrics from the same query results
      const userMetricData = validMetrics.find((m) => m.mentoradoId === userMentorado.id);
      const userMetrics = userMetricData
        ? {
            faturamento: userMetricData.faturamento || 0,
            lucro: userMetricData.lucro || 0,
            leads: userMetricData.leads || 0,
            procedimentos: userMetricData.procedimentos || 0,
            postsFeed: userMetricData.postsFeed || 0,
            stories: userMetricData.stories || 0,
          }
        : null;

      // Calculate percentiles for user
      const calculatePercentile = (value: number, allValues: number[]) => {
        const sorted = [...allValues].sort((a, b) => a - b);
        const index = sorted.findIndex((v) => v >= value);
        return Math.round(((index + 1) / sorted.length) * 100);
      };

      let percentiles = null;
      if (userMetrics) {
        percentiles = {
          faturamento: calculatePercentile(
            userMetrics.faturamento,
            validMetrics.map((m) => m.faturamento || 0)
          ),
          lucro: calculatePercentile(
            userMetrics.lucro,
            validMetrics.map((m) => m.lucro || 0)
          ),
          leads: calculatePercentile(
            userMetrics.leads,
            validMetrics.map((m) => m.leads || 0)
          ),
          procedimentos: calculatePercentile(
            userMetrics.procedimentos,
            validMetrics.map((m) => m.procedimentos || 0)
          ),
        };
      }

      return {
        userMetrics,
        turmaAverage,
        percentiles,
        totalMentorados,
        mentoradosComDados,
      };
    }),

  /**
   * Get Overview Stats for Dashboard Redesign (Optimized)
   * Fetches all data in parallel for better performance
   */
  getOverviewStats: mentoradoProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const mentoradoId = ctx.mentorado.id;

    // Parallel fetching for performance
    const [metrics, diagnostico, meetings, notes] = await Promise.all([
      // 1. Fetch Last 12 months metrics
      db
        .select()
        .from(metricasMensais)
        .where(eq(metricasMensais.mentoradoId, mentoradoId))
        .orderBy(desc(metricasMensais.ano), desc(metricasMensais.mes))
        .limit(12),

      // 2. Get Specialty from Diagnosticos
      db
        .select({ specialty: diagnosticos.atuacaoSaude })
        .from(diagnosticos)
        .where(eq(diagnosticos.mentoradoId, mentoradoId))
        .limit(1)
        .then((res) => res[0]),

      // 3. Get recent meetings
      db
        .select({
          id: interacoes.id,
          createdAt: interacoes.createdAt,
          duracao: interacoes.duracao,
          notas: interacoes.notas,
        })
        .from(interacoes)
        .where(and(eq(interacoes.mentoradoId, mentoradoId), eq(interacoes.tipo, "reuniao")))
        .orderBy(desc(interacoes.createdAt))
        .limit(5),

      // 4. Get recent notes
      db
        .select({
          id: interacoes.id,
          createdAt: interacoes.createdAt,
          notas: interacoes.notas,
        })
        .from(interacoes)
        .where(
          and(
            eq(interacoes.mentoradoId, mentoradoId),
            eq(interacoes.tipo, "nota"),
            isNull(interacoes.leadId)
          )
        )
        .orderBy(desc(interacoes.createdAt))
        .limit(5),
    ]);

    // Calculate Financials
    const chartData = [...metrics].sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      return a.mes - b.mes;
    });

    const totalRevenue = metrics.reduce((acc, m) => acc + m.faturamento, 0);
    const totalProfit = metrics.reduce((acc, m) => acc + m.lucro, 0);
    const averageRevenue = metrics.length > 0 ? totalRevenue / metrics.length : 0;

    // Calculate growth (compare latest month vs first month in data)
    let growthPercent = 0;
    if (chartData.length >= 2) {
      const first = chartData[0].faturamento || 1;
      const last = chartData[chartData.length - 1].faturamento;
      growthPercent = Math.round(((last - first) / first) * 100);
    }

    return {
      financials: {
        totalRevenue,
        totalProfit,
        averageRevenue,
        growthPercent,
        chartData,
      },
      profile: {
        specialty: diagnostico?.specialty || "N/A",
      },
      meetings,
      notes,
    };
  }),

  // Link email to mentorado (admin only)
  linkEmail: adminProcedure
    .input(
      z.object({
        mentoradoId: z.number(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
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
        await sendWelcomeEmail(input.email, mentorado.nomeCompleto, mentorado.turma);
      } catch (_error) {
        // Don't fail the mutation if email fails
      }

      return { success: true, emailSent: true };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ONBOARDING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if current mentorado has completed onboarding
   */
  isOnboardingComplete: mentoradoProcedure.query(async ({ ctx }) => {
    return ctx.mentorado.onboardingCompleted === "sim";
  }),

  /**
   * Mark current mentorado's onboarding as complete
   */
  completeOnboarding: mentoradoProcedure.mutation(async ({ ctx }) => {
    const db = getDb();
    await db
      .update(mentorados)
      .set({ onboardingCompleted: "sim", updatedAt: new Date() })
      .where(eq(mentorados.id, ctx.mentorado.id));
    return { success: true };
  }),
});
