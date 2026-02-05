import { Flame } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { NeonCard } from "@/components/ui/neon-card";

interface StreakCardProps {
  streak: number;
  isLoading?: boolean;
}

export function StreakCard({ streak, isLoading }: StreakCardProps) {
  if (isLoading) {
    return (
      <NeonCard className="p-6 h-full flex flex-col justify-between animate-pulse bg-muted/10 min-h-[140px]">
        <div className="h-4 w-24 bg-muted/20 rounded" />
        <div className="h-12 w-16 bg-muted/20 rounded self-end" />
      </NeonCard>
    );
  }

  const isFire = streak > 0;

  return (
    <NeonCard
      className={`p-6 h-full flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
        isFire ? "border-orange-500/30 bg-orange-500/5 hover:border-orange-500/50" : "border-muted"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Ofensiva
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Dias consecutivos registrando</p>
        </div>
        <div
          className={`p-2 rounded-full ${isFire ? "bg-orange-500/20 text-orange-500 animate-pulse" : "bg-muted/20 text-muted-foreground"}`}
        >
          <Flame className={`w-5 h-5 ${isFire ? "fill-orange-500" : ""}`} />
        </div>
      </div>

      <div className="flex items-end justify-between mt-4">
        <div className="flex items-baseline gap-1">
          <span
            className={`text-4xl font-bold ${isFire ? "text-orange-500" : "text-muted-foreground"}`}
          >
            <AnimatedCounter to={streak} duration={1} />
          </span>
          <span className="text-sm font-medium text-muted-foreground">dias</span>
        </div>

        {streak > 3 && (
          <span className="text-xs font-semibold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full">
            Keep on fire! 🔥
          </span>
        )}
      </div>
    </NeonCard>
  );
}
