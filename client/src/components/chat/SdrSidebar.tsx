import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Brain,
  Calendar,
  ChevronRight,
  FileText,
  History,
  MessageSquare,
  RefreshCw,
  User,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SdrSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPhone: string | null;
  contactName: string | null;
  className?: string;
  isAiEnabled: boolean;
  onToggleAi: () => void;
}

interface AgentLog {
  id: string;
  type: "thought" | "action" | "info" | "error";
  content: string;
  timestamp: string;
}

const MOCK_LOGS: AgentLog[] = [
  {
    id: "1",
    type: "info",
    content: "Mensagem recebida do lead.",
    timestamp: "10:42",
  },
  {
    id: "2",
    type: "thought",
    content: "Analisando intenção: Lead interessado em valores de Harmonização.",
    timestamp: "10:42",
  },
  {
    id: "3",
    type: "action",
    content: "Consultando tabela de preços (base de conhecimento).",
    timestamp: "10:42",
  },
  {
    id: "4",
    type: "thought",
    content: "Gerando resposta empática focada em valor, não apenas preço.",
    timestamp: "10:43",
  },
];

export function SdrSidebar({
  isOpen,
  onClose,
  selectedPhone,
  contactName,
  className,
  isAiEnabled,
  onToggleAi,
}: SdrSidebarProps) {
  const [activeTab, setActiveTab] = useState("context");
  const [logs] = useState<AgentLog[]>(MOCK_LOGS);

  // Animation variants
  const sidebarVariants = {
    closed: { x: "100%", opacity: 0 },
    open: { x: 0, opacity: 1 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={sidebarVariants}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "absolute inset-y-0 right-0 z-40 w-full sm:w-[400px] bg-background border-l shadow-2xl flex flex-col",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">SDR Agent</h2>
                <div className="flex items-center gap-1.5">
                  <span className={cn("relative flex h-2 w-2")}>
                    <span
                      className={cn(
                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                        isAiEnabled ? "bg-emerald-400" : "bg-zinc-400"
                      )}
                    />
                    <span
                      className={cn(
                        "relative inline-flex rounded-full h-2 w-2",
                        isAiEnabled ? "bg-emerald-500" : "bg-zinc-500"
                      )}
                    />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isAiEnabled ? "Ativo e Monitorando" : "Pausado"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={isAiEnabled}
                onCheckedChange={onToggleAi}
                className="data-[state=checked]:bg-emerald-500"
              />
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {!selectedPhone ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-muted-foreground">Nenhuma conversa selecionada</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Selecione uma conversa para ver o contexto do lead e ações disponíveis.
              </p>
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="px-4 pt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="context">Contexto & Ações</TabsTrigger>
                  <TabsTrigger value="activity">Atividade (Logs)</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <TabsContent value="context" className="p-4 space-y-6 m-0">
                    {/* Lead Info Card */}
                    <Card className="border-emerald-500/20 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-emerald-500" />
                            Contexto do Lead
                          </div>
                          <Badge variant="outline" className="text-[10px] font-normal">
                            Extraído da conversa
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Nome Identificado</Label>
                          <div className="flex gap-2">
                            <Input
                              defaultValue={contactName || "Não identificado"}
                              className="h-8 text-sm"
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Interesse</Label>
                            <Input defaultValue="Harmonização" className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Orçamento</Label>
                            <Input defaultValue="R$ 5k - 10k" className="h-8 text-sm" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Resumo da Dor</Label>
                          <div className="text-xs p-2 bg-muted/50 rounded-md text-muted-foreground">
                            Cliente incomodada com "bigode chinês" e flacidez leve. Já fez botox há
                            6 meses.
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <Zap className="w-4 h-4" />
                        Ações Rápidas
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="h-auto py-3 flex flex-col items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500/50 transition-all"
                          onClick={() =>
                            toast.success("Pré-agendamento criado!", {
                              description: "Sugerindo horários para o lead...",
                            })
                          }
                        >
                          <Calendar className="w-5 h-5 text-emerald-600" />
                          <span className="text-xs">Agendar Avaliação</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-auto py-3 flex flex-col items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-500/50 transition-all"
                          onClick={() =>
                            toast.success("Lead sincronizado!", {
                              description: "Dados enviados para o CRM.",
                            })
                          }
                        >
                          <RefreshCw className="w-5 h-5 text-blue-600" />
                          <span className="text-xs">Sincronizar CRM</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-auto py-3 flex flex-col items-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-500/50 transition-all"
                          onClick={() =>
                            toast.success("Paciente criado!", {
                              description: "Redirecionando para ficha...",
                            })
                          }
                        >
                          <User className="w-5 h-5 text-purple-600" />
                          <span className="text-xs">Criar Paciente</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-auto py-3 flex flex-col items-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-500/50 transition-all"
                          onClick={() =>
                            toast.success("Resumo gerado!", {
                              description: "Adicionado às notas do contato.",
                            })
                          }
                        >
                          <FileText className="w-5 h-5 text-amber-600" />
                          <span className="text-xs">Gerar Resumo</span>
                        </Button>
                      </div>
                    </div>

                    {/* Next Steps Recommendation */}
                    <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20 dark:border-indigo-900/50">
                      <div className="flex items-start gap-3">
                        <Brain className="w-5 h-5 text-indigo-600 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                            Sugestão da IA
                          </h4>
                          <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                            O lead demonstrou alto interesse. Sugiro oferecer um slot de avaliação
                            para <b>terça-feira às 14h</b>, pois é nosso horário mais tranquilo.
                          </p>
                          <Button
                            size="sm"
                            variant="link"
                            className="px-0 h-auto text-indigo-600 text-xs mt-2"
                          >
                            Aplicar sugestão <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="p-0 m-0">
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          <History className="w-4 h-4" />
                          Log de Pensamento
                        </h3>
                        <Badge variant="secondary" className="text-[10px]">
                          Real-time
                        </Badge>
                      </div>

                      <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
                        {logs.map((log) => (
                          <div key={log.id} className="relative pl-6">
                            <div
                              className={cn(
                                "absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center",
                                log.type === "thought" && "bg-indigo-100 text-indigo-600",
                                log.type === "action" && "bg-emerald-100 text-emerald-600",
                                log.type === "info" && "bg-slate-100 text-slate-600",
                                log.type === "error" && "bg-red-100 text-red-600"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  log.type === "thought" && "bg-indigo-500",
                                  log.type === "action" && "bg-emerald-500",
                                  log.type === "info" && "bg-slate-500",
                                  log.type === "error" && "bg-red-500"
                                )}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {log.timestamp}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] px-1 py-0 h-4 uppercase",
                                    log.type === "thought" && "border-indigo-200 text-indigo-600",
                                    log.type === "action" && "border-emerald-200 text-emerald-600",
                                    log.type === "info" && "border-slate-200 text-slate-600",
                                    log.type === "error" && "border-red-200 text-red-600"
                                  )}
                                >
                                  {log.type}
                                </Badge>
                              </div>
                              <p className="text-xs text-secondary-foreground leading-relaxed">
                                {log.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </div>
            </Tabs>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
