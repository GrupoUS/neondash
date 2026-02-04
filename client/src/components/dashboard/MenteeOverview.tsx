import { BadgeCheck, DollarSign, TrendingUp, Trophy, Wallet } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { AITasksCard } from "./AITasksCard";
import { FinancialHistoryChart } from "./FinancialHistoryChart";
import { MeetingHistory } from "./MeetingHistory";
import { MentorNotes } from "./MentorNotes";
import { NewMentoradoWelcome } from "./NewMentoradoWelcome";
import { RoadmapView } from "./RoadmapView";
import { UpcomingClassSection } from "./UpcomingClassSection";

interface MenteeOverviewProps {
  mentoradoId?: number;
  isAdmin?: boolean;
  onNavigateToTab?: (tab: string) => void;
}

export function MenteeOverview({ mentoradoId, isAdmin, onNavigateToTab }: MenteeOverviewProps) {
  // Determine if viewing another mentorado (admin mode)
  const isViewingOther = mentoradoId !== undefined;

  // Fetch stats - pass mentoradoId only if viewing another user
  const { data: stats, isLoading: isLoadingStats } = trpc.mentorados.getOverviewStats.useQuery(
    isViewingOther ? { mentoradoId } : undefined
  );

  // Fetch mentorado info - use getById for admin view, me for self view
  const { data: mentoradoMe, isLoading: isLoadingMe } = trpc.mentorados.me.useQuery(undefined, {
    enabled: !isViewingOther,
  });
  const { data: mentoradoById, isLoading: isLoadingById } = trpc.mentorados.getById.useQuery(
    { id: mentoradoId! },
    { enabled: isViewingOther }
  );

  const mentorado = isViewingOther ? mentoradoById : mentoradoMe;

  // Determine if queries have finished loading
  const isQueriesLoading = isLoadingStats || (isViewingOther ? isLoadingById : isLoadingMe);

  // If still loading, show skeleton
  if (isQueriesLoading) {
    return <OverviewSkeleton />;
  }

  // If no mentorado exists (user without mentorado profile), show welcome screen
  if (!mentorado) {
    return (
      <NewMentoradoWelcome
        mentoradoName="Novo Usuário"
        onNavigateToDiagnostico={() => onNavigateToTab?.("diagnostico")}
      />
    );
  }

  // If stats failed to load, show skeleton (shouldn't happen normally)
  if (!stats) {
    return <OverviewSkeleton />;
  }

  // Note: We now show full overview even with zero data (after diagnostico)
  // Stats will display zeros until user enters their first metrics

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Profile Section - Horizontal Layout */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 dark:from-slate-900 dark:to-slate-800 border border-border dark:border-slate-700 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <BadgeCheck className="w-40 h-40 text-[#D4AF37]" />
        </div>

        {/* Top Row: Avatar + Name/Specialty + Score */}
        <div className="flex items-center gap-4 relative z-10">
          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] blur-sm opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <Avatar className="w-16 h-16 border-2 border-[#D4AF37] relative z-10 shadow-xl">
              <AvatarImage src={mentorado.fotoUrl || undefined} className="object-cover" />
              <AvatarFallback className="text-lg font-bold bg-muted dark:bg-slate-800 text-primary">
                {mentorado.nomeCompleto.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name - Specialty */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {mentorado.nomeCompleto}
              </h1>
              <span className="text-muted-foreground font-medium">—</span>
              <span className="text-sm text-muted-foreground font-medium">
                {stats.profile.specialty}
              </span>
            </div>
          </div>

          {/* Score Badge - Elaborated */}
          <div className="flex-shrink-0">
            <div
              className={cn(
                "flex items-center gap-3 px-5 py-2.5 rounded-xl border-2 shadow-lg transition-all hover:scale-105",
                stats.score >= 80
                  ? "bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-500/20"
                  : stats.score >= 60
                    ? "bg-blue-500/10 border-blue-500/40 dark:bg-blue-500/20"
                    : stats.score >= 40
                      ? "bg-amber-500/10 border-amber-500/40 dark:bg-amber-500/20"
                      : "bg-red-500/10 border-red-500/40 dark:bg-red-500/20"
              )}
            >
              <Trophy
                className={cn(
                  "w-5 h-5",
                  stats.score >= 80
                    ? "text-emerald-500"
                    : stats.score >= 60
                      ? "text-blue-500"
                      : stats.score >= 40
                        ? "text-amber-500"
                        : "text-red-500"
                )}
              />
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "text-2xl font-bold tabular-nums leading-none",
                    stats.score >= 80
                      ? "text-emerald-600 dark:text-emerald-400"
                      : stats.score >= 60
                        ? "text-blue-600 dark:text-blue-400"
                        : stats.score >= 40
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                  )}
                >
                  {stats.score}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Score
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Dual Events */}
        <div className="mt-5 pt-4 border-t border-border/50">
          <UpcomingClassSection isAdmin={isAdmin} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Financials & Roadmap */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card/80 dark:bg-slate-950/30 p-6 rounded-3xl border border-border dark:border-slate-800/60 backdrop-blur-sm shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-primary text-xl font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Histórico Financeiro
              </h2>
            </div>
            <FinancialHistoryChart data={stats.financials.chartData} />
          </div>

          <div className="space-y-4">
            <h2 className="text-primary text-xl font-semibold flex items-center gap-2 px-2">
              <TrendingUp className="w-5 h-5" />
              Jornada do Mentorado
            </h2>
            <RoadmapView mentoradoId={mentorado.id} />
          </div>
        </div>

        {/* Right Column: Neon Coach (top), Stats & Notes */}
        <div className="space-y-8">
          {/* AI Tasks Section - Placed prominently at the TOP */}
          <AITasksCard mentoradoId={mentorado.id} isAdmin={isAdmin} />

          <div className="space-y-4">
            <h2 className="text-primary text-lg font-medium px-1">Principais Estatísticas</h2>

            <div className="grid grid-cols-1 gap-4">
              {/* ROI Card - Based on R$ 20,000 mentorship price */}
              {(() => {
                const MENTORSHIP_COST = 20000;
                const roi =
                  stats.financials.totalProfit > 0
                    ? (stats.financials.totalProfit / MENTORSHIP_COST) * 100
                    : 0;
                const isPositiveROI = roi > 0;
                return (
                  <Card className="bg-card dark:bg-slate-900/50 border-border dark:border-slate-700/50 hover:border-primary/30 transition-all hover:bg-accent/50 dark:hover:bg-slate-900/80 group shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted dark:bg-slate-800 flex items-center justify-center border border-border dark:border-slate-700 text-primary group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-primary/20">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                          ROI da Mentoria
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span
                            className={`text-2xl font-bold tracking-tight ${isPositiveROI ? "text-emerald-400" : "text-foreground"}`}
                          >
                            {roi.toFixed(0)}%
                          </span>
                          {isPositiveROI && (
                            <span className="text-xs text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                              +{formatCurrency(stats.financials.totalProfit)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Base: {formatCurrency(MENTORSHIP_COST)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Current Monthly Revenue Card */}
              <Card className="bg-card dark:bg-slate-900/50 border-border dark:border-slate-700/50 hover:border-primary/30 transition-all hover:bg-accent/50 dark:hover:bg-slate-900/80 group shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted dark:bg-slate-800 flex items-center justify-center border border-border dark:border-slate-700 text-primary group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-primary/20">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                      Receita Mensal
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-foreground tracking-tight">
                        {stats.financials.chartData.length > 0
                          ? formatCurrency(
                              stats.financials.chartData[stats.financials.chartData.length - 1]
                                .faturamento
                            )
                          : "R$ 0,00"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Growth Card */}
              <Card className="bg-card dark:bg-slate-900/50 border-border dark:border-slate-700/50 hover:border-primary/30 transition-all hover:bg-accent/50 dark:hover:bg-slate-900/80 group shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted dark:bg-slate-800 flex items-center justify-center border border-border dark:border-slate-700 text-primary group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-primary/20">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                      Crescimento
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-foreground tracking-tight">
                        {stats.financials.growthPercent}%
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">(Geral)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px bg-border flex-1"></div>
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-widest">
                Mentor Area
              </span>
              <div className="h-px bg-border flex-1"></div>
            </div>
            <h2 className="text-primary text-lg font-medium px-1">Anotações Privadas</h2>
            <MentorNotes existingNotes={stats.notes} />
          </div>

          <div className="pt-4 space-y-4">
            <h2 className="text-primary text-lg font-medium px-1">Histórico de Reuniões</h2>
            <MeetingHistory meetings={stats.meetings} />
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-muted rounded-2xl w-full"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-muted rounded-xl"></div>
        <div className="space-y-4">
          <div className="h-24 bg-muted rounded-xl"></div>
          <div className="h-24 bg-muted rounded-xl"></div>
          <div className="h-24 bg-muted rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}
