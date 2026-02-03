import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FinancialHistoryChartProps {
  data: Array<{
    ano: number;
    mes: number;
    faturamento: number;
    lucro: number;
  }>;
}

const monthNames = [
  "",
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

export function FinancialHistoryChart({ data }: FinancialHistoryChartProps) {
  // Handle empty data state
  if (data.length === 0) {
    return (
      <Card className="bg-card dark:bg-slate-900/50 border-border dark:border-slate-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-foreground dark:text-slate-200 text-sm font-medium">
            Receita Mensal dos Últimos 12 Meses
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground text-center">
            Nenhum dado financeiro registrado ainda.
            <br />
            <span className="text-sm">
              Preencha suas métricas mensais para visualizar o histórico.
            </span>
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    name: monthNames[d.mes],
    faturamento: d.faturamento,
    lucro: d.lucro,
  }));

  return (
    <Card className="bg-card dark:bg-slate-900/50 border-border dark:border-slate-700 shadow-lg">
      <CardHeader>
        <CardTitle className="text-foreground dark:text-slate-200 text-sm font-medium">
          Receita Mensal dos Últimos 12 Meses
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              tickFormatter={(value) => `R$${value / 1000}k`}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                color: "#e2e8f0",
                borderRadius: "8px",
              }}
              formatter={(value: number) =>
                new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
              }
            />
            <Area
              type="monotone"
              dataKey="faturamento"
              stroke="#D4AF37"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorFaturamento)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
