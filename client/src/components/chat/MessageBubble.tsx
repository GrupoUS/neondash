import {
  Check,
  CheckCheck,
  Clock,
  Copy,
  MessageCircleReply,
  MoreHorizontal,
  Smile,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { MediaPreview } from "@/components/chat/MediaPreview";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type MessageDirection = "inbound" | "outbound";
type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";

export interface MessageReaction {
  emoji: string;
  count?: number;
  users?: string[];
}

export interface MessageMedia {
  type: "image" | "audio" | "video" | "file";
  url?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  durationSeconds?: number | null;
  thumbnailUrl?: string | null;
}

export interface MessageQuote {
  messageId?: number | null;
  senderName?: string | null;
  content?: string | null;
}

export interface MessageBubbleData {
  id: number;
  direction: MessageDirection;
  content: string;
  createdAt: Date | string;
  status: MessageStatus;
  isFromAi?: "sim" | "nao" | null;
  media?: MessageMedia | null;
  quote?: MessageQuote | null;
  reactions?: MessageReaction[];
}

export interface MessageBubbleActionPayload {
  messageId: number;
}

interface MessageBubbleProps {
  message: MessageBubbleData;
  className?: string;
  onReply?: (payload: MessageBubbleActionPayload) => void;
  onReact?: (payload: MessageBubbleActionPayload) => void;
  onCopy?: (payload: MessageBubbleActionPayload) => void;
  onDelete?: (payload: MessageBubbleActionPayload) => void;
}

function formatTime(value: Date | string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderStatusIcon(status: MessageStatus) {
  switch (status) {
    case "read":
      return <CheckCheck className="h-3.5 w-3.5 text-sky-400" />;
    case "delivered":
      return <CheckCheck className="h-3.5 w-3.5 text-slate-500" />;
    case "sent":
      return <Check className="h-3.5 w-3.5 text-slate-500" />;
    case "failed":
      return <TriangleAlert className="h-3.5 w-3.5 text-red-500" />;
    default:
      return <Clock className="h-3.5 w-3.5 text-slate-500" />;
  }
}

export function MessageBubble({
  message,
  className,
  onReply,
  onReact,
  onCopy,
  onDelete,
}: MessageBubbleProps) {
  const isOutbound = message.direction === "outbound";
  const quoteText = message.quote?.content?.trim() || null;

  return (
    <div className={cn("flex w-full", isOutbound ? "justify-end" : "justify-start", className)}>
      <div
        className={cn(
          "group max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm",
          isOutbound
            ? "bg-gradient-to-br from-amber-500 to-amber-600 text-slate-900 rounded-br-sm"
            : "bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700/50"
        )}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            {message.quote && (
              <div className="rounded-md border-l-2 border-current/30 bg-black/15 px-2.5 py-1.5 text-xs">
                <p className="font-medium opacity-90">
                  {message.quote.senderName?.trim() || "Mensagem respondida"}
                </p>
                <p className="truncate opacity-85">{quoteText ?? "Conteúdo indisponível"}</p>
              </div>
            )}

            {message.media && <MediaPreview media={message.media} compact />}

            {message.content.trim().length > 0 && (
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                {message.content}
              </p>
            )}

            {message.reactions && message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {message.reactions.map((reaction) => (
                  <span
                    key={`${message.id}-${reaction.emoji}`}
                    className="inline-flex items-center gap-1 rounded-full border border-current/20 bg-black/10 px-2 py-0.5 text-[11px]"
                  >
                    <span>{reaction.emoji}</span>
                    {reaction.count && reaction.count > 1 ? <span>{reaction.count}</span> : null}
                  </span>
                ))}
              </div>
            )}

            <div
              className={cn(
                "flex items-center gap-1.5",
                isOutbound ? "justify-end" : "justify-start"
              )}
            >
              <span className="text-[11px] opacity-70">{formatTime(message.createdAt)}</span>
              {isOutbound ? renderStatusIcon(message.status) : null}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
                  isOutbound
                    ? "text-slate-900/70 hover:text-slate-900 hover:bg-black/10"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOutbound ? "end" : "start"}>
              <DropdownMenuItem onClick={() => onReply?.({ messageId: message.id })}>
                <MessageCircleReply className="h-4 w-4" />
                Responder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onReact?.({ messageId: message.id })}>
                <Smile className="h-4 w-4" />
                Reagir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopy?.({ messageId: message.id })}>
                <Copy className="h-4 w-4" />
                Copiar
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete?.({ messageId: message.id })}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
