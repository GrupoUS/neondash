import { Mic, Paperclip, Send, Smile } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TypingPayload {
  isTyping: boolean;
}

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onTypingChange?: (payload: TypingPayload) => void;
  onAttachmentSelect?: (files: FileList | null) => void;
  onEmojiSelect?: (emoji: string) => void;
  onAudioAction?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  minRows?: number;
  maxRows?: number;
  typingDebounceMs?: number;
}

const EMOJI_OPTIONS = ["😀", "😂", "😍", "🙏", "👍", "🔥"] as const;

function calculateRows(value: string, minRows: number, maxRows: number): number {
  const lines = value.split(/\r\n|\r|\n/).length;
  return Math.min(maxRows, Math.max(minRows, lines));
}

export function MessageInput({
  value,
  onChange,
  onSend,
  onTypingChange,
  onAttachmentSelect,
  onEmojiSelect,
  onAudioAction,
  disabled = false,
  placeholder = "Digite sua mensagem...",
  className,
  minRows = 1,
  maxRows = 5,
  typingDebounceMs = 1200,
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  const [rows, setRows] = useState(minRows);

  const canSend = useMemo(() => value.trim().length > 0 && !disabled, [disabled, value]);

  const emitTyping = useCallback(
    (nextTyping: boolean) => {
      if (!onTypingChange) return;
      if (isTypingRef.current === nextTyping) return;

      isTypingRef.current = nextTyping;
      onTypingChange({ isTyping: nextTyping });
    },
    [onTypingChange]
  );

  const clearTypingTimer = useCallback(() => {
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, []);

  const scheduleTypingStop = useCallback(() => {
    clearTypingTimer();
    typingTimerRef.current = window.setTimeout(() => {
      emitTyping(false);
    }, typingDebounceMs);
  }, [clearTypingTimer, emitTyping, typingDebounceMs]);

  const handleValueChange = useCallback(
    (nextValue: string) => {
      onChange(nextValue);
      setRows(calculateRows(nextValue, minRows, maxRows));

      const hasText = nextValue.trim().length > 0;
      if (hasText) {
        emitTyping(true);
        scheduleTypingStop();
      } else {
        clearTypingTimer();
        emitTyping(false);
      }
    },
    [clearTypingTimer, emitTyping, maxRows, minRows, onChange, scheduleTypingStop]
  );

  const handleSend = useCallback(() => {
    if (!canSend) return;

    clearTypingTimer();
    emitTyping(false);
    onSend();
    setRows(minRows);
  }, [canSend, clearTypingTimer, emitTyping, minRows, onSend]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleAttachmentButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onAttachmentSelect?.(event.target.files);
      event.target.value = "";
    },
    [onAttachmentSelect]
  );

  useEffect(() => {
    setRows(calculateRows(value, minRows, maxRows));
  }, [maxRows, minRows, value]);

  useEffect(
    () => () => {
      clearTypingTimer();
      emitTyping(false);
    },
    [clearTypingTimer, emitTyping]
  );

  return (
    <div className={cn("flex items-end gap-2 p-3 border-t border-border/50 bg-card/80", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={handleAttachmentButtonClick}
        disabled={disabled}
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        multiple
        aria-hidden="true"
        tabIndex={-1}
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            disabled={disabled}
          >
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <div className="flex items-center gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <Button
                key={emoji}
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-base"
                onClick={() => onEmojiSelect?.(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Textarea
        value={value}
        onChange={(event) => handleValueChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        className="min-h-[40px] max-h-44 resize-none"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={onAudioAction}
        disabled={disabled}
      >
        <Mic className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="icon"
        className="shrink-0"
        onClick={handleSend}
        disabled={!canSend}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default MessageInput;
