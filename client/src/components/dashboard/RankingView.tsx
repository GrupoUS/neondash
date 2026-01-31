import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BentoCard, BentoCardContent } from "@/components/ui/bento-grid";

import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Trophy, Medal, Award, Crown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";

interface RankingViewProps {
  selectedMonth: number;
  selectedYear: number;
}

export function RankingView({ selectedMonth, selectedYear }: RankingViewProps) {
  const { user } = useAuth();
  const { data: ranking, isLoading } = trpc.gamificacao.ranking.useQuery({
    ano: selectedYear,
    mes: selectedMonth,
  });

  const { data: mentorado } = trpc.mentorados.me.useQuery();

  const getPosicaoIcon = (posicao: number) => {
    switch (posicao) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-500" />;
      default:
        return (
          <span className="text-lg font-bold text-slate-500">{posicao}º</span>
        );
    }
  };

  const getPosicaoStyle = (posicao: number) => {
    switch (posicao) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200";
      case 3:
        return "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200";
      default:
        return "bg-white";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Ranking Mensal
          </h2>
          <p className="text-slate-500 mt-1">
            Classificação de performance dos mentorados
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-neon-green" />
        </div>
      ) : !ranking || ranking.length === 0 ? (
        <Card className="border-none shadow-sm">
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Ranking não disponível
            </h3>
            <p className="text-slate-500">
              O ranking selecionado ainda não foi calculado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top 3 Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 0, 2].map((idx, i) => {
              const item = ranking[idx];
              if (!item) return <div key={idx} className="hidden md:block" />;
              const isCurrentUser = mentorado?.id === item.mentorado.id;

              // Determine delay based on visual order (center first, then left, then right)
              // Center (idx 0) -> delay 0
              // Left (idx 1) -> delay 0.1
              // Right (idx 2) -> delay 0.2
              const delay = idx === 0 ? 0 : idx === 1 ? 0.1 : 0.2;

              return (
                <BentoCard
                  key={item.ranking.id}
                  delay={delay}
                  className={cn(
                    "text-center relative overflow-hidden",
                    idx === 0 && "md:-mt-4 z-10",
                    getPosicaoStyle(item.ranking.posicao),
                    isCurrentUser && "ring-2 ring-neon-green"
                  )}
                >
                  <BentoCardContent className="pt-6 pb-4">
                    <div className="mb-3 flex justify-center">
                      {getPosicaoIcon(item.ranking.posicao)}
                    </div>
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-3 overflow-hidden shadow-inner">
                      {item.mentorado.fotoUrl ? (
                        <img
                          src={item.mentorado.fotoUrl}
                          alt={item.mentorado.nomeCompleto}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-slate-400">
                          {item.mentorado.nomeCompleto.charAt(0)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1 truncate px-2 text-lg">
                      {item.mentorado.nomeCompleto.split(" ")[0]}
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-xs mb-2 bg-white/50 backdrop-blur-sm"
                    >
                      Neon
                    </Badge>
                    <div className="text-2xl font-bold text-neon-green">
                      {item.ranking.pontuacaoTotal}
                      <span className="text-sm text-slate-500 ml-1">pts</span>
                    </div>
                    {item.ranking.pontosBonus > 0 && (
                      <p className="text-xs text-purple-600 mt-1 font-medium bg-purple-50 inline-block px-2 py-0.5 rounded-full">
                        +{item.ranking.pontosBonus} bônus
                      </p>
                    )}
                  </BentoCardContent>
                </BentoCard>
              );
            })}
          </div>

          {/* Full Ranking List */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Classificação Completa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ranking.map(item => {
                  const isCurrentUser = mentorado?.id === item.mentorado.id;

                  return (
                    <div
                      key={item.ranking.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg transition-colors",
                        getPosicaoStyle(item.ranking.posicao),
                        isCurrentUser && "ring-2 ring-neon-green"
                      )}
                    >
                      <div className="w-10 flex justify-center">
                        {getPosicaoIcon(item.ranking.posicao)}
                      </div>

                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.mentorado.fotoUrl ? (
                          <img
                            src={item.mentorado.fotoUrl}
                            alt={item.mentorado.nomeCompleto}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-slate-400">
                            {item.mentorado.nomeCompleto.charAt(0)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 truncate">
                          {item.mentorado.nomeCompleto}
                          {isCurrentUser && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Você
                            </Badge>
                          )}
                        </h4>
                        <p className="text-sm text-slate-500">Neon</p>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-slate-900">
                          {item.ranking.pontuacaoTotal}
                          <span className="text-sm text-slate-500 ml-1">
                            pts
                          </span>
                        </div>
                        {item.ranking.pontosBonus > 0 && (
                          <div className="flex items-center justify-end gap-1 text-xs text-purple-600">
                            <TrendingUp className="w-3 h-3" />+
                            {item.ranking.pontosBonus} bônus
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
