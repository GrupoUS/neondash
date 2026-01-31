import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { diagnosticos, mentorados } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";

export const diagnosticoRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();

    // 1. Get user's mentorado record
    // We can use ctx.mentorado if available, but let's be safe and query via db if needed,
    // though protectedProcedure ensures ctx.mentorado exists for 'mentoradoProcedure'.
    // However, this is 'protectedProcedure' which only ensures 'ctx.user'.

    // Let's try to find mentorado for this user
    const mentorado = await db.query.mentorados.findFirst({
      where: eq(mentorados.userId, ctx.user.id),
    });

    if (!mentorado) {
      return null;
    }

    // 2. Get diagnostic
    const diagnostico = await db.query.diagnosticos.findFirst({
      where: eq(diagnosticos.mentoradoId, mentorado.id),
    });

    return diagnostico || null;
  }),

  getByMentoradoId: protectedProcedure
    .input(z.object({ mentoradoId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const diagnostico = await db.query.diagnosticos.findFirst({
        where: eq(diagnosticos.mentoradoId, input.mentoradoId),
      });
      return diagnostico || null;
    }),

  upsert: protectedProcedure
    .input(
      z.object({
        atuacaoSaude: z.string().optional(),
        tempoLivre: z.string().optional(),
        jaAtuaEstetica: z.string().optional(),
        temClinica: z.string().optional(),
        rendaMensal: z.string().optional(),
        faturaEstetica: z.string().optional(),
        contas: z.string().optional(),
        custoVida: z.string().optional(),
        incomodaRotina: z.string().optional(),
        dificuldadeCrescer: z.string().optional(),
        objetivo6Meses: z.string().optional(),
        resultadoTransformador: z.string().optional(),
        organizacao: z.string().optional(),
        mentoradoId: z.number().optional(), // Admin override
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      let targetMentoradoId: number;

      // 1. Determine Target Mentorado
      if (input.mentoradoId) {
        // Only admin can set mentoradoId
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem editar outros diagnósticos.",
          });
        }
        targetMentoradoId = input.mentoradoId;
      } else {
        // Normal user: find their own mentorado record
        const mentorado = await db.query.mentorados.findFirst({
          where: eq(mentorados.userId, ctx.user.id),
        });

        if (!mentorado) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Usuário não vinculado a um mentorado.",
          });
        }
        targetMentoradoId = mentorado.id;
      }

      // 2. Check if exists
      const existing = await db.query.diagnosticos.findFirst({
        where: eq(diagnosticos.mentoradoId, targetMentoradoId),
      });

      // Prepare data excluding mentoradoId from input to avoid schema conflict if we spread
      const { mentoradoId: _ignored, ...dataToUpsert } = input;

      if (existing) {
        // Update
        const [updated] = await db
          .update(diagnosticos)
          .set({ ...dataToUpsert, updatedAt: new Date() })
          .where(eq(diagnosticos.id, existing.id))
          .returning();
        return updated;
      } else {
        // Create
        const [created] = await db
          .insert(diagnosticos)
          .values({
            mentoradoId: targetMentoradoId,
            ...dataToUpsert,
          })
          .returning();
        return created;
      }
    }),
});
