import { MessageCircle, Pin, User } from "lucide-react";
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
  isPinned?: boolean;
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
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  // Less than 1 minute ago
  if (diffMins < 1) {
    return "Agora";
  }

  // Less than 1 hour ago
  if (diffMins < 60) {
    return `${diffMins} min`;
  }

  // Today - show time
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Ontem";
  }

  // Older - show date
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
    ? "Digitando..."
    : (conversation.lastMessage ?? "Sem mensagens");

  // Truncate preview to ~50 characters
  const truncatedPreview = previewText.length > 50 ? `${previewText.slice(0, 50)}...` : previewText;

  return (
    <button
      type="button"
      onClick={() => onClick?.(conversation.phone)}
      aria-label={`Conversa com ${displayName}${conversation.unreadCount ? `, ${conversation.unreadCount} mensagens não lidas` : ""}`}
      aria-pressed={isSelected}
      className={cn(
        "w-full px-4 py-3 flex items-center gap-3 transition-colors text-left relative",
        "hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected &&
          "bg-primary/10 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary",
        className
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12 border border-border/60">
          <AvatarImage src={conversation.avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {conversation.name ? (
              getInitials(conversation.name, conversation.phone)
            ) : (
              <User className="h-5 w-5" />
            )}
          </AvatarFallback>
        </Avatar>

        {/* Online indicator - 8x8px green badge */}
        {conversation.isOnline && (
          <span
            className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background"
            title="Contato online"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {conversation.isPinned && <Pin className="h-3 w-3 text-muted-foreground shrink-0" />}
            <span
              className={cn(
                "text-lg truncate",
                conversation.unreadCount > 0 ? "font-semibold" : "font-medium"
              )}
            >
              {displayName}
            </span>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground shrink-0">{timestamp}</span>}
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={cn(
              "text-sm truncate",
              conversation.isTyping ? "text-emerald-500 font-medium" : "text-muted-foreground"
            )}
          >
            {conversation.isTyping ? (
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {previewText}
              </span>
            ) : (
              truncatedPreview
            )}
          </p>

          {/* Unread badge - 20x20px red with pulse animation */}
          {conversation.unreadCount > 0 && (
            <Badge className="h-5 min-w-5 px-1.5 text-xs tabular-nums bg-destructive text-destructive-foreground animate-pulse">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

export default ConversationItem;
