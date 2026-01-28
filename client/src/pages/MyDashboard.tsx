import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { NeonCRM } from "@/components/dashboard/NeonCRM";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { ClassList } from "@/components/dashboard/ClassList";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { NeonCard } from "@/components/ui/neon-card";
// import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export default function MyDashboard() {
  const isMobile = useIsMobile();
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
  const { data: mentoradoMe, isLoading: isLoadingMe, error: errorMe } = trpc.mentorados.me.useQuery(
    undefined,
    { enabled: !isAdmin, retry: false }
  );

  // If admin and selected -> fetch by ID
  const { data: mentoradoById, isLoading: isLoadingById, error: errorById } = trpc.mentorados.getById.useQuery(
    { id: parseInt(selectedMentoradoId) },
    { enabled: isAdmin && !!selectedMentoradoId, retry: false }
  );

  const currentMentorado = isAdmin ? mentoradoById : mentoradoMe;
  const isLoading = isAdmin ? (!!selectedMentoradoId ? isLoadingById : !allMentorados) : isLoadingMe;
  const error = isAdmin ? errorById : errorMe;

  // Derived ID for child components
  const targetMentoradoId = isAdmin && selectedMentoradoId
    ? parseInt(selectedMentoradoId)
    : currentMentorado?.id;


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

  if (error || (!currentMentorado && !isAdmin)) { // If not admin and no mentorado, show restricted access
    return (
      <DashboardLayout>
        <Alert variant="destructive" className="bg-red-950/20 border-red-900/50 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Restrito</AlertTitle>
          <AlertDescription>
            Este dashboard é exclusivo para mentorados oficiais. Se você é um mentorado e está vendo esta mensagem, entre em contato com o suporte.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {isAdmin ? "Visão Admin" : "Meu Dashboard"}
            </h1>
            <p className="text-gray-400 mt-1">
              {isAdmin
                ? "Selecione um mentorado para visualizar os dados"
                : "Acompanhe seu progresso e metas em tempo real"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {!isMobile && (
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Sistema Online
              </div>
            )}

            {isAdmin && (
              <Select
                value={selectedMentoradoId}
                onValueChange={setSelectedMentoradoId}
              >
                <SelectTrigger className="w-[280px] bg-black/40 border-white/10">
                  <SelectValue placeholder="Selecione um mentorado" />
                </SelectTrigger>
                <SelectContent>
                  {allMentorados?.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.nomeCompleto} ({m.turma})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Hero Section - Only show if we have a mentorado data or if loading */}
        {(currentMentorado || isLoading) && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          {/* Profile Card */}
          <div className="md:col-span-8">
            <NeonCard className="h-full relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-2">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-2 border-white/10 overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    {isLoading ? (
                      <Skeleton className="w-full h-full bg-slate-800" />
                    ) : (
                      <img
                        src={currentMentorado?.fotoUrl || `https://ui-avatars.com/api/?name=${currentMentorado?.nomeCompleto}&background=random`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4">
                    <div className="bg-black border border-white/10 rounded-full p-2 shadow-xl">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                </div>

                <div className="text-center md:text-left space-y-2 flex-1">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-48 bg-slate-800" />
                      <Skeleton className="h-4 w-32 bg-slate-800" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center md:justify-start gap-3">
                        <h2 className="text-2xl font-bold text-white">
                          Olá, {currentMentorado?.nomeCompleto?.split(' ')[0]}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 font-medium uppercase tracking-wider">
                          {currentMentorado?.turma === "neon_estrutura" ? "Estrutura" : "Escala"}
                        </span>
                      </div>
                      <p className="text-gray-400 max-w-md">
                        Mantenha o foco nas metas de {new Date().toLocaleString('pt-BR', { month: 'long' })}.
                        Sua evolução é constante! 🚀
                      </p>
                    </>
                  )}
                </div>
              </div>
            </NeonCard>
          </div>

          {/* Quick Stats / Sidebar Trigger */}
          <div className="md:col-span-4">
            <NeonCard className="h-full flex flex-col justify-between p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Progresso Geral</h3>
                  <span className="text-sm text-gray-400">Mês Atual</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-neon-gold">75%</span>
                  <span className="text-green-400 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 mr-1" /> +5%
                  </span>
                </div>
                <p className="text-gray-500 text-sm">
                  Você está no caminho certo! Continue assim.
                </p>
              </div>
              <Button className="w-full mt-4 bg-white/5 hover:bg-white/10 text-white border-0">
                Ver Detalhes
              </Button>
            </NeonCard>
          </div>
        </div>
        )}

        {/* CRM Summary Section */}
        <section>
          <NeonCRM mentoradoId={targetMentoradoId} />
        </section>

        {/* Main Content Grid */}
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
      </div>
    </DashboardLayout>
  );
}
