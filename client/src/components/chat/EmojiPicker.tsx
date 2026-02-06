import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DEFAULT_EMOJIS = [
  "😀",
  "😂",
  "😍",
  "😮",
  "🙏",
  "👍",
  "👏",
  "🔥",
  "🎉",
  "❤️",
  "🤝",
  "✅",
] as const;

export interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
  emojis?: readonly string[];
  className?: string;
}

export function EmojiPicker({
  onSelect,
  disabled = false,
  emojis = DEFAULT_EMOJIS,
  className,
}: EmojiPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("shrink-0", className)}
          disabled={disabled}
          aria-label="Abrir seletor de emojis"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[248px] p-2">
        <div className="grid grid-cols-6 gap-1">
          {emojis.map((emoji) => (
            <Button
              key={emoji}
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-base"
              onClick={() => onSelect(emoji)}
              aria-label={`Selecionar emoji ${emoji}`}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default EmojiPicker;
