/**
 * AIPromptInput - KokonutUI-inspired AI chat input
 * Features auto-resize, send button, loading state
 */

import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AIPromptInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function AIPromptInput({
  onSend,
  isLoading = false,
  placeholder = "Digite sua mensagem...",
  className,
}: AIPromptInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
  });

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    onSend(trimmed);
    setValue("");

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={cn(
        "flex items-end gap-2 rounded-xl border border-border/50 bg-background/80 p-2 backdrop-blur-sm",
        "focus-within:ring-1 focus-within:ring-primary/30 transition-all",
        className
      )}
    >
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className={cn(
          "flex-1 min-h-[36px] max-h-[120px] resize-none border-0 bg-transparent p-1.5",
          "focus-visible:ring-0 focus-visible:ring-offset-0",
          "placeholder:text-muted-foreground/60 text-sm"
        )}
        rows={1}
      />

      <Button
        type="button"
        size="icon"
        onClick={handleSubmit}
        disabled={!value.trim() || isLoading}
        className={cn(
          "h-8 w-8 shrink-0 rounded-lg",
          "bg-gradient-to-br from-primary to-primary/80",
          "hover:from-primary/90 hover:to-primary/70",
          "disabled:opacity-40"
        )}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </div>
  );
}
