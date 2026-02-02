import { BadgeCheck, DollarSign, TrendingUp, Wallet } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { FinancialHistoryChart } from "./FinancialHistoryChart";
import { MeetingHistory } from "./MeetingHistory";
import { MentorNotes } from "./MentorNotes";
import { MilestoneTimeline } from "./MilestoneTimeline";

export function MenteeOverview() {
  // Single optimized query that fetches everything
  const { data: stats, isLoading } = trpc.mentorados.getOverviewStats.useQuery();
  const { data: mentorado } = trpc.mentorados.me.useQuery();

  if (isLoading || !mentorado || !stats) {
    return <OverviewSkeleton />;
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <div className="space-y-6">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 shadow-xl">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] blur-sm opacity-50"></div>
          <Avatar className="w-24 h-24 border-2 border-[#D4AF37] relative z-10">
            <AvatarImage src={mentorado.fotoUrl || undefined} />
            <AvatarFallback className="text-2xl font-bold bg-slate-800 text-[#D4AF37]">
              {mentorado.nomeCompleto.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold text-white mb-1">{mentorado.nomeCompleto}</h1>
          <p className="text-slate-400 font-medium">
            Especialidade: <span className="text-slate-200">{stats.profile.specialty}</span>
          </p>
        </div>

        <Badge className="bg-gradient-to-r from-[#D4AF37] to-[#AA8C2C] text-slate-900 px-4 py-2 text-sm font-bold border-none shadow-lg flex items-center gap-2">
          <BadgeCheck className="w-5 h-5" />
          High Performer
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Financials */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-[#D4AF37] text-lg font-medium">Histórico Financeiro</h2>
          </div>

          <FinancialHistoryChart data={stats.financials.chartData} />

          <h2 className="text-[#D4AF37] text-lg font-medium mt-8">Linha do Tempo de Marcos</h2>
          <MilestoneTimeline />
        </div>

        {/* Right Column: Stats & Notes */}
        <div className="space-y-6">
          <h2 className="text-[#D4AF37] text-lg font-medium">
            Principais Estatísticas Financeiras
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {/* ROI Card */}
            <Card className="bg-slate-900/50 border-slate-700/50 hover:border-[#D4AF37]/50 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 text-[#D4AF37]">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">ROI Total da Mentoria</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-white">
                      {formatCurrency(stats.financials.totalProfit)}
                    </span>
                    {stats.financials.growthPercent > 0 && (
                      <span className="text-xs text-green-500 font-bold bg-green-500/10 px-1.5 py-0.5 rounded">
                        +{stats.financials.growthPercent}%
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Monthly Revenue Card */}
            <Card className="bg-slate-900/50 border-slate-700/50 hover:border-[#D4AF37]/50 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 text-[#D4AF37]">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Receita Mensal Atual</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-white">
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
            <Card className="bg-slate-900/50 border-slate-700/50 hover:border-[#D4AF37]/50 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 text-[#D4AF37]">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Percentual de Crescimento</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-white">
                      {stats.financials.growthPercent}%
                    </span>
                    <span className="text-xs text-slate-500 font-medium">(Período)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="pt-4 space-y-2">
            <h2 className="text-[#D4AF37] text-lg font-medium">Anotações Privadas do Mentor</h2>
            <MentorNotes existingNotes={stats.notes} />
          </div>

          <div className="pt-4 space-y-2">
            <h2 className="text-[#D4AF37] text-lg font-medium">Histórico de Reuniões</h2>
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
      <div className="h-32 bg-slate-800 rounded-2xl w-full"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-slate-800 rounded-xl"></div>
        <div className="space-y-4">
          <div className="h-24 bg-slate-800 rounded-xl"></div>
          <div className="h-24 bg-slate-800 rounded-xl"></div>
          <div className="h-24 bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}
