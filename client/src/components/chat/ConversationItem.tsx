import { MessageCircle, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ConversationItemData {
  phone: string;
  name: string | null;
  avatarUrl?: string | null;
  lastMessage: string | null;
  lastMessageAt: Date | string | null;
  unreadCount: number;
  isOnline?: boolean;
  isTyping?: boolean;
}

interface ConversationItemProps {
  conversation: ConversationItemData;
  isSelected?: boolean;
  onClick?: (phone: string) => void;
  className?: string;
}

function formatTimestamp(value: Date | string | null): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function getInitials(name: string | null, phone: string): string {
  if (name && name.trim().length > 0) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  return phone.slice(-2).toUpperCase();
}

export function ConversationItem({
  conversation,
  isSelected = false,
  onClick,
  className,
}: ConversationItemProps) {
  const displayName = conversation.name || conversation.phone;
  const timestamp = formatTimestamp(conversation.lastMessageAt);
  const previewText = conversation.isTyping
    ? "digitando…"
    : (conversation.lastMessage ?? "Sem mensagens");

  return (
    <button
      type="button"
      onClick={() => onClick?.(conversation.phone)}
      className={cn(
        "w-full px-4 py-3 flex items-center gap-3 transition-colors text-left",
        "hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "bg-accent",
        className
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10 border border-border/60">
          <AvatarImage src={conversation.avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {conversation.name ? (
              getInitials(conversation.name, conversation.phone)
            ) : (
              <User className="h-4 w-4" />
            )}
          </AvatarFallback>
        </Avatar>

        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background",
            conversation.isOnline ? "bg-emerald-500" : "bg-muted-foreground/50"
          )}
          title={conversation.isOnline ? "Contato online" : "Contato offline"}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-sm truncate">{displayName}</span>
          {timestamp && <span className="text-xs text-muted-foreground shrink-0">{timestamp}</span>}
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={cn(
              "text-xs truncate",
              conversation.isTyping ? "text-emerald-500 font-medium" : "text-muted-foreground"
            )}
          >
            {conversation.isTyping ? (
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {previewText}
              </span>
            ) : (
              previewText
            )}
          </p>

          {conversation.unreadCount > 0 && (
            <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs tabular-nums">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

export default ConversationItem;
