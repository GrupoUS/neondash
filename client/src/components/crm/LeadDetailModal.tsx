import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Briefcase,
  CalendarPlus,
  Check,
  Edit2,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWhatsAppProvider } from "@/hooks/useWhatsAppProvider";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { LeadChatWindow } from "../chat/LeadChatWindow";
import { AddInteractionDialog } from "./AddInteractionDialog";
import { AddObjectionDialog } from "./AddObjectionDialog";
import { LeadInfoModules } from "./lead-details/LeadInfoModules";
import { LeadTimeline } from "./lead-details/LeadTimeline";

interface LeadDetailModalProps {
  leadId: number | null;
  isOpen: boolean;
  onClose: () => void;
  isReadOnly?: boolean;
  onSchedule?: (leadName: string) => void;
}

// Animation variants
const panelVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      damping: 30,
      stiffness: 300,
      staggerChildren: 0.05,
    },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1] as const,
    },
  },
};

export function LeadDetailModal({
  leadId,
  isOpen,
  onClose,
  isReadOnly = false,
  onSchedule,
}: LeadDetailModalProps) {
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [objectionDialogOpen, setObjectionDialogOpen] = useState(false);
  const [interactionType, setInteractionType] = useState<string>("nota");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown>>(null!);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("detalhes");
  const [, navigate] = useLocation();

  const utils = trpc.useUtils();

  const { data, isLoading, refetch } = trpc.leads.getById.useQuery(
    { id: leadId! },
    { enabled: !!leadId }
  );

  const { activeProvider } = useWhatsAppProvider();

  const { data: zapiMessages } = trpc.zapi.getMessages.useQuery(
    { leadId: leadId!, limit: 50 },
    { enabled: !!leadId && activeProvider === "zapi" }
  );

  const { data: metaMessages } = trpc.metaApi.getMessages.useQuery(
    { leadId: leadId!, limit: 50 },
    { enabled: !!leadId && activeProvider === "meta" }
  );

  const { data: baileysMessages } = trpc.baileys.getMessages.useQuery(
    { leadId: leadId!, limit: 50 },
    { enabled: !!leadId && activeProvider === "baileys" }
  );

  const whatsappMessages = useMemo(() => {
    if (activeProvider === "meta") return metaMessages || [];
    if (activeProvider === "baileys") return baileysMessages || [];
    return zapiMessages || [];
  }, [activeProvider, metaMessages, baileysMessages, zapiMessages]);

  const deleteMutation = trpc.leads.delete.useMutation({
    onSuccess: () => {
      toast.success("Lead excluído com sucesso");
      utils.leads.list.invalidate();
      onClose();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir lead: ${error.message}`);
    },
  });

  const handleDelete = () => {
    if (leadId) {
      deleteMutation.mutate({ id: leadId });
    }
  };

  useEffect(() => {
    if (data?.lead && !isEditing) {
      setEditData({
        nome: data.lead.nome,
        email: data.lead.email,
        telefone: data.lead.telefone || "",
        empresa: data.lead.empresa || "",
        origem: data.lead.origem || "outro",
        status: data.lead.status || "novo",
        tags: data.lead.tags || [],
        dataNascimento: data.lead.dataNascimento
          ? new Date(data.lead.dataNascimento).toISOString().split("T")[0]
          : "",
        genero: data.lead.genero || "",
        procedimentosInteresse: data.lead.procedimentosInteresse || [],
        historicoEstetico: data.lead.historicoEstetico || "",
        alergias: data.lead.alergias || "",
        tipoPele: data.lead.tipoPele || "",
        disponibilidade: data.lead.disponibilidade || "",
        indicadoPor: data.lead.indicadoPor || "",
        profissao: data.lead.profissao || "",
        dorPrincipal: data.lead.dorPrincipal || "",
        desejoPrincipal: data.lead.desejoPrincipal || "",
        temperatura: data.lead.temperatura,
      });
    }
  }, [data, isEditing]);

  const updateMutation = trpc.leads.update.useMutation({
    onSuccess: () => {
      toast.success("Lead atualizado com sucesso");
      setIsEditing(false);
      utils.leads.getById.invalidate({ id: leadId! });
      utils.leads.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar lead: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!editData.nome || !editData.email) {
      toast.error("Nome e Email são obrigatórios");
      return;
    }
    updateMutation.mutate({
      id: leadId!,
      nome: editData.nome as string,
      email: editData.email as string,
      telefone: editData.telefone as string,
      empresa: editData.empresa as string,
      valorEstimado: Math.round((editData.valorEstimado as number) * 100),
      tags: editData.tags as string[],
      dataNascimento: (editData.dataNascimento as string) || undefined,
      genero: editData.genero as string,
      procedimentosInteresse: editData.procedimentosInteresse as number[],
      historicoEstetico: editData.historicoEstetico as string,
      alergias: editData.alergias as string,
      tipoPele: editData.tipoPele as string,
      disponibilidade: editData.disponibilidade as string,
      indicadoPor: editData.indicadoPor as string,
      profissao: editData.profissao as string,
      dorPrincipal: editData.dorPrincipal as string,
      desejoPrincipal: editData.desejoPrincipal as string,
      temperatura: editData.temperatura as "frio" | "morno" | "quente" | undefined,
    });
  };

  const handleQuickAction = (type: string) => {
    setInteractionType(type);
    setInteractionDialogOpen(true);
  };

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case "novo":
        return { color: "bg-amber-500/15 text-amber-500 border-amber-500/30", label: "Novo" };
      case "primeiro_contato":
        return {
          color: "bg-orange-500/15 text-orange-500 border-orange-500/30",
          label: "Primeiro Contato",
        };
      case "qualificado":
        return {
          color: "bg-violet-500/15 text-violet-500 border-violet-500/30",
          label: "Qualificado",
        };
      case "proposta":
        return { color: "bg-blue-500/15 text-blue-500 border-blue-500/30", label: "Proposta" };
      case "negociacao":
        return { color: "bg-pink-500/15 text-pink-500 border-pink-500/30", label: "Negociação" };
      case "fechado":
        return {
          color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
          label: "Fechado",
        };
      case "perdido":
        return { color: "bg-red-500/15 text-red-500 border-red-500/30", label: "Perdido" };
      default:
        return { color: "bg-muted text-muted-foreground border-border", label: "Novo" };
    }
  };

  const getTemperatureConfig = (temp?: string) => {
    switch (temp) {
      case "frio":
        return { icon: "❄️", color: "text-blue-500", bg: "bg-blue-500/10" };
      case "morno":
        return { icon: "🌤️", color: "text-amber-500", bg: "bg-amber-500/10" };
      case "quente":
        return { icon: "🔥", color: "text-red-500", bg: "bg-red-500/10" };
      default:
        return { icon: "—", color: "text-muted-foreground", bg: "bg-muted/30" };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (!leadId) return null;

  const statusConfig = getStatusConfig(
    isEditing ? (editData?.status as string) : data?.lead?.status
  );
  const tempConfig = getTemperatureConfig(data?.lead?.temperatura ?? undefined);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:w-[600px] md:w-[700px] p-0 gap-0 sm:max-w-[700px] bg-background border-l border-border/30 shadow-2xl overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full items-center justify-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Carregando...</span>
                </div>
              </motion.div>
            ) : data ? (
              <motion.div
                key="content"
                className="flex flex-col h-full bg-[#020617]"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={panelVariants}
              >
                {/* Premium Header */}
                <div className="relative z-10">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                  <div className="p-6 pb-4 bg-card/40 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-start gap-5">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)]">
                          {getInitials(data.lead.nome)}
                        </div>
                        <div
                          className={cn(
                            "absolute -bottom-2 -right-2 h-7 w-7 rounded-full flex items-center justify-center text-sm shadow-lg border-[3px] border-[#020617]",
                            tempConfig.bg
                          )}
                        >
                          {tempConfig.icon}
                        </div>
                      </div>

                      {/* Header Info */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-3 mb-1">
                          {isEditing ? (
                            <Input
                              value={editData?.nome as string}
                              onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                              className="text-xl font-bold h-9 py-0 px-2 bg-white/5 border-white/10 focus:border-primary max-w-[240px]"
                            />
                          ) : (
                            <h2 className="text-2xl font-bold text-foreground truncate tracking-tight">
                              {data.lead.nome}
                            </h2>
                          )}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-semibold px-2 py-0.5 border-0 ring-1 ring-inset",
                              statusConfig.color
                            )}
                          >
                            {isEditing ? (
                              <Select
                                value={editData?.status as string}
                                onValueChange={(val) => setEditData({ ...editData, status: val })}
                              >
                                <SelectTrigger className="h-5 border-none p-0 bg-transparent focus:ring-0 text-xs shadow-none">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="novo">Novo</SelectItem>
                                  <SelectItem value="primeiro_contato">Primeiro Contato</SelectItem>
                                  <SelectItem value="qualificado">Qualificado</SelectItem>
                                  <SelectItem value="proposta">Proposta</SelectItem>
                                  <SelectItem value="negociacao">Negociação</SelectItem>
                                  <SelectItem value="fechado">Fechado</SelectItem>
                                  <SelectItem value="perdido">Perdido</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              statusConfig.label
                            )}
                          </Badge>
                        </div>

                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          {isEditing ? (
                            <div className="flex flex-col gap-2 mt-2">
                              <Input
                                value={editData?.empresa as string}
                                onChange={(e) =>
                                  setEditData({ ...editData, empresa: e.target.value })
                                }
                                placeholder="Empresa"
                                className="h-8 bg-white/5 border-white/10"
                              />
                              <Input
                                value={editData?.email as string}
                                onChange={(e) =>
                                  setEditData({ ...editData, email: e.target.value })
                                }
                                placeholder="Email"
                                className="h-8 bg-white/5 border-white/10"
                              />
                            </div>
                          ) : (
                            <>
                              {data.lead.empresa && (
                                <div className="flex items-center gap-1.5 text-foreground/80">
                                  <Briefcase className="h-3.5 w-3.5" />
                                  <span className="font-medium">{data.lead.empresa}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                                <Mail className="h-3.5 w-3.5" />
                                <span>{data.lead.email}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Value Pill */}
                        {(data.lead.valorEstimado ?? 0) > 0 && !isEditing && (
                          <div className="mt-3">
                            <span className="inline-flex items-center gap-1.5 pl-2 pr-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                              <Sparkles className="h-3 w-3" />
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format((data.lead.valorEstimado || 0) / 100)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Header Actions */}
                      {!isReadOnly && (
                        <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => setIsEditing(false)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={handleSave}
                                disabled={updateMutation.isPending}
                              >
                                {updateMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                onClick={() => setIsEditing(true)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setShowDeleteConfirm(true)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Bar */}
                  <div className="px-6 py-3 bg-card/20 border-b border-white/5 flex gap-2 overflow-x-auto pb-3 custom-scrollbar">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 bg-white/5 border-white/10 hover:bg-primary/10 hover:border-primary/30 hover:text-primary text-xs"
                      onClick={() => handleQuickAction("ligacao")}
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Ligar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 bg-white/5 border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-500 text-xs"
                      onClick={() => {
                        const phone = data?.lead?.telefone;
                        if (phone) {
                          onClose();
                          navigate(`/chat?phone=${encodeURIComponent(phone)}&leadId=${leadId}`);
                        } else {
                          toast.error("Lead não possui número de telefone");
                        }
                      }}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 bg-white/5 border-white/10 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive text-xs"
                      onClick={() => setObjectionDialogOpen(true)}
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Objeção
                    </Button>
                    {onSchedule && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 hover:border-primary/40 text-xs"
                        onClick={() => onSchedule(data?.lead?.nome || "Procedimento")}
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        Agendar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 ml-auto bg-primary hover:bg-primary/90 text-xs"
                      onClick={() => handleQuickAction("nota")}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Nota
                    </Button>
                  </div>
                </div>

                {/* Main Content Tabs */}
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <div className="px-6 border-b border-white/5 bg-white/[0.02]">
                    <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6">
                      {[
                        { value: "detalhes", label: "Detalhes" },
                        { value: "historico", label: "Histórico" },
                        { value: "chat", label: "Chat" },
                      ].map((tab) => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-0 pb-3 pt-3 -mb-[1px] transition-all text-muted-foreground hover:text-foreground data-[state=active]:font-semibold"
                        >
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  <ScrollArea
                    className={cn(
                      "flex-1 bg-background/50",
                      activeTab === "chat" && "overflow-hidden"
                    )}
                  >
                    <TabsContent value="detalhes" className="p-6 m-0 focus-visible:outline-none">
                      <LeadInfoModules
                        data={data}
                        isEditing={isEditing}
                        editData={editData}
                        setEditData={setEditData}
                        updateMutation={updateMutation}
                        isReadOnly={isReadOnly}
                        onSchedule={onSchedule}
                      />
                    </TabsContent>

                    <TabsContent value="historico" className="p-6 m-0 focus-visible:outline-none">
                      <LeadTimeline whatsappMessages={whatsappMessages} data={data} />
                    </TabsContent>

                    <TabsContent
                      value="chat"
                      className="p-0 m-0 h-[calc(100vh-280px)] focus-visible:outline-none"
                    >
                      <div className="h-full w-full bg-[#0B1120]">
                        <LeadChatWindow
                          leadId={leadId!}
                          phone={data?.lead?.telefone || undefined}
                          leadName={data?.lead?.nome}
                        />
                      </div>
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </SheetContent>
      </Sheet>

      <AddInteractionDialog
        leadId={leadId!}
        isOpen={interactionDialogOpen}
        onClose={() => setInteractionDialogOpen(false)}
        defaultType={interactionType}
        onSuccess={() => refetch()}
      />

      <AddObjectionDialog
        leadId={leadId!}
        isOpen={objectionDialogOpen}
        onClose={() => setObjectionDialogOpen(false)}
        currentObjections={data?.lead?.objecoes}
        onSuccess={() => refetch()}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Lead
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita. Todas as
              interações e notas associadas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir Lead"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
