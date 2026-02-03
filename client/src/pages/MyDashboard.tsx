import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import DashboardLayout from "@/components/DashboardLayout";
import { AtividadesContent } from "@/components/dashboard/AtividadesContent";
import { DiagnosticoForm } from "@/components/dashboard/DiagnosticoForm";
import { EvolucaoView } from "@/components/dashboard/EvolucaoView";
import { InstagramAnalyticsView } from "@/components/dashboard/InstagramAnalyticsView";
import { MenteeOverview } from "@/components/dashboard/MenteeOverview";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
  const [activeTab, setActiveTab] = useState("visao-geral");

  // 1. Get current user to check role
  const { data: user, isLoading: isLoadingUser, error: userError } = trpc.auth.me.useQuery();
  const isAdmin = user?.role === "admin";

  // DEBUG: Log estado do user
  // biome-ignore lint/suspicious/noConsole: debug logging for dashboard
  console.log("[DASHBOARD] Estado auth.me:", {
    hasUser: !!user,
    userId: user?.id,
    userRole: user?.role,
    isLoadingUser,
    userError: userError?.message,
  });

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
    refetch: refetchMentorado,
  } = trpc.mentorados.me.useQuery(undefined, {
    enabled: !isAdmin,
    retry: false,
  });

  // DEBUG: Log estado do mentorado
  // biome-ignore lint/suspicious/noConsole: debug logging for dashboard
  console.log("[DASHBOARD] Estado mentorados.me:", {
    isAdmin,
    enabled: !isAdmin,
    hasMentorado: !!mentoradoMe,
    mentoradoId: mentoradoMe?.id,
    isLoadingMe,
    errorMe: errorMe?.message,
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

  // DEBUG: Log estado final
  // biome-ignore lint/suspicious/noConsole: debug logging for dashboard
  console.log("[DASHBOARD] Estado final:", {
    isAdmin,
    isLoading,
    isLoadingMe,
    hasCurrentMentorado: !!currentMentorado,
    hasError: !!error,
    errorMessage: error?.message,
  });

  // FIX: Auto-retry mechanism for race condition between ensureMentorado and mentorados.me
  const retryCount = useRef(0);
  const maxRetries = 5;

  useEffect(() => {
    // If we're not loading, have no mentorado, no error, and haven't exceeded retries
    if (!isAdmin && !isLoadingMe && !mentoradoMe && !errorMe && retryCount.current < maxRetries) {
      retryCount.current += 1;
      // biome-ignore lint/suspicious/noConsole: debug logging for dashboard
      console.log(`[DASHBOARD] Auto-retry ${retryCount.current}/${maxRetries} for mentorados.me`);

      // Wait and then refetch
      const timer = setTimeout(() => {
        // biome-ignore lint/suspicious/noConsole: debug logging for dashboard
        console.log("[DASHBOARD] Executing refetch...");
        void refetchMentorado();
      }, 2000 * retryCount.current); // Progressive delay: 2s, 4s, 6s, 8s, 10s

      return () => clearTimeout(timer);
    }
  }, [isAdmin, isLoadingMe, mentoradoMe, errorMe, refetchMentorado]);

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
    // AT-008: Enhanced error state with retry button
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <Alert
            variant="destructive"
            className="bg-destructive/10 border-destructive/20 text-destructive max-w-lg"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Perfil não encontrado</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>
                Não conseguimos carregar seu perfil de mentorado. Isso pode acontecer se você acabou
                de fazer login ou se houve um problema temporário.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.loading("Tentando novamente...", { duration: 2000 });
                    window.location.reload();
                  }}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tentar novamente
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    window.open("https://wa.me/5511999999999", "_blank");
                  }}
                  className="gap-2"
                >
                  Contatar suporte
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* Hidden legacy message for debugging */}
          <p className="text-xs text-muted-foreground">
            Código: {error ? "MENTORADO_ERROR" : "MENTORADO_NOT_FOUND"}
          </p>
        </div>
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

        <NeonTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6">
            <NeonTabsList>
              <NeonTabsTrigger value="visao-geral">Visão Geral</NeonTabsTrigger>
              <NeonTabsTrigger value="diagnostico">Diagnóstico</NeonTabsTrigger>
              <NeonTabsTrigger value="evolucao">Evolução</NeonTabsTrigger>
              <NeonTabsTrigger value="atividades">Atividades</NeonTabsTrigger>
              <NeonTabsTrigger value="instagram">Instagram</NeonTabsTrigger>
            </NeonTabsList>
          </div>

          <NeonTabsContent value="visao-geral" className="space-y-6">
            <MenteeOverview
              mentoradoId={isAdmin ? targetMentoradoId : undefined}
              isAdmin={isAdmin}
              onNavigateToTab={setActiveTab}
            />
          </NeonTabsContent>

          <NeonTabsContent value="diagnostico">
            <div className="grid grid-cols-1 max-w-4xl mx-auto w-full">
              {isAdmin ? <DiagnosticoForm mentoradoId={targetMentoradoId} /> : <DiagnosticoForm />}
            </div>
          </NeonTabsContent>

          <NeonTabsContent value="evolucao">
            <div className="grid grid-cols-1">
              <NeonCard className="p-6 bg-white/95 dark:bg-black/40 border-white/5">
                <EvolucaoView mentoradoId={targetMentoradoId} />
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

          <NeonTabsContent value="instagram">
            <div className="grid grid-cols-1">
              <NeonCard className="p-6 bg-black/40 border-white/5">
                <InstagramAnalyticsView mentoradoId={targetMentoradoId} />
              </NeonCard>
            </div>
          </NeonTabsContent>
        </NeonTabs>
      </div>
    </DashboardLayout>
  );
}
