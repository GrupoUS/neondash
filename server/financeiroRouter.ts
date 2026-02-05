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

    importCsv: mentoradoProcedure
      .input(z.object({ csvContent: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const lines = input.csvContent.trim().split("\n");

        // Skip header row
        const dataLines = lines.slice(1);
        let imported = 0;

        for (const line of dataLines) {
          const [dataStr, descricao, valorStr] = line.split(",").map((s: string) => s.trim());
          if (!dataStr || !descricao || !valorStr) continue;

          const valor = Math.round(Number(valorStr.replace(",", ".")) * 100);
          if (Number.isNaN(valor)) continue;

          const tipo = valor >= 0 ? "receita" : "despesa";
          const valorAbs = Math.abs(valor);

          await db.insert(transacoes).values({
            mentoradoId: ctx.mentorado.id,
            data: dataStr,
            tipo,
            descricao,
            valor: valorAbs,
          });
          imported++;
        }

        return { imported };
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
    analyze: mentoradoProcedure.mutation(async ({ ctx }) => {
      const db = getDb();
      const mentoradoId = ctx.mentorado.id;

      // 1. Get System Prompt
      const settings = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, "financial_coach_prompt"))
        .limit(1);

      const systemPrompt =
        settings[0]?.value ||
        "Você é um especialista financeiro. Analise os dados e dê dicas curtas.";

      // 2. Get Financial Data (Last 3 months)
      const today = new Date();
      const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);

      const recentTransacoes = await db
        .select({
          data: transacoes.data,
          tipo: transacoes.tipo,
          valor: transacoes.valor,
          categoria: categoriasFinanceiras.nome,
        })
        .from(transacoes)
        .leftJoin(categoriasFinanceiras, eq(transacoes.categoriaId, categoriasFinanceiras.id))
        .where(
          and(
            eq(transacoes.mentoradoId, mentoradoId),
            gte(transacoes.data, threeMonthsAgo.toISOString().split("T")[0])
          )
        )
        .orderBy(desc(transacoes.data));

      // 3. Prepare Context
      const context = JSON.stringify({
        summary: "Últimas transações (valores em centavos)",
        data: recentTransacoes.slice(0, 50), // Limit to 50 for token saving
      });

      // 4. Invoke LLM
      const { invokeLLM } = await import("./_core/llm");
      const result = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analise estes dados financeiros e me dê 3 insights práticos e motivadores:\n${context}`,
          },
        ],
        maxTokens: 500,
        model: "gemini-2.0-flash-exp", // Fast and good
      });

      const choice = result.choices[0];
      const content = choice?.message?.content;

      if (!content || typeof content !== "string") {
        return "Não consegui analisar seus dados agora. Tente novamente mais tarde.";
      }

      return content;
    }),
  }),
});
