import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { NeonCard } from "@/components/ui/neon-card";
import { trpc } from "@/lib/trpc";

interface DailyBalanceChartProps {
  ano: number;
  mes: number;
}

export function DailyBalanceChart({ ano, mes }: DailyBalanceChartProps) {
  const { data: dailyData, isLoading } = trpc.financeiro.transacoes.dailyFlow.useQuery({
    ano,
    mes,
  });

  if (isLoading) {
    return (
      <NeonCard className="p-6 h-[300px] flex items-center justify-center bg-muted/5 animate-pulse">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </NeonCard>
    );
  }

  const data =
    dailyData?.map((d) => ({
      ...d,
      saldo: d.saldo / 100, // Convert to Reais
      dateObj: parseISO(d.date),
    })) || [];

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: any[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium mb-1">
            {format(parseISO(label || ""), "dd 'de' MMMM", { locale: ptBR })}
          </p>
          <p className="text-sm text-emerald-500 font-semibold">
            Saldo:{" "}
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
              payload[0].value
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <NeonCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Fluxo Diário</h3>
        <p className="text-sm text-muted-foreground">Movimentação líquida por dia</p>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FBbf24" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FBbf24" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border) / 0.5)"
            />
            <XAxis
              dataKey="date"
              tickFormatter={(val) => format(parseISO(val), "dd")}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `R$ ${val}`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="saldo"
              stroke="#FBbf24"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorSaldo)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </NeonCard>
  );
}
