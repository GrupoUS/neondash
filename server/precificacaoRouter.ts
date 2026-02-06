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
      const mentoradoId = ctx.mentorado.id;

      // Check if mentorado has insumos
      let insumosList = await db
        .select()
        .from(insumos)
        .where(eq(insumos.mentoradoId, mentoradoId))
        .orderBy(insumos.nome);

      // Auto-seed if empty (valores em centavos)
      if (insumosList.length === 0) {
        const defaultInsumos = [
          { nome: "Agulha 40x13", valorCompra: 2500, rendimento: 100 },
          { nome: "Agulha 30x13", valorCompra: 3900, rendimento: 100 },
          { nome: "Agulha 80x30", valorCompra: 2500, rendimento: 100 },
          { nome: "Agulha 60x30", valorCompra: 2500, rendimento: 100 },
          { nome: "Agulha 30x7", valorCompra: 1500, rendimento: 100 },
          { nome: "Agulha Ponteira Capilar", valorCompra: 8000, rendimento: 8 },
          { nome: "Ponteira SmartGR", valorCompra: 29000, rendimento: 10 },
          { nome: "Ponteira 5 Agulhas", valorCompra: 100, rendimento: 1 },
          { nome: "Ativos - Alopecia Masculina", valorCompra: 14410, rendimento: 5 },
          { nome: "Dudasterida", valorCompra: 18634, rendimento: 10 },
          { nome: "Ativos - Alopecia Masculina + Feminina", valorCompra: 16352, rendimento: 5 },
          { nome: "Ativos - IM Boom Capilar", valorCompra: 11356, rendimento: 10 },
          { nome: "Anestésico", valorCompra: 4000, rendimento: 1 },
          { nome: "Labial", valorCompra: 45000, rendimento: 1 },
          { nome: "Full Face", valorCompra: 50000, rendimento: 1 },
          { nome: "Diamond Bio", valorCompra: 45000, rendimento: 1 },
          { nome: "Elleva 210 Bio", valorCompra: 69999, rendimento: 1 },
          { nome: "Fios de PDO", valorCompra: 112990, rendimento: 60 },
          { nome: "Cânula", valorCompra: 25000, rendimento: 10 },
          { nome: "Botox", valorCompra: 60000, rendimento: 1 },
          { nome: "Soro Fisiológico Bastonete", valorCompra: 120, rendimento: 1 },
          { nome: "Água de Injeção Bastonete", valorCompra: 120, rendimento: 1 },
          { nome: "Luvas", valorCompra: 3300, rendimento: 100 },
          { nome: "Máscara", valorCompra: 1100, rendimento: 100 },
          { nome: "Oxigênio Portátil", valorCompra: 6200, rendimento: 1000 },
          { nome: "Fluido Biorelaxante", valorCompra: 13000, rendimento: 1 },
          { nome: "Oxigênio", valorCompra: 96040, rendimento: 98000 },
          { nome: "Álcool Suabe", valorCompra: 790, rendimento: 100 },
          { nome: "Band Aid", valorCompra: 2500, rendimento: 500 },
          { nome: "Seringa 3ML", valorCompra: 2900, rendimento: 100 },
          { nome: "Seringa 10ML", valorCompra: 4500, rendimento: 100 },
          { nome: "Seringa 20ML", valorCompra: 3950, rendimento: 50 },
          { nome: "Seringa 60ML", valorCompra: 1750, rendimento: 5 },
          { nome: "Sonda", valorCompra: 6000, rendimento: 50 },
          { nome: "Tubo de Coleta", valorCompra: 6500, rendimento: 50 },
          { nome: "Escalpe", valorCompra: 3600, rendimento: 30 },
          { nome: "Papel Lençol", valorCompra: 6900, rendimento: 210 },
          { nome: "Torneirinha 3 vias", valorCompra: 4550, rendimento: 35 },
          { nome: "Gaze", valorCompra: 15960, rendimento: 500 },
          { nome: "Tubo Verde", valorCompra: 13500, rendimento: 50 },
          { nome: "Saco de Lixo", valorCompra: 3500, rendimento: 100 },
          { nome: "Cápsula de Café", valorCompra: 2200, rendimento: 8 },
          { nome: "Açúcar", valorCompra: 500, rendimento: 20 },
          { nome: "Material Banheiro", valorCompra: 2000, rendimento: 12 },
          { nome: "Água Mineral", valorCompra: 1600, rendimento: 20 },
          { nome: "Sabonete Líquido Pele", valorCompra: 11400, rendimento: 500 },
          { nome: "Tônico Pele", valorCompra: 11100, rendimento: 500 },
          { nome: "Esfoliante", valorCompra: 13800, rendimento: 200 },
          { nome: "Loção Emoliente", valorCompra: 9900, rendimento: 500 },
          { nome: "Creme Emoliente", valorCompra: 13900, rendimento: 200 },
          { nome: "Epigem", valorCompra: 110800, rendimento: 120 },
          { nome: "Vitamina Pós Procedimento", valorCompra: 25000, rendimento: 30 },
          { nome: "Máquina Lavien (Locação Diária)", valorCompra: 110000, rendimento: 5 },
          { nome: "Locação Máquina Microfocado", valorCompra: 280000, rendimento: 8 },
        ];

        await db.insert(insumos).values(
          defaultInsumos.map((i) => ({
            mentoradoId,
            nome: i.nome,
            valorCompra: i.valorCompra,
            rendimento: i.rendimento,
          }))
        );

        // Re-fetch after seed
        insumosList = await db
          .select()
          .from(insumos)
          .where(eq(insumos.mentoradoId, mentoradoId))
          .orderBy(insumos.nome);
      }

      return insumosList;
    }),

    create: mentoradoProcedure
      .input(
        z.object({
          nome: z.string().min(1, "Nome é obrigatório"),
          valorCompra: z.number().positive("Valor deve ser positivo"),
          rendimento: z.number().positive("Rendimento deve ser positivo"),
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
          rendimento: z.number().positive().optional(),
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

        // NEW: Calculate additional KPIs for aesthetic clinic owners
        const precoVenda = proc.precoVenda;

        // Margem Líquida % = (Lucro Final / Preço Venda) × 100
        const margemLiquidaPercent =
          precoVenda > 0 ? Math.round((lucroFinal / precoVenda) * 10000) / 100 : 0;

        // Margem Bruta % = (Lucro Parcial / Preço Venda) × 100
        const margemBrutaPercent =
          precoVenda > 0 ? Math.round((lucroParcial / precoVenda) * 10000) / 100 : 0;

        // Markup = Preço Venda / Custo Total
        const markup = custoTotal > 0 ? Math.round((precoVenda / custoTotal) * 100) / 100 : 0;

        // Eficiência de Custos = (Custo Insumos / Custo Total) × 100
        const eficienciaCustos =
          custoTotal > 0 ? Math.round((custoInsumos / custoTotal) * 10000) / 100 : 0;

        // ROI do Serviço = (Lucro Final / Custo Total) × 100
        const roiServico = custoTotal > 0 ? Math.round((lucroFinal / custoTotal) * 10000) / 100 : 0;

        return {
          custoInsumos,
          custoOperacional,
          custoInvestimento,
          custoParceiro,
          custoTotal,
          lucroParcial,
          imposto,
          lucroFinal,
          // NEW KPIs
          precoVenda,
          margemLiquidaPercent,
          margemBrutaPercent,
          markup,
          eficienciaCustos,
          roiServico,
        };
      }),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // SEED DEFAULTS
  // ═══════════════════════════════════════════════════════════════════════════

  seedDefaults: mentoradoProcedure.mutation(async ({ ctx }) => {
    const db = getDb();
    const mentoradoId = ctx.mentorado.id;

    // Check existing insumos
    const existingInsumos = await db
      .select()
      .from(insumos)
      .where(eq(insumos.mentoradoId, mentoradoId))
      .limit(1);

    if (existingInsumos.length > 0) {
      return { insumosCriados: 0 };
    }

    // Default insumos (valores em centavos)
    const defaultInsumos = [
      { nome: "Agulha 40x13", valorCompra: 2500, rendimento: 100 },
      { nome: "Agulha 30x13", valorCompra: 3900, rendimento: 100 },
      { nome: "Agulha 80x30", valorCompra: 2500, rendimento: 100 },
      { nome: "Agulha 60x30", valorCompra: 2500, rendimento: 100 },
      { nome: "Agulha 30x7", valorCompra: 1500, rendimento: 100 },
      { nome: "Agulha Ponteira Capilar", valorCompra: 8000, rendimento: 8 },
      { nome: "Ponteira SmartGR", valorCompra: 29000, rendimento: 10 },
      { nome: "Ponteira 5 Agulhas", valorCompra: 100, rendimento: 1 },
      { nome: "Ativos - Alopecia Masculina", valorCompra: 14410, rendimento: 5 },
      { nome: "Dudasterida", valorCompra: 18634, rendimento: 10 },
      { nome: "Ativos - Alopecia Masculina + Feminina", valorCompra: 16352, rendimento: 5 },
      { nome: "Ativos - IM Boom Capilar", valorCompra: 11356, rendimento: 10 },
      { nome: "Anestésico", valorCompra: 4000, rendimento: 1 },
      { nome: "Labial", valorCompra: 45000, rendimento: 1 },
      { nome: "Full Face", valorCompra: 50000, rendimento: 1 },
      { nome: "Diamond Bio", valorCompra: 45000, rendimento: 1 },
      { nome: "Elleva 210 Bio", valorCompra: 69999, rendimento: 1 },
      { nome: "Fios de PDO", valorCompra: 112990, rendimento: 60 },
      { nome: "Cânula", valorCompra: 25000, rendimento: 10 },
      { nome: "Botox", valorCompra: 60000, rendimento: 1 },
      { nome: "Soro Fisiológico Bastonete", valorCompra: 120, rendimento: 1 },
      { nome: "Água de Injeção Bastonete", valorCompra: 120, rendimento: 1 },
      { nome: "Luvas", valorCompra: 3300, rendimento: 100 },
      { nome: "Máscara", valorCompra: 1100, rendimento: 100 },
      { nome: "Oxigênio Portátil", valorCompra: 6200, rendimento: 1000 },
      { nome: "Fluido Biorelaxante", valorCompra: 13000, rendimento: 1 },
      { nome: "Oxigênio", valorCompra: 96040, rendimento: 98000 },
      { nome: "Álcool Suabe", valorCompra: 790, rendimento: 100 },
      { nome: "Band Aid", valorCompra: 2500, rendimento: 500 },
      { nome: "Seringa 3ML", valorCompra: 2900, rendimento: 100 },
      { nome: "Seringa 10ML", valorCompra: 4500, rendimento: 100 },
      { nome: "Seringa 20ML", valorCompra: 3950, rendimento: 50 },
      { nome: "Seringa 60ML", valorCompra: 1750, rendimento: 5 },
      { nome: "Sonda", valorCompra: 6000, rendimento: 50 },
      { nome: "Tubo de Coleta", valorCompra: 6500, rendimento: 50 },
      { nome: "Escalpe", valorCompra: 3600, rendimento: 30 },
      { nome: "Papel Lençol", valorCompra: 6900, rendimento: 210 },
      { nome: "Torneirinha 3 vias", valorCompra: 4550, rendimento: 35 },
      { nome: "Gaze", valorCompra: 15960, rendimento: 500 },
      { nome: "Tubo Verde", valorCompra: 13500, rendimento: 50 },
      { nome: "Saco de Lixo", valorCompra: 3500, rendimento: 100 },
      { nome: "Cápsula de Café", valorCompra: 2200, rendimento: 8 },
      { nome: "Açúcar", valorCompra: 500, rendimento: 20 },
      { nome: "Material Banheiro", valorCompra: 2000, rendimento: 12 },
      { nome: "Água Mineral", valorCompra: 1600, rendimento: 20 },
      { nome: "Sabonete Líquido Pele", valorCompra: 11400, rendimento: 500 },
      { nome: "Tônico Pele", valorCompra: 11100, rendimento: 500 },
      { nome: "Esfoliante", valorCompra: 13800, rendimento: 200 },
      { nome: "Loção Emoliente", valorCompra: 9900, rendimento: 500 },
      { nome: "Creme Emoliente", valorCompra: 13900, rendimento: 200 },
      { nome: "Epigem", valorCompra: 110800, rendimento: 120 },
      { nome: "Vitamina Pós Procedimento", valorCompra: 25000, rendimento: 30 },
      { nome: "Máquina Lavien (Locação Diária)", valorCompra: 110000, rendimento: 5 },
      { nome: "Locação Máquina Microfocado", valorCompra: 280000, rendimento: 8 },
    ];

    await db.insert(insumos).values(
      defaultInsumos.map((i) => ({
        mentoradoId,
        nome: i.nome,
        valorCompra: i.valorCompra,
        rendimento: i.rendimento,
      }))
    );

    return { insumosCriados: defaultInsumos.length };
  }),
});
