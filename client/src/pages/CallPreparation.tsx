import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link, useParams } from "wouter";

import DashboardLayout from "@/components/DashboardLayout";
import { EvolutionChart } from "@/components/dashboard/EvolutionChart";
import { AlertsSection } from "@/components/mentor/AlertsSection";
import { CallHeader } from "@/components/mentor/CallHeader";
import { CallNotesForm } from "@/components/mentor/CallNotesForm";
import { ComparativeRadar } from "@/components/mentor/ComparativeRadar";
import { MetricsSummary } from "@/components/mentor/MetricsSummary";
import { PreviousCallNotes } from "@/components/mentor/PreviousCallNotes";
import { TopicSuggestions } from "@/components/mentor/TopicSuggestions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

function CallPreparationSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-5 p-6 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[180px]" />
        </div>
      </div>

      {/* Alerts skeleton */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {["alert-skel-1", "alert-skel-2", "alert-skel-3"].map((id) => (
          <Skeleton key={id} className="h-20 w-full" />
        ))}
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          "metric-skel-1",
          "metric-skel-2",
          "metric-skel-3",
          "metric-skel-4",
          "metric-skel-5",
          "metric-skel-6",
        ].map((id) => (
          <Skeleton key={id} className="h-24 w-full" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-[350px] w-full" />
        <Skeleton className="h-[350px] w-full" />
      </div>

      {/* Notes and suggestions skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>

      {/* Form skeleton */}
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}

export default function CallPreparation() {
  const params = useParams<{ mentoradoId: string }>();
  const mentoradoId = params.mentoradoId ? parseInt(params.mentoradoId, 10) : null;

  const { data, isLoading, error, refetch } = trpc.mentor.getCallPreparation.useQuery(
    { mentoradoId: mentoradoId ?? 0 },
    {
      enabled: !!mentoradoId && !Number.isNaN(mentoradoId),
    }
  );

  if (!mentoradoId || Number.isNaN(mentoradoId)) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <Alert variant="destructive" className="max-w-lg">
            <AlertTitle>ID do mentorado inválido</AlertTitle>
            <AlertDescription>
              O ID fornecido na URL não é válido. Por favor, volte à lista de mentorados e tente
              novamente.
            </AlertDescription>
          </Alert>
          <Link href="/admin/mentorados">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Mentorados
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <CallPreparationSkeleton />
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <Alert variant="destructive" className="max-w-lg">
            <AlertTitle>Erro ao carregar dados</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>
                {error?.message || "Não foi possível carregar os dados de preparação para a call."}
              </p>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Tentar novamente
                </Button>
                <Link href="/admin/mentorados">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate previous metrics for comparison (second-to-last in evolution array)
  const previousMetrics =
    data.evolution.length >= 2
      ? {
          faturamento: data.evolution[data.evolution.length - 2].faturamento,
          leads: data.evolution[data.evolution.length - 2].leads,
          procedimentos: data.evolution[data.evolution.length - 2].procedimentos,
          lucro: 0, // Not available in evolution
          postsFeed: 0,
          stories: 0,
        }
      : null;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Back button */}
        <div className="flex items-center gap-4">
          <Link href="/admin/mentorados">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Preparação para Call
          </h1>
        </div>

        {/* Section 1: Header */}
        <section aria-label="Informações do mentorado">
          <CallHeader mentorado={data.mentorado} lastCallDate={data.lastCallNotes?.dataCall} />
        </section>

        {/* Section 2: Alerts */}
        <section aria-label="Alertas">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Alertas</h2>
          <AlertsSection
            alerts={data.alerts}
            usedFallback={data.alerts.some((a) => a.usedFallback)}
          />
        </section>

        {/* Section 3: Metrics Summary */}
        <section aria-label="Resumo de métricas">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Métricas do Mês Atual
          </h2>
          <MetricsSummary currentMetrics={data.currentMetrics} previousMetrics={previousMetrics} />
        </section>

        {/* Section 4 & 5: Charts */}
        <section aria-label="Gráficos de evolução">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Análise de Performance
          </h2>
          <div className="grid lg:grid-cols-2 gap-6">
            <EvolutionChart mentoradoId={mentoradoId} />
            <ComparativeRadar
              userMetrics={data.comparison?.userMetrics ?? null}
              turmaAverage={data.comparison?.turmaAverage ?? null}
            />
          </div>
        </section>

        {/* Section 6 & 7: Notes and Suggestions */}
        <section aria-label="Notas e sugestões">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Contexto para a Call
          </h2>
          <div className="grid lg:grid-cols-2 gap-6">
            <PreviousCallNotes lastCallNotes={data.lastCallNotes} />
            <TopicSuggestions mentoradoId={mentoradoId} />
          </div>
        </section>

        {/* Section 8: Notes Form */}
        <section aria-label="Formulário de notas">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Registrar Notas
          </h2>
          <CallNotesForm mentoradoId={mentoradoId} />
        </section>
      </div>
    </DashboardLayout>
  );
}
