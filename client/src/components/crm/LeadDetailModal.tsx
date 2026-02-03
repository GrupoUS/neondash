import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  Briefcase,
  Calendar,
  CalendarPlus,
  Check,
  Clock,
  Edit2,
  FileText,
  Heart,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  Target,
  ThermometerSun,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { LeadChatWindow } from "../chat/LeadChatWindow";
import { AddInteractionDialog } from "./AddInteractionDialog";

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

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
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
  const [interactionType, setInteractionType] = useState<string>("nota");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown>>(null!);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("detalhes");

  const utils = trpc.useUtils();

  const { data, isLoading, refetch } = trpc.leads.getById.useQuery(
    { id: leadId! },
    { enabled: !!leadId }
  );

  // Delete mutation
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
        valorEstimado: (data.lead.valorEstimado || 0) / 100,
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
      procedimentosInteresse: editData.procedimentosInteresse as string[],
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
        return {
          color: "bg-amber-500/15 text-amber-400 border-amber-500/30 ring-amber-500/20",
          label: "Novo",
        };
      case "primeiro_contato":
        return {
          color: "bg-orange-500/15 text-orange-400 border-orange-500/30 ring-orange-500/20",
          label: "Primeiro Contato",
        };
      case "qualificado":
        return {
          color: "bg-violet-500/15 text-violet-400 border-violet-500/30 ring-violet-500/20",
          label: "Qualificado",
        };
      case "proposta":
        return {
          color: "bg-blue-500/15 text-blue-400 border-blue-500/30 ring-blue-500/20",
          label: "Proposta",
        };
      case "negociacao":
        return {
          color: "bg-pink-500/15 text-pink-400 border-pink-500/30 ring-pink-500/20",
          label: "Negociação",
        };
      case "fechado":
        return {
          color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ring-emerald-500/20",
          label: "Fechado",
        };
      case "perdido":
        return {
          color: "bg-red-500/15 text-red-400 border-red-500/30 ring-red-500/20",
          label: "Perdido",
        };
      default:
        return {
          color: "bg-muted text-muted-foreground border-border",
          label: "Novo",
        };
    }
  };

  const getTemperatureConfig = (temp?: string) => {
    switch (temp) {
      case "frio":
        return { icon: "❄️", color: "text-blue-400", bg: "bg-blue-500/10" };
      case "morno":
        return { icon: "🌤️", color: "text-amber-400", bg: "bg-amber-500/10" };
      case "quente":
        return { icon: "🔥", color: "text-red-400", bg: "bg-red-500/10" };
      default:
        return { icon: "—", color: "text-muted-foreground", bg: "bg-muted/30" };
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "ligacao":
        return <Phone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />;
      case "reuniao":
        return <Calendar className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
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
          className="w-full sm:w-[560px] md:w-[640px] p-0 gap-0 sm:max-w-[640px] bg-background border-l border-border/30 shadow-2xl overflow-hidden"
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
                className="flex flex-col h-full"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={panelVariants}
              >
                {/* Premium Header with Gradient Accent */}
                <div className="relative">
                  {/* Gradient Accent Bar */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

                  <div className="p-6 pt-7 pb-5 bg-card/80 backdrop-blur-sm border-b border-border/30">
                    {/* Top Row: Avatar, Name, Actions */}
                    <div className="flex items-start gap-4">
                      {/* Avatar with Ring */}
                      <div className="relative">
                        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 flex items-center justify-center text-xl font-bold text-primary shadow-lg">
                          {getInitials(data.lead.nome)}
                        </div>
                        {/* Temperature indicator */}
                        <div
                          className={cn(
                            "absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center text-xs shadow-md border-2 border-background",
                            tempConfig.bg
                          )}
                        >
                          {tempConfig.icon}
                        </div>
                      </div>

                      {/* Name & Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isEditing ? (
                            <Input
                              value={editData?.nome as string}
                              onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                              className="text-xl font-bold h-auto py-1 px-2 bg-transparent border-primary/30 focus:border-primary max-w-[200px]"
                            />
                          ) : (
                            <h2 className="text-xl font-bold text-foreground truncate">
                              {data.lead.nome}
                            </h2>
                          )}
                          <Badge
                            variant="outline"
                            className={cn("text-xs font-medium ring-1", statusConfig.color)}
                          >
                            {isEditing ? (
                              <Select
                                value={editData?.status as string}
                                onValueChange={(val) => setEditData({ ...editData, status: val })}
                              >
                                <SelectTrigger className="h-5 border-none p-0 bg-transparent focus:ring-0 text-xs">
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

                        {/* Contact Info */}
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Input
                                value={editData?.empresa as string}
                                onChange={(e) =>
                                  setEditData({ ...editData, empresa: e.target.value })
                                }
                                placeholder="Empresa"
                                className="h-7 text-xs bg-transparent border-muted-foreground/20 w-24"
                              />
                              <Input
                                value={editData?.email as string}
                                onChange={(e) =>
                                  setEditData({ ...editData, email: e.target.value })
                                }
                                placeholder="Email"
                                className="h-7 text-xs bg-transparent border-muted-foreground/20 w-40"
                              />
                            </div>
                          ) : (
                            <>
                              {data.lead.empresa && (
                                <>
                                  <span className="flex items-center gap-1">
                                    <Briefcase className="h-3.5 w-3.5" />
                                    {data.lead.empresa}
                                  </span>
                                  <span className="text-border">•</span>
                                </>
                              )}
                              <span className="truncate">{data.lead.email}</span>
                            </>
                          )}
                        </div>

                        {/* Value Badge */}
                        {(data.lead.valorEstimado ?? 0) > 0 && (
                          <div className="mt-2">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              <Sparkles className="h-3 w-3" />
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format((data.lead.valorEstimado || 0) / 100)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {!isReadOnly && (
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                                onClick={() => setIsEditing(false)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                className="h-9 w-9 bg-primary hover:bg-primary/90"
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
                                className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                onClick={() => setIsEditing(true)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                onClick={() => setShowDeleteConfirm(true)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick Action Bar */}
                    <motion.div
                      className="flex gap-2 mt-5 overflow-x-auto pb-1 scrollbar-hide"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 bg-card/50 border-border/50 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all duration-200"
                        onClick={() => handleQuickAction("ligacao")}
                      >
                        <Phone className="h-4 w-4" />
                        <span className="hidden sm:inline">Ligar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 bg-card/50 border-border/50 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-500 transition-all duration-200"
                        onClick={() => handleQuickAction("whatsapp")}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 bg-card/50 border-border/50 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-500 transition-all duration-200"
                        onClick={() => handleQuickAction("email")}
                      >
                        <Mail className="h-4 w-4" />
                        <span className="hidden sm:inline">Email</span>
                      </Button>
                      {onSchedule && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 gap-2 bg-primary/5 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
                          onClick={() => onSchedule(data?.lead?.nome || "Procedimento")}
                        >
                          <CalendarPlus className="h-4 w-4" />
                          <span className="hidden sm:inline">Agendar</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="h-9 gap-2 ml-auto bg-primary/90 hover:bg-primary shadow-md shadow-primary/20 transition-all duration-200"
                        onClick={() => handleQuickAction("nota")}
                      >
                        <FileText className="h-4 w-4" />
                        <span>Nota</span>
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <div className="px-6 border-b border-border/30 bg-card/30">
                    <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-8">
                      {[
                        { value: "detalhes", label: "Detalhes" },
                        { value: "historico", label: "Histórico" },
                        { value: "chat", label: "Chat" },
                      ].map((tab) => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-0 pb-3 pt-3 -mb-[1px] transition-all duration-200 text-muted-foreground hover:text-foreground data-[state=active]:font-medium"
                        >
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* ScrollArea for Tab Content */}
                  <ScrollArea className="flex-1">
                    <TabsContent value="detalhes" className="p-6 m-0 focus-visible:outline-none">
                      <motion.div
                        className="space-y-6"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                      >
                        {/* Section: Dados Pessoais */}
                        <motion.div variants={sectionVariants} className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                            <User className="h-4 w-4 text-primary" />
                            <h4 className="text-sm font-semibold text-foreground">
                              Dados Pessoais
                            </h4>
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <FieldDisplay
                              label="Data Nasc."
                              value={
                                data.lead.dataNascimento
                                  ? new Date(data.lead.dataNascimento).toLocaleDateString("pt-BR")
                                  : "—"
                              }
                              isEditing={isEditing}
                              editComponent={
                                <Input
                                  type="date"
                                  value={(editData?.dataNascimento as string) || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, dataNascimento: e.target.value })
                                  }
                                  className="bg-background/50 border-border/50 h-9"
                                />
                              }
                            />
                            <FieldDisplay
                              label="Gênero"
                              value={data.lead.genero || "—"}
                              isEditing={isEditing}
                              editComponent={
                                <Select
                                  value={(editData?.genero as string) || ""}
                                  onValueChange={(val) => setEditData({ ...editData, genero: val })}
                                >
                                  <SelectTrigger className="h-9 bg-background/50 border-border/50">
                                    <SelectValue placeholder="—" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Feminino">Feminino</SelectItem>
                                    <SelectItem value="Masculino">Masculino</SelectItem>
                                    <SelectItem value="Outro">Outro</SelectItem>
                                  </SelectContent>
                                </Select>
                              }
                            />
                            <FieldDisplay
                              label="Profissão"
                              value={data.lead.profissao || "—"}
                              isEditing={isEditing}
                              editComponent={
                                <Input
                                  value={(editData?.profissao as string) || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, profissao: e.target.value })
                                  }
                                  className="bg-background/50 border-border/50 h-9"
                                />
                              }
                            />
                            <FieldDisplay
                              label="Telefone"
                              value={data.lead.telefone || "—"}
                              icon={
                                data.lead.telefone ? (
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                ) : undefined
                              }
                              isEditing={isEditing}
                              editComponent={
                                <Input
                                  value={(editData?.telefone as string) || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, telefone: e.target.value })
                                  }
                                  className="bg-background/50 border-border/50 h-9"
                                />
                              }
                            />
                          </div>
                        </motion.div>

                        {/* Section: Anamnese & Interesse */}
                        <motion.div variants={sectionVariants} className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                            <Heart className="h-4 w-4 text-primary" />
                            <h4 className="text-sm font-semibold text-foreground">
                              Anamnese & Interesse
                            </h4>
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <FieldDisplay
                              label="Queixa Principal"
                              value={data.lead.dorPrincipal || "—"}
                              isEditing={isEditing}
                              editComponent={
                                <Input
                                  value={(editData?.dorPrincipal as string) || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, dorPrincipal: e.target.value })
                                  }
                                  className="bg-background/50 border-border/50 h-9"
                                />
                              }
                            />
                            <FieldDisplay
                              label="Desejo Principal"
                              value={data.lead.desejoPrincipal || "—"}
                              isEditing={isEditing}
                              editComponent={
                                <Input
                                  value={(editData?.desejoPrincipal as string) || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, desejoPrincipal: e.target.value })
                                  }
                                  className="bg-background/50 border-border/50 h-9"
                                />
                              }
                            />
                          </div>

                          {/* Procedures of Interest */}
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                              Interesse em
                            </Label>
                            {isEditing ? (
                              <Input
                                value={
                                  Array.isArray(editData?.procedimentosInteresse)
                                    ? (editData.procedimentosInteresse as string[]).join(", ")
                                    : (editData?.procedimentosInteresse as string) || ""
                                }
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    procedimentosInteresse: e.target.value
                                      .split(",")
                                      .map((s: string) => s.trim()),
                                  })
                                }
                                placeholder="Botox, Preenchimento, etc (separar por vírgula)"
                                className="bg-background/50 border-border/50 h-9"
                              />
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {data.lead.procedimentosInteresse &&
                                data.lead.procedimentosInteresse.length > 0 ? (
                                  data.lead.procedimentosInteresse.map(
                                    (proc: string, i: number) => (
                                      <Badge
                                        key={i}
                                        variant="secondary"
                                        className="px-2 py-0.5 text-xs font-normal bg-primary/10 text-primary border-0"
                                      >
                                        {proc}
                                      </Badge>
                                    )
                                  )
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <FieldDisplay
                              label="Histórico Estético"
                              value={data.lead.historicoEstetico || "—"}
                              isEditing={isEditing}
                              editComponent={
                                <Input
                                  value={(editData?.historicoEstetico as string) || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, historicoEstetico: e.target.value })
                                  }
                                  className="bg-background/50 border-border/50 h-9"
                                />
                              }
                            />
                            <FieldDisplay
                              label="Alergias"
                              value={data.lead.alergias || "—"}
                              valueClassName={data.lead.alergias ? "text-destructive" : ""}
                              isEditing={isEditing}
                              editComponent={
                                <Input
                                  value={(editData?.alergias as string) || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, alergias: e.target.value })
                                  }
                                  className="bg-background/50 border-border/50 h-9"
                                />
                              }
                            />
                          </div>
                        </motion.div>

                        {/* Section: Qualificação */}
                        <motion.div variants={sectionVariants} className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                            <Target className="h-4 w-4 text-primary" />
                            <h4 className="text-sm font-semibold text-foreground">Qualificação</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                Temperatura
                              </Label>
                              {isEditing ? (
                                <Select
                                  value={(editData?.temperatura as string) || ""}
                                  onValueChange={(val) =>
                                    setEditData({ ...editData, temperatura: val })
                                  }
                                >
                                  <SelectTrigger className="h-9 bg-background/50 border-border/50">
                                    <SelectValue placeholder="—" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="frio">❄️ Frio</SelectItem>
                                    <SelectItem value="morno">🌤️ Morno</SelectItem>
                                    <SelectItem value="quente">🔥 Quente</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div
                                  className={cn(
                                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
                                    tempConfig.bg,
                                    tempConfig.color
                                  )}
                                >
                                  <ThermometerSun className="h-4 w-4" />
                                  <span className="capitalize">{data.lead.temperatura || "—"}</span>
                                </div>
                              )}
                            </div>
                            <FieldDisplay
                              label="Disponibilidade"
                              value={data.lead.disponibilidade || "—"}
                              isEditing={isEditing}
                              editComponent={
                                <Input
                                  value={(editData?.disponibilidade as string) || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, disponibilidade: e.target.value })
                                  }
                                  placeholder="Ex: Seg a Sex, manhã"
                                  className="bg-background/50 border-border/50 h-9"
                                />
                              }
                            />
                            <FieldDisplay
                              label="Valor Proposta"
                              value={new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format((data.lead.valorEstimado || 0) / 100)}
                              valueClassName="text-emerald-500 font-semibold"
                              isEditing={isEditing}
                              editComponent={
                                <Input
                                  type="number"
                                  value={editData?.valorEstimado as number}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      valorEstimado: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="bg-background/50 border-border/50 h-9"
                                />
                              }
                            />
                            <FieldDisplay
                              label="Indicado Por"
                              value={data.lead.indicadoPor || "—"}
                              isEditing={isEditing}
                              editComponent={
                                <Input
                                  value={(editData?.indicadoPor as string) || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, indicadoPor: e.target.value })
                                  }
                                  className="bg-background/50 border-border/50 h-9"
                                />
                              }
                            />
                          </div>
                        </motion.div>

                        {/* Section: Próximo Acompanhamento */}
                        <motion.div variants={sectionVariants} className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                            <Bell className="h-4 w-4 text-primary" />
                            <h4 className="text-sm font-semibold text-foreground">
                              Acompanhamento
                            </h4>
                          </div>
                          <div className="p-4 rounded-xl bg-card/50 border border-border/30 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Próximo contato</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => onSchedule?.(data.lead.nome)}
                              >
                                <CalendarPlus className="h-3.5 w-3.5 mr-1" />
                                Agendar
                              </Button>
                            </div>
                            <Textarea
                              placeholder="Adicione uma nota rápida sobre o próximo passo..."
                              className="min-h-[80px] bg-background/50 border-border/50 resize-none text-sm"
                              disabled={isReadOnly}
                            />
                          </div>
                        </motion.div>
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="historico" className="p-6 m-0 focus-visible:outline-none">
                      <motion.div
                        className="relative border-l-2 border-border/30 ml-4 space-y-6 min-h-[200px]"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                      >
                        {/* Creation Event */}
                        <motion.div variants={sectionVariants} className="relative pl-6">
                          <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary ring-4 ring-background shadow-md" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">Lead criado</p>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(data.lead.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                            </span>
                          </div>
                        </motion.div>

                        {/* Interactions */}
                        {(
                          data.interacoes as Array<{
                            id: number;
                            tipo: string;
                            createdAt: Date;
                            notas?: string | null;
                            duracao?: number | null;
                          }>
                        ).map((interaction) => (
                          <motion.div
                            key={interaction.id}
                            variants={sectionVariants}
                            className="relative pl-6"
                          >
                            <div className="absolute -left-[13px] top-0 bg-card p-1.5 rounded-full border border-border/50 text-muted-foreground shadow-sm">
                              {getInteractionIcon(interaction.tipo)}
                            </div>
                            <div className="space-y-2 pb-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="capitalize text-[11px] h-5 px-2 font-medium bg-muted/30"
                                  >
                                    {interaction.tipo}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {format(
                                      new Date(interaction.createdAt),
                                      "dd/MM/yyyy 'às' HH:mm"
                                    )}
                                  </span>
                                </div>
                                {interaction.duracao && (
                                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 bg-muted/30 px-2 py-0.5 rounded-full">
                                    <Clock className="h-3 w-3" /> {interaction.duracao}m
                                  </span>
                                )}
                              </div>

                              {interaction.notas && (
                                <div className="bg-muted/20 p-3 rounded-lg text-sm whitespace-pre-line border border-border/20 text-foreground/90">
                                  {interaction.notas}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </TabsContent>

                    <TabsContent
                      value="chat"
                      className="p-0 m-0 h-[calc(100vh-280px)] focus-visible:outline-none"
                    >
                      <LeadChatWindow
                        leadId={leadId!}
                        phone={data?.lead?.telefone || undefined}
                        leadName={data?.lead?.nome}
                      />
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

      {/* Delete Confirmation Dialog */}
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

// Helper component for field display
interface FieldDisplayProps {
  label: string;
  value: string;
  valueClassName?: string;
  icon?: React.ReactNode;
  isEditing: boolean;
  editComponent: React.ReactNode;
}

function FieldDisplay({
  label,
  value,
  valueClassName,
  icon,
  isEditing,
  editComponent,
}: FieldDisplayProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
        {label}
      </Label>
      {isEditing ? (
        editComponent
      ) : (
        <div
          className={cn(
            "text-sm font-medium text-foreground flex items-center gap-1.5",
            valueClassName
          )}
        >
          {icon}
          {value}
        </div>
      )}
    </div>
  );
}
