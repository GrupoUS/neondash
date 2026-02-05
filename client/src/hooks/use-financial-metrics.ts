import { differenceInCalendarDays, isSameDay, parseISO, subDays } from "date-fns";
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";

export type FinancialTransaction = {
  id: number;
  data: string;
  tipo: "receita" | "despesa";
  valor: number;
};

export function useFinancialMetrics() {
  const { data: transacoes } = trpc.financeiro.transacoes.list.useQuery({});
  const { data: resumo } = trpc.financeiro.transacoes.resumo.useQuery({
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
  });

  const streak = useMemo(() => {
    if (!transacoes || transacoes.length === 0) return 0;

    // Get unique dates with transactions, sorted desc
    const dates = Array.from(new Set(transacoes.map((t: { data: string }) => t.data)))
      .map((d) => parseISO(d))
      .sort((a, b) => b.getTime() - a.getTime());

    if (dates.length === 0) return 0;

    const today = new Date();
    // Normalize to start of day for accurate comparison
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let currentStreak = 0;

    // Check if the most recent transaction was today or yesterday to start the streak
    // If the last transaction was older than yesterday, streak is broken (0)
    const lastTransactionDate = dates[0];
    const diffToLast = differenceInCalendarDays(normalizedToday, lastTransactionDate);

    if (diffToLast > 1) return 0;

    // Iterate backwards to count consecutive days
    // We start checking from the last transaction date
    let checkDate = lastTransactionDate;
    let dateIndex = 0;

    while (dateIndex < dates.length) {
      if (isSameDay(dates[dateIndex], checkDate)) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
        dateIndex++;
      } else {
        // If the next date in history isn't the expected previous day, check if we have another transaction on the same day (duplicate dates already handled by Set but logically safe)
        // Since we handled unique dates, this means there is a gap.
        // Wait, logic: dates are unique.
        // If dates[dateIndex] != checkDate, then we missed a day.
        const diff = differenceInCalendarDays(checkDate, dates[dateIndex]);
        if (diff === 0) {
          // Should not happen with unique set/isSameDay check above, but purely defensive
          dateIndex++;
        } else {
          break; // Gap found
        }
      }
    }

    return currentStreak;
  }, [transacoes]);

  const healthScore = useMemo(() => {
    if (!resumo) return 0;
    const { totalReceitas, totalDespesas } = resumo;

    if (totalReceitas === 0) return 0;

    const margin = (totalReceitas - totalDespesas) / totalReceitas;

    // Score logic:
    // Margin < 0% -> 0
    // Margin 0-10% -> 0-30
    // Margin 10-30% -> 30-80
    // Margin > 30% -> 80-100

    if (margin <= 0) return 0;
    if (margin <= 0.1) return Math.round(margin * 100 * 3); // 10% -> 30
    if (margin <= 0.3) return Math.round(30 + (((margin - 0.1) * 100) / 20) * 50); // 30% -> 80
    return Math.min(100, Math.round(80 + (((margin - 0.3) * 100) / 20) * 20)); // >50% maxes out
  }, [resumo]);

  return {
    streak,
    healthScore,
    isLoading: !transacoes || !resumo,
  };
}
