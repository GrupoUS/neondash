import { Activity, Camera, FileText, Sparkles, TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PatientStatsCardProps {
  patientId?: number;
  stats: {
    totalProcedimentos: number;
    totalFotos: number;
    totalDocumentos: number;
    ultimoProcedimento: Date | null;
  };
  procedureHistory?: Array<{
    month: string;
    count: number;
    valor: number;
  }>;
}

export function PatientStatsCard({ stats, procedureHistory = [] }: PatientStatsCardProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value / 100);

  const statItems = [
    {
      label: "Procedimentos",
      value: stats.totalProcedimentos,
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Fotos",
      value: stats.totalFotos,
      icon: Camera,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Documentos",
      value: stats.totalDocumentos,
      icon: FileText,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  const totalGasto = procedureHistory.reduce((acc, m) => acc + m.valor, 0);

  return (
    <Card className="border-primary/10 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Resumo do Paciente
        </CardTitle>
        <CardDescription>Atividades e histórico de procedimentos</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {statItems.map((item) => (
            <div
              key={item.label}
              className={`flex flex-col items-center justify-center p-4 rounded-lg ${item.bgColor} transition-transform hover:scale-105`}
            >
              <item.icon className={`h-6 w-6 ${item.color} mb-2`} />
              <span className="text-2xl font-bold">{item.value}</span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Revenue Total */}
        {totalGasto > 0 && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Investido</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(totalGasto)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Procedure History Chart */}
        {procedureHistory.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Histórico de Procedimentos
            </h4>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={procedureHistory}>
                  <defs>
                    <linearGradient id="colorProcedures" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload?.[0]) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover text-popover-foreground border rounded-lg p-2 shadow-lg">
                            <p className="font-medium">{data.month}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.count} procedimento(s)
                            </p>
                            <p className="text-sm text-primary">{formatCurrency(data.valor)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorProcedures)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Last Procedure */}
        {stats.ultimoProcedimento && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-1">Último Procedimento</p>
            <p className="font-medium">
              {new Date(stats.ultimoProcedimento).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        )}

        {/* Empty State */}
        {stats.totalProcedimentos === 0 &&
          stats.totalFotos === 0 &&
          stats.totalDocumentos === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma atividade registrada ainda</p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
