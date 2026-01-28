import { z } from "zod";
import { 
  protectedProcedure, 
  router, 
  mentoradoProcedure, 
  adminProcedure 
} from "./_core/trpc";
import { TRPCError } from "@trpc/server"; // Added import
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { mentorados } from "../drizzle/schema";
import { sendWelcomeEmail } from "./emailService";
import {
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
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.mentorado || null;
  }),

  // Get specific mentorado by ID (admin only or self?)
  // Actually usually used by admin to "view as"
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
        const db = getDb();
        if (ctx.user?.role !== "admin") {
            // If not admin, can only see self
            if (ctx.mentorado?.id !== input.id) throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        const [mentorado] = await db.select().from(mentorados).where(eq(mentorados.id, input.id)).limit(1);
        if(!mentorado) throw new TRPCError({ code: "NOT_FOUND" });
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
        turma: z.enum(["neon_estrutura", "neon_escala"]),
        metaFaturamento: z.number().default(16000),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createMentorado(input);
      return { id };
    }),

  // Get metrics history for a mentorado
  metricas: mentoradoProcedure
    .query(async ({ ctx }) => {
      return await getMetricasMensaisByMentorado(ctx.mentorado.id);
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
        turma: z.enum(["neon_estrutura", "neon_escala"]).optional(),
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
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
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
        turma: z.enum(["neon_estrutura", "neon_escala"]),
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
        m => m.mentoradoId === userMentorado.id
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
