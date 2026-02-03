import { ArrowDownRight, ArrowRight, ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

interface MetricData {
  id: number;
  ano: number;
  mes: number;
  faturamento: number;
  lucro: number;
  leads: number;
  postsFeed: number;
  stories: number;
  procedimentos: number;
}

interface MonthComparisonProps {
  currentMonth: MetricData | null;
  previousMonth: MetricData | null;
  className?: string;
}

function calculateVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function MetricCard({
  title,
  current,
  previous,
  variation,
  isCurrency = false,
}: {
  title: string;
  current: number;
  previous: number;
  variation: number;
  isCurrency?: boolean;
}) {
  const isPositive = variation > 0;
  const isNeutral = variation === 0;

  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50 dark:bg-black/20 border border-border/50 dark:border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{title}</span>
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-emerald-400" />
        ) : isNeutral ? null : (
          <TrendingDown className="h-4 w-4 text-rose-400" />
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-foreground">
          {isCurrency ? formatCurrency(current) : current}
        </span>
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isPositive && "text-emerald-400",
            !isPositive && !isNeutral && "text-rose-400",
            isNeutral && "text-muted-foreground"
          )}
        >
          {isPositive ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : isNeutral ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          <span>
            {isPositive && "+"}
            {variation.toFixed(1)}%
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">
        Anterior: {isCurrency ? formatCurrency(previous) : previous}
      </span>
    </div>
  );
}

export function MonthComparison({ currentMonth, previousMonth, className }: MonthComparisonProps) {
  if (!currentMonth || !previousMonth) {
    return null;
  }

  const getMesNome = (m: number) => {
    const meses = [
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
    return meses[m - 1];
  };

  const variations = {
    faturamento: calculateVariation(currentMonth.faturamento, previousMonth.faturamento),
    lucro: calculateVariation(currentMonth.lucro, previousMonth.lucro),
    leads: calculateVariation(currentMonth.leads, previousMonth.leads),
    procedimentos: calculateVariation(currentMonth.procedimentos, previousMonth.procedimentos),
  };

  return (
    <Card
      className={cn(
        "bg-card dark:bg-black/40 border-border dark:border-white/5 shadow-sm",
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-primary">📊</span>
          Comparação Mês-a-Mês
        </CardTitle>
        <CardDescription>
          {getMesNome(currentMonth.mes)}/{currentMonth.ano} vs {getMesNome(previousMonth.mes)}/
          {previousMonth.ano}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Faturamento"
            current={currentMonth.faturamento}
            previous={previousMonth.faturamento}
            variation={variations.faturamento}
            isCurrency
          />
          <MetricCard
            title="Lucro"
            current={currentMonth.lucro}
            previous={previousMonth.lucro}
            variation={variations.lucro}
            isCurrency
          />
          <MetricCard
            title="Leads"
            current={currentMonth.leads}
            previous={previousMonth.leads}
            variation={variations.leads}
          />
          <MetricCard
            title="Procedimentos"
            current={currentMonth.procedimentos}
            previous={previousMonth.procedimentos}
            variation={variations.procedimentos}
          />
        </div>
      </CardContent>
    </Card>
  );
}
