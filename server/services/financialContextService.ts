import { and, desc, eq, gte } from "drizzle-orm";
import { categoriasFinanceiras, transacoes } from "../../drizzle/schema";
import { getDb } from "../db";

export interface FinancialContext {
  periodo: string;
  resumo: {
    totalReceitas: number;
    totalDespesas: number;
    saldo: number;
    margemLiquida: number; // percentage
  };
  recentTransactions: Array<{
    data: string;
    tipo: "receita" | "despesa";
    valor: number;
    categoria: string;
  }>;
  formatted: string; // Ready-to-use string for AI prompt
}

/**
 * Fetches relevant financial context for AI analysis
 * - Last 3 months of transactions
 * - Summary metrics (Revenue, Expenses, Balance, Margin)
 * - Formatted string for LLM injection
 */
export async function getFinancialContext(mentoradoId: number): Promise<FinancialContext> {
  const db = getDb();
  const today = new Date();
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);

  // 1. Fetch transactions
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

  // 2. Calculate metrics
  const totalReceitas = recentTransacoes
    .filter((t) => t.tipo === "receita")
    .reduce((sum, t) => sum + t.valor, 0);

  const totalDespesas = recentTransacoes
    .filter((t) => t.tipo === "despesa")
    .reduce((sum, t) => sum + t.valor, 0);

  const saldo = totalReceitas - totalDespesas;
  const margem = totalReceitas > 0 ? (saldo / totalReceitas) * 100 : 0;

  // 3. Format transactions for context (limit to 30 recent ones to save tokens)
  const formattedTransactions = recentTransacoes.slice(0, 30).map((t) => ({
    ...t,
    categoria: t.categoria || "Sem categoria",
  }));

  const contextData: FinancialContext = {
    periodo: "Últimos 3 meses",
    resumo: {
      totalReceitas,
      totalDespesas,
      saldo,
      margemLiquida: Number(margem.toFixed(1)),
    },
    recentTransactions: formattedTransactions,
    formatted: JSON.stringify(
      {
        periodo: "Últimos 3 meses (valores em CENTAVOS)",
        resumo: {
          totalReceitas: totalReceitas,
          totalDespesas: totalDespesas,
          saldo: saldo,
          margemLiquida: `${margem.toFixed(1)}%`,
        },
        transacoesRecentes: formattedTransactions.map((t) => ({
          data: t.data,
          tipo: t.tipo,
          valor: t.valor, // Send in cents to avoid float issues, let AI handle or prompt to divide
          categoria: t.categoria,
        })),
      },
      null,
      2
    ),
  };

  return contextData;
}
