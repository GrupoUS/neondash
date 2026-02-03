/**
 * Chat Message Bubble Component
 * Displays a single message with direction-based styling and status indicators
 * WhatsApp-inspired design with high contrast colors
 */
import { motion } from "framer-motion";
import { AlertCircle, Check, CheckCheck, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type MessageDirection = "inbound" | "outbound";
type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";
type SimNao = "sim" | "nao";

interface WhatsappMessage {
  id: number;
  mentoradoId: number;
  leadId: number | null;
  phone: string;
  direction: MessageDirection;
  content: string;
  zapiMessageId: string | null;
  status: MessageStatus;
  isFromAi: SimNao | null;
  createdAt: Date | string;
}

interface ChatMessageBubbleProps {
  message: WhatsappMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isOutbound = message.direction === "outbound";
  const isFromAi = message.isFromAi === "sim";

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = () => {
    if (!isOutbound) return null;

    switch (message.status) {
      case "read":
        return <CheckCheck className="w-3.5 h-3.5 text-sky-400" />;
      case "delivered":
        return <CheckCheck className="w-3.5 h-3.5 text-slate-500" />;
      case "sent":
        return <Check className="w-3.5 h-3.5 text-slate-500" />;
      case "failed":
        return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn("flex w-full", isOutbound ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 shadow-md",
          isOutbound
            ? // Outbound: Gold/Amber background with dark text for high contrast
              "bg-gradient-to-br from-amber-500 to-amber-600 text-slate-900 rounded-br-sm"
            : // Inbound: Dark card background with light text
              "bg-slate-800 dark:bg-slate-700/80 text-slate-100 rounded-bl-sm border border-slate-700/50"
        )}
      >
        {/* AI Badge */}
        {isFromAi && isOutbound && (
          <div className="flex items-center gap-1 mb-1.5 text-xs text-slate-700/80">
            <Sparkles className="w-3 h-3" />
            <span className="font-medium">AI</span>
          </div>
        )}

        {/* Message Content */}
        <p
          className={cn(
            "text-sm whitespace-pre-wrap break-words leading-relaxed",
            isOutbound ? "text-slate-900" : "text-slate-100"
          )}
        >
          {message.content}
        </p>

        {/* Timestamp and Status */}
        <div
          className={cn(
            "flex items-center gap-1.5 mt-1.5",
            isOutbound ? "justify-end" : "justify-start"
          )}
        >
          <span
            className={cn(
              "text-[11px] font-medium",
              isOutbound ? "text-slate-700/70" : "text-slate-400"
            )}
          >
            {formatTime(message.createdAt)}
          </span>
          {getStatusIcon()}
        </div>
      </div>
    </motion.div>
  );
}

export default ChatMessageBubble;
