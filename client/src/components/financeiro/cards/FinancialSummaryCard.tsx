import { ArrowDownCircle, ArrowUpCircle, TrendingUp } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { NeonCard } from "@/components/ui/neon-card";

interface FinancialSummaryCardProps {
  saldo: number;
  totalReceitas: number;
  totalDespesas: number;
  isLoading?: boolean;
}

export function FinancialSummaryCard({
  saldo,
  totalReceitas,
  totalDespesas,
  isLoading,
}: FinancialSummaryCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  if (isLoading) {
    return (
      <NeonCard className="p-6 h-full flex flex-col justify-between animate-pulse bg-muted/10">
        <div className="h-6 w-32 bg-muted/20 rounded" />
        <div className="h-10 w-48 bg-muted/20 rounded" />
        <div className="h-4 w-full bg-muted/20 rounded" />
      </NeonCard>
    );
  }

  const isPositive = saldo >= 0;

  return (
    <NeonCard
      variant="glow"
      className={`p-6 h-full flex flex-col justify-between relative overflow-hidden group transition-all duration-300 ${
        isPositive
          ? "shadow-emerald-500/10 hover:shadow-emerald-500/20"
          : "shadow-red-500/10 hover:shadow-red-500/20"
      }`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-50">
        <div className={`p-2 rounded-full ${isPositive ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
          <TrendingUp className={`w-6 h-6 ${isPositive ? "text-emerald-500" : "text-red-500"}`} />
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Saldo Atual
          </h3>
          <div
            className={`text-4xl font-bold mt-2 ${isPositive ? "text-emerald-500" : "text-red-500"}`}
          >
            <AnimatedCounter to={saldo} formatFn={formatCurrency} duration={1.5} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-500" />
              Receitas
            </div>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(totalReceitas)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowDownCircle className="w-3.5 h-3.5 text-red-500" />
              Despesas
            </div>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(totalDespesas)}</p>
          </div>
        </div>
      </div>
    </NeonCard>
  );
}
