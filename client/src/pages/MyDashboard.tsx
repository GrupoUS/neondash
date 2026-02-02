import { AlertCircle } from "lucide-react";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { AtividadesContent } from "@/components/dashboard/AtividadesContent";
import { ComparativoView } from "@/components/dashboard/ComparativoView";
import { DiagnosticoForm } from "@/components/dashboard/DiagnosticoForm";
import { EvolucaoView } from "@/components/dashboard/EvolucaoView";
import { MenteeOverview } from "@/components/dashboard/MenteeOverview";
import { PlaybookView } from "@/components/dashboard/PlaybookView";

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

  // Progress queries removed - now handled by MenteeOverview

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

              <NeonTabsTrigger value="jornada">Playbook</NeonTabsTrigger>
              <NeonTabsTrigger value="atividades">Atividades</NeonTabsTrigger>
            </NeonTabsList>
          </div>

          <NeonTabsContent value="visao-geral" className="space-y-6">
            <MenteeOverview />
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
