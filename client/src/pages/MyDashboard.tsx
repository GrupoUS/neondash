import { AlertCircle, TrendingUp } from "lucide-react";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { AtividadesContent } from "@/components/dashboard/AtividadesContent";
import { ClassList } from "@/components/dashboard/ClassList";
import { ComparativoView } from "@/components/dashboard/ComparativoView";
import { DiagnosticoForm } from "@/components/dashboard/DiagnosticoForm";
import { EvolucaoView } from "@/components/dashboard/EvolucaoView";
import { NeonCRM } from "@/components/dashboard/NeonCRM";
import { NotificationsView } from "@/components/dashboard/NotificationsView";
import { PlaybookView } from "@/components/dashboard/PlaybookView";
import { SubmitMetricsForm } from "@/components/dashboard/SubmitMetricsForm";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FloatingDock } from "@/components/ui/floating-dock";
import { NeonCard } from "@/components/ui/neon-card";
import {
  NeonTabs,
  NeonTabsContent,
  NeonTabsList,
  NeonTabsTrigger,
} from "@/components/ui/neon-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { calcularProgresso } from "@/data/atividades-data";
// import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { trpc } from "@/lib/trpc";

export default function MyDashboard() {
  const _isMobile = useIsMobile();
  const [selectedMentoradoId, setSelectedMentoradoId] = useState<string>("");

  // 1. Get current user to check role
  const { data: user } = trpc.auth.me.useQuery();
  const isAdmin = user?.role === "admin";

  // 2. If admin, fetch all mentorados for the selector
  const { data: allMentorados } = trpc.mentorados.list.useQuery(undefined, {
    enabled: isAdmin,
  });

  // 3. Determine which mentorado to view
  // If not admin -> fetch "me"
  const {
    data: mentoradoMe,
    isLoading: isLoadingMe,
    error: errorMe,
  } = trpc.mentorados.me.useQuery(undefined, {
    enabled: !isAdmin,
    retry: false,
  });

  // If admin and selected -> fetch by ID
  const {
    data: mentoradoById,
    isLoading: isLoadingById,
    error: errorById,
  } = trpc.mentorados.getById.useQuery(
    { id: parseInt(selectedMentoradoId, 10) },
    { enabled: isAdmin && !!selectedMentoradoId, retry: false }
  );

  const currentMentorado = isAdmin ? mentoradoById : mentoradoMe;
  const isLoading = isAdmin ? (selectedMentoradoId ? isLoadingById : !allMentorados) : isLoadingMe;
  const error = isAdmin ? errorById : errorMe;

  // Derived ID for child components
  const targetMentoradoId =
    isAdmin && selectedMentoradoId ? parseInt(selectedMentoradoId, 10) : currentMentorado?.id;

  // 4. Progress queries for atividades (always call both, use enabled to control which fetches)
  const progressQueryMe = trpc.atividades.getProgress.useQuery(undefined, {
    enabled: !isAdmin,
  });
  const progressQueryById = trpc.atividades.getProgressById.useQuery(
    { mentoradoId: parseInt(selectedMentoradoId || "0", 10) },
    { enabled: isAdmin && !!selectedMentoradoId }
  );

  const progressData =
    isAdmin && selectedMentoradoId ? progressQueryById.data : progressQueryMe.data;
  const progressLoading =
    isAdmin && selectedMentoradoId ? progressQueryById.isLoading : progressQueryMe.isLoading;

  const {
    percentage: atividadesPercentage,
    completed: atividadesCompleted,
    total: atividadesTotal,
  } = calcularProgresso(
    Object.fromEntries(Object.entries(progressData ?? {}).map(([k, v]) => [k, v.completed]))
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || (!currentMentorado && !isAdmin)) {
    // If not admin and no mentorado, show restricted access
    return (
      <DashboardLayout>
        <Alert
          variant="destructive"
          className="bg-destructive/10 border-destructive/20 text-destructive"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Restrito</AlertTitle>
          <AlertDescription>
            Este dashboard é exclusivo para mentorados oficiais. Se você é um mentorado e está vendo
            esta mensagem, entre em contato com o suporte.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isAdmin ? "Visão Admin" : "Meu Dashboard"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin
                ? "Selecione um mentorado para visualizar os dados"
                : "Acompanhe seu progresso e metas em tempo real"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <div className="relative">
                <FloatingDock
                  items={
                    allMentorados?.map((m) => ({
                      id: m.id.toString(),
                      title: m.nomeCompleto,
                      icon: (
                        <div className="h-full w-full rounded-full overflow-hidden bg-muted flex items-center justify-center">
                          {m.fotoUrl ? (
                            <img
                              src={m.fotoUrl}
                              alt={m.nomeCompleto}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground">
                              {m.nomeCompleto.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                      ),
                      onClick: () => setSelectedMentoradoId(m.id.toString()),
                      isActive: selectedMentoradoId === m.id.toString(),
                    })) || []
                  }
                  activeValue={selectedMentoradoId}
                />
              </div>
            )}
          </div>
        </div>

        <NeonTabs defaultValue="visao-geral" className="w-full">
          <div className="flex justify-center mb-6">
            <NeonTabsList>
              <NeonTabsTrigger value="visao-geral">Visão Geral</NeonTabsTrigger>
              <NeonTabsTrigger value="diagnostico">Diagnóstico</NeonTabsTrigger>
              <NeonTabsTrigger value="evolucao">Evolução</NeonTabsTrigger>
              <NeonTabsTrigger value="comparativo">Comparativo</NeonTabsTrigger>
              <NeonTabsTrigger value="lancar-metricas">Lançar Métricas</NeonTabsTrigger>
              <NeonTabsTrigger value="jornada">Playbook</NeonTabsTrigger>
              <NeonTabsTrigger value="atividades">Atividades</NeonTabsTrigger>
            </NeonTabsList>
          </div>

          <NeonTabsContent value="visao-geral" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Hero Section */}
              <div className="md:col-span-8">
                {(currentMentorado || isLoading) && (
                  <NeonCard className="h-full relative overflow-hidden group border-border">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-2">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full border-2 border-border overflow-hidden shadow-lg shadow-primary/10">
                          {isLoading ? (
                            <Skeleton className="w-full h-full" />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              {currentMentorado?.fotoUrl ? (
                                <img
                                  src={currentMentorado.fotoUrl}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-3xl font-bold text-muted-foreground/50">
                                  {currentMentorado?.nomeCompleto?.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4">
                          <div className="bg-card border border-border rounded-full p-2 shadow-xl">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                      </div>

                      <div className="text-center md:text-left space-y-2 flex-1">
                        {isLoading ? (
                          <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-center md:justify-start gap-3">
                              <h2 className="text-2xl font-bold text-foreground">
                                Olá, {currentMentorado?.nomeCompleto?.split(" ")[0]}
                              </h2>
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-bold uppercase tracking-wider">
                                NEON
                              </span>
                            </div>
                            <p className="text-muted-foreground max-w-md">
                              Mantenha o foco nas metas de{" "}
                              {new Date().toLocaleString("pt-BR", {
                                month: "long",
                              })}
                              . Sua evolução é constante! 🚀
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </NeonCard>
                )}
              </div>

              {/* Quick Stats */}
              <div className="md:col-span-4">
                <NeonCard className="h-full flex flex-col justify-between p-6 border-border">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">Progresso Geral</h3>
                      <span className="text-sm text-muted-foreground">Atividades</span>
                    </div>
                    <div className="flex items-end gap-2">
                      {progressLoading ? (
                        <Skeleton className="h-10 w-20" />
                      ) : (
                        <span className="text-4xl font-bold text-primary">
                          {atividadesPercentage}%
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {progressLoading ? (
                        <Skeleton className="h-4 w-48" />
                      ) : atividadesPercentage === 0 ? (
                        "Comece sua jornada na aba Atividades!"
                      ) : atividadesPercentage < 50 ? (
                        `${atividadesCompleted}/${atividadesTotal} passos concluídos. Continue avançando!`
                      ) : atividadesPercentage < 100 ? (
                        `${atividadesCompleted}/${atividadesTotal} passos. Você está no caminho certo!`
                      ) : (
                        "Parabéns! Você completou todas as atividades! 🎉"
                      )}
                    </p>
                  </div>
                </NeonCard>
              </div>
            </div>

            {/* CRM Summary & Notifications Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <section className="lg:col-span-8">
                <NeonCRM mentoradoId={targetMentoradoId} />
              </section>
              <section className="lg:col-span-4">
                <NeonCard className="h-full p-4 bg-white/5 border-white/5">
                  <NotificationsView />
                </NeonCard>
              </section>
            </div>

            {/* Tasks & Classes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
              {/* Left Column: Tasks - Takes up 7/12 on large screens */}
              <section className="lg:col-span-7 h-full">
                <TaskBoard mentoradoId={targetMentoradoId} />
              </section>

              {/* Right Column: Classes & Meetings - Takes up 5/12 on large screens */}
              <section className="lg:col-span-5 h-full">
                <ClassList mentoradoId={targetMentoradoId} />
              </section>
            </div>
          </NeonTabsContent>

          <NeonTabsContent value="evolucao">
            <div className="grid grid-cols-1">
              <NeonCard className="p-6 bg-white/95 dark:bg-black/40 border-white/5">
                <EvolucaoView mentoradoId={targetMentoradoId} />
              </NeonCard>
            </div>
          </NeonTabsContent>

          <NeonTabsContent value="comparativo">
            <div className="grid grid-cols-1">
              <NeonCard className="p-6 bg-white/95 dark:bg-black/40 border-white/5">
                <ComparativoView />
              </NeonCard>
            </div>
          </NeonTabsContent>

          <NeonTabsContent value="diagnostico">
            <div className="grid grid-cols-1 max-w-4xl mx-auto w-full">
              {isAdmin ? <DiagnosticoForm mentoradoId={targetMentoradoId} /> : <DiagnosticoForm />}
            </div>
          </NeonTabsContent>

          <NeonTabsContent value="lancar-metricas">
            <div className="grid grid-cols-1 max-w-2xl mx-auto">
              <NeonCard className="p-6 bg-black/40 border-white/5">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">Lançar Métricas Mensais</h2>
                  <p className="text-gray-400">
                    Preencha os dados do mês para alimentar seu dashboard e comparativos.
                  </p>
                </div>
                <SubmitMetricsForm className="bg-transparent" />
              </NeonCard>
            </div>
          </NeonTabsContent>

          <NeonTabsContent value="jornada">
            <div className="grid grid-cols-1">
              <NeonCard className="p-6 bg-black/40 border-white/5">
                <PlaybookView turma={currentMentorado?.turma} />
              </NeonCard>
            </div>
          </NeonTabsContent>

          <NeonTabsContent value="atividades">
            <div className="grid grid-cols-1">
              <NeonCard className="p-6 bg-black/40 border-white/5">
                <AtividadesContent />
              </NeonCard>
            </div>
          </NeonTabsContent>
        </NeonTabs>
      </div>
    </DashboardLayout>
  );
}
