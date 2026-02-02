/**
 * Chat Message Bubble Component
 * Displays a single message with direction-based styling and status indicators
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
        return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
      case "delivered":
        return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
      case "sent":
        return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
      case "failed":
        return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
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
          "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
          isOutbound
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        {/* AI Badge */}
        {isFromAi && isOutbound && (
          <div className="flex items-center gap-1 mb-1 text-xs opacity-80">
            <Sparkles className="w-3 h-3" />
            <span>AI</span>
          </div>
        )}

        {/* Message Content */}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

        {/* Timestamp and Status */}
        <div
          className={cn(
            "flex items-center gap-1.5 mt-1",
            isOutbound ? "justify-end" : "justify-start"
          )}
        >
          <span className={cn("text-[10px]", isOutbound ? "opacity-70" : "text-muted-foreground")}>
            {formatTime(message.createdAt)}
          </span>
          {getStatusIcon()}
        </div>
      </div>
    </motion.div>
  );
}

export default ChatMessageBubble;
