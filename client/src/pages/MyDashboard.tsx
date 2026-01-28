import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "wouter";
import { useEffect } from "react";
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
import { NeonCard, NeonCardContent, NeonCardHeader, NeonCardTitle } from "@/components/ui/neon-card";

export default function MyDashboard() {
  const [, setLocation] = useLocation();
  const { data: mentorado, isLoading: loadingMentorado } =
    trpc.mentorados.me.useQuery();
  const { data: metricas, isLoading: loadingMetricas } =
    trpc.mentorados.metricas.useQuery(undefined, { enabled: !!mentorado });

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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando seus dados...</p>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
            <p className="text-muted-foreground">Redirecionando...</p>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando métricas...</p>
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
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neon-blue-dark tracking-tight">
            Meu Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe sua evolução e performance mensal
          </p>
          <Badge className="mt-2 bg-neon-blue-dark hover:bg-neon-blue text-white mr-2" variant="secondary">
            {mentorado.turma === "neon_estrutura"
              ? "Neon Estrutura"
              : "Neon Escala"}
          </Badge>
        </div>

        {/* KPIs do Último Mês */}
        {ultimaMetrica && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-neon-blue-dark border-l-4 border-neon-gold pl-3">
                {getMesNome(ultimaMetrica.mes)}/{ultimaMetrica.ano}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <NeonCard variant="glow" className="group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <DollarSign className="w-16 h-16 text-neon-gold" />
                </div>
                <NeonCardHeader className="pb-2">
                  <NeonCardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Faturamento
                  </NeonCardTitle>
                </NeonCardHeader>
                <NeonCardContent>
                  <div className="text-3xl font-bold text-neon-blue-dark">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 0,
                    }).format(ultimaMetrica.faturamento)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Meta:{" "}
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 0,
                    }).format(mentorado.metaFaturamento)}
                  </p>
                  <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        ultimaMetrica.faturamento >= mentorado.metaFaturamento
                          ? "bg-neon-green"
                          : "bg-neon-gold"
                      )}
                      style={{
                        width: `${Math.min((ultimaMetrica.faturamento / mentorado.metaFaturamento) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </NeonCardContent>
              </NeonCard>

              <NeonCard className="group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Instagram className="w-16 h-16 text-neon-blue" />
                </div>
                <NeonCardHeader className="pb-2">
                  <NeonCardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Conteúdo
                  </NeonCardTitle>
                </NeonCardHeader>
                <NeonCardContent>
                  <div className="flex gap-4">
                    <div>
                      <div className="text-2xl font-bold text-neon-blue-dark">
                        {ultimaMetrica.postsFeed}
                      </div>
                      <p className="text-xs text-muted-foreground">Posts</p>
                    </div>
                    <div className="border-l border-border"></div>
                    <div>
                      <div className="text-2xl font-bold text-neon-blue-dark">
                        {ultimaMetrica.stories}
                      </div>
                      <p className="text-xs text-muted-foreground">Stories</p>
                    </div>
                  </div>
                </NeonCardContent>
              </NeonCard>

              <NeonCard className="group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Activity className="w-16 h-16 text-neon-blue-dark" />
                </div>
                <NeonCardHeader className="pb-2">
                  <NeonCardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Operacional
                  </NeonCardTitle>
                </NeonCardHeader>
                <NeonCardContent>
                  <div className="flex gap-4">
                    <div>
                      <div className="text-2xl font-bold text-neon-blue-dark">
                        {ultimaMetrica.leads}
                      </div>
                      <p className="text-xs text-muted-foreground">Leads</p>
                    </div>
                    <div className="border-l border-border"></div>
                    <div>
                      <div className="text-2xl font-bold text-neon-blue-dark">
                        {ultimaMetrica.procedimentos}
                      </div>
                      <p className="text-xs text-muted-foreground">Procedimentos</p>
                    </div>
                  </div>
                </NeonCardContent>
              </NeonCard>
            </div>
          </>
        )}

        {/* Gráficos de Evolução */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <NeonCard>
              <NeonCardHeader>
                <NeonCardTitle className="text-lg">Evolução Financeira</NeonCardTitle>
              </NeonCardHeader>
              <NeonCardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="mes"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickFormatter={value => `R$${value / 1000}k`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
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
                      stroke="#20445b" /* neon-blue-medium */
                      strokeWidth={3}
                      dot={{ fill: "#20445b", r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Faturamento"
                    />
                    <Line
                      type="monotone"
                      dataKey="lucro"
                      stroke="#ac9469" /* neon-gold */
                      strokeWidth={3}
                      dot={{ fill: "#ac9469", r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Lucro"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </NeonCardContent>
            </NeonCard>

            <NeonCard>
              <NeonCardHeader>
                <NeonCardTitle className="text-lg">Evolução de Conteúdo</NeonCardTitle>
              </NeonCardHeader>
              <NeonCardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="mes"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                       contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="posts"
                      fill="#20445b"
                      name="Posts"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="stories"
                      fill="#ac9469"
                      name="Stories"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </NeonCardContent>
            </NeonCard>
          </div>
        )}

        {/* Feedback do Mentor */}
        {feedbackAtual && (
          <NeonCard variant="glass" className="border-neon-blue/20 bg-neon-blue/5">
            <NeonCardHeader>
              <NeonCardTitle className="flex items-center gap-2 text-neon-blue text-lg">
                <Lightbulb className="w-5 h-5 text-neon-gold" />
                Feedback do Mentor - {getMesNome(currentMonth)}/{currentYear}
              </NeonCardTitle>
            </NeonCardHeader>
            <NeonCardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Análise do Mês
                </p>
                <p className="text-sm text-foreground">
                  {feedbackAtual.analiseMes}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Foco para o Próximo Mês
                </p>
                <p className="text-sm font-medium text-neon-blue-dark">
                  {feedbackAtual.focoProximoMes}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-neon-border/50 shadow-sm">
                <p className="text-xs font-semibold text-neon-blue uppercase mb-2">
                  Sugestão do Mentor
                </p>
                <p className="text-sm text-slate-600 italic">
                  "{feedbackAtual.sugestaoMentor}"
                </p>
              </div>
            </NeonCardContent>
          </NeonCard>
        )}

        {/* Empty State */}
        {!metricas ||
          (metricas.length === 0 && (
            <NeonCard className="border-dashed border-neon-border/50">
              <NeonCardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neon-blue-dark mb-2">
                  Nenhum dado registrado ainda
                </h3>
                <p className="text-muted-foreground mb-4">
                  Comece enviando suas primeiras métricas mensais para
                  acompanhar sua evolução.
                </p>
              </NeonCardContent>
            </NeonCard>
          ))}
      </div>
    </DashboardLayout>
  );
}
