/**
 * OpenClaw Page - AI Assistant Chat Interface
 *
 * Main page for interacting with the NEON AI Assistant.
 * Includes chat interface and optional sidebar with context.
 */

import { Bot, Calendar, Target, TrendingUp } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { ChatInterface } from "@/components/openclaw/ChatInterface";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

export default function OpenClawPage() {
  const contextQuery = trpc.openclaw.getOpenClawContext.useQuery();

  // Get latest metrics (first item in the array)
  const latestMetrics = Array.isArray(contextQuery.data?.metrics)
    ? contextQuery.data?.metrics[0]
    : null;

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-3">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assistente NEON</h1>
            <p className="text-sm text-muted-foreground">
              Seu assistente de mentoria com inteligência artificial
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <ChatInterface />
          </div>

          {/* Context Sidebar */}
          <div className="space-y-4">
            {/* Current Mentorado Card */}
            <Card className="border-border/50 bg-card/80 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Target className="h-4 w-4 text-primary" />
                  Seu Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contextQuery.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : contextQuery.data?.mentorado ? (
                  <>
                    <div>
                      <p className="font-medium">{contextQuery.data.mentorado.nomeCompleto}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {contextQuery.data.mentorado.turma === "neon" ? "NEON" : "NEON"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="text-muted-foreground">Meta</p>
                        <p className="font-semibold">
                          R${" "}
                          {contextQuery.data.goals?.metaFaturamento?.toLocaleString("pt-BR") ?? "-"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="text-muted-foreground">Turma</p>
                        <p className="font-semibold capitalize">
                          {contextQuery.data.mentorado.turma === "neon" ? "Neon" : "Neon"}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Perfil de mentorado não encontrado
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Metrics Card */}
            <Card className="border-border/50 bg-card/80 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Métricas Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contextQuery.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : latestMetrics ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Faturamento</span>
                      <span className="font-medium">
                        R$ {latestMetrics.faturamento?.toLocaleString("pt-BR") ?? "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lucro</span>
                      <span className="font-medium">
                        R$ {latestMetrics.lucro?.toLocaleString("pt-BR") ?? "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Procedimentos</span>
                      <span className="font-medium">{latestMetrics.procedimentos ?? "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Leads</span>
                      <span className="font-medium">{latestMetrics.leads ?? "-"}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem métricas disponíveis</p>
                )}
              </CardContent>
            </Card>

            {/* Latest Feedback Card */}
            <Card className="border-border/50 bg-card/80 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  Último Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contextQuery.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                ) : contextQuery.data?.latestFeedback ? (
                  <div className="space-y-2 text-sm">
                    <p className="line-clamp-3 text-muted-foreground">
                      {contextQuery.data.latestFeedback.analiseMes}
                    </p>
                    {contextQuery.data.latestFeedback.focoProximoMes && (
                      <div className="rounded-lg bg-amber-500/10 p-2">
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          Foco próximo mês
                        </p>
                        <p className="mt-1 text-xs">
                          {contextQuery.data.latestFeedback.focoProximoMes}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem feedback disponível</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
