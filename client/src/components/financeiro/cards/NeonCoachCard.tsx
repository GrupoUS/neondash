import { ArrowRight, Bot, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { NeonCard } from "@/components/ui/neon-card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

export function NeonCoachCard() {
  const [, setLocation] = useLocation();
  const [analysis, setAnalysis] = useState<string | null>(null);

  // Get current month summary for quick stats
  const now = new Date();
  const { data: resumo } = trpc.financeiro.transacoes.resumo.useQuery({
    ano: now.getFullYear(),
    mes: now.getMonth() + 1,
  });

  const { mutate: analyze, isPending } = trpc.financeiro.coach.analyze.useMutation({
    onSuccess: (data) => {
      setAnalysis(data);
    },
    onError: (error) => {
      toast.error("Erro ao gerar análise", {
        description: error.message || "Tente novamente mais tarde.",
      });
    },
  });

  const handleAnalyze = () => {
    analyze();
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const saldo = resumo?.saldo ?? 0;
  const margem =
    resumo && resumo.totalReceitas > 0
      ? ((resumo.saldo / resumo.totalReceitas) * 100).toFixed(0)
      : 0;
  const isSaldoPositivo = saldo >= 0;

  return (
    <NeonCard
      className="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-indigo-950/50 via-purple-950/40 to-violet-950/30 border-neon-gold/30"
      variant="default"
    >
      {/* Animated Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-gold/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
      </div>

      {/* Background Icon */}
      <div className="absolute top-2 right-2 opacity-[0.07] pointer-events-none">
        <Sparkles className="w-24 h-24 text-neon-gold" />
      </div>

      <div className="p-5 flex flex-col h-full z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-neon-gold/20 to-amber-500/10 border border-neon-gold/30 shadow-lg shadow-neon-gold/10">
            <Bot className="w-5 h-5 text-neon-gold" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              Neon Coach
              <span className="text-[9px] uppercase tracking-wider bg-gradient-to-r from-neon-gold/20 to-amber-500/10 text-neon-gold px-1.5 py-0.5 rounded-full border border-neon-gold/30 font-medium">
                IA
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">Insights financeiros inteligentes</p>
          </div>
        </div>

        {/* Quick Stats Badges */}
        {resumo && !analysis && !isPending && (
          <div className="flex flex-wrap gap-2 mb-3">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isSaldoPositivo
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {isSaldoPositivo ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {formatCurrency(Math.abs(saldo))}
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Margem {margem}%
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 min-h-[100px] flex flex-col justify-center">
          {isPending ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-neon-gold/80 italic">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                Analisando suas finanças...
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full bg-indigo-500/15 rounded" />
                <Skeleton className="h-3 w-[90%] bg-indigo-500/15 rounded" />
                <Skeleton className="h-3 w-[80%] bg-indigo-500/15 rounded" />
              </div>
            </div>
          ) : analysis ? (
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground/90 overflow-y-auto max-h-[180px] pr-2 custom-scrollbar">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center space-y-2 py-1">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Receba análises personalizadas do desempenho financeiro da sua clínica.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-3 mt-auto space-y-2">
          {!analysis || isPending ? (
            <Button
              onClick={handleAnalyze}
              disabled={isPending}
              className="w-full bg-gradient-to-r from-neon-gold to-amber-500 hover:from-neon-gold/90 hover:to-amber-500/90 text-neon-navy font-semibold transition-all shadow-lg shadow-neon-gold/20 hover:shadow-neon-gold/30 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Gerando Insights...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Análise Rápida
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyze}
                className="flex-1 border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-500/20 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Atualizar
              </Button>
              <Button
                size="sm"
                onClick={() => setLocation("/financeiro/analise")}
                className="flex-1 bg-neon-gold/90 hover:bg-neon-gold text-neon-navy font-medium cursor-pointer"
              >
                Ver Análise Completa
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </NeonCard>
  );
}
