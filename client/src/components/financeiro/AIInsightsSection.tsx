import { BarChart3, PieChart, TrendingDown, TrendingUp, Wallet, Zap } from "lucide-react";
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { InsightCard, InsightCardPlaceholder } from "./cards/InsightCard";
import type { PeriodType } from "./PeriodSelector";
import { getDateRangeForPeriod } from "./PeriodSelector";

interface AIInsightsSectionProps {
  periodType: PeriodType;
}

export function AIInsightsSection({ periodType }: AIInsightsSectionProps) {
  const { dataInicio, dataFim } = useMemo(() => getDateRangeForPeriod(periodType), [periodType]);

  // Fetch transactions for the period
  const { data: transacoes, isLoading } = trpc.financeiro.transacoes.list.useQuery({
    dataInicio,
    dataFim,
  });

  // Compute insights from transactions
  const insights = useMemo(() => {
    if (!transacoes || transacoes.length === 0) return null;

    // 1. Total Receitas & Despesas
    const totalReceitas = transacoes
      .filter((t) => t.tipo === "receita")
      .reduce((sum, t) => sum + t.valor, 0);
    const totalDespesas = transacoes
      .filter((t) => t.tipo === "despesa")
      .reduce((sum, t) => sum + t.valor, 0);
    const saldo = totalReceitas - totalDespesas;
    const margem = totalReceitas > 0 ? (saldo / totalReceitas) * 100 : 0;

    // 2. Top Expense Category
    const despesasByCategoria = new Map<string, number>();
    transacoes
      .filter((t) => t.tipo === "despesa")
      .forEach((t) => {
        const cat = t.categoriaNome || "Sem categoria";
        despesasByCategoria.set(cat, (despesasByCategoria.get(cat) || 0) + t.valor);
      });

    let topDespesaCategoria = { nome: "-", valor: 0, pct: 0 };
    if (despesasByCategoria.size > 0) {
      const sorted = [...despesasByCategoria.entries()].sort((a, b) => b[1] - a[1]);
      const [nome, valor] = sorted[0];
      topDespesaCategoria = {
        nome,
        valor,
        pct: totalDespesas > 0 ? (valor / totalDespesas) * 100 : 0,
      };
    }

    // 3. Top Revenue Category
    const receitasByCategoria = new Map<string, number>();
    transacoes
      .filter((t) => t.tipo === "receita")
      .forEach((t) => {
        const cat = t.categoriaNome || "Sem categoria";
        receitasByCategoria.set(cat, (receitasByCategoria.get(cat) || 0) + t.valor);
      });

    let topReceitaCategoria = { nome: "-", valor: 0, pct: 0 };
    if (receitasByCategoria.size > 0) {
      const sorted = [...receitasByCategoria.entries()].sort((a, b) => b[1] - a[1]);
      const [nome, valor] = sorted[0];
      topReceitaCategoria = {
        nome,
        valor,
        pct: totalReceitas > 0 ? (valor / totalReceitas) * 100 : 0,
      };
    }

    // 4. Transaction count
    const transactionCount = transacoes.length;
    const avgTransactionValue =
      transactionCount > 0 ? transacoes.reduce((sum, t) => sum + t.valor, 0) / transactionCount : 0;

    return {
      totalReceitas,
      totalDespesas,
      saldo,
      margem,
      topDespesaCategoria,
      topReceitaCategoria,
      transactionCount,
      avgTransactionValue,
    };
  }, [transacoes]);

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(cents / 100);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InsightCard icon={TrendingUp} title="" value="" isLoading />
        <InsightCard icon={PieChart} title="" value="" isLoading />
        <InsightCard icon={BarChart3} title="" value="" isLoading />
        <InsightCard icon={Wallet} title="" value="" isLoading />
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InsightCardPlaceholder title="Margem" />
        <InsightCardPlaceholder title="Top Receita" />
        <InsightCardPlaceholder title="Top Despesa" />
        <InsightCardPlaceholder title="Transações" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Margin Analysis */}
      <InsightCard
        icon={TrendingUp}
        title="Margem Líquida"
        value={`${insights.margem.toFixed(1)}%`}
        trend={insights.margem >= 20 ? "up" : insights.margem >= 0 ? "neutral" : "down"}
        description={`Saldo: ${formatCurrency(insights.saldo)}`}
      />

      {/* Top Revenue */}
      <InsightCard
        icon={PieChart}
        title="Top Receita"
        value={insights.topReceitaCategoria.nome}
        trend="up"
        description={`${formatCurrency(insights.topReceitaCategoria.valor)} (${insights.topReceitaCategoria.pct.toFixed(0)}%)`}
      />

      {/* Top Expense */}
      <InsightCard
        icon={TrendingDown}
        title="Maior Despesa"
        value={insights.topDespesaCategoria.nome}
        trend="down"
        description={`${formatCurrency(insights.topDespesaCategoria.valor)} (${insights.topDespesaCategoria.pct.toFixed(0)}%)`}
      />

      {/* Volume */}
      <InsightCard
        icon={Zap}
        title="Volume"
        value={`${insights.transactionCount} transações`}
        trend="neutral"
        description={`Média: ${formatCurrency(insights.avgTransactionValue)}`}
      />
    </div>
  );
}
