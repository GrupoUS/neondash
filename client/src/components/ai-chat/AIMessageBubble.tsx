/**
 * AIMessageBubble - Chat message bubble with avatar
 * Supports user and assistant roles with distinct styling
 */

import { Bot, User } from "lucide-react";
import { Streamdown } from "streamdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AIMessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  className?: string;
}

export function AIMessageBubble({ role, content, timestamp, className }: AIMessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse", className)}>
      <Avatar className="h-7 w-7 flex-shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs",
            isUser ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"
          )}
        >
          {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        )}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
            <Streamdown>{content}</Streamdown>
          </div>
        )}

        {timestamp && (
          <p
            className={cn(
              "mt-1 text-[10px]",
              isUser ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {timestamp.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}
