import DashboardLayout from "@/components/DashboardLayout";
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
import MonthYearFilter from "@/components/MonthYearFilter";
import { useState } from "react";
import { RankingView } from "@/components/dashboard/RankingView";
import { AchievementsView } from "@/components/dashboard/AchievementsView";
import { TurmaView } from "@/components/dashboard/TurmaView";
import { motion } from "motion/react";
import { AnimatedList } from "@/components/ui/animated-list";
import { slideUp, staggerContainer, fadeIn } from "@/lib/animation-variants";

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
      <motion.div 
        className="space-y-6"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Painel Administrativo
            </h1>
            <p className="text-slate-500 mt-2">
              Visão consolidada e gestão de turmas
            </p>
          </div>
          <MonthYearFilter
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
          />
        </div>

        <Tabs defaultValue="overview" className="w-full space-y-6">
          <TabsList className="bg-slate-100 p-1 rounded-xl flex flex-wrap h-auto">
            <TabsTrigger
              value="overview"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-neon-blue data-[state=active]:shadow-sm flex-1 min-w-[100px]"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="ranking"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-neon-blue data-[state=active]:shadow-sm flex-1 min-w-[100px]"
            >
              Ranking
            </TabsTrigger>
            <TabsTrigger
              value="conquistas"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-neon-blue data-[state=active]:shadow-sm flex-1 min-w-[100px]"
            >
              Conquistas
            </TabsTrigger>
            <TabsTrigger
              value="estrutura"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-neon-blue data-[state=active]:shadow-sm flex-1 min-w-[100px]"
            >
              Neon Estrutura
            </TabsTrigger>
            <TabsTrigger
              value="escala"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-neon-blue data-[state=active]:shadow-sm flex-1 min-w-[100px]"
            >
              Neon Escala
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-8 mt-0" asChild>
            <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit">
            {/* KPI Cards */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              variants={staggerContainer}
            >
              <motion.div variants={slideUp}>
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
                    <TrendingUp className="w-3 h-3 text-neon-gold" /> Dezembro
                    2025
                  </p>
                </CardContent>
              </Card>
              </motion.div>

              <motion.div variants={slideUp}>

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
              </motion.div>

              <motion.div variants={slideUp}>

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
            </motion.div>
            </motion.div>

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
                            fill={
                              entry.grupo === "Escala" ? "#20445B" : "#AC9469"
                            }
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
                  <AnimatedList
                    items={topPerformers}
                    className="space-y-4"
                    staggerDelay={0.1}
                    renderItem={(performer, index) => (
                      <div
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
                    )}
                    keyExtractor={(item) => item.nome}
                  />
                </CardContent>
              </Card>
            </div>
          </motion.div>
          </TabsContent>

          {/* RANKING TAB */}
          <TabsContent value="ranking" className="mt-0">
            <RankingView
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          </TabsContent>

          {/* ACHIEVEMENTS TAB */}
          <TabsContent value="conquistas" className="mt-0">
             <AchievementsView />
          </TabsContent>

          {/* ESTRUTURA TAB */}
          <TabsContent value="estrutura" className="mt-0">
            <TurmaView type="estrutura" />
          </TabsContent>

          {/* ESCALA TAB */}
          <TabsContent value="escala" className="mt-0">
            <TurmaView type="escala" />
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
}
