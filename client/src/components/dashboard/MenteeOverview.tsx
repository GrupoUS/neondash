import { BadgeCheck, DollarSign, TrendingUp, Wallet } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AITasksCard } from "./AITasksCard";
import { FinancialHistoryChart } from "./FinancialHistoryChart";
import { MeetingHistory } from "./MeetingHistory";
import { MentorNotes } from "./MentorNotes";
import { NewMentoradoWelcome } from "./NewMentoradoWelcome";
import { NextLiveCard } from "./NextLiveCard";
import { RoadmapView } from "./RoadmapView";

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
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 dark:from-slate-900 dark:to-slate-800 border border-border dark:border-slate-700 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <BadgeCheck className="w-32 h-32 text-[#D4AF37]" />
        </div>

        <div className="relative group">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] blur-sm opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <Avatar className="w-24 h-24 border-2 border-[#D4AF37] relative z-10 shadow-2xl">
            <AvatarImage src={mentorado.fotoUrl || undefined} className="object-cover" />
            <AvatarFallback className="text-2xl font-bold bg-muted dark:bg-slate-800 text-primary">
              {mentorado.nomeCompleto.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 text-center md:text-left z-10">
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            {mentorado.nomeCompleto}
          </h1>
          <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
            Especialidade:{" "}
            <span className="text-foreground bg-muted/50 dark:bg-slate-800/50 px-3 py-1 rounded-full text-sm border border-border dark:border-slate-700">
              {stats.profile.specialty}
            </span>
          </p>
        </div>

        <Badge className="bg-gradient-to-br from-[#D4AF37] to-[#AA8C2C] text-slate-900 px-6 py-2.5 text-sm font-bold border-none shadow-xl flex items-center gap-2 hover:scale-105 transition-transform z-10">
          <BadgeCheck className="w-5 h-5" />
          High Performer
        </Badge>
      </div>

      {/* Next Live Session Card */}
      <div className="w-full">
        <NextLiveCard isAdmin={isAdmin} />
        {/* Let's simplify: if isAdmin is passed (true for admin view), or if we can derive it. passed prop is safest. */}
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
