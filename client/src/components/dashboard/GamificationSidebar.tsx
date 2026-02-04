import { AnimatePresence, motion } from "framer-motion";
import { Flame, Lock, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
}

interface EarnedBadge {
  badge: Badge;
  conquistadoEm: Date | string;
  ano: number;
  mes: number;
}

export function GamificationSidebar({ mentoradoId, className }: GamificationSidebarProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Fetch streak data
  const { data: streakData, isLoading: streakLoading } = trpc.gamificacao.getStreak.useQuery(
    { mentoradoId: mentoradoId ?? 0 },
    { enabled: !!mentoradoId }
  );

  // Fetch all badges
  const { data: allBadges, isLoading: allBadgesLoading } = trpc.gamificacao.allBadges.useQuery();

  // Fetch earned badges
  const { data: earnedBadges, isLoading: earnedLoading } = trpc.gamificacao.myBadges.useQuery();

  // Set window size for confetti
  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Track new badges and show confetti
  const [previousBadgeCount, setPreviousBadgeCount] = useState(0);
  useEffect(() => {
    if (earnedBadges && earnedBadges.length > previousBadgeCount && previousBadgeCount > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
    if (earnedBadges) {
      setPreviousBadgeCount(earnedBadges.length);
    }
  }, [earnedBadges, previousBadgeCount]);

  const isLoading = streakLoading || allBadgesLoading || earnedLoading;

  // Compute locked badges
  const earnedBadgeIds = new Set((earnedBadges ?? []).map((b: EarnedBadge) => b.badge.id));
  const lockedBadges = (allBadges ?? []).filter((b: Badge) => !earnedBadgeIds.has(b.id));

  // Get next badge to earn (first locked badge)
  const nextBadge = lockedBadges[0] as Badge | undefined;

  const sidebarContent = (
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
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-primary">
                  {streakData?.currentStreak ?? 0}
                </span>
                <span className="text-muted-foreground">meses</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recorde: {streakData?.longestStreak ?? 0} meses
              </p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Próximo marco</span>
                  <span className="font-medium">{streakData?.nextMilestone ?? 3} meses</span>
                </div>
                <Progress value={streakData?.progressPercent ?? 0} className="h-2" />
              </div>
            </motion.div>
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
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        delay: index * 0.1,
                      }}
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full text-lg cursor-pointer transition-transform hover:scale-110",
                        earned.badge.cor === "gold" && "bg-yellow-500/20 ring-1 ring-yellow-500/50",
                        earned.badge.cor === "silver" && "bg-gray-400/20 ring-1 ring-gray-400/50",
                        earned.badge.cor === "bronze" &&
                          "bg-orange-600/20 ring-1 ring-orange-600/50",
                        earned.badge.cor === "green" && "bg-green-500/20 ring-1 ring-green-500/50",
                        earned.badge.cor === "blue" && "bg-blue-500/20 ring-1 ring-blue-500/50",
                        earned.badge.cor === "purple" &&
                          "bg-purple-500/20 ring-1 ring-purple-500/50"
                      )}
                    >
                      {earned.badge.icone}
                    </motion.div>
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

      {/* Locked Badges */}
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
              {lockedBadges.slice(0, 8).map((badge: Badge) => (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/50 cursor-pointer grayscale">
                      {badge.icone}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-semibold">{badge.nome}</p>
                      <p className="text-xs text-muted-foreground">{badge.descricao}</p>
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

      {/* Next Badge Progress */}
      {nextBadge && (
        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Próxima Conquista</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
                {nextBadge.icone}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{nextBadge.nome}</p>
                <p className="text-xs text-muted-foreground">{nextBadge.descricao}</p>
                <p className="text-xs text-primary mt-1">+{nextBadge.pontos} pts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
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
