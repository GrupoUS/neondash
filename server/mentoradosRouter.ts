import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  diagnosticos,
  instagramSyncLog,
  interacoes,
  mentorados,
  metricasMensais,
} from "../drizzle/schema";
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
  upsertMetricaMensalPartial,
} from "./mentorados";
import { instagramService } from "./services/instagramService";

// ═══════════════════════════════════════════════════════════════════════════
// INSTAGRAM VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Input schema for connecting Instagram
 */
const connectInstagramSchema = z.object({
  mentoradoId: z.number().positive("ID do mentorado deve ser positivo"),
});

/**
 * Input schema for Instagram OAuth callback
 */
const instagramCallbackSchema = z.object({
  code: z.string().min(1, "Código de autorização é obrigatório"),
  mentoradoId: z.number().positive("ID do mentorado deve ser positivo"),
});

/**
 * Input schema for fetching Instagram metrics
 */
const getInstagramMetricsSchema = z.object({
  ano: z.number().min(2020).max(2030),
  mes: z.number().min(1).max(12),
});

/**
 * Input schema for disconnecting Instagram
 */
const disconnectInstagramSchema = z.object({
  mentoradoId: z.number().positive("ID do mentorado deve ser positivo"),
});

import { createLogger } from "./_core/logger";

export const mentoradosRouter = router({
  // Get current user's mentorado profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const logger = createLogger({ service: "mentorados", userId: ctx.user?.clerkId });

    logger.info("mentorados_me_query_called", {
      hasUser: !!ctx.user,
      userId: ctx.user?.id,
      hasMentorado: !!ctx.mentorado,
      mentoradoId: ctx.mentorado?.id,
    });

    if (!ctx.mentorado) {
      logger.warn("mentorados_me_no_mentorado_in_context", {
        userId: ctx.user?.id,
        userEmail: ctx.user?.email,
      });
    }

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
  evolution: protectedProcedure
    .input(z.object({ mentoradoId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      // Determine target mentorado ID
      let targetId: number;

      if (input?.mentoradoId) {
        // Check authorization: admin can access any, non-admin only their own
        const isAdmin = ctx.user?.role === "admin";
        const isOwnMentorado = ctx.mentorado?.id === input.mentoradoId;

        if (!isAdmin && !isOwnMentorado) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem acessar dados de outros mentorados",
          });
        }
        targetId = input.mentoradoId;
      } else if (ctx.mentorado) {
        // Regular user viewing their own stats (no mentoradoId passed)
        targetId = ctx.mentorado.id;
      } else {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Perfil de mentorado não encontrado",
        });
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

  /**
   * Update a single metric field (for auto-save)
   */
  updateMetricaField: mentoradoProcedure
    .input(
      z.object({
        ano: z.number(),
        mes: z.number().min(1).max(12),
        field: z.enum(["faturamento", "lucro", "leads", "procedimentos", "postsFeed", "stories"]),
        value: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const partialData = { [input.field]: input.value };
      const id = await upsertMetricaMensalPartial(
        ctx.mentorado.id,
        input.ano,
        input.mes,
        partialData
      );
      return { id, success: true };
    }),

  /**
   * Update monthly goals (Admin)
   */
  updateMonthlyGoals: adminProcedure
    .input(
      z.object({
        mentoradoId: z.number(),
        ano: z.number(),
        mes: z.number().min(1).max(12),
        metaFaturamento: z.number().optional(),
        metaLeads: z.number().optional(),
        metaProcedimentos: z.number().optional(),
        metaPosts: z.number().optional(),
        metaStories: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { mentoradoId, ano, mes, ...goals } = input;
      // Import dynamically to avoid circular deps if any (though imports are at top)
      const { updateMonthlyGoals } = await import("./mentorados");
      const id = await updateMonthlyGoals(mentoradoId, ano, mes, goals);
      return { id, success: true };
    }),

  /**
   * Update monthly goals for ALL active mentorados (Admin)
   */
  updateGlobalMonthlyGoals: adminProcedure
    .input(
      z.object({
        ano: z.number(),
        mes: z.number().min(1).max(12),
        metaFaturamento: z.number().optional(),
        metaLeads: z.number().optional(),
        metaProcedimentos: z.number().optional(),
        metaPosts: z.number().optional(),
        metaStories: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { ano, mes, ...goals } = input;
      const db = getDb();
      const { updateMonthlyGoals } = await import("./mentorados");

      // Get all active mentorados
      const activeMentorados = await db
        .select({ id: mentorados.id })
        .from(mentorados)
        .where(eq(mentorados.ativo, "sim"));

      // Apply goals to each
      let count = 0;
      for (const m of activeMentorados) {
        await updateMonthlyGoals(m.id, ano, mes, goals);
        count++;
      }

      return { count, success: true };
    }),

  /**
   * Get previous month's metrics (for comparison placeholders)
   */
  getPreviousMonthMetrics: mentoradoProcedure
    .input(
      z.object({
        ano: z.number(),
        mes: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      // Calculate previous month
      let prevMes = input.mes - 1;
      let prevAno = input.ano;
      if (prevMes === 0) {
        prevMes = 12;
        prevAno = input.ano - 1;
      }
      return await getMetricaMensal(ctx.mentorado.id, prevAno, prevMes);
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
   * Admins can pass mentoradoId to view any mentorado's stats
   */
  getOverviewStats: protectedProcedure
    .input(z.object({ mentoradoId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();

      // Determine target mentorado ID
      let mentoradoId: number;

      if (input?.mentoradoId) {
        // Check authorization: admin can access any, non-admin only their own
        const isAdmin = ctx.user?.role === "admin";
        const isOwnMentorado = ctx.mentorado?.id === input.mentoradoId;

        if (!isAdmin && !isOwnMentorado) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem acessar dados de outros mentorados",
          });
        }
        mentoradoId = input.mentoradoId;
      } else if (ctx.mentorado) {
        // Regular user viewing their own stats (no mentoradoId passed)
        mentoradoId = ctx.mentorado.id;
      } else {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Perfil de mentorado não encontrado",
        });
      }

      // Parallel fetching for performance
      const [metrics, diagnostico, meetings, notes, mentoradoDetails] = await Promise.all([
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

        // 5. Get Mentorados meta data (for score calculation)
        db
          .select()
          .from(mentorados)
          .where(eq(mentorados.id, mentoradoId))
          .limit(1)
          .then((res) => res[0]),
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

      // Calculate Score for the latest month
      let score = 0;
      if (metrics.length > 0 && mentoradoDetails) {
        const latestMetric = metrics[0];
        // Import dynamically to avoid circular deps
        const { calculateScoreFromMetrics } = await import("./gamificacao");
        score = calculateScoreFromMetrics(mentoradoDetails, latestMetric);
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
        score, // Current month score
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

  // ═══════════════════════════════════════════════════════════════════════════
  // INSTAGRAM INTEGRATION ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Initiate Instagram OAuth flow by generating authorization URL
   *
   * @param mentoradoId - The mentorado ID to connect Instagram for
   * @returns Object with authorization URL to redirect user to
   * @throws TRPCError with code "PRECONDITION_FAILED" if Instagram OAuth not configured
   * @throws TRPCError with code "INTERNAL_SERVER_ERROR" on service failure
   *
   * @example
   * // Frontend usage:
   * const { authUrl } = await trpc.mentorados.connectInstagram.mutate({ mentoradoId: 123 });
   * window.location.href = authUrl;
   */
  connectInstagram: protectedProcedure
    .input(connectInstagramSchema)
    .mutation(async ({ ctx, input }) => {
      // Authorization check: admins can target any mentorado, users must match their own ID
      if (ctx.user?.role !== "admin" && ctx.mentorado?.id !== input.mentoradoId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para conectar o Instagram deste mentorado",
        });
      }

      try {
        // Check if Instagram OAuth is configured
        if (!instagramService.isInstagramConfigured()) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Instagram OAuth não está configurado. Configure INSTAGRAM_APP_ID e INSTAGRAM_APP_SECRET.",
          });
        }

        // Generate authorization URL
        const authUrl = instagramService.getAuthUrl(input.mentoradoId);

        return { authUrl };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Erro ao gerar URL de autorização do Instagram",
        });
      }
    }),

  /**
   * Process Instagram OAuth callback and store tokens
   *
   * @param code - Authorization code from Instagram OAuth callback
   * @param mentoradoId - The mentorado ID to associate the token with
   * @returns Object with success boolean
   * @throws TRPCError with code "BAD_REQUEST" if business account validation fails
   * @throws TRPCError with code "INTERNAL_SERVER_ERROR" on token exchange failure
   *
   * @example
   * // Frontend usage (in callback handler):
   * await trpc.mentorados.instagramCallback.mutate({ code: urlParams.code, mentoradoId: 123 });
   */
  instagramCallback: protectedProcedure
    .input(instagramCallbackSchema)
    .mutation(async ({ ctx, input }) => {
      // Authorization check: admins can target any mentorado, users must match their own ID
      if (ctx.user?.role !== "admin" && ctx.mentorado?.id !== input.mentoradoId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para conectar o Instagram deste mentorado",
        });
      }

      try {
        // Exchange authorization code for short-lived token
        const shortLivedResponse = await instagramService.exchangeCodeForTokens(input.code);

        // Exchange short-lived token for long-lived token (60 days)
        const longLivedResponse = await instagramService.exchangeForLongLivedToken(
          shortLivedResponse.access_token
        );

        // Validate business account
        const businessAccountInfo = await instagramService.validateBusinessAccount(
          longLivedResponse.access_token
        );

        if (!businessAccountInfo.isValid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              businessAccountInfo.errorMessage ??
              "Conta do Instagram precisa ser Business ou Creator",
          });
        }

        // Calculate expiration date
        const expiresAt = new Date(Date.now() + longLivedResponse.expires_in * 1000);

        // Upsert token to database
        await instagramService.upsertInstagramToken({
          mentoradoId: input.mentoradoId,
          accessToken: longLivedResponse.access_token,
          refreshToken: null,
          expiresAt,
          scope: "instagram_basic,instagram_manage_insights,pages_show_list",
          instagramBusinessAccountId: businessAccountInfo.accountId ?? null,
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Erro ao processar callback do Instagram",
        });
      }
    }),

  /**
   * Retrieve Instagram sync log for a specific month
   *
   * @param ano - Year (2020-2030)
   * @param mes - Month (1-12)
   * @returns Sync log record with postsCount, storiesCount, syncStatus, syncedAt, or null if not found
   *
   * @example
   * // Frontend usage:
   * const metrics = await trpc.mentorados.getInstagramMetrics.query({ ano: 2024, mes: 12 });
   * if (metrics) {
   *   console.log(`Posts: ${metrics.postsCount}, Stories: ${metrics.storiesCount}`);
   * }
   */
  getInstagramMetrics: mentoradoProcedure
    .input(getInstagramMetricsSchema)
    .query(async ({ ctx, input }) => {
      const db = getDb();

      const [syncLog] = await db
        .select({
          posts: instagramSyncLog.postsCount,
          stories: instagramSyncLog.storiesCount,
          syncedAt: instagramSyncLog.syncedAt,
        })
        .from(instagramSyncLog)
        .where(
          and(
            eq(instagramSyncLog.mentoradoId, ctx.mentorado.id),
            eq(instagramSyncLog.ano, input.ano),
            eq(instagramSyncLog.mes, input.mes)
          )
        )
        .limit(1);

      return syncLog ?? null;
    }),

  /**
   * Disconnect Instagram integration and delete tokens
   *
   * @param mentoradoId - The mentorado ID to disconnect Instagram for
   * @returns Object with success boolean
   * @throws TRPCError with code "FORBIDDEN" if user lacks permission
   * @throws TRPCError with code "INTERNAL_SERVER_ERROR" on service failure
   *
   * @example
   * // Frontend usage:
   * await trpc.mentorados.disconnectInstagram.mutate({ mentoradoId: 123 });
   */
  disconnectInstagram: protectedProcedure
    .input(disconnectInstagramSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify authorization: admin can disconnect any, user can only disconnect self
      if (ctx.user?.role !== "admin" && ctx.mentorado?.id !== input.mentoradoId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para desconectar o Instagram deste mentorado",
        });
      }

      try {
        await instagramService.revokeAccess(input.mentoradoId);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao desconectar Instagram",
        });
      }
    }),
});
