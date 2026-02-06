import { cn } from "@/lib/utils";

export interface DateSeparatorProps {
  date: Date | string;
  className?: string;
}

function formatDateLabel(value: Date | string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const normalized = date.toDateString();
  if (normalized === today.toDateString()) return "Hoje";
  if (normalized === yesterday.toDateString()) return "Ontem";

  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export function DateSeparator({ date, className }: DateSeparatorProps) {
  const label = formatDateLabel(date);

  return (
    <div className={cn("relative my-4 flex items-center justify-center", className)}>
      <div className="absolute inset-x-0 h-px bg-border/60" />
      <span className="relative rounded-full border border-border/60 bg-background/90 px-3 py-1 text-[11px] font-medium capitalize text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export default DateSeparator;
