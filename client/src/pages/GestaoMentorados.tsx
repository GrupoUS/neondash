import {
  Activity,
  Award,
  Bell,
  Calendar,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  Medal,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LinkEmailsView } from "@/components/admin/LinkEmailsView";
import { MenteeManagementView } from "@/components/admin/MenteeManagementView";
import { NotificationsSettingsView } from "@/components/admin/NotificationsSettingsView";
import DashboardLayout from "@/components/DashboardLayout";
import { AchievementsView } from "@/components/dashboard/AchievementsView";
import { MonthlyGoalsAdmin } from "@/components/dashboard/MonthlyGoalsAdmin";
import { RankingView } from "@/components/dashboard/RankingView";
import { WeeklyPlanningAdmin } from "@/components/dashboard/WeeklyPlanningAdmin";

import MonthYearFilter from "@/components/MonthYearFilter";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AnimatedList } from "@/components/ui/animated-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FloatingDockTabs,
  FloatingDockTabsContent,
  FloatingDockTabsList,
} from "@/components/ui/floating-dock-tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fadeIn, slideUp, staggerContainer } from "@/lib/animation-variants";
import { analiseData } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function GestaoMentorados() {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(12);

  // Data from analiseData for overview
  const topPerformers = analiseData.neon.ranking
    .map(([nome, score]: [string, number]) => ({
      nome,
      score,
      grupo: "Neon",
      avatar: nome.charAt(0).toUpperCase(),
    }))
    .slice(0, 5);

  const faturamentoTotal = Object.values(analiseData.neon.analise).reduce(
    (acc, curr) => acc + curr.dados.faturamento,
    0
  );

  const totalMentorados = Object.keys(analiseData.neon.analise).length;

  const mediaScore = (
    topPerformers.reduce((acc, curr) => acc + curr.score, 0) / topPerformers.length
  ).toFixed(1);

  const chartData = analiseData.neon.ranking
    .map(([nome, score]: [string, number]) => ({
      name: nome.split(" ")[0],
      score,
      faturamento: analiseData.neon.analise[nome].dados.faturamento,
      grupo: "Neon",
    }))
    .sort((a, b) => b.faturamento - a.faturamento)
    .slice(0, 10);

  return (
    <DashboardLayout>
      <ScrollArea className="h-full">
        <motion.div
          className="space-y-8 p-2 md:p-4 pb-20"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Painel Administrativo
              </h1>
              <p className="text-muted-foreground text-lg">
                Visão estratégica e gestão de alta performance.
              </p>
            </div>
            <MonthYearFilter
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onYearChange={setSelectedYear}
              onMonthChange={setSelectedMonth}
            />
          </div>

          <Separator className="bg-border/40" />

          {/* Main Tabs */}
          <FloatingDockTabs defaultValue="overview" className="w-full space-y-8">
            <FloatingDockTabsList
              tabs={[
                {
                  value: "overview",
                  label: "Visão Geral",
                  icon: LayoutDashboard,
                },
                {
                  value: "ranking",
                  label: "Ranking Global",
                  icon: Trophy,
                },
                {
                  value: "conquistas",
                  label: "Badges & Conquistas",
                  icon: Medal,
                },
                {
                  value: "gestao",
                  label: "Gestão",
                  icon: Users,
                },
                {
                  value: "planejamento",
                  label: "Planejamento",
                  icon: ClipboardList,
                },
                {
                  value: "notificacoes",
                  label: "Notificações",
                  icon: Bell,
                },
              ]}
              className="bg-muted/30 p-1 rounded-2xl border border-white/5 shadow-inner"
            />

            {/* OVERVIEW TAB */}
            <FloatingDockTabsContent value="overview" className="mt-6 space-y-8" asChild>
              <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit">
                {/* Primary Metrics Row */}
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  variants={staggerContainer}
                >
                  {/* Faturamento */}
                  <motion.div variants={slideUp}>
                    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-card to-card/50 shadow-xl ring-1 ring-white/10 dark:ring-white/5 transition-all hover:scale-[1.02] hover:shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
                      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

                      <CardHeader className="relative pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          <DollarSign className="w-4 h-4 text-primary" /> Faturamento Total
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative">
                        <div className="text-4xl font-bold text-foreground tracking-tight">
                          <AnimatedCounter
                            to={faturamentoTotal}
                            duration={1.5}
                            formatFn={(v) =>
                              new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                                maximumFractionDigits: 0,
                              }).format(v)
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-primary/5 w-fit border border-primary/10">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-medium text-primary">
                            +12.5% vs mês anterior
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Mentorados */}
                  <motion.div variants={slideUp}>
                    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-card to-card/50 shadow-xl ring-1 ring-white/10 dark:ring-white/5 transition-all hover:scale-[1.02] hover:shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-50" />
                      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />

                      <CardHeader className="relative pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          <Users className="w-4 h-4 text-blue-500" /> Mentorados Ativos
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative">
                        <div className="text-4xl font-bold text-foreground tracking-tight">
                          <AnimatedCounter to={totalMentorados} duration={1} />
                        </div>
                        <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-blue-500/5 w-fit border border-blue-500/10 dark:border-blue-500/20">
                          <Activity className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            100% Taxa de Engajamento
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Score */}
                  <motion.div variants={slideUp}>
                    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-card to-card/50 shadow-xl ring-1 ring-white/10 dark:ring-white/5 transition-all hover:scale-[1.02] hover:shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-50" />
                      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl" />

                      <CardHeader className="relative pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          <Award className="w-4 h-4 text-amber-500" /> Score Médio (Top 5)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative">
                        <div className="text-4xl font-bold text-foreground tracking-tight">
                          <AnimatedCounter
                            to={parseFloat(mediaScore)}
                            duration={1.2}
                            formatFn={(v) => v.toFixed(1)}
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-amber-500/5 w-fit border border-amber-500/10 dark:border-amber-500/20">
                          <Target className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            Alta performance
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>

                {/* Charts & Performance Listings */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Performance Chart */}
                  <Card className="lg:col-span-2 border-none bg-card/40 backdrop-blur-md shadow-lg ring-1 ring-black/5 dark:ring-white/5">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-semibold">Top Performance</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Faturamento vs. Meta (Dezembro 2025)
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="hidden sm:flex">
                        <Calendar className="w-4 h-4 mr-2" /> Exportar Relatório
                      </Button>
                    </CardHeader>
                    <CardContent className="h-[400px] mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                          barSize={32}
                        >
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                              <stop
                                offset="100%"
                                stopColor="hsl(var(--primary))"
                                stopOpacity={0.6}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="hsl(var(--border))"
                            opacity={0.4}
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: "hsl(var(--muted-foreground))",
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: "hsl(var(--muted-foreground))",
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                            tickFormatter={(value) => `R$${value / 1000}k`}
                            dx={-10}
                          />
                          <Tooltip
                            cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                            contentStyle={{
                              borderRadius: "12px",
                              border: "1px solid hsl(var(--border))",
                              backgroundColor: "hsl(var(--card))",
                              color: "hsl(var(--card-foreground))",
                              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                              padding: "12px",
                            }}
                            formatter={(value: number) => [
                              new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(value),
                              "Faturamento",
                            ]}
                          />
                          <Bar
                            dataKey="faturamento"
                            fill="url(#barGradient)"
                            radius={[6, 6, 0, 0]}
                            animationDuration={1500}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Leaderboard Card */}
                  <Card className="border-none bg-card/40 backdrop-blur-md shadow-lg ring-1 ring-black/5 dark:ring-white/5 h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Líderes do Mês
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Baseado em score de metas</p>
                    </CardHeader>
                    <CardContent>
                      <AnimatedList
                        items={topPerformers}
                        className="space-y-4"
                        staggerDelay={0.1}
                        renderItem={(performer, index) => (
                          <div className="group flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-all border border-transparent hover:border-primary/10">
                            <div className="flex items-center gap-4">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm",
                                  index === 0
                                    ? "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 ring-2 ring-amber-200"
                                    : index === 1
                                      ? "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 ring-2 ring-slate-100"
                                      : index === 2
                                        ? "bg-gradient-to-br from-orange-300 to-orange-400 text-orange-900 ring-2 ring-orange-200"
                                        : "bg-background text-muted-foreground border border-border"
                                )}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {performer.nome}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {performer.grupo}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-primary text-lg">
                                {performer.score}
                              </span>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                Score
                              </span>
                            </div>
                          </div>
                        )}
                        keyExtractor={(item) => item.nome}
                      />
                      <Button
                        variant="ghost"
                        className="w-full mt-6 text-xs text-muted-foreground hover:text-primary"
                      >
                        Ver Ranking Completo
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </FloatingDockTabsContent>

            {/* RANKING TAB */}
            <FloatingDockTabsContent value="ranking" className="mt-0">
              <RankingView selectedMonth={selectedMonth} selectedYear={selectedYear} />
            </FloatingDockTabsContent>

            {/* ACHIEVEMENTS TAB */}
            <FloatingDockTabsContent value="conquistas" className="mt-0">
              <AchievementsView />
            </FloatingDockTabsContent>

            {/* GESTÃO TAB */}
            <FloatingDockTabsContent value="gestao" className="mt-0" asChild>
              <motion.div variants={fadeIn}>
                <Tabs defaultValue="cadastros" className="w-full">
                  <TabsList className="grid w-[400px] grid-cols-2 mb-6">
                    <TabsTrigger value="cadastros">Cadastros</TabsTrigger>
                    <TabsTrigger value="acessos">Acessos</TabsTrigger>
                  </TabsList>
                  <TabsContent value="cadastros" className="mt-0">
                    <MenteeManagementView />
                  </TabsContent>
                  <TabsContent value="acessos" className="mt-0">
                    <LinkEmailsView />
                  </TabsContent>
                </Tabs>
              </motion.div>
            </FloatingDockTabsContent>

            {/* PLANEJAMENTO TAB */}
            <FloatingDockTabsContent value="planejamento" className="mt-0">
              <MonthlyGoalsAdmin />
              <WeeklyPlanningAdmin />
            </FloatingDockTabsContent>

            {/* NOTIFICAÇÕES TAB */}
            <FloatingDockTabsContent value="notificacoes" className="mt-0">
              <NotificationsSettingsView />
            </FloatingDockTabsContent>
          </FloatingDockTabs>
        </motion.div>
      </ScrollArea>
    </DashboardLayout>
  );
}
