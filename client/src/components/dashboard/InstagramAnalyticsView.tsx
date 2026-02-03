/**
 * Instagram Analytics View Component
 * Displays Instagram connection status and metrics for a mentorado.
 */

import { Film, Image, Instagram, RefreshCcw, TrendingUp, Users } from "lucide-react";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { InstagramConnectionCard } from "@/components/instagram/InstagramConnectionCard";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fadeIn, slideUp, staggerContainer } from "@/lib/animation-variants";
import { trpc } from "@/lib/trpc";

interface InstagramAnalyticsViewProps {
  mentoradoId?: number;
}

export function InstagramAnalyticsView({ mentoradoId }: InstagramAnalyticsViewProps) {
  // Fetch connection status
  const { data: connectionStatus, isLoading: isLoadingStatus } =
    trpc.instagram.getConnectionStatus.useQuery(
      { mentoradoId: mentoradoId! },
      { enabled: !!mentoradoId }
    );

  // Fetch metrics history
  const { data: metricsHistory, isLoading: isLoadingHistory } =
    trpc.instagram.getMetricsHistory.useQuery(
      { mentoradoId: mentoradoId! },
      { enabled: !!mentoradoId && connectionStatus?.isConnected }
    );

  // Get current month metrics
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentMetrics = metricsHistory?.find(
    (m) => m.mes === currentMonth && m.ano === currentYear
  );

  // Sync mutation
  const syncMutation = trpc.instagram.syncMetrics.useMutation();

  const handleSync = async () => {
    if (!mentoradoId) return;
    await syncMutation.mutateAsync({
      mentoradoId,
      ano: currentYear,
      mes: currentMonth,
    });
  };

  if (!mentoradoId) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="py-12 text-center">
          <Instagram className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            Selecione um mentorado para ver as análises do Instagram.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingStatus) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {/* Connection Card */}
      <motion.div variants={fadeIn}>
        <InstagramConnectionCard mentoradoId={mentoradoId} />
      </motion.div>

      {/* Metrics Section - Only show if connected */}
      {connectionStatus?.isConnected && (
        <>
          {/* Header with Sync Button */}
          <motion.div className="flex items-center justify-between" variants={fadeIn}>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Métricas do Instagram</h3>
              <p className="text-sm text-muted-foreground">
                Acompanhe seu desempenho nas redes sociais
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className="gap-2"
            >
              <RefreshCcw className={`w-4 h-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </motion.div>

          {/* Metrics Cards */}
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4" variants={staggerContainer}>
            {/* Posts Card */}
            <motion.div variants={slideUp}>
              <Card className="relative overflow-hidden border-none bg-gradient-to-br from-card to-card/50 shadow-lg ring-1 ring-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-transparent opacity-50" />
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-pink-500/10 blur-2xl" />

                <CardHeader className="relative pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    <Image className="w-4 h-4 text-pink-500" />
                    Posts no Feed
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl font-bold text-foreground tracking-tight">
                    {isLoadingHistory ? (
                      <Skeleton className="h-10 w-16" />
                    ) : (
                      <AnimatedCounter to={currentMetrics?.postsFeed ?? 0} duration={1} />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">este mês</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stories Card */}
            <motion.div variants={slideUp}>
              <Card className="relative overflow-hidden border-none bg-gradient-to-br from-card to-card/50 shadow-lg ring-1 ring-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-50" />
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl" />

                <CardHeader className="relative pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    <Film className="w-4 h-4 text-purple-500" />
                    Stories
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl font-bold text-foreground tracking-tight">
                    {isLoadingHistory ? (
                      <Skeleton className="h-10 w-16" />
                    ) : (
                      <AnimatedCounter to={currentMetrics?.stories ?? 0} duration={1} />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">este mês</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Followers Card */}
            <motion.div variants={slideUp}>
              <Card className="relative overflow-hidden border-none bg-gradient-to-br from-card to-card/50 shadow-lg ring-1 ring-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-50" />
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />

                <CardHeader className="relative pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    <Users className="w-4 h-4 text-blue-500" />
                    Seguidores
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl font-bold text-foreground tracking-tight">
                    {isLoadingHistory ? (
                      <Skeleton className="h-10 w-16" />
                    ) : (
                      <AnimatedCounter
                        to={currentMetrics?.followers ?? 0}
                        duration={1.2}
                        formatFn={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString())}
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">total</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Chart Section */}
          <motion.div variants={fadeIn}>
            <Card className="border-none bg-card/40 backdrop-blur-md shadow-lg ring-1 ring-black/5 dark:ring-white/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Evolução de Métricas
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoadingHistory ? (
                  <Skeleton className="h-full w-full" />
                ) : metricsHistory && metricsHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={metricsHistory}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorStories" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--border))"
                        opacity={0.4}
                      />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 12,
                        }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 12,
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid hsl(var(--border))",
                          backgroundColor: "hsl(var(--card))",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="postsFeed"
                        name="Posts"
                        stroke="#ec4899"
                        fillOpacity={1}
                        fill="url(#colorPosts)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="stories"
                        name="Stories"
                        stroke="#a855f7"
                        fillOpacity={1}
                        fill="url(#colorStories)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Nenhum dado histórico disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
