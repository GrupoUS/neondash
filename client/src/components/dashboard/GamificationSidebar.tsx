import { AnimatePresence } from "framer-motion";
import { Flame, Lock, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";
import { toast } from "sonner";
import { BadgeIcon } from "@/components/dashboard/BadgeIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface GamificationSidebarProps {
  mentoradoId?: number;
  className?: string;
}

interface Badge {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
  categoria: string;
  pontos: number;
  criterio: string;
}

interface EarnedBadge {
  badge: Badge;
  conquistadoEm: Date | string;
  ano: number;
  mes: number;
}

// Helper to compute badge progress from criterio
function computeBadgeProgress(
  badge: Badge,
  currentStreak: number
): { progress: number; label: string } {
  try {
    const criterio = JSON.parse(badge.criterio);

    switch (criterio.tipo) {
      case "streak_consecutivo": {
        const target = criterio.meses ?? 0;
        const progress = target > 0 ? Math.min(100, Math.round((currentStreak / target) * 100)) : 0;
        return { progress, label: `${currentStreak}/${target} meses` };
      }
      case "primeiro_registro":
        // Can't compute without knowing if first registration happened
        return { progress: 0, label: "Registre suas métricas" };
      case "pontualidade": {
        // Requires historical data, simplified
        const months = criterio.meses ?? 3;
        return { progress: 0, label: `${months} meses até dia ${criterio.dia ?? 5}` };
      }
      case "faturamento_meta":
        return { progress: 0, label: "Atingir meta de faturamento" };
      case "crescimento":
        return { progress: 0, label: `Crescer ${criterio.percentual ?? criterio.valor ?? 25}%` };
      case "faturamento_minimo": {
        const valor = criterio.valor ?? 0;
        return { progress: 0, label: `Faturar R$ ${(valor / 1000).toFixed(0)}k+` };
      }
      case "ranking_top": {
        const pos = criterio.posicao ?? 1;
        return { progress: 0, label: `Top ${pos} no ranking` };
      }
      case "acima_media":
        return { progress: 0, label: `${criterio.meses ?? 3} meses acima da média` };
      case "leads_minimo":
        return { progress: 0, label: `${criterio.valor ?? 50}+ leads` };
      case "conversao":
        return { progress: 0, label: `Taxa >${criterio.percentual ?? 20}%` };
      case "playbook_completo":
        return { progress: 0, label: "Completar playbook" };
      case "meses_mentoria":
        return { progress: 0, label: `${criterio.valor ?? 6} meses de mentoria` };
      default:
        return { progress: 0, label: badge.descricao };
    }
  } catch {
    return { progress: 0, label: badge.descricao };
  }
}

export function GamificationSidebar({ mentoradoId, className }: GamificationSidebarProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Track previous badge count with ref to persist across renders (Comment 4 fix)
  const prevBadgeCountRef = useRef<number | null>(null);

  // Comment 2 fix: Fetch streak data - use myStreak when no mentoradoId, getStreak when provided
  const { data: selfStreakData, isLoading: selfStreakLoading } = trpc.gamificacao.myStreak.useQuery(
    undefined,
    { enabled: !mentoradoId }
  );

  const { data: targetStreakData, isLoading: targetStreakLoading } =
    trpc.gamificacao.getStreak.useQuery(
      { mentoradoId: mentoradoId ?? 0 },
      { enabled: !!mentoradoId }
    );

  // Combine streak data from whichever source is active
  const streakData = mentoradoId ? targetStreakData : selfStreakData;
  const streakLoading = mentoradoId ? targetStreakLoading : selfStreakLoading;

  // Fetch all badges
  const { data: allBadges, isLoading: allBadgesLoading } = trpc.gamificacao.allBadges.useQuery();

  // Comment 1 fix: Fetch earned badges - use mentoradoBadges when mentoradoId is provided
  const { data: selfBadges, isLoading: selfBadgesLoading } = trpc.gamificacao.myBadges.useQuery(
    undefined,
    { enabled: !mentoradoId }
  );

  const { data: targetBadges, isLoading: targetBadgesLoading } =
    trpc.gamificacao.mentoradoBadges.useQuery(
      { mentoradoId: mentoradoId ?? 0 },
      { enabled: !!mentoradoId }
    );

  // Combine badge data from whichever source is active
  const earnedBadges = mentoradoId ? targetBadges : selfBadges;
  const earnedLoading = mentoradoId ? targetBadgesLoading : selfBadgesLoading;

  // Set window size for confetti
  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Comment 4 fix: Track new badges and show confetti + toast (including from 0)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (earnedBadges) {
      const currentCount = earnedBadges.length;
      const prevCount = prevBadgeCountRef.current;

      // Fire confetti when badge count increases from ANY previous value (including 0 → 1)
      if (prevCount !== null && currentCount > prevCount) {
        setShowConfetti(true);
        timeoutId = setTimeout(() => setShowConfetti(false), 5000);

        // Show toast with the newest badge name
        const newestBadge = earnedBadges[0]; // Most recent (ordered by conquistadoEm DESC)
        if (newestBadge) {
          toast.success(`🏆 Nova conquista: ${newestBadge.badge.nome}!`, {
            description: newestBadge.badge.descricao,
            duration: 5000,
          });
        }
      }

      // Always update the ref to current count
      prevBadgeCountRef.current = currentCount;
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [earnedBadges]);

  const isLoading = streakLoading || allBadgesLoading || earnedLoading;

  // Comment 1 fix: Derive locked badges from the SAME source as earned badges
  const earnedBadgeIds = new Set((earnedBadges ?? []).map((b: EarnedBadge) => b.badge.id));
  const lockedBadges = (allBadges ?? []).filter((b: Badge) => !earnedBadgeIds.has(b.id));

  // Comment 3 fix: Compute progress for locked badges and pick the one with highest progress
  const currentStreak = streakData?.currentStreak ?? 0;
  const lockedWithProgress = lockedBadges.map((badge: Badge) => ({
    badge,
    ...computeBadgeProgress(badge, currentStreak),
  }));

  // Sort by progress (highest first), then by points (higher value = more prestigious)
  lockedWithProgress.sort((a, b) => {
    if (b.progress !== a.progress) return b.progress - a.progress;
    return b.badge.pontos - a.badge.pontos;
  });

  // Get the best next badge (highest progress or highest points if tied at 0)
  const nextBadgeWithProgress = lockedWithProgress[0];

  const sidebarContent = (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Confetti Effect */}
        <AnimatePresence>
          {showConfetti && (
            <Confetti
              width={windowSize.width}
              height={windowSize.height}
              recycle={false}
              numberOfPieces={200}
              gravity={0.2}
            />
          )}
        </AnimatePresence>

        {/* Streak Counter */}
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="size-5 text-orange-500" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-primary">
                    {streakData?.currentStreak ?? 0}
                  </span>
                  <span className="text-muted-foreground">meses</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Recorde: {streakData?.longestStreak ?? 0} meses
                </p>
                {(() => {
                  // Compute nextMilestone and progressPercent locally
                  const streak = streakData?.currentStreak ?? 0;
                  const nextMilestone = streak < 3 ? 3 : streak < 6 ? 6 : 12;
                  const progressPercent = Math.min(100, Math.round((streak / nextMilestone) * 100));
                  return (
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Próximo marco</span>
                        <span className="font-medium">{nextMilestone} meses</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Earned Badges */}
        <Card className="border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="size-5 text-yellow-500" />
              Conquistas
              {earnedBadges && (
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {earnedBadges.length} de {allBadges?.length ?? 0}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="size-10 rounded-full" />
                ))}
              </div>
            ) : earnedBadges && earnedBadges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {earnedBadges.map((earned: EarnedBadge, index: number) => (
                  <Tooltip key={earned.badge.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex size-10 items-center justify-center rounded-full text-lg cursor-pointer transition-transform hover:scale-110 animate-in fade-in zoom-in-95 duration-300",
                          earned.badge.cor === "gold" &&
                            "bg-yellow-500/20 ring-1 ring-yellow-500/50",
                          earned.badge.cor === "silver" && "bg-gray-400/20 ring-1 ring-gray-400/50",
                          earned.badge.cor === "bronze" &&
                            "bg-orange-600/20 ring-1 ring-orange-600/50",
                          earned.badge.cor === "green" &&
                            "bg-green-500/20 ring-1 ring-green-500/50",
                          earned.badge.cor === "blue" && "bg-blue-500/20 ring-1 ring-blue-500/50",
                          earned.badge.cor === "purple" && "bg-teal-500/20 ring-1 ring-teal-500/50"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <BadgeIcon code={earned.badge.codigo} size={20} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <p className="font-semibold">{earned.badge.nome}</p>
                        <p className="text-xs text-muted-foreground">{earned.badge.descricao}</p>
                        <p className="text-xs text-primary mt-1">+{earned.badge.pontos} pts</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma conquista ainda. Continue subindo suas métricas!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Locked Badges - Comment 3 fix: Show progress in tooltips */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
              <Lock className="size-5" />
              Badges Bloqueadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="size-10 rounded-full" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {lockedWithProgress.slice(0, 8).map(({ badge, progress, label }) => (
                  <Tooltip key={badge.id}>
                    <TooltipTrigger asChild>
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/50 cursor-pointer grayscale hover:grayscale-0 hover:bg-muted/80 transition-all">
                        <BadgeIcon code={badge.codigo} size={20} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center max-w-[200px]">
                        <p className="font-semibold">{badge.nome}</p>
                        <p className="text-xs text-muted-foreground">{badge.descricao}</p>
                        {/* Comment 3: Progress details in tooltip */}
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Progresso:</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1" />
                          <p className="text-xs text-primary">{label}</p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {lockedBadges.length > 8 && (
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted/30 text-xs text-muted-foreground">
                    +{lockedBadges.length - 8}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Badge Progress - Comment 3 fix: Show badge with highest progress */}
        {nextBadgeWithProgress && (
          <Card className="border-dashed border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Próxima Conquista</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <BadgeIcon
                    code={nextBadgeWithProgress.badge.codigo}
                    size={24}
                    className="text-primary"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{nextBadgeWithProgress.badge.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {nextBadgeWithProgress.badge.descricao}
                  </p>
                  <p className="text-xs text-primary mt-1">
                    +{nextBadgeWithProgress.badge.pontos} pts
                  </p>
                </div>
              </div>
              {/* Comment 3: Progress bar for next badge */}
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{nextBadgeWithProgress.label}</span>
                  <span className="font-medium">{nextBadgeWithProgress.progress}%</span>
                </div>
                <Progress value={nextBadgeWithProgress.progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );

  return (
    <>
      {/* Desktop: Sticky Sidebar */}
      <aside className={cn("hidden lg:block w-80 shrink-0", className)}>
        <div className="sticky top-24 space-y-4">{sidebarContent}</div>
      </aside>

      {/* Mobile: Sheet Trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-6 right-6 z-50 lg:hidden size-14 rounded-full shadow-lg"
            aria-label="Ver gamificação"
          >
            <Trophy className="size-6 text-yellow-500" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[320px] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-yellow-500" />
              Gamificação
            </SheetTitle>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}
