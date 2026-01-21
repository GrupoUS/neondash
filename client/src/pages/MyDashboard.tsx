import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Instagram,
  Users,
  Activity,
  Calendar,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function MyDashboard() {
  const [, setLocation] = useLocation();
  const { data: mentorado, isLoading: loadingMentorado } =
    trpc.mentorados.me.useQuery();
  const { data: metricas, isLoading: loadingMetricas } =
    trpc.mentorados.metricas.useQuery({}, { enabled: !!mentorado });

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const { data: feedbackAtual } = trpc.mentorados.feedback.useQuery(
    {
      ano: currentYear,
      mes: currentMonth,
    },
    { enabled: !!mentorado }
  );

  // Redirect to PrimeiroAcesso if no mentorado profile found - must be before any conditional returns
  useEffect(() => {
    if (!loadingMentorado && !mentorado) {
      setLocation("/primeiro-acesso");
    }
  }, [mentorado, loadingMentorado, setLocation]);

  if (loadingMentorado) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple mx-auto mb-4"></div>
            <p className="text-slate-500">Carregando seus dados...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!mentorado) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple mx-auto mb-4"></div>
            <p className="text-slate-500">Redirecionando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loadingMetricas) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple mx-auto mb-4"></div>
            <p className="text-slate-500">Carregando métricas...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const ultimaMetrica = metricas?.[0];
  const chartData =
    metricas
      ?.slice()
      .reverse()
      .map(m => ({
        mes: `${m.mes}/${m.ano}`,
        faturamento: m.faturamento,
        lucro: m.lucro,
        posts: m.postsFeed,
        stories: m.stories,
      })) || [];

  const getMesNome = (m: number) => {
    const meses = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    return meses[m - 1];
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Meu Dashboard
          </h1>
          <p className="text-slate-500 mt-2">
            Acompanhe sua evolução e performance mensal
          </p>
          <Badge className="mt-2" variant="secondary">
            {mentorado.turma === "neon_estrutura"
              ? "Neon Estrutura"
              : "Neon Escala"}
          </Badge>
        </div>

        {/* KPIs do Último Mês */}
        {ultimaMetrica && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Último Registro: {getMesNome(ultimaMetrica.mes)}/
                {ultimaMetrica.ano}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <DollarSign className="w-16 h-16 text-neon-green" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Faturamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 0,
                    }).format(ultimaMetrica.faturamento)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Meta:{" "}
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 0,
                    }).format(mentorado.metaFaturamento)}
                  </p>
                  <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        ultimaMetrica.faturamento >= mentorado.metaFaturamento
                          ? "bg-neon-green"
                          : "bg-yellow-500"
                      )}
                      style={{
                        width: `${Math.min((ultimaMetrica.faturamento / mentorado.metaFaturamento) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Instagram className="w-16 h-16 text-neon-purple" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Conteúdo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div>
                      <div className="text-2xl font-bold text-slate-900">
                        {ultimaMetrica.postsFeed}
                      </div>
                      <p className="text-xs text-slate-400">Posts</p>
                    </div>
                    <div className="border-l border-slate-200"></div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">
                        {ultimaMetrica.stories}
                      </div>
                      <p className="text-xs text-slate-400">Stories</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Activity className="w-16 h-16 text-neon-pink" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Operacional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div>
                      <div className="text-2xl font-bold text-slate-900">
                        {ultimaMetrica.leads}
                      </div>
                      <p className="text-xs text-slate-400">Leads</p>
                    </div>
                    <div className="border-l border-slate-200"></div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">
                        {ultimaMetrica.procedimentos}
                      </div>
                      <p className="text-xs text-slate-400">Procedimentos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Gráficos de Evolução */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Evolução Financeira</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="mes"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickFormatter={value => `R$${value / 1000}k`}
                    />
                    <Tooltip
                      formatter={(value: number) =>
                        new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(value)
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="faturamento"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      name="Faturamento"
                    />
                    <Line
                      type="monotone"
                      dataKey="lucro"
                      stroke="#10b981"
                      strokeWidth={3}
                      name="Lucro"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Evolução de Conteúdo</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="mes"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                    <Tooltip />
                    <Bar
                      dataKey="posts"
                      fill="#8b5cf6"
                      name="Posts"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="stories"
                      fill="#ec4899"
                      name="Stories"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feedback do Mentor */}
        {feedbackAtual && (
          <Card className="border-neon-purple/20 bg-neon-purple/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neon-purple">
                <Lightbulb className="w-5 h-5" />
                Feedback do Mentor - {getMesNome(currentMonth)}/{currentYear}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                  Análise do Mês
                </p>
                <p className="text-sm text-slate-700">
                  {feedbackAtual.analiseMes}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                  Foco para o Próximo Mês
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {feedbackAtual.focoProximoMes}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-100">
                <p className="text-xs font-semibold text-neon-green-dark uppercase mb-2">
                  Sugestão do Mentor
                </p>
                <p className="text-sm text-slate-600 italic">
                  "{feedbackAtual.sugestaoMentor}"
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!metricas ||
          (metricas.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Nenhum dado registrado ainda
                </h3>
                <p className="text-slate-500 mb-4">
                  Comece enviando suas primeiras métricas mensais para
                  acompanhar sua evolução.
                </p>
              </CardContent>
            </Card>
          ))}
      </div>
    </DashboardLayout>
  );
}
