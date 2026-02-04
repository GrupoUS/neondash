"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NeonCard } from "@/components/ui/neon-card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface MyMentorshipProps {
  mentoradoId?: number;
}

export function MyMentorship({ mentoradoId }: MyMentorshipProps) {
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);

  // Fetch sessions for the current mentorado or the specified one
  const {
    data: sessions,
    isLoading,
    error,
  } = trpc.mentorship.listByMentorado.useQuery(mentoradoId ? { mentoradoId } : undefined);

  // Toggle action item mutation
  const toggleActionItem = trpc.mentorship.toggleActionItem.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Compute progress statistics
  const allActionItems = sessions?.flatMap((s) => s.actionItems) ?? [];
  const completedItems = allActionItems.filter((item) => item.status === "completed");
  const progressPercentage =
    allActionItems.length > 0
      ? Math.round((completedItems.length / allActionItems.length) * 100)
      : 0;

  // Get the most recent session with pending action items
  const activeSession = sessions?.find((s) =>
    s.actionItems.some((item) => item.status === "pending")
  );

  const handleToggleItem = (actionItemId: number) => {
    toggleActionItem.mutate({ actionItemId });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <NeonCard className="p-6">
        <div className="text-center text-muted-foreground py-8">
          <p>Erro ao carregar sessões de mentoria</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </NeonCard>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <NeonCard className="p-8">
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
          <ClipboardList className="w-16 h-16 mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma sessão de mentoria ainda</h3>
          <p className="text-sm max-w-md">
            Seu mentor registrará aqui os pontos discutidos e ações combinadas após cada sessão de
            mentoria.
          </p>
        </div>
      </NeonCard>
    );
  }

  // Get mentor info from first session (assuming same mentor)
  const mentor = sessions[0]?.mentor;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mentor Card */}
        {mentor && (
          <NeonCard className="lg:col-span-1 p-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={mentor.imageUrl ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {mentor.name?.charAt(0).toUpperCase() ?? "M"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Seu Mentor</p>
                <h3 className="text-lg font-semibold">{mentor.name}</h3>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sessões realizadas</span>
                <Badge variant="secondary">{sessions.length}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Action items</span>
                <Badge variant="secondary">
                  {completedItems.length}/{allActionItems.length}
                </Badge>
              </div>
            </div>
          </NeonCard>
        )}

        {/* Progress Card */}
        <NeonCard className="lg:col-span-2 p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              Seu Progresso
            </CardTitle>
            <CardDescription>Acompanhe a conclusão das suas ações combinadas</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="flex items-center gap-4">
              <Progress value={progressPercentage} className="flex-1 h-3" />
              <span className="text-2xl font-bold text-primary min-w-[60px] text-right">
                {progressPercentage}%
              </span>
            </div>

            {activeSession?.actionItems.some((i) => i.status === "pending") && (
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">📌 Próximas ações</p>
                <ul className="space-y-2">
                  {activeSession.actionItems
                    .filter((item) => item.status === "pending")
                    .slice(0, 3)
                    .map((item) => (
                      <li key={item.id} className="flex items-center gap-2 text-sm">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleToggleItem(item.id)}
                          disabled={toggleActionItem.isPending}
                        >
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <span className="flex-1">{item.description}</span>
                        {item.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            até {format(new Date(item.dueDate), "dd/MM")}
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </CardContent>
        </NeonCard>
      </div>

      {/* Sessions List */}
      <NeonCard className="p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="w-5 h-5 text-primary" />
            Histórico de Sessões
          </CardTitle>
          <CardDescription>{sessions.length} sessões de mentoria registradas</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="space-y-4 pr-4">
              {sessions.map((session) => (
                <Collapsible
                  key={session.id}
                  open={expandedSessionId === session.id}
                  onOpenChange={(open) => setExpandedSessionId(open ? session.id : null)}
                  className="group"
                >
                  <Card className="bg-muted/20 border-border/50 overflow-hidden">
                    <CollapsibleTrigger className="w-full text-left">
                      <CardHeader className="py-4 flex flex-row items-center justify-between group-hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <CalendarDays className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{session.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(session.sessionDate), "PPP", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="secondary" className="hidden sm:flex">
                            {session.actionItems.filter((i) => i.status === "completed").length}/
                            {session.actionItems.length} itens
                          </Badge>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0 border-t border-border/30">
                        {/* Summary */}
                        <div className="py-4">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Resumo</p>
                          <p className="text-sm whitespace-pre-wrap">{session.summary}</p>
                        </div>

                        {/* Action Items */}
                        {session.actionItems.length > 0 && (
                          <div className="pt-4 border-t border-border/30">
                            <p className="text-sm font-medium text-muted-foreground mb-3">
                              Action Items
                            </p>
                            <div className="space-y-2">
                              {session.actionItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-3 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleItem(item.id);
                                    }}
                                    disabled={toggleActionItem.isPending}
                                  >
                                    {item.status === "completed" ? (
                                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    ) : (
                                      <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                                    )}
                                  </Button>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={cn(
                                        "text-sm",
                                        item.status === "completed" &&
                                          "line-through text-muted-foreground"
                                      )}
                                    >
                                      {item.description}
                                    </p>
                                    {item.dueDate && (
                                      <p className="text-xs text-muted-foreground">
                                        Prazo: {format(new Date(item.dueDate), "dd/MM/yyyy")}
                                      </p>
                                    )}
                                  </div>
                                  <Badge
                                    variant={item.status === "completed" ? "default" : "secondary"}
                                    className="flex-shrink-0"
                                  >
                                    {item.status === "completed" ? "Concluído" : "Pendente"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </NeonCard>
    </motion.div>
  );
}
