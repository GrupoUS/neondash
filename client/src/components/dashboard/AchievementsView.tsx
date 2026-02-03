import { calcularProgresso } from "@shared/atividades-data";
import {
  Award,
  Camera,
  Crown,
  Flame,
  Gem,
  Loader2,
  Lock,
  Medal,
  Play,
  Rocket,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import {
  AnimatedTabs,
  AnimatedTabsContent,
  AnimatedTabsList,
  AnimatedTabsTrigger,
} from "@/components/ui/animated-tabs";
import { Badge } from "@/components/ui/badge";
import {
  BentoCard,
  BentoCardContent,
  BentoCardHeader,
  BentoGrid,
} from "@/components/ui/bento-grid";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Target,
  TrendingUp,
  Rocket,
  Crown,
  Gem,
  Camera,
  Flame,
  Play,
  Users,
  Zap,
  Award,
  Trophy,
  Medal,
};

const colorMap: Record<string, string> = {
  gold: "from-yellow-400 to-amber-500 text-yellow-900",
  silver: "from-gray-300 to-gray-400 text-gray-800",
  bronze: "from-orange-400 to-orange-600 text-orange-900",
  purple: "from-purple-400 to-purple-600 text-purple-100",
  blue: "from-blue-400 to-blue-600 text-blue-100",
  green: "from-green-400 to-green-600 text-green-100",
  orange: "from-orange-400 to-orange-600 text-orange-100",
  pink: "from-pink-400 to-pink-600 text-pink-100",
  yellow: "from-yellow-400 to-yellow-600 text-yellow-900",
};

const categoriaLabels: Record<string, string> = {
  faturamento: "Faturamento",
  conteudo: "Conteúdo",
  operacional: "Operacional",
  consistencia: "Consistência",
  especial: "Especial",
};

// Component helper to isolate logic and avoiding re-fches if parent components re-nder
function ActivityProgressContent() {
  const { data: progressMap } = trpc.atividades.getProgress.useQuery();

  const { total, completed, percentage } = calcularProgresso(
    Object.fromEntries(Object.entries(progressMap || {}).map(([k, v]) => [k, v.completed]))
  );

  return (
    <>
      <BentoCardHeader className="pb-2">
        <div className="text-sm font-medium text-green-700 dark:text-green-400 uppercase tracking-wider">
          Progresso Geral
        </div>
      </BentoCardHeader>
      <BentoCardContent>
        <div className="text-4xl font-bold text-green-900 dark:text-green-100">
          {percentage}%
          <span className="text-sm font-normal text-green-600 dark:text-green-500 ml-2">
            ({completed}/{total} passos)
          </span>
        </div>
      </BentoCardContent>
    </>
  );
}

export function AchievementsView() {
  const { data: allBadges, isLoading: loadingAll } = trpc.gamificacao.allBadges.useQuery();
  const { data: myBadges, isLoading: loadingMy } = trpc.gamificacao.myBadges.useQuery();

  const isLoading = loadingAll || loadingMy;

  const earnedBadgeIds = new Set(myBadges?.map((b) => b.badge.id) || []);

  const categorias = ["faturamento", "conteudo", "operacional", "consistencia", "especial"];

  const totalPontos = myBadges?.reduce((acc, b) => acc + b.badge.pontos, 0) || 0;
  const totalBadges = myBadges?.length || 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Conquistas</h2>
        <p className="text-slate-500 mt-1">Suas medalhas e badges conquistados na mentoria</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-neon-green" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <BentoGrid className="grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <BentoCard
              delay={0}
              className="border-none shadow-sm bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-amber-950/30 dark:to-yellow-950/30"
            >
              <BentoCardHeader className="pb-2">
                <div className="text-sm font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Badges Conquistados
                </div>
              </BentoCardHeader>
              <BentoCardContent>
                <div className="text-4xl font-bold text-amber-900 dark:text-amber-100">
                  {totalBadges}
                  <span className="text-lg text-amber-600 dark:text-amber-500 ml-1">
                    / {allBadges?.length || 0}
                  </span>
                </div>
              </BentoCardContent>
            </BentoCard>

            <BentoCard
              delay={0.1}
              className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-violet-50 dark:from-violet-950/30 dark:to-purple-950/30"
            >
              <BentoCardHeader className="pb-2">
                <div className="text-sm font-medium text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  Pontos Totais
                </div>
              </BentoCardHeader>
              <BentoCardContent>
                <div className="text-4xl font-bold text-purple-900 dark:text-purple-100">
                  {totalPontos}
                </div>
              </BentoCardContent>
            </BentoCard>

            <BentoCard
              delay={0.2}
              className="border-none shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 dark:from-emerald-950/30 dark:to-green-950/30"
            >
              <ActivityProgressContent />
            </BentoCard>
          </BentoGrid>

          {/* Badges by Category */}
          <AnimatedTabs defaultValue="all" className="w-full">
            <AnimatedTabsList className="mb-6 overflow-x-auto w-full md:w-auto justify-start bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
              <AnimatedTabsTrigger value="all" className="rounded-xl">
                Todos
              </AnimatedTabsTrigger>
              {categorias.map((cat) => (
                <AnimatedTabsTrigger key={cat} value={cat} className="rounded-xl">
                  {categoriaLabels[cat]}
                </AnimatedTabsTrigger>
              ))}
            </AnimatedTabsList>

            <AnimatedTabsContent value="all">
              <BentoGrid className="grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allBadges?.map((badge, idx) => {
                  const earned = earnedBadgeIds.has(badge.id);
                  const Icon = iconMap[badge.icone] || Award;
                  const earnedData = myBadges?.find((b) => b.badge.id === badge.id);

                  return (
                    <BentoCard
                      key={badge.id}
                      delay={idx * 0.05}
                      className={cn(
                        "relative overflow-hidden transition-all duration-300",
                        earned
                          ? "border-none shadow-lg hover:shadow-xl dark:bg-card/60"
                          : "border-dashed border-2 border-gray-200 bg-gray-50 opacity-60 dark:bg-gray-900/40 dark:border-gray-800"
                      )}
                    >
                      <BentoCardContent className="p-6 text-center flex flex-col items-center h-full justify-between">
                        <div>
                          <div
                            className={cn(
                              "w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4",
                              earned
                                ? `bg-gradient-to-br ${colorMap[badge.cor] || colorMap.gold}`
                                : "bg-gray-200 dark:bg-gray-800"
                            )}
                          >
                            {earned ? (
                              <Icon className="w-8 h-8" />
                            ) : (
                              <Lock className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                            )}
                          </div>
                          <h3
                            className={cn(
                              "font-bold mb-1",
                              earned
                                ? "text-slate-900 dark:text-slate-100"
                                : "text-gray-400 dark:text-gray-600"
                            )}
                          >
                            {badge.nome}
                          </h3>
                          <p
                            className={cn(
                              "text-xs mb-2",
                              earned
                                ? "text-slate-500 dark:text-slate-400"
                                : "text-gray-400 dark:text-gray-600"
                            )}
                          >
                            {badge.descricao}
                          </p>
                        </div>
                        <div className="mt-2">
                          <Badge variant={earned ? "default" : "outline"} className="text-xs">
                            {badge.pontos} pts
                          </Badge>
                          {earned && earnedData && (
                            <p className="text-xs text-neon-green mt-2">
                              Conquistado em {earnedData.mes}/{earnedData.ano}
                            </p>
                          )}
                        </div>
                      </BentoCardContent>
                    </BentoCard>
                  );
                })}
              </BentoGrid>
            </AnimatedTabsContent>

            {categorias.map((cat) => (
              <AnimatedTabsContent key={cat} value={cat}>
                <BentoGrid className="grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allBadges
                    ?.filter((b) => b.categoria === cat)
                    .map((badge, idx) => {
                      const earned = earnedBadgeIds.has(badge.id);
                      const Icon = iconMap[badge.icone] || Award;
                      const earnedData = myBadges?.find((b) => b.badge.id === badge.id);

                      return (
                        <BentoCard
                          key={badge.id}
                          delay={idx * 0.05}
                          className={cn(
                            "relative overflow-hidden transition-all duration-300",
                            earned
                              ? "border-none shadow-lg hover:shadow-xl dark:bg-card/60"
                              : "border-dashed border-2 border-gray-200 bg-gray-50 opacity-60 dark:bg-gray-900/40 dark:border-gray-800"
                          )}
                        >
                          <BentoCardContent className="p-6 text-center flex flex-col items-center h-full justify-between">
                            <div>
                              <div
                                className={cn(
                                  "w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4",
                                  earned
                                    ? `bg-gradient-to-br ${colorMap[badge.cor] || colorMap.gold}`
                                    : "bg-gray-200 dark:bg-gray-800"
                                )}
                              >
                                {earned ? (
                                  <Icon className="w-8 h-8" />
                                ) : (
                                  <Lock className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                                )}
                              </div>
                              <h3
                                className={cn(
                                  "font-bold mb-1",
                                  earned
                                    ? "text-slate-900 dark:text-slate-100"
                                    : "text-gray-400 dark:text-gray-600"
                                )}
                              >
                                {badge.nome}
                              </h3>
                              <p
                                className={cn(
                                  "text-xs mb-2",
                                  earned
                                    ? "text-slate-500 dark:text-slate-400"
                                    : "text-gray-400 dark:text-gray-600"
                                )}
                              >
                                {badge.descricao}
                              </p>
                            </div>
                            <div className="mt-2">
                              <Badge variant={earned ? "default" : "outline"} className="text-xs">
                                {badge.pontos} pts
                              </Badge>
                              {earned && earnedData && (
                                <p className="text-xs text-neon-green mt-2">
                                  Conquistado em {earnedData.mes}/{earnedData.ano}
                                </p>
                              )}
                            </div>
                          </BentoCardContent>
                        </BentoCard>
                      );
                    })}
                </BentoGrid>
              </AnimatedTabsContent>
            ))}
          </AnimatedTabs>
        </>
      )}
    </div>
  );
}
