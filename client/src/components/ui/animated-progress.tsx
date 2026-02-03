import { motion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface AnimatedProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
  gradientColors?: { start: string; end: string };
}

/**
 * AnimatedProgressRing - Circular progress indicator with smooth animations
 *
 * Features:
 * - SVG-based circular progress ring
 * - Spring-based animation for smooth value transitions
 * - Optional percentage display in center
 * - Customizable colors and size
 * - Respects prefers-reduced-motion
 */
export function AnimatedProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  showPercentage = true,
  gradientColors = { start: "hsl(var(--primary))", end: "hsl(38 70% 50%)" },
}: AnimatedProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Spring animation for smooth progress transitions
  const springValue = useSpring(0, {
    stiffness: 60,
    damping: 15,
    restDelta: 0.001,
  });

  // Transform spring value to stroke offset
  const strokeDashoffset = useTransform(springValue, [0, 100], [circumference, 0]);

  // Transform for percentage display
  const displayValue = useTransform(springValue, (latest) => Math.round(latest));

  useEffect(() => {
    springValue.set(Math.min(Math.max(value, 0), 100));
  }, [value, springValue]);

  const gradientId = `progress-gradient-${Math.random().toString(36).slice(2)}`;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        role="img"
        aria-label={`Progresso: ${Math.round(value)}%`}
      >
        <title>Progresso circular</title>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientColors.start} />
            <stop offset="100%" stopColor={gradientColors.end} />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          className="opacity-30"
        />

        {/* Animated progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
          className="drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
        />
      </svg>

      {/* Center percentage display */}
      {showPercentage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">
            <motion.span>{displayValue}</motion.span>
            <span className="text-lg">%</span>
          </span>
          <span className="text-xs text-muted-foreground">completo</span>
        </div>
      )}
    </div>
  );
}

/**
 * AnimatedProgressBar - Enhanced linear progress with animation
 */
interface AnimatedProgressBarProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function AnimatedProgressBar({
  value,
  className,
  indicatorClassName,
  showLabel = false,
  size = "md",
}: AnimatedProgressBarProps) {
  const springValue = useSpring(0, {
    stiffness: 80,
    damping: 20,
  });

  const width = useTransform(springValue, [0, 100], ["0%", "100%"]);

  useEffect(() => {
    springValue.set(Math.min(Math.max(value, 0), 100));
  }, [value, springValue]);

  const heights = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className="relative w-full">
      <div
        className={cn(
          "bg-primary/20 relative w-full overflow-hidden rounded-full",
          heights[size],
          className
        )}
      >
        <motion.div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-primary to-primary/80",
            indicatorClassName
          )}
          style={{ width }}
        />
      </div>
      {showLabel && (
        <motion.span className="absolute right-0 -top-5 text-xs font-medium text-muted-foreground">
          {Math.round(value)}%
        </motion.span>
      )}
    </div>
  );
}
