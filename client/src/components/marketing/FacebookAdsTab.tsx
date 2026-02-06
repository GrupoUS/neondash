/**
 * Facebook Ads Tab - Connection + Performance Metrics
 * Shows connection card and insights when connected.
 */

import { BadgeDollarSign, DollarSign, MousePointerClick, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { FacebookAdsConnectionCard } from "@/components/facebook-ads/FacebookAdsConnectionCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NeonCard } from "@/components/ui/neon-card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

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

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ElementType;
}

function MetricCard({ title, value, trend, icon: Icon }: MetricCardProps) {
  const trendColor = trend && trend > 0 ? "text-green-600" : "text-red-600";

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend !== undefined && (
              <p className={`text-xs ${trendColor}`}>
                {trend > 0 ? "+" : ""}
                {trend}% vs mês anterior
              </p>
            )}
          </div>
          <div className="p-3 rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FacebookAdsTab() {
  const { data: mentorado, isLoading: mentoradoLoading } = trpc.mentorados.me.useQuery();

  const connectionStatus = trpc.facebookAds.getConnectionStatus.useQuery(
    { mentoradoId: mentorado?.id ?? 0 },
    { enabled: !!mentorado?.id }
  );

  const summary = trpc.facebookAds.getCurrentMonthSummary.useQuery(
    { mentoradoId: mentorado?.id ?? 0 },
    { enabled: !!mentorado?.id && connectionStatus.data?.isConnected }
  );

  const insightsHistory = trpc.facebookAds.getInsightsHistory.useQuery(
    { mentoradoId: mentorado?.id ?? 0, months: 6 },
    { enabled: !!mentorado?.id && connectionStatus.data?.isConnected }
  );

  if (mentoradoLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (!mentorado) {
    return (
      <NeonCard className="p-6">
        <p className="text-muted-foreground">Mentorado não encontrado</p>
      </NeonCard>
    );
  }

  const isConnected = connectionStatus.data?.isConnected;

  // Chart data from insights history
  const chartData =
    insightsHistory.data?.map((item) => ({
      month: `${item.mes}/${item.ano}`,
      spend: item.spend / 100,
      impressions: item.impressions / 1000,
      clicks: item.clicks,
    })) ?? [];

  return (
    <div className="space-y-6">
      {/* Connection Card */}
      <div className="max-w-md mx-auto">
        <FacebookAdsConnectionCard mentoradoId={mentorado.id} />
      </div>

      {/* Metrics Grid - Only show when connected */}
      {isConnected && summary.data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Investimento"
              value={formatCurrency(summary.data.spend)}
              trend={summary.data.trends?.spend}
              icon={DollarSign}
            />
            <MetricCard
              title="Impressões"
              value={formatNumber(summary.data.impressions)}
              trend={summary.data.trends?.impressions}
              icon={Users}
            />
            <MetricCard
              title="Cliques"
              value={formatNumber(summary.data.clicks)}
              trend={summary.data.trends?.clicks}
              icon={MousePointerClick}
            />
            <MetricCard
              title="CTR"
              value={summary.data.ctr === null ? "—" : `${(summary.data.ctr / 100).toFixed(2)}%`}
              icon={TrendingUp}
            />
          </div>

          {/* Performance Chart */}
          {chartData.length > 0 && (
            <NeonCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <div className="flex items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Histórico de Performance</CardTitle>
                </div>
                <CardDescription>Investimento e resultados dos últimos meses</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.reverse()}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === "spend") return [`R$ ${value.toFixed(2)}`, "Investimento"];
                        if (name === "impressions") return [`${value.toFixed(1)}K`, "Impressões"];
                        return [value, "Cliques"];
                      }}
                    />
                    <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="clicks" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </NeonCard>
          )}
        </>
      )}

      {/* Empty State when not connected */}
      {!isConnected && !connectionStatus.isLoading && (
        <NeonCard className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <BadgeDollarSign className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Conecte seu Facebook Ads</h3>
              <p className="text-muted-foreground max-w-md mx-auto mt-1">
                Vincule sua conta de anúncios para acompanhar métricas de campanhas, investimento e
                retorno em tempo real.
              </p>
            </div>
          </div>
        </NeonCard>
      )}
    </div>
  );
}
