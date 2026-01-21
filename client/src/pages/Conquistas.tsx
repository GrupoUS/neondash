import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
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
  Lock,
} from "lucide-react";
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

export default function Conquistas() {
  const { data: allBadges, isLoading: loadingAll } =
    trpc.gamificacao.allBadges.useQuery();
  const { data: myBadges, isLoading: loadingMy } =
    trpc.gamificacao.myBadges.useQuery();

  const isLoading = loadingAll || loadingMy;

  const earnedBadgeIds = new Set(myBadges?.map(b => b.badge.id) || []);

  const categorias = [
    "faturamento",
    "conteudo",
    "operacional",
    "consistencia",
    "especial",
  ];

  const totalPontos =
    myBadges?.reduce((acc, b) => acc + b.badge.pontos, 0) || 0;
  const totalBadges = myBadges?.length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Conquistas
          </h1>
          <p className="text-slate-500 mt-2">
            Suas medalhas e badges conquistados na mentoria
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neon-green" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm bg-gradient-to-br from-yellow-50 to-amber-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-700 uppercase tracking-wider">
                    Badges Conquistados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-amber-900">
                    {totalBadges}
                    <span className="text-lg text-amber-600 ml-1">
                      / {allBadges?.length || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-violet-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700 uppercase tracking-wider">
                    Pontos Totais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-purple-900">
                    {totalPontos}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 uppercase tracking-wider">
                    Progresso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-900">
                    {allBadges && allBadges.length > 0
                      ? Math.round((totalBadges / allBadges.length) * 100)
                      : 0}
                    %
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Badges by Category */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="all">Todos</TabsTrigger>
                {categorias.map(cat => (
                  <TabsTrigger key={cat} value={cat}>
                    {categoriaLabels[cat]}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allBadges?.map(badge => {
                    const earned = earnedBadgeIds.has(badge.id);
                    const Icon = iconMap[badge.icone] || Award;
                    const earnedData = myBadges?.find(
                      b => b.badge.id === badge.id
                    );

                    return (
                      <Card
                        key={badge.id}
                        className={cn(
                          "relative overflow-hidden transition-all duration-300",
                          earned
                            ? "border-none shadow-lg hover:shadow-xl"
                            : "border-dashed border-2 border-gray-200 bg-gray-50 opacity-60"
                        )}
                      >
                        <CardContent className="p-6 text-center">
                          <div
                            className={cn(
                              "w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4",
                              earned
                                ? `bg-gradient-to-br ${colorMap[badge.cor] || colorMap.gold}`
                                : "bg-gray-200"
                            )}
                          >
                            {earned ? (
                              <Icon className="w-8 h-8" />
                            ) : (
                              <Lock className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <h3
                            className={cn(
                              "font-bold mb-1",
                              earned ? "text-slate-900" : "text-gray-400"
                            )}
                          >
                            {badge.nome}
                          </h3>
                          <p
                            className={cn(
                              "text-xs mb-2",
                              earned ? "text-slate-500" : "text-gray-400"
                            )}
                          >
                            {badge.descricao}
                          </p>
                          <Badge
                            variant={earned ? "default" : "outline"}
                            className="text-xs"
                          >
                            {badge.pontos} pts
                          </Badge>
                          {earned && earnedData && (
                            <p className="text-xs text-neon-green mt-2">
                              Conquistado em {earnedData.mes}/{earnedData.ano}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {categorias.map(cat => (
                <TabsContent key={cat} value={cat}>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {allBadges
                      ?.filter(b => b.categoria === cat)
                      .map(badge => {
                        const earned = earnedBadgeIds.has(badge.id);
                        const Icon = iconMap[badge.icone] || Award;
                        const earnedData = myBadges?.find(
                          b => b.badge.id === badge.id
                        );

                        return (
                          <Card
                            key={badge.id}
                            className={cn(
                              "relative overflow-hidden transition-all duration-300",
                              earned
                                ? "border-none shadow-lg hover:shadow-xl"
                                : "border-dashed border-2 border-gray-200 bg-gray-50 opacity-60"
                            )}
                          >
                            <CardContent className="p-6 text-center">
                              <div
                                className={cn(
                                  "w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4",
                                  earned
                                    ? `bg-gradient-to-br ${colorMap[badge.cor] || colorMap.gold}`
                                    : "bg-gray-200"
                                )}
                              >
                                {earned ? (
                                  <Icon className="w-8 h-8" />
                                ) : (
                                  <Lock className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              <h3
                                className={cn(
                                  "font-bold mb-1",
                                  earned ? "text-slate-900" : "text-gray-400"
                                )}
                              >
                                {badge.nome}
                              </h3>
                              <p
                                className={cn(
                                  "text-xs mb-2",
                                  earned ? "text-slate-500" : "text-gray-400"
                                )}
                              >
                                {badge.descricao}
                              </p>
                              <Badge
                                variant={earned ? "default" : "outline"}
                                className="text-xs"
                              >
                                {badge.pontos} pts
                              </Badge>
                              {earned && earnedData && (
                                <p className="text-xs text-neon-green mt-2">
                                  Conquistado em {earnedData.mes}/
                                  {earnedData.ano}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
