import { Target } from "lucide-react";

import { NeonCard } from "@/components/ui/neon-card";
import { trpc } from "@/lib/trpc";

interface GoalCardProps {
  currentRevenue: number;
}

export function GoalCard({ currentRevenue }: GoalCardProps) {
  // Try to fetch goal from diagnostico as fallback for now
  // Ideally this should be a specific setting in Financeiro
  // Fetch goal from mentorado profile
  const { data: mentorado } = trpc.mentorados.me.useQuery();

  const goal = mentorado?.metaFaturamento || 50000; // Default 50k if missing
  const percentage = Math.min(100, Math.round((currentRevenue / (goal * 100)) * 100)); // currentRevenue is in cents

  return (
    <NeonCard className="p-6 h-full flex flex-col justify-between relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 pointer-events-none" />

      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Meta Mensal
          </h3>
          <p className="text-xs text-muted-foreground mt-1 text-nowrap">Faturamento</p>
        </div>
        <Target className="w-5 h-5 text-primary" />
      </div>

      <div className="space-y-2 mt-4 z-10">
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold text-foreground">{percentage}%</span>
          <span className="text-xs text-muted-foreground">
            de{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
              notation: "compact",
            }).format(goal)}
          </span>
        </div>

        {/* Simple Progress Bar */}
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </NeonCard>
  );
}
