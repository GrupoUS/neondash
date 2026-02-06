/**
 * Typing Indicator Component
 * Shows animated dots to indicate someone is typing
 * WhatsApp-style "..." animation
 */

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  isVisible: boolean;
  label?: string;
  timeoutMs?: number;
  lastActivityAt?: Date | string | number | null;
  onTimeout?: () => void;
  className?: string;
}

export function TypingIndicator({
  isVisible,
  label = "digitando…",
  timeoutMs = 4500,
  lastActivityAt,
  onTimeout,
  className,
}: TypingIndicatorProps) {
  const [isRendered, setIsRendered] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!isVisible) {
      setIsRendered(false);
      return;
    }

    setIsRendered(true);

    const lastActivity =
      typeof lastActivityAt === "number"
        ? lastActivityAt
        : lastActivityAt
          ? new Date(lastActivityAt).getTime()
          : Date.now();

    const elapsed = Math.max(0, Date.now() - lastActivity);
    const remaining = Math.max(200, timeoutMs - elapsed);

    timeoutRef.current = window.setTimeout(() => {
      setIsRendered(false);
      onTimeout?.();
    }, remaining);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isVisible, lastActivityAt, onTimeout, timeoutMs]);

  if (!isRendered) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("flex items-center gap-2 justify-start", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="bg-slate-800 dark:bg-slate-700/80 rounded-2xl rounded-bl-sm px-4 py-3 shadow-md border border-slate-700/50">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-slate-400 rounded-full"
              animate={{
                y: [0, -4, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      <span className="text-xs text-slate-400">{label}</span>
    </motion.div>
  );
}

export default TypingIndicator;
