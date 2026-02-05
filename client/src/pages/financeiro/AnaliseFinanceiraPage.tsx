import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CreditCard,
  LineChart,
  Percent,
  PiggyBank,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { NeonCard } from "@/components/ui/neon-card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

const COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899"];

export default function AnaliseFinanceiraPage() {
  const [fullAnalysis, setFullAnalysis] = useState<string | null>(null);

  const { data: metrics, isLoading: metricsLoading } =
    trpc.financeiro.coach.getDetailedMetrics.useQuery();

  const { mutate: generateFullAnalysis, isPending: analysisLoading } =
    trpc.financeiro.coach.getFullAnalysis.useMutation({
      onSuccess: (data) => {
        setFullAnalysis(data);
      },
      onError: (error) => {
        toast.error("Erro ao gerar análise", {
          description: error.message || "Tente novamente mais tarde.",
        });
      },
    });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const formatMonth = (monthStr: string) => {
    const [, month] = monthStr.split("-");
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    return months[parseInt(month, 10) - 1] || monthStr;
  };

  if (metricsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-in fade-in">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      </DashboardLayout>
    );
  }

  const kpis = metrics?.kpis;
  const monthlyData = metrics?.monthlyBreakdown.map((m) => ({
    ...m,
    name: formatMonth(m.month),
    receitas: m.receitas / 100,
    despesas: m.despesas / 100,
    saldo: m.saldo / 100,
  }));

  const receitasCategorias = metrics?.categorias
    .filter((c) => c.tipo === "receita")
    .map((c) => ({ name: c.nome, value: c.total / 100 }));

  const despesasCategorias = metrics?.categorias
    .filter((c) => c.tipo === "despesa")
    .map((c) => ({ name: c.nome, value: c.total / 100 }));

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Bot className="h-8 w-8 text-neon-gold" />
              Análise Financeira
            </h1>
            <p className="text-muted-foreground mt-1">
              Insights completos sobre a saúde financeira da sua clínica
            </p>
          </div>
          {metrics?.periodo && (
            <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
              Período: {new Date(metrics.periodo.inicio).toLocaleDateString("pt-BR")} -{" "}
              {new Date(metrics.periodo.fim).toLocaleDateString("pt-BR")}
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Saldo Atual */}
          <NeonCard className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo do Mês</p>
                <p
                  className={`text-2xl font-bold tabular-nums mt-1 ${
                    (kpis?.saldoAtual ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {formatCurrency(kpis?.saldoAtual ?? 0)}
                </p>
              </div>
              <div
                className={`p-3 rounded-xl ${
                  (kpis?.saldoAtual ?? 0) >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
                }`}
              >
                <Wallet
                  className={`h-6 w-6 ${
                    (kpis?.saldoAtual ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"
                  }`}
                />
              </div>
            </div>
          </NeonCard>

          {/* Margem Líquida */}
          <NeonCard className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Margem Líquida</p>
                <p
                  className={`text-2xl font-bold tabular-nums mt-1 ${
                    (kpis?.margemLiquida ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {(kpis?.margemLiquida ?? 0).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-500/10">
                <Percent className="h-6 w-6 text-indigo-500" />
              </div>
            </div>
          </NeonCard>

          {/* Tendência Mensal */}
          <NeonCard className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tendência</p>
                <p
                  className={`text-2xl font-bold tabular-nums mt-1 ${
                    (kpis?.tendenciaMensal ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {formatPercent(kpis?.tendenciaMensal ?? 0)}
                </p>
              </div>
              <div
                className={`p-3 rounded-xl ${
                  (kpis?.tendenciaMensal ?? 0) >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
                }`}
              >
                {(kpis?.tendenciaMensal ?? 0) >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-500" />
                )}
              </div>
            </div>
          </NeonCard>

          {/* Custo MDR */}
          <NeonCard className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Custo MDR Total</p>
                <p className="text-2xl font-bold tabular-nums mt-1 text-amber-500">
                  {formatCurrency(kpis?.totalMDR ?? 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10">
                <CreditCard className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </NeonCard>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend Chart */}
          <NeonCard className="p-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <LineChart className="h-5 w-5 text-primary" />
              Evolução Mensal
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted)/0.3)" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) =>
                      new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(value)
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="receitas"
                    name="Receitas"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: "#10B981" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="despesas"
                    name="Despesas"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={{ fill: "#EF4444" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    name="Saldo"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: "#3B82F6" }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </NeonCard>

          {/* Payment Methods */}
          <NeonCard className="p-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Formas de Pagamento
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics?.formasPagamento.map((f) => ({
                    name: f.nome,
                    valor: f.total / 100,
                    mdr: f.custoMDR / 100,
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted)/0.3)" />
                  <XAxis
                    type="number"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) =>
                      new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(value)
                    }
                  />
                  <Bar dataKey="valor" name="Valor" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </NeonCard>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receitas por Categoria */}
          {receitasCategorias && receitasCategorias.length > 0 && (
            <NeonCard className="p-5">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                Receitas por Categoria
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={receitasCategorias}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {receitasCategorias.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(value)
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </NeonCard>
          )}

          {/* Despesas por Categoria */}
          {despesasCategorias && despesasCategorias.length > 0 && (
            <NeonCard className="p-5">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ArrowDownRight className="h-5 w-5 text-red-500" />
                Despesas por Categoria
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={despesasCategorias}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {despesasCategorias.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(value)
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </NeonCard>
          )}
        </div>

        {/* AI Full Analysis Section */}
        <NeonCard className="p-6 bg-gradient-to-br from-indigo-950/30 to-purple-950/20 border-neon-gold/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-neon-gold/20 to-amber-500/10 border border-neon-gold/30">
              <Bot className="w-6 h-6 text-neon-gold" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                Neon Coach
                <span className="text-[10px] uppercase tracking-wider bg-gradient-to-r from-neon-gold/20 to-amber-500/10 text-neon-gold px-2 py-0.5 rounded-full border border-neon-gold/30">
                  Análise Completa
                </span>
              </h3>
              <p className="text-sm text-muted-foreground">
                Diagnóstico financeiro detalhado com plano de ação
              </p>
            </div>
          </div>

          {analysisLoading ? (
            <div className="space-y-3 py-6">
              <div className="flex items-center gap-2 text-neon-gold/80 italic">
                <Sparkles className="w-4 h-4 animate-spin" />
                Gerando análise completa...
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-indigo-500/10" />
                <Skeleton className="h-4 w-[95%] bg-indigo-500/10" />
                <Skeleton className="h-4 w-[90%] bg-indigo-500/10" />
                <Skeleton className="h-4 w-[85%] bg-indigo-500/10" />
              </div>
            </div>
          ) : fullAnalysis ? (
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground/90 bg-background/30 rounded-lg p-4 border border-border/50">
              <ReactMarkdown>{fullAnalysis}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-8">
              <PiggyBank className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground mb-4">
                Clique abaixo para receber uma análise financeira completa com diagnóstico, insights
                e plano de ação.
              </p>
              <Button
                onClick={() => generateFullAnalysis()}
                className="bg-gradient-to-r from-neon-gold to-amber-500 hover:from-neon-gold/90 hover:to-amber-500/90 text-neon-navy font-semibold shadow-lg shadow-neon-gold/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Análise Completa
              </Button>
            </div>
          )}

          {fullAnalysis && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateFullAnalysis()}
                className="border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-500/20 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Atualizar Análise
              </Button>
            </div>
          )}
        </NeonCard>
      </div>
    </DashboardLayout>
  );
}
