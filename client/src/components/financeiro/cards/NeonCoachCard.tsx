import { Bot, Sparkles } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { NeonCard } from "@/components/ui/neon-card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

export function NeonCoachCard() {
  const [analysis, setAnalysis] = useState<string | null>(null);

  const { mutate: analyze, isPending } = trpc.financeiro.coach.analyze.useMutation({
    onSuccess: (data) => {
      setAnalysis(data);
    },
  });

  const handleAnalyze = () => {
    analyze();
  };

  return (
    <NeonCard
      className="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-indigo-950/50 to-purple-950/30 border-neon-gold/20"
      variant="default" // Using default but styled manually for extra flair
    >
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Sparkles className="w-32 h-32 text-neon-gold" />
      </div>

      <div className="p-6 flex flex-col h-full z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-neon-gold/10 border border-neon-gold/20 shadow-neon-gold/5 shadow-sm">
            <Bot className="w-5 h-5 text-neon-gold" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              Neon Coach
              <span className="text-[10px] uppercase tracking-wider bg-neon-gold/10 text-neon-gold px-1.5 py-0.5 rounded border border-neon-gold/20">
                Beta
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">Insights financeiros por IA</p>
          </div>
        </div>

        <div className="flex-1 min-h-[120px] flex flex-col justify-center">
          {isPending ? (
            <div className="space-y-3 animate-pulse">
              <div className="flex items-center gap-2 text-sm text-neon-gold/80 italic">
                <Sparkles className="w-3 h-3 animate-spin" />
                Analisando suas finanças...
              </div>
              <Skeleton className="h-4 w-full bg-indigo-500/10" />
              <Skeleton className="h-4 w-[90%] bg-indigo-500/10" />
              <Skeleton className="h-4 w-[95%] bg-indigo-500/10" />
            </div>
          ) : analysis ? (
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground/90 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                Clique abaixo para receber uma análise personalizada do seu desempenho financeiro.
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 mt-auto">
          {!analysis || isPending ? (
            <Button
              onClick={handleAnalyze}
              disabled={isPending}
              className="w-full bg-neon-gold hover:bg-neon-gold/90 text-neon-navy font-semibold transition-all shadow-lg shadow-neon-gold/10 hover:shadow-neon-gold/20"
            >
              {isPending ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Gerando Insights...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Análise Financeira
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              className="w-full border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-500/20"
            >
              Atualizar Análise
            </Button>
          )}
        </div>
      </div>
    </NeonCard>
  );
}
