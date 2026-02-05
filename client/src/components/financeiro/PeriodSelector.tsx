import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PeriodType = "mensal" | "trimestral" | "semestral" | "ytd" | "12m" | "24m" | "total";

interface PeriodSelectorProps {
  value: PeriodType;
  onChange: (period: PeriodType) => void;
}

const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: "mensal", label: "Mensal" },
  { value: "trimestral", label: "Trimestre" },
  { value: "semestral", label: "Semestre" },
  { value: "ytd", label: "YTD" },
  { value: "12m", label: "12 meses" },
  { value: "24m", label: "24 meses" },
  { value: "total", label: "Total" },
];

/**
 * Compute date range for a given period type
 */
export function getDateRangeForPeriod(period: PeriodType): { dataInicio: string; dataFim: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // End date is always tomorrow (exclusive upper bound)
  const tomorrow = new Date(year, month, now.getDate() + 1);
  const dataFim = tomorrow.toISOString().split("T")[0];

  let startDate: Date;

  switch (period) {
    case "mensal":
      // First day of current month
      startDate = new Date(year, month, 1);
      break;
    case "trimestral":
      // 3 months ago
      startDate = new Date(year, month - 2, 1);
      break;
    case "semestral":
      // 6 months ago
      startDate = new Date(year, month - 5, 1);
      break;
    case "ytd":
      // January 1st of current year
      startDate = new Date(year, 0, 1);
      break;
    case "12m":
      // 12 months ago
      startDate = new Date(year - 1, month, 1);
      break;
    case "24m":
      // 24 months ago
      startDate = new Date(year - 2, month, 1);
      break;
    case "total":
      // Far past date to get everything
      startDate = new Date(2000, 0, 1);
      break;
    default:
      startDate = new Date(year, month, 1);
  }

  const dataInicio = startDate.toISOString().split("T")[0];

  return { dataInicio, dataFim };
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1.5">
      <CalendarDays className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5 bg-muted/30">
        {PERIOD_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={value === option.value ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs cursor-pointer transition-colors"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
