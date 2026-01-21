import DashboardLayout from "@/components/DashboardLayout";
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
import { useAuth } from "@/_core/hooks/useAuth";
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

export default function DashboardComparativo() {
  const { user } = useAuth();
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

  // Prepare data for comparison chart
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

  // Prepare data for radar chart (normalized to 100)
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
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700">
              Perfil não encontrado
            </h2>
            <p className="text-slate-500 mt-2">
              Você precisa ter um perfil de mentorado vinculado para acessar o
              dashboard comparativo.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Dashboard Comparativo
            </h1>
            <p className="text-slate-500 mt-1">
              Compare sua performance com a média da turma{" "}
              {mentorado.turma === "neon_estrutura"
                ? "Neon Estrutura"
                : "Neon Escala"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={String(selectedMonth)}
              onValueChange={v => setSelectedMonth(Number(v))}
            >
              <SelectTrigger className="w-36">
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
              <SelectTrigger className="w-24">
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
          <Card className="border-none shadow-sm">
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700">
                Sem dados para este período
              </h3>
              <p className="text-slate-500 mt-2">
                Você ainda não enviou suas métricas de{" "}
                {MESES[selectedMonth - 1]} {selectedYear}.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-none shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">
                        Participantes
                      </p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        {stats.mentoradosComDados}
                      </p>
                      <p className="text-xs text-slate-400">
                        de {stats.totalMentorados} na turma
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-neon-blue/30" />
                  </div>
                </CardContent>
              </Card>

              {stats.percentiles && (
                <>
                  <Card className="border-none shadow-sm">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider">
                            Seu Ranking
                          </p>
                          <p
                            className={`text-2xl font-bold mt-1 ${getPercentileColor(stats.percentiles.faturamento)}`}
                          >
                            Top {100 - stats.percentiles.faturamento}%
                          </p>
                          <p className="text-xs text-slate-400">
                            em faturamento
                          </p>
                        </div>
                        <Award className="w-8 h-8 text-neon-gold/30" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider">
                            Seu Faturamento
                          </p>
                          <p className="text-2xl font-bold text-slate-900 mt-1">
                            {formatCurrency(stats.userMetrics.faturamento)}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {getTrendIcon(
                              stats.userMetrics.faturamento,
                              stats.turmaAverage!.faturamento
                            )}
                            <span className="text-xs text-slate-400">
                              vs média{" "}
                              {formatCurrency(stats.turmaAverage!.faturamento)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider">
                            Seus Leads
                          </p>
                          <p className="text-2xl font-bold text-slate-900 mt-1">
                            {stats.userMetrics.leads}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {getTrendIcon(
                              stats.userMetrics.leads,
                              stats.turmaAverage!.leads
                            )}
                            <span className="text-xs text-slate-400">
                              vs média {Math.round(stats.turmaAverage!.leads)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Percentile Cards */}
            {stats.percentiles && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: "Faturamento",
                    value: stats.percentiles.faturamento,
                  },
                  { label: "Lucro", value: stats.percentiles.lucro },
                  { label: "Leads", value: stats.percentiles.leads },
                  {
                    label: "Procedimentos",
                    value: stats.percentiles.procedimentos,
                  },
                ].map(item => {
                  const badge = getPercentileBadge(item.value);
                  return (
                    <Card key={item.label} className="border-none shadow-sm">
                      <CardContent className="pt-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                          {item.label}
                        </p>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-lg font-bold ${getPercentileColor(item.value)}`}
                          >
                            Percentil {item.value}
                          </span>
                          <Badge variant="outline" className={badge.color}>
                            {badge.label}
                          </Badge>
                        </div>
                        <Progress value={item.value} className="h-2" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Bar Chart Comparison */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Comparativo com a Turma
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis
                        dataKey="metric"
                        type="category"
                        tick={{ fontSize: 12 }}
                        width={100}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === "voce"
                            ? `R$ ${(value * 1000).toLocaleString()}`
                            : `R$ ${(value * 1000).toLocaleString()}`,
                          name === "voce" ? "Você" : "Média da Turma",
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="voce"
                        name="Você"
                        fill="#1e3a5f"
                        radius={[0, 4, 4, 0]}
                      />
                      <Bar
                        dataKey="turma"
                        name="Média da Turma"
                        fill="#c9a227"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Radar Chart */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Perfil de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fontSize: 10 }}
                      />
                      <Radar
                        name="Você"
                        dataKey="voce"
                        stroke="#1e3a5f"
                        fill="#1e3a5f"
                        fillOpacity={0.5}
                      />
                      <Radar
                        name="Média da Turma"
                        dataKey="turma"
                        stroke="#c9a227"
                        fill="#c9a227"
                        fillOpacity={0.3}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Comparison Table */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Detalhamento por Métrica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          Métrica
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          Você
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          Média Turma
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          Diferença
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          label: "Faturamento",
                          user: stats.userMetrics.faturamento,
                          avg: stats.turmaAverage!.faturamento,
                          format: "currency",
                        },
                        {
                          label: "Lucro",
                          user: stats.userMetrics.lucro,
                          avg: stats.turmaAverage!.lucro,
                          format: "currency",
                        },
                        {
                          label: "Leads",
                          user: stats.userMetrics.leads,
                          avg: stats.turmaAverage!.leads,
                          format: "number",
                        },
                        {
                          label: "Procedimentos",
                          user: stats.userMetrics.procedimentos,
                          avg: stats.turmaAverage!.procedimentos,
                          format: "number",
                        },
                        {
                          label: "Posts Feed",
                          user: stats.userMetrics.postsFeed,
                          avg: stats.turmaAverage!.postsFeed,
                          format: "number",
                        },
                        {
                          label: "Stories",
                          user: stats.userMetrics.stories,
                          avg: stats.turmaAverage!.stories,
                          format: "number",
                        },
                      ].map(row => {
                        const diff = row.user - row.avg;
                        const diffPercent = ((diff / row.avg) * 100).toFixed(1);
                        const isPositive = diff > 0;
                        return (
                          <tr
                            key={row.label}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="py-3 px-4 font-medium text-slate-700">
                              {row.label}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-900">
                              {row.format === "currency"
                                ? formatCurrency(row.user)
                                : row.user}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-500">
                              {row.format === "currency"
                                ? formatCurrency(row.avg)
                                : Math.round(row.avg)}
                            </td>
                            <td
                              className={`py-3 px-4 text-right font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
                            >
                              {isPositive ? "+" : ""}
                              {diffPercent}%
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getTrendIcon(row.user, row.avg)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
