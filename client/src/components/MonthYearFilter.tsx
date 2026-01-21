import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface MonthYearFilterProps {
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

const YEARS = [2024, 2025, 2026];

export default function MonthYearFilter({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
}: MonthYearFilterProps) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-slate-200">
      <Calendar className="w-5 h-5 text-neon-purple" />
      <div className="flex items-center gap-2">
        <Select
          value={selectedMonth.toString()}
          onValueChange={v => onMonthChange(Number(v))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map(month => (
              <SelectItem key={month.value} value={month.value.toString()}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-slate-400">/</span>

        <Select
          value={selectedYear.toString()}
          onValueChange={v => onYearChange(Number(v))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
