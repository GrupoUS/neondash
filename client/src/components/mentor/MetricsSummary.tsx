import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface Metrics {
  faturamento: number;
  leads: number;
  procedimentos: number;
  lucro?: number;
  postsFeed?: number;
  stories?: number;
}

interface MetricsSummaryProps {
  currentMetrics: Metrics | null;
  previousMetrics?: Metrics | null;
}

interface MetricCardProps {
  label: string;
  value: number;
  previousValue?: number;
  format?: "currency" | "number";
}

function MetricCard({ label, value, previousValue, format = "number" }: MetricCardProps) {
  const formattedValue =
    format === "currency" ? formatCurrency(value) : value.toLocaleString("pt-BR");

  let percentChange: number | null = null;
  if (previousValue !== undefined && previousValue !== 0) {
    percentChange = ((value - previousValue) / previousValue) * 100;
  }

  return (
    <Card className="border-none shadow-sm bg-slate-50 dark:bg-slate-900/50">
      <CardContent className="p-4">
        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{formattedValue}</div>
        {percentChange !== null && (
          <div className="flex items-center gap-1 mt-1">
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${
                percentChange > 0
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : percentChange < 0
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {percentChange > 0 ? (
                <ArrowUp className="h-3 w-3" />
              ) : percentChange < 0 ? (
                <ArrowDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {Math.abs(percentChange).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">vs anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MetricsSummary({ currentMetrics, previousMetrics }: MetricsSummaryProps) {
  if (!currentMetrics) {
    return (
      <Card className="border-none shadow-sm bg-slate-50 dark:bg-slate-800/50">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Mentorado ainda não enviou métricas este mês.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <MetricCard
        label="Faturamento"
        value={currentMetrics.faturamento}
        previousValue={previousMetrics?.faturamento}
        format="currency"
      />
      <MetricCard
        label="Lucro"
        value={currentMetrics.lucro ?? 0}
        previousValue={previousMetrics?.lucro}
        format="currency"
      />
      <MetricCard
        label="Leads"
        value={currentMetrics.leads}
        previousValue={previousMetrics?.leads}
      />
      <MetricCard
        label="Procedimentos"
        value={currentMetrics.procedimentos}
        previousValue={previousMetrics?.procedimentos}
      />
      <MetricCard
        label="Posts Feed"
        value={currentMetrics.postsFeed ?? 0}
        previousValue={previousMetrics?.postsFeed}
      />
      <MetricCard
        label="Stories"
        value={currentMetrics.stories ?? 0}
        previousValue={previousMetrics?.stories}
      />
    </div>
  );
}
