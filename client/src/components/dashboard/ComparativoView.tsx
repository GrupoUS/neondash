import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Target,
  Award,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function ComparativoView() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { data: mentorado } = trpc.mentorados.me.useQuery();
  const { data: stats, isLoading } = trpc.mentorados.comparativeStats.useQuery(
    { ano: selectedYear, mes: selectedMonth },
    { enabled: !!mentorado }
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 75) return "text-green-600";
    if (percentile >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getPercentileBadge = (percentile: number) => {
    if (percentile >= 90)
      return {
        label: "Top 10%",
        color: "bg-green-100 text-green-700 border-green-300",
      };
    if (percentile >= 75)
      return {
        label: "Top 25%",
        color: "bg-emerald-100 text-emerald-700 border-emerald-300",
      };
    if (percentile >= 50)
      return {
        label: "Acima da Média",
        color: "bg-amber-100 text-amber-700 border-amber-300",
      };
    if (percentile >= 25)
      return {
        label: "Abaixo da Média",
        color: "bg-orange-100 text-orange-700 border-orange-300",
      };
    return {
      label: "Precisa Melhorar",
      color: "bg-red-100 text-red-700 border-red-300",
    };
  };

  const getTrendIcon = (userValue: number, avgValue: number) => {
    const diff = ((userValue - avgValue) / avgValue) * 100;
    if (diff > 5) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (diff < -5) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const comparisonData =
    stats?.userMetrics && stats?.turmaAverage
      ? [
          {
            metric: "Faturamento",
            voce: stats.userMetrics.faturamento / 1000,
            turma: stats.turmaAverage.faturamento / 1000,
          },
          {
            metric: "Lucro",
            voce: stats.userMetrics.lucro / 1000,
            turma: stats.turmaAverage.lucro / 1000,
          },
          {
            metric: "Leads",
            voce: stats.userMetrics.leads,
            turma: stats.turmaAverage.leads,
          },
          {
            metric: "Procedimentos",
            voce: stats.userMetrics.procedimentos,
            turma: stats.turmaAverage.procedimentos,
          },
        ]
      : [];

  const radarData =
    stats?.userMetrics && stats?.turmaAverage
      ? [
          {
            subject: "Faturamento",
            voce: Math.min(
              (stats.userMetrics.faturamento /
                (stats.turmaAverage.faturamento * 1.5)) *
                100,
              100
            ),
            turma: 66.67,
          },
          {
            subject: "Lucro",
            voce: Math.min(
              (stats.userMetrics.lucro / (stats.turmaAverage.lucro * 1.5)) *
                100,
              100
            ),
            turma: 66.67,
          },
          {
            subject: "Leads",
            voce: Math.min(
              (stats.userMetrics.leads / (stats.turmaAverage.leads * 1.5)) *
                100,
              100
            ),
            turma: 66.67,
          },
          {
            subject: "Procedimentos",
            voce: Math.min(
              (stats.userMetrics.procedimentos /
                (stats.turmaAverage.procedimentos * 1.5)) *
                100,
              100
            ),
            turma: 66.67,
          },
          {
            subject: "Posts",
            voce: Math.min(
              (stats.userMetrics.postsFeed /
                (stats.turmaAverage.postsFeed * 1.5)) *
                100,
              100
            ),
            turma: 66.67,
          },
          {
            subject: "Stories",
            voce: Math.min(
              (stats.userMetrics.stories / (stats.turmaAverage.stories * 1.5)) *
                100,
              100
            ),
            turma: 66.67,
          },
        ]
      : [];

  if (!mentorado) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-50 rounded-lg">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h2 className="text-lg font-semibold text-slate-700">
            Perfil não encontrado
          </h2>
          <p className="text-slate-500">
            Você precisa ter um perfil de mentorado vinculado para acessar o
            dashboard comparativo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Dashboard Comparativo
          </h2>
          <p className="text-sm text-slate-500">
            Compare sua performance com a média da turma{" "}
            {mentorado.turma === "neon_estrutura"
              ? "Estrutura"
              : "Escala"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(selectedMonth)}
            onValueChange={v => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((mes, idx) => (
                <SelectItem key={idx} value={String(idx + 1)}>
                  {mes}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(selectedYear)}
            onValueChange={v => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-24 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">
          Carregando dados comparativos...
        </div>
      ) : !stats?.userMetrics ? (
        <Card className="border-none shadow-sm bg-slate-50">
          <CardContent className="py-8 text-center">
            <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-slate-700">
              Sem dados para este período
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Envie suas métricas de {MESES[selectedMonth - 1]} para ver o
              comparativo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm">
              <CardContent className="pt-4 p-4">
                <div className="flex items-center justify-between mb-1">
                   <span className="text-xs text-slate-500 uppercase tracking-wider">Ranking</span>
                   <Award className="w-4 h-4 text-neon-gold/50" />
                </div>
                {stats.percentiles && (
                  <>
                    <div className={`text-xl font-bold ${getPercentileColor(stats.percentiles.faturamento)}`}>
                       Top {100 - stats.percentiles.faturamento}%
                    </div>
                    <div className="text-xs text-slate-400 mt-1">em faturamento</div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
                <CardContent className="pt-4 p-4">
                  <div className="flex items-center justify-between mb-1">
                     <span className="text-xs text-slate-500 uppercase tracking-wider">Faturamento</span>
                     <TrendingUp className="w-4 h-4 text-neon-blue/50" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {formatCurrency(stats.userMetrics.faturamento)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    {getTrendIcon(stats.userMetrics.faturamento, stats.turmaAverage!.faturamento)}
                     vs média {formatCurrency(stats.turmaAverage!.faturamento)}
                  </div>
                </CardContent>
            </Card>
            
            <Card className="border-none shadow-sm">
                <CardContent className="pt-4 p-4">
                  <div className="flex items-center justify-between mb-1">
                     <span className="text-xs text-slate-500 uppercase tracking-wider">Leads</span>
                     <Users className="w-4 h-4 text-neon-blue/50" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {stats.userMetrics.leads}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    {getTrendIcon(stats.userMetrics.leads, stats.turmaAverage!.leads)}
                     vs média {Math.round(stats.turmaAverage!.leads)}
                  </div>
                </CardContent>
            </Card>

             <Card className="border-none shadow-sm">
                <CardContent className="pt-4 p-4">
                  <div className="flex items-center justify-between mb-1">
                     <span className="text-xs text-slate-500 uppercase tracking-wider">Participantes</span>
                     <BarChart3 className="w-4 h-4 text-slate-300" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {stats.mentoradosComDados} <span className="text-sm font-normal text-slate-400">/ {stats.totalMentorados}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                     dados contabilizados
                  </div>
                </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Comparativo Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={comparisonData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} hide />
                    <YAxis
                      dataKey="metric"
                      type="category"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      width={80}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        fontSize: '12px',
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        color: "hsl(var(--foreground))"
                      }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    <Bar
                      dataKey="voce"
                      name="Você"
                      fill="var(--color-neon-blue)"
                      radius={[0, 4, 4, 0]}
                      barSize={12}
                    />
                    <Bar
                      dataKey="turma"
                      name="Média"
                      fill="var(--color-neon-gold)"
                      radius={[0, 4, 4, 0]}
                      barSize={12}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Radar de Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData} outerRadius={80}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      name="Você"
                      dataKey="voce"
                      stroke="var(--color-neon-blue)"
                      fill="var(--color-neon-blue)"
                      fillOpacity={0.4}
                    />
                    <Radar
                      name="Média"
                      dataKey="turma"
                      stroke="var(--color-neon-gold)"
                      fill="var(--color-neon-gold)"
                      fillOpacity={0.2}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
