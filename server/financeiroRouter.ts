/**
 * Financeiro Router - CRUD for financial transactions, categories and payment methods
 */
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { categoriasFinanceiras, formasPagamento, transacoes } from "../drizzle/schema";
import { mentoradoProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

export const financeiroRouter = router({
  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORIAS FINANCEIRAS
  // ═══════════════════════════════════════════════════════════════════════════

  categorias: router({
    list: mentoradoProcedure.query(async ({ ctx }) => {
      const db = getDb();
      return db
        .select()
        .from(categoriasFinanceiras)
        .where(eq(categoriasFinanceiras.mentoradoId, ctx.mentorado.id))
        .orderBy(categoriasFinanceiras.tipo, categoriasFinanceiras.nome);
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
      return db
        .select()
        .from(formasPagamento)
        .where(eq(formasPagamento.mentoradoId, ctx.mentorado.id))
        .orderBy(formasPagamento.nome);
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
          const [dataStr, descricao, valorStr] = line.split(",").map((s) => s.trim());
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
  }),
});
