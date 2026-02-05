/**
 * Precificacao Router - CRUD for supplies/procedures and pricing calculations
 */
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { insumos, procedimentoInsumos, procedimentos } from "../drizzle/schema";
import { mentoradoProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

export const precificacaoRouter = router({
  // ═══════════════════════════════════════════════════════════════════════════
  // INSUMOS
  // ═══════════════════════════════════════════════════════════════════════════

  insumos: router({
    list: mentoradoProcedure.query(async ({ ctx }) => {
      const db = getDb();
      return db
        .select()
        .from(insumos)
        .where(eq(insumos.mentoradoId, ctx.mentorado.id))
        .orderBy(insumos.nome);
    }),

    create: mentoradoProcedure
      .input(
        z.object({
          nome: z.string().min(1, "Nome é obrigatório"),
          valorCompra: z.number().positive("Valor deve ser positivo"),
          rendimento: z.number().int().positive("Rendimento deve ser positivo"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [insumo] = await db
          .insert(insumos)
          .values({
            mentoradoId: ctx.mentorado.id,
            nome: input.nome,
            valorCompra: input.valorCompra,
            rendimento: input.rendimento,
          })
          .returning({ id: insumos.id });
        return insumo;
      }),

    update: mentoradoProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().optional(),
          valorCompra: z.number().positive().optional(),
          rendimento: z.number().int().positive().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [insumo] = await db.select().from(insumos).where(eq(insumos.id, input.id)).limit(1);

        if (!insumo) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Insumo não encontrado" });
        }
        if (insumo.mentoradoId !== ctx.mentorado.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        await db
          .update(insumos)
          .set({
            nome: input.nome,
            valorCompra: input.valorCompra,
            rendimento: input.rendimento,
            updatedAt: new Date(),
          })
          .where(eq(insumos.id, input.id));

        return { success: true };
      }),

    delete: mentoradoProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [insumo] = await db.select().from(insumos).where(eq(insumos.id, input.id)).limit(1);

        if (!insumo) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Insumo não encontrado" });
        }
        if (insumo.mentoradoId !== ctx.mentorado.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        await db.delete(insumos).where(eq(insumos.id, input.id));
        return { success: true };
      }),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCEDIMENTOS
  // ═══════════════════════════════════════════════════════════════════════════

  procedimentos: router({
    list: mentoradoProcedure.query(async ({ ctx }) => {
      const db = getDb();

      // Get all procedures
      const procs = await db
        .select()
        .from(procedimentos)
        .where(eq(procedimentos.mentoradoId, ctx.mentorado.id))
        .orderBy(procedimentos.nome);

      // Get all procedure-insumo relationships with insumo data
      const procInsumos = await db
        .select({
          procedimentoId: procedimentoInsumos.procedimentoId,
          insumoId: procedimentoInsumos.insumoId,
          quantidade: procedimentoInsumos.quantidade,
          insumoNome: insumos.nome,
          insumoValorCompra: insumos.valorCompra,
          insumoRendimento: insumos.rendimento,
        })
        .from(procedimentoInsumos)
        .innerJoin(insumos, eq(procedimentoInsumos.insumoId, insumos.id))
        .innerJoin(procedimentos, eq(procedimentoInsumos.procedimentoId, procedimentos.id))
        .where(eq(procedimentos.mentoradoId, ctx.mentorado.id));

      // Map insumos to procedures
      return procs.map((proc) => ({
        ...proc,
        insumos: procInsumos.filter((pi) => pi.procedimentoId === proc.id),
      }));
    }),

    create: mentoradoProcedure
      .input(
        z.object({
          nome: z.string().min(1, "Nome é obrigatório"),
          precoVenda: z.number().positive("Preço deve ser positivo"),
          custoOperacional: z.number().optional(),
          custoInvestimento: z.number().optional(),
          percentualParceiro: z.number().min(0).max(10000).optional(),
          percentualImposto: z.number().min(0).max(10000).optional(),
          insumos: z
            .array(
              z.object({
                insumoId: z.number(),
                quantidade: z.number().int().positive(),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();

        const [proc] = await db
          .insert(procedimentos)
          .values({
            mentoradoId: ctx.mentorado.id,
            nome: input.nome,
            precoVenda: input.precoVenda,
            custoOperacional: input.custoOperacional,
            custoInvestimento: input.custoInvestimento,
            percentualParceiro: input.percentualParceiro,
            percentualImposto: input.percentualImposto,
          })
          .returning({ id: procedimentos.id });

        // Add insumos if provided
        if (input.insumos && input.insumos.length > 0) {
          await db.insert(procedimentoInsumos).values(
            input.insumos.map((i) => ({
              procedimentoId: proc.id,
              insumoId: i.insumoId,
              quantidade: i.quantidade,
            }))
          );
        }

        return proc;
      }),

    update: mentoradoProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().optional(),
          precoVenda: z.number().positive().optional(),
          custoOperacional: z.number().optional(),
          custoInvestimento: z.number().optional(),
          percentualParceiro: z.number().min(0).max(10000).optional(),
          percentualImposto: z.number().min(0).max(10000).optional(),
          insumos: z
            .array(
              z.object({
                insumoId: z.number(),
                quantidade: z.number().int().positive(),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [proc] = await db
          .select()
          .from(procedimentos)
          .where(eq(procedimentos.id, input.id))
          .limit(1);

        if (!proc) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Procedimento não encontrado" });
        }
        if (proc.mentoradoId !== ctx.mentorado.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        await db
          .update(procedimentos)
          .set({
            nome: input.nome,
            precoVenda: input.precoVenda,
            custoOperacional: input.custoOperacional,
            custoInvestimento: input.custoInvestimento,
            percentualParceiro: input.percentualParceiro,
            percentualImposto: input.percentualImposto,
            updatedAt: new Date(),
          })
          .where(eq(procedimentos.id, input.id));

        // Update insumos if provided
        if (input.insumos !== undefined) {
          // Delete existing
          await db
            .delete(procedimentoInsumos)
            .where(eq(procedimentoInsumos.procedimentoId, input.id));

          // Insert new
          if (input.insumos.length > 0) {
            await db.insert(procedimentoInsumos).values(
              input.insumos.map((i) => ({
                procedimentoId: input.id,
                insumoId: i.insumoId,
                quantidade: i.quantidade,
              }))
            );
          }
        }

        return { success: true };
      }),

    delete: mentoradoProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [proc] = await db
          .select()
          .from(procedimentos)
          .where(eq(procedimentos.id, input.id))
          .limit(1);

        if (!proc) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Procedimento não encontrado" });
        }
        if (proc.mentoradoId !== ctx.mentorado.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        await db.delete(procedimentos).where(eq(procedimentos.id, input.id));
        return { success: true };
      }),

    calcularCusto: mentoradoProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = getDb();
        const [proc] = await db
          .select()
          .from(procedimentos)
          .where(eq(procedimentos.id, input.id))
          .limit(1);

        if (!proc) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Procedimento não encontrado" });
        }
        if (proc.mentoradoId !== ctx.mentorado.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        // Calculate insumos cost
        const procInsumos = await db
          .select({
            quantidade: procedimentoInsumos.quantidade,
            valorCompra: insumos.valorCompra,
            rendimento: insumos.rendimento,
          })
          .from(procedimentoInsumos)
          .innerJoin(insumos, eq(procedimentoInsumos.insumoId, insumos.id))
          .where(eq(procedimentoInsumos.procedimentoId, input.id));

        const custoInsumos = procInsumos.reduce((acc, pi) => {
          const custoPorUso = Math.round((pi.valorCompra ?? 0) / (pi.rendimento ?? 1));
          return acc + custoPorUso * (pi.quantidade ?? 1);
        }, 0);

        const custoOperacional = proc.custoOperacional ?? 0;
        const custoInvestimento = proc.custoInvestimento ?? 0;
        const custoParceiro = Math.round(
          (proc.precoVenda * (proc.percentualParceiro ?? 0)) / 10000
        );
        const custoTotal = custoInsumos + custoOperacional + custoInvestimento + custoParceiro;
        const lucroParcial = proc.precoVenda - custoTotal;
        const imposto = Math.round((proc.precoVenda * (proc.percentualImposto ?? 700)) / 10000);
        const lucroFinal = lucroParcial - imposto;

        return {
          custoInsumos,
          custoOperacional,
          custoInvestimento,
          custoParceiro,
          custoTotal,
          lucroParcial,
          imposto,
          lucroFinal,
        };
      }),
  }),
});
