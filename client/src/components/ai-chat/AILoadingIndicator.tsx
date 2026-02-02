/**
 * AILoadingIndicator - Animated loading dots for AI chat
 * Inspired by KokonutUI ai-loading component
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AILoadingIndicatorProps {
  className?: string;
  text?: string;
}

export function AILoadingIndicator({ className, text = "Pensando" }: AILoadingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-primary/60"
            animate={{
              y: [0, -6, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">{text}...</span>
    </div>
  );
}
