/**
 * Marketing Analytics - Campaign performance charts and metrics
 * Uses Facebook Ads tRPC endpoints for real data
 */

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  DollarSign,
  Eye,
  Loader2,
  MousePointerClick,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  NeonCard,
  NeonCardContent,
  NeonCardHeader,
  NeonCardTitle,
} from "@/components/ui/neon-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

// Helper functions
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// Period options in months
const PERIOD_OPTIONS = [
  { value: "3", label: "Últimos 3 meses" },
  { value: "6", label: "Últimos 6 meses" },
  { value: "12", label: "Últimos 12 meses" },
];

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
  isLoading,
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  trend?: "up" | "down" | null;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <NeonCard className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </NeonCard>
    );
  }

  return (
    <NeonCard className="p-4 focus-within:ring-2 focus-within:ring-ring/40">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          {change !== undefined && trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm mt-1",
                trend === "up" ? "text-green-600" : "text-red-500"
              )}
            >
              {trend === "up" ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span className="tabular-nums">{Math.abs(change)}%</span>
              <span className="text-muted-foreground">vs. mês anterior</span>
            </div>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </NeonCard>
  );
}

// Custom Tooltip
interface TooltipPayload {
  color: string;
  name: string;
  value: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload) return null;

  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// Main Component
export function MarketingAnalytics() {
  const [months, setMonths] = useState<number>(6);

  // Fetch mentorado data
  const { data: mentorado, isLoading: mentoradoLoading } = trpc.mentorados.me.useQuery();

  // Fetch Facebook Ads connection status
  const connectionStatus = trpc.facebookAds.getConnectionStatus.useQuery(
    { mentoradoId: mentorado?.id ?? 0 },
    { enabled: !!mentorado?.id }
  );

  // Fetch current month summary for KPI cards
  const summary = trpc.facebookAds.getCurrentMonthSummary.useQuery(
    { mentoradoId: mentorado?.id ?? 0 },
    { enabled: !!mentorado?.id && connectionStatus.data?.isConnected }
  );

  // Fetch insights history for charts
  const insightsHistory = trpc.facebookAds.getInsightsHistory.useQuery(
    { mentoradoId: mentorado?.id ?? 0, months },
    { enabled: !!mentorado?.id && connectionStatus.data?.isConnected }
  );

  const isConnected = connectionStatus.data?.isConnected;
  const isLoading = mentoradoLoading || connectionStatus.isLoading;
  const hasData = summary.data?.hasData;

  // Transform insights history to chart data
  const chartData =
    insightsHistory.data
      ?.map((item) => ({
        label: item.label,
        impressions: item.impressions,
        clicks: item.clicks,
        spend: item.spend / 100, // Convert cents to BRL
        reach: item.reach,
      }))
      .reverse() ?? []; // Reverse to show chronological order

  // Channel distribution (placeholder since we only have Facebook Ads data)
  const channelDistribution = [{ name: "Facebook Ads", value: 100, color: "hsl(var(--chart-1))" }];

  // If not connected, show message
  if (!isLoading && !isConnected) {
    return (
      <section className="space-y-6" aria-label="Painel de analytics de marketing">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" aria-hidden="true" />
              Analytics de Marketing
            </h2>
            <p className="text-muted-foreground mt-1">Acompanhe o desempenho das suas campanhas</p>
          </div>
        </header>

        <NeonCard className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Conecte seu Facebook Ads</h3>
              <p className="text-muted-foreground max-w-md mx-auto mt-1">
                Vincule sua conta de anúncios na aba "Facebook Ads" para visualizar métricas de
                campanhas, investimento e resultados em tempo real.
              </p>
            </div>
          </div>
        </NeonCard>
      </section>
    );
  }

  return (
    <section className="space-y-6" aria-label="Painel de analytics de marketing">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" aria-hidden="true" />
            Analytics de Marketing
          </h2>
          <p className="text-muted-foreground mt-1">Acompanhe o desempenho das suas campanhas</p>
        </div>
        <Select value={months.toString()} onValueChange={(value) => setMonths(Number(value))}>
          <SelectTrigger className="min-h-11 w-full sm:w-[180px]" aria-label="Selecionar período">
            <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Investimento"
          value={hasData ? formatCurrency(summary.data?.spend ?? 0) : "—"}
          change={summary.data?.trends?.spend}
          icon={DollarSign}
          trend={
            summary.data?.trends?.spend ? (summary.data.trends.spend >= 0 ? "up" : "down") : null
          }
          isLoading={summary.isLoading}
        />
        <StatCard
          title="Impressões"
          value={hasData ? formatNumber(summary.data?.impressions ?? 0) : "—"}
          change={summary.data?.trends?.impressions}
          icon={Eye}
          trend={
            summary.data?.trends?.impressions
              ? summary.data.trends.impressions >= 0
                ? "up"
                : "down"
              : null
          }
          isLoading={summary.isLoading}
        />
        <StatCard
          title="Cliques"
          value={hasData ? formatNumber(summary.data?.clicks ?? 0) : "—"}
          change={summary.data?.trends?.clicks}
          icon={MousePointerClick}
          trend={
            summary.data?.trends?.clicks ? (summary.data.trends.clicks >= 0 ? "up" : "down") : null
          }
          isLoading={summary.isLoading}
        />
        <StatCard
          title="Conversões"
          value={hasData ? formatNumber(summary.data?.conversions ?? 0) : "—"}
          change={summary.data?.trends?.conversions}
          icon={TrendingUp}
          trend={
            summary.data?.trends?.conversions
              ? summary.data.trends.conversions >= 0
                ? "up"
                : "down"
              : null
          }
          isLoading={summary.isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Spend Chart */}
        <NeonCard className="lg:col-span-2">
          <NeonCardHeader>
            <NeonCardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
              Investimento e Resultados
            </NeonCardTitle>
          </NeonCardHeader>
          <NeonCardContent className="h-[300px]">
            {insightsHistory.isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Nenhum dado disponível para o período selecionado
              </div>
            ) : (
              <>
                <p className="sr-only">Gráfico de área comparando investimento e cliques.</p>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="spend"
                      name="Investimento (R$)"
                      stroke="hsl(var(--chart-1))"
                      fillOpacity={1}
                      fill="url(#colorSpend)"
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      name="Cliques"
                      stroke="hsl(var(--chart-2))"
                      fillOpacity={1}
                      fill="url(#colorClicks)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            )}
          </NeonCardContent>
        </NeonCard>

        {/* Channel Distribution */}
        <NeonCard>
          <NeonCardHeader>
            <NeonCardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" aria-hidden="true" />
              Canais
            </NeonCardTitle>
          </NeonCardHeader>
          <NeonCardContent className="h-[300px] flex items-center justify-center">
            <p className="sr-only">Distribuição percentual entre canais de marketing.</p>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {channelDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </NeonCardContent>
          <div className="flex flex-wrap justify-center gap-4 px-4 pb-4">
            {channelDistribution.map((channel) => (
              <div key={channel.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }} />
                <span className="text-sm text-muted-foreground tabular-nums">
                  {channel.name} ({channel.value}%)
                </span>
              </div>
            ))}
          </div>
        </NeonCard>
      </div>

      {/* Performance by Period */}
      <NeonCard>
        <NeonCardHeader>
          <NeonCardTitle className="text-lg">Performance por Período</NeonCardTitle>
        </NeonCardHeader>
        <NeonCardContent className="h-[250px]">
          {insightsHistory.isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Nenhum dado disponível para o período selecionado
            </div>
          ) : (
            <>
              <p className="sr-only">Ranking de períodos por impressões.</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="label" type="category" className="text-xs" width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="impressions"
                    name="Impressões"
                    fill="hsl(var(--chart-1))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </NeonCardContent>
      </NeonCard>
    </section>
  );
}
