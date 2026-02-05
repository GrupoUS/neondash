import {
  ArrowDownRight,
  ArrowUpRight,
  Lightbulb,
  type LucideIcon,
  Minus,
  Sparkles,
} from "lucide-react";
import { NeonCard } from "@/components/ui/neon-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  trend?: "up" | "down" | "neutral";
  description?: string;
  isLoading?: boolean;
  className?: string;
}

const trendConfig = {
  up: {
    icon: ArrowUpRight,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  down: {
    icon: ArrowDownRight,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  neutral: {
    icon: Minus,
    color: "text-muted-foreground",
    bg: "bg-muted/50",
  },
};

export function InsightCard({
  icon: Icon,
  title,
  value,
  trend,
  description,
  isLoading = false,
  className,
}: InsightCardProps) {
  const trendStyle = trend ? trendConfig[trend] : null;
  const TrendIcon = trendStyle?.icon;

  if (isLoading) {
    return (
      <NeonCard className={cn("p-4 h-full", className)}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-full" />
        </div>
      </NeonCard>
    );
  }

  return (
    <NeonCard
      className={cn(
        "p-4 h-full relative overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5",
        className
      )}
    >
      {/* Background Sparkle */}
      <div className="absolute top-1 right-1 opacity-[0.04] pointer-events-none">
        <Sparkles className="w-16 h-16 text-neon-gold" />
      </div>

      <div className="flex flex-col gap-2 z-10 relative">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </span>
          </div>
          {TrendIcon && trendStyle && (
            <div className={cn("p-1 rounded-full", trendStyle.bg)}>
              <TrendIcon className={cn("h-3.5 w-3.5", trendStyle.color)} />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-foreground tracking-tight">{value}</span>
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </NeonCard>
  );
}

/**
 * Placeholder insight card for when no data is available
 */
export function InsightCardPlaceholder({ title }: { title: string }) {
  return (
    <NeonCard className="p-4 h-full flex flex-col items-center justify-center text-center gap-2 opacity-60">
      <Lightbulb className="h-6 w-6 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{title}</span>
      <span className="text-[10px] text-muted-foreground/60">Sem dados suficientes</span>
    </NeonCard>
  );
}
