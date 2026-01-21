import DashboardLayout from "@/components/DashboardLayout";
import MentoradoCard from "@/components/MentoradoCard";
import { analiseData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Users, TrendingUp, DollarSign, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import MonthYearFilter from "@/components/MonthYearFilter";
import { useState } from "react";

export default function Home() {
  // Admin dashboard - no auth check needed for now
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(12);

  const topPerformers = [
    ...analiseData.neon_estrutura.ranking.map(([nome, score]) => ({
      nome,
      score,
      grupo: "Estrutura",
    })),
    ...analiseData.neon_escala.ranking.map(([nome, score]) => ({
      nome,
      score,
      grupo: "Escala",
    })),
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const faturamentoTotal =
    Object.values(analiseData.neon_estrutura.analise).reduce(
      (acc, curr) => acc + curr.dados.faturamento,
      0
    ) +
    Object.values(analiseData.neon_escala.analise).reduce(
      (acc, curr) => acc + curr.dados.faturamento,
      0
    );

  const totalMentorados =
    Object.keys(analiseData.neon_estrutura.analise).length +
    Object.keys(analiseData.neon_escala.analise).length;

  const mediaScore = (
    topPerformers.reduce((acc, curr) => acc + curr.score, 0) /
    topPerformers.length
  ).toFixed(1);

  const chartData = [
    ...analiseData.neon_estrutura.ranking.map(([nome, score]) => ({
      name: nome.split(" ")[0],
      score,
      faturamento: analiseData.neon_estrutura.analise[nome].dados.faturamento,
      grupo: "Estrutura",
    })),
    ...analiseData.neon_escala.ranking.map(([nome, score]) => ({
      name: nome.split(" ")[0],
      score,
      faturamento: analiseData.neon_escala.analise[nome].dados.faturamento,
      grupo: "Escala",
    })),
  ]
    .sort((a, b) => b.faturamento - a.faturamento)
    .slice(0, 10);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Visão Geral de Performance
            </h1>
            <p className="text-slate-500 mt-2">
              Análise consolidada de Dezembro 2025 - Turmas Neon
            </p>
          </div>
          <MonthYearFilter
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
          />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign className="w-16 h-16 text-neon-gold" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Faturamento Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  maximumFractionDigits: 0,
                }).format(faturamentoTotal)}
              </div>
              <p className="text-xs text-neon-gold mt-1 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-neon-gold" /> Dezembro 2025
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-16 h-16 text-neon-blue" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Mentorados Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {totalMentorados}
              </div>
              <div className="flex gap-2 mt-1 text-xs">
                <span className="bg-neon-gold/20 text-neon-blue-dark px-2 py-0.5 rounded-full font-medium">
                  5 Estrutura
                </span>
                <span className="bg-neon-blue/10 text-neon-blue px-2 py-0.5 rounded-full font-medium">
                  9 Escala
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Award className="w-16 h-16 text-neon-blue-dark" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Score Médio (Top 5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {mediaScore}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Pontuação baseada em metas atingidas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader>
              <CardTitle>Top 10 Faturamento</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickFormatter={value => `R$${value / 1000}k`}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar dataKey="faturamento" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.grupo === "Escala" ? "#20445B" : "#AC9469"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Top Performers (Score)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                          index === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : index === 1
                              ? "bg-slate-200 text-slate-700"
                              : index === 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-white text-slate-500 border border-slate-200"
                        )}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {performer.nome}
                        </div>
                        <div className="text-xs text-slate-500">
                          {performer.grupo}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-neon-blue">
                      {performer.score}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Lists */}
        <Tabs defaultValue="estrutura" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Detalhamento por Turma
            </h2>
            <TabsList className="bg-slate-100 p-1 rounded-xl">
              <TabsTrigger
                value="estrutura"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-neon-blue data-[state=active]:shadow-sm"
              >
                Neon Estrutura
              </TabsTrigger>
              <TabsTrigger
                value="escala"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-neon-blue data-[state=active]:shadow-sm"
              >
                Neon Escala
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="estrutura" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analiseData.neon_estrutura.ranking.map(
                ([nome, score], index) => (
                  <MentoradoCard
                    key={nome}
                    nome={nome}
                    data={analiseData.neon_estrutura.analise[nome]}
                    rank={index + 1}
                  />
                )
              )}
            </div>
          </TabsContent>

          <TabsContent value="escala" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analiseData.neon_escala.ranking.map(([nome, score], index) => (
                <MentoradoCard
                  key={nome}
                  nome={nome}
                  data={analiseData.neon_escala.analise[nome]}
                  rank={index + 1}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
