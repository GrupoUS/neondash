/**
 * Financeiro Router - CRUD for financial transactions, categories and payment methods
 */

import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  categoriasFinanceiras,
  formasPagamento,
  systemSettings,
  transacoes,
} from "../drizzle/schema";
import { mentoradoProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { getFinancialContext } from "./services/financialContextService";

export const financeiroRouter = router({
  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORIAS FINANCEIRAS
  // ═══════════════════════════════════════════════════════════════════════════

  categorias: router({
    list: mentoradoProcedure.query(async ({ ctx }) => {
      const db = getDb();
      const mentoradoId = ctx.mentorado.id;

      // Check if mentorado has categories
      let categorias = await db
        .select()
        .from(categoriasFinanceiras)
        .where(eq(categoriasFinanceiras.mentoradoId, mentoradoId))
        .orderBy(categoriasFinanceiras.tipo, categoriasFinanceiras.nome);

      // Auto-seed if empty
      if (categorias.length === 0) {
        const defaultCategorias: { tipo: "receita" | "despesa"; nome: string }[] = [
          // Receitas (8)
          { tipo: "receita", nome: "Procedimentos Faciais" },
          { tipo: "receita", nome: "Procedimentos Corporais" },
          { tipo: "receita", nome: "Harmonização Orofacial" },
          { tipo: "receita", nome: "Consultas e Avaliações" },
          { tipo: "receita", nome: "Venda de Produtos" },
          { tipo: "receita", nome: "Tratamentos Capilares" },
          { tipo: "receita", nome: "Depilação" },
          { tipo: "receita", nome: "Outros Serviços" },
          // Despesas (12)
          { tipo: "despesa", nome: "Insumos e Materiais" },
          { tipo: "despesa", nome: "Equipamentos" },
          { tipo: "despesa", nome: "Aluguel/Condomínio" },
          { tipo: "despesa", nome: "Salários e Profissionais" },
          { tipo: "despesa", nome: "Marketing e Publicidade" },
          { tipo: "despesa", nome: "Impostos e Taxas" },
          { tipo: "despesa", nome: "Manutenção" },
          { tipo: "despesa", nome: "Cursos e Capacitação" },
          { tipo: "despesa", nome: "Contabilidade" },
          { tipo: "despesa", nome: "Limpeza e Higienização" },
          { tipo: "despesa", nome: "Sistemas e Software" },
          { tipo: "despesa", nome: "Outras Despesas" },
        ];

        await db.insert(categoriasFinanceiras).values(
          defaultCategorias.map((c) => ({
            mentoradoId,
            tipo: c.tipo,
            nome: c.nome,
          }))
        );

        // Re-fetch after seed
        categorias = await db
          .select()
          .from(categoriasFinanceiras)
          .where(eq(categoriasFinanceiras.mentoradoId, mentoradoId))
          .orderBy(categoriasFinanceiras.tipo, categoriasFinanceiras.nome);
      }

      return categorias;
    }),

    create: mentoradoProcedure
      .input(
        z.object({
          tipo: z.enum(["receita", "despesa"]),
          nome: z.string().min(1, "Nome é obrigatório"),
          descricao: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [categoria] = await db
          .insert(categoriasFinanceiras)
          .values({
            mentoradoId: ctx.mentorado.id,
            tipo: input.tipo,
            nome: input.nome,
            descricao: input.descricao,
          })
          .returning({ id: categoriasFinanceiras.id });
        return categoria;
      }),

    delete: mentoradoProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [categoria] = await db
          .select()
          .from(categoriasFinanceiras)
          .where(eq(categoriasFinanceiras.id, input.id))
          .limit(1);

        if (!categoria) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Categoria não encontrada" });
        }
        if (categoria.mentoradoId !== ctx.mentorado.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        await db.delete(categoriasFinanceiras).where(eq(categoriasFinanceiras.id, input.id));
        return { success: true };
      }),

    update: mentoradoProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().min(1, "Nome é obrigatório"),
          descricao: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [categoria] = await db
          .select()
          .from(categoriasFinanceiras)
          .where(eq(categoriasFinanceiras.id, input.id))
          .limit(1);

        if (!categoria) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Categoria não encontrada" });
        }
        if (categoria.mentoradoId !== ctx.mentorado.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        await db
          .update(categoriasFinanceiras)
          .set({
            nome: input.nome,
            descricao: input.descricao,
          })
          .where(eq(categoriasFinanceiras.id, input.id));

        return { success: true };
      }),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMAS DE PAGAMENTO
  // ═══════════════════════════════════════════════════════════════════════════

  formasPagamento: router({
    list: mentoradoProcedure.query(async ({ ctx }) => {
      const db = getDb();
      const mentoradoId = ctx.mentorado.id;

      // Check if mentorado has payment methods
      let formas = await db
        .select()
        .from(formasPagamento)
        .where(eq(formasPagamento.mentoradoId, mentoradoId))
        .orderBy(formasPagamento.nome);

      // Auto-seed if empty (taxas em percentual * 100)
      if (formas.length === 0) {
        const defaultFormas = [
          { nome: "Dinheiro", taxaPercentual: 0, prazoRecebimentoDias: 0 },
          { nome: "PIX", taxaPercentual: 0, prazoRecebimentoDias: 0 },
          { nome: "Débito", taxaPercentual: 150, prazoRecebimentoDias: 1 },
          { nome: "Crédito à Vista", taxaPercentual: 290, prazoRecebimentoDias: 30 },
          { nome: "Crédito 2x", taxaPercentual: 450, prazoRecebimentoDias: 60 },
          { nome: "Crédito 3x", taxaPercentual: 520, prazoRecebimentoDias: 90 },
          { nome: "Crédito 4-6x", taxaPercentual: 580, prazoRecebimentoDias: 120 },
          { nome: "Crédito 7-12x", taxaPercentual: 650, prazoRecebimentoDias: 180 },
          { nome: "Boleto", taxaPercentual: 190, prazoRecebimentoDias: 3 },
          { nome: "Link de Pagamento", taxaPercentual: 250, prazoRecebimentoDias: 2 },
        ];

        await db.insert(formasPagamento).values(
          defaultFormas.map((f) => ({
            mentoradoId,
            nome: f.nome,
            taxaPercentual: f.taxaPercentual,
            prazoRecebimentoDias: f.prazoRecebimentoDias,
          }))
        );

        // Re-fetch after seed
        formas = await db
          .select()
          .from(formasPagamento)
          .where(eq(formasPagamento.mentoradoId, mentoradoId))
          .orderBy(formasPagamento.nome);
      }

      return formas;
    }),

    create: mentoradoProcedure
      .input(
        z.object({
          nome: z.string().min(1, "Nome é obrigatório"),
          taxaPercentual: z.number().optional(),
          prazoRecebimentoDias: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [forma] = await db
          .insert(formasPagamento)
          .values({
            mentoradoId: ctx.mentorado.id,
            nome: input.nome,
            taxaPercentual: input.taxaPercentual,
            prazoRecebimentoDias: input.prazoRecebimentoDias,
          })
          .returning({ id: formasPagamento.id });
        return forma;
      }),

    delete: mentoradoProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [forma] = await db
          .select()
          .from(formasPagamento)
          .where(eq(formasPagamento.id, input.id))
          .limit(1);

        if (!forma) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Forma de pagamento não encontrada" });
        }
        if (forma.mentoradoId !== ctx.mentorado.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        await db.delete(formasPagamento).where(eq(formasPagamento.id, input.id));
        return { success: true };
      }),

    update: mentoradoProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().min(1, "Nome é obrigatório"),
          taxaPercentual: z.number().optional(),
          prazoRecebimentoDias: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [forma] = await db
          .select()
          .from(formasPagamento)
          .where(eq(formasPagamento.id, input.id))
          .limit(1);

        if (!forma) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Forma de pagamento não encontrada" });
        }
        if (forma.mentoradoId !== ctx.mentorado.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        await db
          .update(formasPagamento)
          .set({
            nome: input.nome,
            taxaPercentual: input.taxaPercentual,
            prazoRecebimentoDias: input.prazoRecebimentoDias,
          })
          .where(eq(formasPagamento.id, input.id));

        return { success: true };
      }),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSACOES
  // ═══════════════════════════════════════════════════════════════════════════

  transacoes: router({
    list: mentoradoProcedure
      .input(
        z.object({
          dataInicio: z.string().optional(),
          dataFim: z.string().optional(),
          tipo: z.enum(["receita", "despesa"]).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const db = getDb();
        const filters = [eq(transacoes.mentoradoId, ctx.mentorado.id)];

        if (input.dataInicio) {
          filters.push(gte(transacoes.data, input.dataInicio));
        }
        if (input.dataFim) {
          filters.push(lte(transacoes.data, input.dataFim));
        }
        if (input.tipo) {
          filters.push(eq(transacoes.tipo, input.tipo));
        }

        return db
          .select({
            id: transacoes.id,
            data: transacoes.data,
            tipo: transacoes.tipo,
            categoriaId: transacoes.categoriaId,
            categoriaNome: categoriasFinanceiras.nome,
            descricao: transacoes.descricao,
            nomeClienteFornecedor: transacoes.nomeClienteFornecedor,
            formaPagamentoId: transacoes.formaPagamentoId,
            formaPagamentoNome: formasPagamento.nome,
            valor: transacoes.valor,
            createdAt: transacoes.createdAt,
          })
          .from(transacoes)
          .leftJoin(categoriasFinanceiras, eq(transacoes.categoriaId, categoriasFinanceiras.id))
          .leftJoin(formasPagamento, eq(transacoes.formaPagamentoId, formasPagamento.id))
          .where(and(...filters))
          .orderBy(desc(transacoes.data), desc(transacoes.createdAt));
      }),

    create: mentoradoProcedure
      .input(
        z.object({
          data: z.string(),
          tipo: z.enum(["receita", "despesa"]),
          categoriaId: z.number().optional(),
          descricao: z.string().min(1, "Descrição é obrigatória"),
          nomeClienteFornecedor: z.string().optional(),
          formaPagamentoId: z.number().optional(),
          valor: z.number().positive("Valor deve ser positivo"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [transacao] = await db
          .insert(transacoes)
          .values({
            mentoradoId: ctx.mentorado.id,
            data: input.data,
            tipo: input.tipo,
            categoriaId: input.categoriaId,
            descricao: input.descricao,
            nomeClienteFornecedor: input.nomeClienteFornecedor,
            formaPagamentoId: input.formaPagamentoId,
            valor: input.valor,
          })
          .returning({ id: transacoes.id });
        return transacao;
      }),

    update: mentoradoProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.string().optional(),
          tipo: z.enum(["receita", "despesa"]).optional(),
          categoriaId: z.number().nullable().optional(),
          descricao: z.string().optional(),
          nomeClienteFornecedor: z.string().nullable().optional(),
          formaPagamentoId: z.number().nullable().optional(),
          valor: z.number().positive().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [transacao] = await db
          .select()
          .from(transacoes)
          .where(eq(transacoes.id, input.id))
          .limit(1);

        if (!transacao) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Transação não encontrada" });
        }
        if (transacao.mentoradoId !== ctx.mentorado.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        await db
          .update(transacoes)
          .set({
            data: input.data,
            tipo: input.tipo,
            categoriaId: input.categoriaId,
            descricao: input.descricao,
            nomeClienteFornecedor: input.nomeClienteFornecedor,
            formaPagamentoId: input.formaPagamentoId,
            valor: input.valor,
            updatedAt: new Date(),
          })
          .where(eq(transacoes.id, input.id));

        return { success: true };
      }),

    delete: mentoradoProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [transacao] = await db
          .select()
          .from(transacoes)
          .where(eq(transacoes.id, input.id))
          .limit(1);

        if (!transacao) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Transação não encontrada" });
        }
        if (transacao.mentoradoId !== ctx.mentorado.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        await db.delete(transacoes).where(eq(transacoes.id, input.id));
        return { success: true };
      }),

    resumo: mentoradoProcedure
      .input(
        z.object({
          ano: z.number(),
          mes: z.number(),
        })
      )
      .query(async ({ ctx, input }) => {
        const db = getDb();
        const dataInicio = `${input.ano}-${String(input.mes).padStart(2, "0")}-01`;
        const nextMonth = input.mes === 12 ? 1 : input.mes + 1;
        const nextYear = input.mes === 12 ? input.ano + 1 : input.ano;
        const dataFim = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

        const result = await db
          .select({
            tipo: transacoes.tipo,
            total: sql<number>`SUM(${transacoes.valor})`.as("total"),
          })
          .from(transacoes)
          .where(
            and(
              eq(transacoes.mentoradoId, ctx.mentorado.id),
              gte(transacoes.data, dataInicio),
              lte(transacoes.data, dataFim)
            )
          )
          .groupBy(transacoes.tipo);

        const totalReceitas = result.find((r) => r.tipo === "receita")?.total ?? 0;
        const totalDespesas = result.find((r) => r.tipo === "despesa")?.total ?? 0;
        const saldo = totalReceitas - totalDespesas;

        return { totalReceitas, totalDespesas, saldo };
      }),

    deleteAll: mentoradoProcedure.mutation(async ({ ctx }) => {
      const db = getDb();

      // Delete all transactions for this mentorado
      const result = await db
        .delete(transacoes)
        .where(eq(transacoes.mentoradoId, ctx.mentorado.id))
        .returning({ id: transacoes.id });

      return { deleted: result.length };
    }),

    importCsv: mentoradoProcedure
      .input(
        z.object({
          transactions: z.array(
            z.object({
              data: z.string(), // YYYY-MM-DD
              descricao: z.string(),
              valor: z.number(), // in centavos
              tipo: z.enum(["receita", "despesa"]),
              suggestedCategory: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        let imported = 0;
        let categoriesCreated = 0;

        // Cache categories to avoid repeated lookups
        const categoryCache = new Map<string, number>();

        for (const t of input.transactions) {
          // Build cache key: tipo + nome
          const cacheKey = `${t.tipo}:${t.suggestedCategory}`;

          let categoriaId: number | null = categoryCache.get(cacheKey) ?? null;

          // If not in cache, try to find existing category
          if (categoriaId === null) {
            const [existing] = await db
              .select({ id: categoriasFinanceiras.id })
              .from(categoriasFinanceiras)
              .where(
                and(
                  eq(categoriasFinanceiras.mentoradoId, ctx.mentorado.id),
                  eq(categoriasFinanceiras.tipo, t.tipo),
                  eq(categoriasFinanceiras.nome, t.suggestedCategory)
                )
              )
              .limit(1);

            if (existing) {
              categoriaId = existing.id;
              categoryCache.set(cacheKey, categoriaId);
            } else {
              // Create new category
              const [newCat] = await db
                .insert(categoriasFinanceiras)
                .values({
                  mentoradoId: ctx.mentorado.id,
                  tipo: t.tipo,
                  nome: t.suggestedCategory,
                })
                .returning({ id: categoriasFinanceiras.id });

              if (newCat) {
                categoriaId = newCat.id;
                categoryCache.set(cacheKey, categoriaId);
                categoriesCreated++;
              }
            }
          }

          // Insert transaction with category
          await db.insert(transacoes).values({
            mentoradoId: ctx.mentorado.id,
            data: t.data,
            tipo: t.tipo,
            descricao: t.descricao,
            valor: t.valor,
            categoriaId,
          });
          imported++;
        }

        return { imported, categoriesCreated };
      }),

    dailyFlow: mentoradoProcedure
      .input(
        z.object({
          ano: z.number(),
          mes: z.number(),
        })
      )
      .query(async ({ ctx, input }) => {
        const db = getDb();
        const dataInicio = `${input.ano}-${String(input.mes).padStart(2, "0")}-01`;
        const nextMonth = input.mes === 12 ? 1 : input.mes + 1;
        const nextYear = input.mes === 12 ? input.ano + 1 : input.ano;
        const dataFim = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

        const result = await db
          .select({
            date: transacoes.data,
            tipo: transacoes.tipo,
            total: sql<number>`SUM(${transacoes.valor})`.as("total"),
          })
          .from(transacoes)
          .where(
            and(
              eq(transacoes.mentoradoId, ctx.mentorado.id),
              gte(transacoes.data, dataInicio),
              lte(transacoes.data, dataFim)
            )
          )
          .groupBy(transacoes.data, transacoes.tipo)
          .orderBy(transacoes.data);

        // Transform into daily breakdown
        const dailyMap = new Map<string, { receita: number; despesa: number }>();

        // Initialize all days in month
        const daysInMonth = new Date(input.ano, input.mes, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
          const dayStr = `${input.ano}-${String(input.mes).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
          dailyMap.set(dayStr, { receita: 0, despesa: 0 });
        }

        result.forEach((r) => {
          const current = dailyMap.get(r.date) || { receita: 0, despesa: 0 };
          if (r.tipo === "receita") current.receita += r.total;
          else current.despesa += r.total;
          dailyMap.set(r.date, current);
        });

        return Array.from(dailyMap.entries()).map(([date, values]) => ({
          date,
          receita: values.receita,
          despesa: values.despesa,
          saldo: values.receita - values.despesa,
        }));
      }),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // SEED DEFAULTS
  // ═══════════════════════════════════════════════════════════════════════════

  seedDefaults: mentoradoProcedure.mutation(async ({ ctx }) => {
    const db = getDb();
    const mentoradoId = ctx.mentorado.id;

    // Check existing data
    const existingCategorias = await db
      .select()
      .from(categoriasFinanceiras)
      .where(eq(categoriasFinanceiras.mentoradoId, mentoradoId))
      .limit(1);

    const existingFormas = await db
      .select()
      .from(formasPagamento)
      .where(eq(formasPagamento.mentoradoId, mentoradoId))
      .limit(1);

    let categoriasCriadas = 0;
    let formasCriadas = 0;

    // Seed categorias if empty
    if (existingCategorias.length === 0) {
      const defaultCategorias: { tipo: "receita" | "despesa"; nome: string }[] = [
        // Receitas (8)
        { tipo: "receita", nome: "Procedimentos Faciais" },
        { tipo: "receita", nome: "Procedimentos Corporais" },
        { tipo: "receita", nome: "Harmonização Orofacial" },
        { tipo: "receita", nome: "Consultas e Avaliações" },
        { tipo: "receita", nome: "Venda de Produtos" },
        { tipo: "receita", nome: "Tratamentos Capilares" },
        { tipo: "receita", nome: "Depilação" },
        { tipo: "receita", nome: "Outros Serviços" },
        // Despesas (12)
        { tipo: "despesa", nome: "Insumos e Materiais" },
        { tipo: "despesa", nome: "Equipamentos" },
        { tipo: "despesa", nome: "Aluguel/Condomínio" },
        { tipo: "despesa", nome: "Salários e Profissionais" },
        { tipo: "despesa", nome: "Marketing e Publicidade" },
        { tipo: "despesa", nome: "Impostos e Taxas" },
        { tipo: "despesa", nome: "Manutenção" },
        { tipo: "despesa", nome: "Cursos e Capacitação" },
        { tipo: "despesa", nome: "Contabilidade" },
        { tipo: "despesa", nome: "Limpeza e Higienização" },
        { tipo: "despesa", nome: "Sistemas e Software" },
        { tipo: "despesa", nome: "Outras Despesas" },
      ];

      await db.insert(categoriasFinanceiras).values(
        defaultCategorias.map((c) => ({
          mentoradoId,
          tipo: c.tipo,
          nome: c.nome,
        }))
      );
      categoriasCriadas = defaultCategorias.length;
    }

    // Seed formas de pagamento if empty (taxas em percentual * 100)
    if (existingFormas.length === 0) {
      const defaultFormas = [
        { nome: "Dinheiro", taxaPercentual: 0, prazoRecebimentoDias: 0 },
        { nome: "PIX", taxaPercentual: 0, prazoRecebimentoDias: 0 },
        { nome: "Débito", taxaPercentual: 150, prazoRecebimentoDias: 1 },
        { nome: "Crédito à Vista", taxaPercentual: 290, prazoRecebimentoDias: 30 },
        { nome: "Crédito 2x", taxaPercentual: 450, prazoRecebimentoDias: 60 },
        { nome: "Crédito 3x", taxaPercentual: 520, prazoRecebimentoDias: 90 },
        { nome: "Crédito 4-6x", taxaPercentual: 580, prazoRecebimentoDias: 120 },
        { nome: "Crédito 7-12x", taxaPercentual: 650, prazoRecebimentoDias: 180 },
        { nome: "Boleto", taxaPercentual: 190, prazoRecebimentoDias: 3 },
        { nome: "Link de Pagamento", taxaPercentual: 250, prazoRecebimentoDias: 2 },
      ];

      await db.insert(formasPagamento).values(
        defaultFormas.map((f) => ({
          mentoradoId,
          nome: f.nome,
          taxaPercentual: f.taxaPercentual,
          prazoRecebimentoDias: f.prazoRecebimentoDias,
        }))
      );
      formasCriadas = defaultFormas.length;
    }

    return { categoriasCriadas, formasCriadas };
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // NEON COACH (AI ANALYSIS)
  // ═══════════════════════════════════════════════════════════════════════════

  coach: router({
    /**
     * Quick analysis for card preview - returns concise insights
     */
    analyze: mentoradoProcedure.mutation(async ({ ctx }) => {
      const db = getDb();
      const mentoradoId = ctx.mentorado.id;

      // 1. Get custom or default system prompt
      const settings = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, "financial_coach_prompt"))
        .limit(1);

      // Comprehensive prompt based on docs/financeiro/instrucoes.md
      const defaultPrompt = `Você é um assistente financeiro especializado para profissionais da saúde estética avançada no Brasil.

**Seu papel:**
- Organizar e analisar fluxo de caixa
- Calcular KPIs relevantes (margem líquida, capital de giro)
- Orientar rotinas de provisões (13º, férias, FGTS)
- Identificar oportunidades de economia

**Dores que você entende:**
- Falta de controle de fluxo de caixa e incerteza sobre entradas/saídas
- Dependência de crédito e impacto do MDR (taxas de maquininha)
- Insegurança para formar preço com margem adequada
- Medo de não conseguir pagar encargos trabalhistas
- Dificuldade em entender o capital de giro necessário

**Formato de resposta:**
- Seja DIRETO, CLARO e NUMÉRICO
- Máximo 3 insights PRÁTICOS e ACIONÁVEIS
- Use emojis moderadamente para engajamento
- Termine com 1 call-to-action específico

**IMPORTANTE:** Os valores estão em CENTAVOS (dividir por 100 para reais).`;

      const systemPrompt = settings[0]?.value || defaultPrompt;

      // 2. Get Financial Data (Last 3 months) via Shared Service
      const financialData = await getFinancialContext(mentoradoId);
      const context = financialData.formatted;

      // 5. Invoke LLM
      const { invokeLLM } = await import("./_core/llm");
      const result = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analise estes dados financeiros da clínica e me dê 3 insights práticos:\n\n${context}`,
          },
        ],
        maxTokens: 600,
        model: "gemini-3-flash-preview",
      });

      const choice = result.choices[0];
      const content = choice?.message?.content;

      if (!content || typeof content !== "string") {
        return "Não consegui analisar seus dados agora. Tente novamente mais tarde.";
      }

      return content;
    }),

    /**
     * Detailed metrics for full analysis page
     */
    getDetailedMetrics: mentoradoProcedure.query(async ({ ctx }) => {
      const db = getDb();
      const mentoradoId = ctx.mentorado.id;

      const today = new Date();
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

      // 1. Get all transactions for last 6 months
      const allTransacoes = await db
        .select({
          data: transacoes.data,
          tipo: transacoes.tipo,
          valor: transacoes.valor,
          categoriaId: transacoes.categoriaId,
          categoriaNome: categoriasFinanceiras.nome,
          formaPagamentoId: transacoes.formaPagamentoId,
          formaPagamentoNome: formasPagamento.nome,
          taxaPercentual: formasPagamento.taxaPercentual,
        })
        .from(transacoes)
        .leftJoin(categoriasFinanceiras, eq(transacoes.categoriaId, categoriasFinanceiras.id))
        .leftJoin(formasPagamento, eq(transacoes.formaPagamentoId, formasPagamento.id))
        .where(
          and(
            eq(transacoes.mentoradoId, mentoradoId),
            gte(transacoes.data, sixMonthsAgo.toISOString().split("T")[0])
          )
        )
        .orderBy(desc(transacoes.data));

      // 2. Calculate monthly breakdown
      const monthlyData = new Map<string, { receitas: number; despesas: number }>();
      for (let i = 0; i < 6; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyData.set(key, { receitas: 0, despesas: 0 });
      }

      allTransacoes.forEach((t) => {
        const month = t.data.substring(0, 7);
        const current = monthlyData.get(month);
        if (current) {
          if (t.tipo === "receita") current.receitas += t.valor;
          else current.despesas += t.valor;
        }
      });

      const monthlyBreakdown = Array.from(monthlyData.entries())
        .map(([month, values]) => ({
          month,
          receitas: values.receitas,
          despesas: values.despesas,
          saldo: values.receitas - values.despesas,
          margem:
            values.receitas > 0 ? ((values.receitas - values.despesas) / values.receitas) * 100 : 0,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // 3. Category breakdown (current month)
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      const categoriaBreakdown = new Map<string, { tipo: string; total: number }>();

      allTransacoes
        .filter((t) => t.data.startsWith(currentMonth))
        .forEach((t) => {
          const key = t.categoriaNome || "Sem categoria";
          const current = categoriaBreakdown.get(key) || { tipo: t.tipo, total: 0 };
          current.total += t.valor;
          categoriaBreakdown.set(key, current);
        });

      const categorias = Array.from(categoriaBreakdown.entries())
        .map(([nome, data]) => ({ nome, ...data }))
        .sort((a, b) => b.total - a.total);

      // 4. Payment method analysis (MDR impact)
      const formasBreakdown = new Map<string, { total: number; taxa: number }>();

      allTransacoes
        .filter((t) => t.tipo === "receita" && t.formaPagamentoNome)
        .forEach((t) => {
          const key = t.formaPagamentoNome!;
          const current = formasBreakdown.get(key) || { total: 0, taxa: t.taxaPercentual || 0 };
          current.total += t.valor;
          formasBreakdown.set(key, current);
        });

      const formasPagamentoAnalise = Array.from(formasBreakdown.entries())
        .map(([nome, data]) => ({
          nome,
          total: data.total,
          taxa: data.taxa,
          custoMDR: Math.round((data.total * data.taxa) / 10000), // taxa is in basis points
        }))
        .sort((a, b) => b.total - a.total);

      // 5. Calculate KPIs
      const currentMonthData = monthlyBreakdown.find((m) => m.month === currentMonth) || {
        receitas: 0,
        despesas: 0,
        saldo: 0,
        margem: 0,
      };

      const previousMonth =
        monthlyBreakdown.length > 1 ? monthlyBreakdown[monthlyBreakdown.length - 2] : null;

      const totalReceitas6m = monthlyBreakdown.reduce((sum, m) => sum + m.receitas, 0);
      const totalDespesas6m = monthlyBreakdown.reduce((sum, m) => sum + m.despesas, 0);
      const tendencia = previousMonth
        ? ((currentMonthData.receitas - previousMonth.receitas) / (previousMonth.receitas || 1)) *
          100
        : 0;

      return {
        kpis: {
          saldoAtual: currentMonthData.saldo,
          margemLiquida: currentMonthData.margem,
          tendenciaMensal: tendencia,
          mediaReceitaMensal: Math.round(totalReceitas6m / 6),
          mediaDespesaMensal: Math.round(totalDespesas6m / 6),
          totalMDR: formasPagamentoAnalise.reduce((sum, f) => sum + f.custoMDR, 0),
        },
        monthlyBreakdown,
        categorias,
        formasPagamento: formasPagamentoAnalise,
        periodo: {
          inicio: sixMonthsAgo.toISOString().split("T")[0],
          fim: today.toISOString().split("T")[0],
        },
      };
    }),

    /**
     * Full AI analysis for detailed page
     */
    getFullAnalysis: mentoradoProcedure.mutation(async ({ ctx }) => {
      const db = getDb();
      const mentoradoId = ctx.mentorado.id;

      // Get custom or default prompt
      const settings = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, "financial_coach_prompt"))
        .limit(1);

      // Extended prompt for full analysis
      const fullPrompt = `Você é um assistente financeiro especializado para profissionais da saúde estética avançada no Brasil.

**Seu papel completo:**
1. Organizar e analisar fluxo de caixa segundo DFC (NBC TG 03)
2. Calcular e explicar KPIs: margem líquida, capital de giro, ciclo de caixa
3. Simular cenários: redução de MDR, migração para PIX, negociação de prazos
4. Orientar provisões: 13º (8,33%), férias (8,33%), 1/3 férias, FGTS (dia 20)
5. Gerar projeções com cenários base, estressado e otimista
6. Apontar alertas de vencimentos e riscos

**Dores específicas de clínicas estéticas:**
- Falta de controle de fluxo de caixa
- Dependência de crédito e alto MDR
- No-show e agenda mal preenchida
- Insegurança na precificação
- Medo de não pagar encargos
- Estoques com risco de perda

**Formato da análise completa:**
## 📊 Diagnóstico Financeiro
[Resumo da situação atual com números]

## 💡 Insights Principais
[3-5 insights detalhados com cálculos]

## ⚠️ Alertas
[Riscos identificados e pontos de atenção]

## 🎯 Plano de Ação (Próximas 2 Semanas)
[Ações específicas e mensuráveis]

## 📈 Projeção
[Impacto esperado das ações sugeridas]

**IMPORTANTE:** Valores em centavos. Seja ESPECÍFICO e PRÁTICO.`;

      const systemPrompt = settings[0]?.value || fullPrompt;

      // Get 6 months of data for comprehensive analysis
      const today = new Date();
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

      const allTransacoes = await db
        .select({
          data: transacoes.data,
          tipo: transacoes.tipo,
          valor: transacoes.valor,
          categoria: categoriasFinanceiras.nome,
          formaPagamento: formasPagamento.nome,
        })
        .from(transacoes)
        .leftJoin(categoriasFinanceiras, eq(transacoes.categoriaId, categoriasFinanceiras.id))
        .leftJoin(formasPagamento, eq(transacoes.formaPagamentoId, formasPagamento.id))
        .where(
          and(
            eq(transacoes.mentoradoId, mentoradoId),
            gte(transacoes.data, sixMonthsAgo.toISOString().split("T")[0])
          )
        )
        .orderBy(desc(transacoes.data));

      // Calculate detailed metrics
      const totalReceitas = allTransacoes
        .filter((t) => t.tipo === "receita")
        .reduce((sum, t) => sum + t.valor, 0);
      const totalDespesas = allTransacoes
        .filter((t) => t.tipo === "despesa")
        .reduce((sum, t) => sum + t.valor, 0);

      // Group by category
      const porCategoria = new Map<string, number>();
      allTransacoes.forEach((t) => {
        const key = `${t.tipo}:${t.categoria || "Outros"}`;
        porCategoria.set(key, (porCategoria.get(key) || 0) + t.valor);
      });

      const context = JSON.stringify({
        periodo: "Últimos 6 meses",
        resumo: {
          totalReceitas: `R$ ${(totalReceitas / 100).toFixed(2)}`,
          totalDespesas: `R$ ${(totalDespesas / 100).toFixed(2)}`,
          lucroLiquido: `R$ ${((totalReceitas - totalDespesas) / 100).toFixed(2)}`,
          margemLiquida:
            totalReceitas > 0
              ? `${(((totalReceitas - totalDespesas) / totalReceitas) * 100).toFixed(1)}%`
              : "0%",
          mediaReceitaMensal: `R$ ${(totalReceitas / 600).toFixed(2)}`,
          mediaDespesaMensal: `R$ ${(totalDespesas / 600).toFixed(2)}`,
        },
        distribuicaoPorCategoria: Object.fromEntries(
          Array.from(porCategoria.entries()).map(([k, v]) => [k, `R$ ${(v / 100).toFixed(2)}`])
        ),
        ultimasTransacoes: allTransacoes.slice(0, 50).map((t) => ({
          data: t.data,
          tipo: t.tipo,
          valor: `R$ ${(t.valor / 100).toFixed(2)}`,
          categoria: t.categoria || "Sem categoria",
          pagamento: t.formaPagamento || "-",
        })),
      });

      const { invokeLLM } = await import("./_core/llm");
      const result = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Faça uma análise financeira COMPLETA desta clínica de estética:\n\n${context}`,
          },
        ],
        maxTokens: 1500,
        model: "gemini-3-flash-preview",
      });

      const choice = result.choices[0];
      const content = choice?.message?.content;

      if (!content || typeof content !== "string") {
        return "Não consegui gerar a análise completa. Tente novamente mais tarde.";
      }

      return content;
    }),
  }),
});
