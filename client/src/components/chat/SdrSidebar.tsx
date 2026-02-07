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
  Thermometer,
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

// ─── Lead Temperature Gauge ───────────────────────────────────────────────────

const TEMPERATURE_CONFIG = {
  cold: { label: "Frio", color: "bg-blue-500", textColor: "text-blue-500", width: "w-1/4" },
  warm: { label: "Morno", color: "bg-amber-500", textColor: "text-amber-500", width: "w-2/4" },
  hot: { label: "Quente", color: "bg-orange-500", textColor: "text-orange-500", width: "w-3/4" },
  burning: {
    label: "Pronto",
    color: "bg-emerald-500",
    textColor: "text-emerald-500",
    width: "w-full",
  },
} as const;

type Temperature = keyof typeof TEMPERATURE_CONFIG;

function LeadTemperatureGauge({ temperature = "warm" }: { temperature?: Temperature }) {
  const config = TEMPERATURE_CONFIG[temperature];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Thermometer className={cn("w-3.5 h-3.5", config.textColor)} />
          <span className="text-[11px] font-medium text-muted-foreground">Temperatura</span>
        </div>
        <Badge
          variant="outline"
          className={cn("text-[10px] px-1.5 py-0 h-4 border-current", config.textColor)}
        >
          {config.label}
        </Badge>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", config.color, config.width)}
        />
      </div>
    </div>
  );
}

// ─── Log Type Config ──────────────────────────────────────────────────────────

const LOG_TYPE_STYLES = {
  thought: {
    dot: "bg-indigo-500",
    badge: "border-indigo-500/30 text-indigo-400",
    bg: "bg-indigo-500/10",
  },
  action: {
    dot: "bg-emerald-500",
    badge: "border-emerald-500/30 text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  info: {
    dot: "bg-muted-foreground",
    badge: "border-border text-muted-foreground",
    bg: "bg-muted/30",
  },
  error: { dot: "bg-red-500", badge: "border-red-500/30 text-red-400", bg: "bg-red-500/10" },
} as const;

// ─── Main Component ───────────────────────────────────────────────────────────

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
            "absolute inset-y-0 right-0 z-40 w-full sm:w-[380px] bg-background border-l border-border/50 shadow-2xl flex flex-col",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/60">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <Bot className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h2 className="font-semibold text-sm leading-tight">SDR Agent</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    {isAiEnabled && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={cn(
                        "relative inline-flex rounded-full h-1.5 w-1.5",
                        isAiEnabled ? "bg-emerald-500" : "bg-muted-foreground/40"
                      )}
                    />
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {isAiEnabled ? "Ativo" : "Pausado"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Switch
                checked={isAiEnabled}
                onCheckedChange={onToggleAi}
                className="scale-90 data-[state=checked]:bg-emerald-500"
              />
              <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {!selectedPhone ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="p-4 rounded-2xl bg-muted/30 ring-1 ring-border/20 mb-4">
                <MessageSquare className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Nenhuma conversa</p>
              <p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">
                Selecione uma conversa para ver o contexto do lead
              </p>
            </motion.div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="px-4 pt-3">
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="context" className="text-xs">
                    Contexto
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs">
                    <span className="flex items-center gap-1.5">
                      Atividade
                      {isAiEnabled && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                      )}
                    </span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <TabsContent value="context" className="p-4 space-y-4 m-0">
                    {/* Lead Temperature */}
                    <LeadTemperatureGauge temperature="warm" />

                    {/* Lead Info Card */}
                    <Card className="border-border/30 shadow-none bg-card/50">
                      <CardHeader className="pb-2 px-3 pt-3">
                        <CardTitle className="text-xs font-medium flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-emerald-500" />
                            Contexto do Lead
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-normal px-1.5 py-0 h-4 text-muted-foreground/60"
                          >
                            Auto-extraído
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2.5 px-3 pb-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground/70">Nome</Label>
                          <div className="flex gap-1.5">
                            <Input
                              defaultValue={contactName || "Não identificado"}
                              className="h-7 text-xs bg-muted/20 border-border/20"
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0">
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground/70">
                              Interesse
                            </Label>
                            <Input
                              defaultValue="Não identificado"
                              className="h-7 text-xs bg-muted/20 border-border/20"
                              placeholder="Ex: Harmonização"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground/70">
                              Orçamento
                            </Label>
                            <Input
                              defaultValue="—"
                              className="h-7 text-xs bg-muted/20 border-border/20"
                              placeholder="Ex: R$ 5k"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground/70">
                            Resumo da Dor
                          </Label>
                          <div className="text-[11px] p-2 bg-muted/20 rounded-md text-muted-foreground/70 leading-relaxed border border-border/10">
                            Aguardando análise da conversa…
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                        <Zap className="w-3 h-3" />
                        Ações Rápidas
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="h-auto py-2.5 flex flex-col items-center gap-1.5 border-border/30 hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all active:scale-[0.98]"
                          onClick={() =>
                            toast.success("Pré-agendamento criado!", {
                              description: "Sugerindo horários para o lead...",
                            })
                          }
                        >
                          <Calendar className="w-4 h-4 text-emerald-500" />
                          <span className="text-[11px]">Agendar</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-auto py-2.5 flex flex-col items-center gap-1.5 border-border/30 hover:bg-blue-500/5 hover:border-blue-500/30 transition-all active:scale-[0.98]"
                          onClick={() =>
                            toast.success("Lead sincronizado!", {
                              description: "Dados enviados para o CRM.",
                            })
                          }
                        >
                          <RefreshCw className="w-4 h-4 text-blue-500" />
                          <span className="text-[11px]">Sync CRM</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-auto py-2.5 flex flex-col items-center gap-1.5 border-border/30 hover:bg-purple-500/5 hover:border-purple-500/30 transition-all active:scale-[0.98]"
                          onClick={() =>
                            toast.success("Paciente criado!", {
                              description: "Redirecionando para ficha...",
                            })
                          }
                        >
                          <User className="w-4 h-4 text-purple-500" />
                          <span className="text-[11px]">Paciente</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-auto py-2.5 flex flex-col items-center gap-1.5 border-border/30 hover:bg-amber-500/5 hover:border-amber-500/30 transition-all active:scale-[0.98]"
                          onClick={() =>
                            toast.success("Resumo gerado!", {
                              description: "Adicionado às notas do contato.",
                            })
                          }
                        >
                          <FileText className="w-4 h-4 text-amber-500" />
                          <span className="text-[11px]">Resumo</span>
                        </Button>
                      </div>
                    </div>

                    {/* AI Suggestion */}
                    <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 ring-1 ring-indigo-500/10">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 mt-0.5">
                          <Brain className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-[11px] font-semibold text-indigo-300">
                            Sugestão da IA
                          </h4>
                          <p className="text-[11px] text-indigo-300/70 mt-1 leading-relaxed">
                            Lead com interesse moderado. Sugiro enviar follow-up com horários
                            disponíveis para avaliação.
                          </p>
                          <Button
                            size="sm"
                            variant="link"
                            className="px-0 h-auto text-indigo-400 text-[11px] mt-1.5"
                          >
                            Aplicar <ChevronRight className="w-3 h-3 ml-0.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="p-0 m-0">
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-medium flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5" />
                          Log de Pensamento
                        </h3>
                        {isAiEnabled && (
                          <Badge
                            variant="outline"
                            className="text-[9px] gap-1 px-1.5 py-0 h-4 border-emerald-500/30 text-emerald-500"
                          >
                            <span className="relative flex h-1 w-1">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-500" />
                            </span>
                            Live
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        {logs.map((log, index) => {
                          const styles = LOG_TYPE_STYLES[log.type];
                          const isLatest = index === logs.length - 1;
                          return (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.08 }}
                              className={cn(
                                "flex items-start gap-2.5 p-2 rounded-lg transition-colors",
                                isLatest && isAiEnabled ? styles.bg : "hover:bg-muted/20"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                                  styles.dot
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono text-muted-foreground/60">
                                    {log.timestamp}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[9px] px-1 py-0 h-3.5 uppercase",
                                      styles.badge
                                    )}
                                  >
                                    {log.type}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                                  {log.content}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
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
