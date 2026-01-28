
import { trpc } from "@/lib/trpc";
import { NeonCard } from "@/components/ui/neon-card";
import { Users, DollarSign, Activity, TrendingUp } from "lucide-react";

export function NeonCRM({ mentoradoId }: { mentoradoId?: number }) {
  const { data: stats, isLoading } = trpc.leads.stats.useQuery({ mentoradoId }, { enabled: !!mentoradoId });

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-slate-800 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-mono text-neon-blue flex items-center gap-2">
          <Activity className="w-5 h-5" />
          CRM [DBE]
        </h2>
        <span className="text-xs text-slate-400 font-mono">Real-time</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NeonCard className="p-4 border-neon-blue/20 bg-slate-950/50">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-mono uppercase">Leads Ativos</span>
            <div className="flex items-center gap-2 mt-1">
              <Users className="w-4 h-4 text-neon-blue" />
              <span className="text-2xl font-bold text-white">{stats?.totalAtivos || 0}</span>
            </div>
          </div>
        </NeonCard>

        <NeonCard className="p-4 border-neon-gold/20 bg-slate-950/50">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-mono uppercase">Pipeline (R$)</span>
            <div className="flex items-center gap-2 mt-1">
              <DollarSign className="w-4 h-4 text-neon-gold" />
              <span className="text-2xl font-bold text-white">
                {stats?.valorPipeline?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
              </span>
            </div>
          </div>
        </NeonCard>

        <NeonCard className="p-4 border-purple-500/20 bg-slate-950/50">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-mono uppercase">Conversão</span>
            <div className="flex items-center gap-2 mt-1">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className="text-2xl font-bold text-white">{stats?.taxaConversao?.toFixed(1) || 0}%</span>
            </div>
          </div>
        </NeonCard>

        <NeonCard className="p-4 border-emerald-500/20 bg-slate-950/50">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-mono uppercase">Tempo Médio</span>
            <div className="flex items-center gap-2 mt-1">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="text-2xl font-bold text-white">{stats?.tempoMedioFechamento || 0}d</span>
            </div>
          </div>
        </NeonCard>
      </div>
    </div>
  );
}
