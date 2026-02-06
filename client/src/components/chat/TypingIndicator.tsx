/**
 * Typing Indicator Component
 * Shows animated dots to indicate someone is typing
 * WhatsApp-style "..." animation with optional avatar and sender name
 */

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  /** Whether the typing indicator is visible */
  isVisible: boolean;
  /** Optional sender name to display (e.g., "João está digitando...") */
  senderName?: string;
  /** Label text (defaults to "digitando…") */
  label?: string;
  /** Whether to show avatar next to indicator */
  showAvatar?: boolean;
  /** Avatar URL to display */
  avatarUrl?: string | null;
  /** Auto-hide timeout in milliseconds */
  timeoutMs?: number;
  /** Timestamp of last typing activity */
  lastActivityAt?: Date | string | number | null;
  /** Callback when auto-hide timeout triggers */
  onTimeout?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export type { TypingIndicatorProps };

export function TypingIndicator({
  isVisible,
  senderName,
  label = "digitando…",
  showAvatar = false,
  avatarUrl,
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

  // Display text: senderName if provided, otherwise label
  const displayText = senderName ? `${senderName} está digitando...` : label;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("flex items-center gap-2 justify-start", className)}
      role="status"
      aria-live="polite"
      aria-label={displayText}
    >
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
              <span className="text-xs text-slate-300">
                {senderName?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Typing bubble */}
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

      {/* Label text */}
      <span className="text-xs text-muted-foreground">{displayText}</span>
    </motion.div>
  );
}

export default TypingIndicator;
