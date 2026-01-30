import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { 
  Phone, Mail, MessageSquare, Calendar, FileText, 
  Clock, Edit2, Trash2, CheckCircle2 
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { AddInteractionDialog } from "./AddInteractionDialog";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect } from "react";

interface LeadDetailModalProps {
  leadId: number | null;
  isOpen: boolean;
  onClose: () => void;
  isReadOnly?: boolean;
}

export function LeadDetailModal({ leadId, isOpen, onClose, isReadOnly = false }: LeadDetailModalProps) {
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [interactionType, setInteractionType] = useState<any>("nota");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const utils = trpc.useUtils();

  const { data, isLoading, refetch } = trpc.leads.getById.useQuery(
    { id: leadId! },
    { enabled: !!leadId }
  );

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
      toast.error("Erro ao atualizar lead: " + error.message);
    }
  });

  const handleSave = () => {
    if (!editData.nome || !editData.email) {
      toast.error("Nome e Email são obrigatórios");
      return;
    }
    updateMutation.mutate({
      id: leadId!,
      ...editData,
      valorEstimado: Math.round(editData.valorEstimado * 100),
    });
  };

  const handleQuickAction = (type: string) => {
    setInteractionType(type);
    setInteractionDialogOpen(true);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "novo": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "primeiro_contato": return "bg-orange-400/10 text-orange-400 border-orange-400/20";
      case "qualificado": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "proposta": return "bg-orange-600/10 text-orange-600 border-orange-600/20";
      case "negociacao": return "bg-pink-500/10 text-pink-500 border-pink-500/20";
      case "fechado": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "perdido": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "ligacao": return <Phone className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      case "whatsapp": return <MessageSquare className="h-4 w-4" />;
      case "reuniao": return <Calendar className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (!leadId) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-[100%] sm:w-[540px] md:w-[600px] p-0 gap-0 sm:max-w-[600px] bg-card border-l border-border/40 shadow-2xl">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : data ? (
            <>
              {/* Header Fixado */}
              <div className="p-6 pb-4 border-b bg-background z-10">
                <SheetHeader className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isEditing ? (
                          <Input 
                            value={editData.nome}
                            onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                            className="text-2xl font-bold tracking-tight h-auto py-1 px-2 -ml-2 bg-transparent border-primary/20 focus:border-primary"
                          />
                        ) : (
                          <SheetTitle className="text-2xl font-bold tracking-tight">{data.lead.nome}</SheetTitle>
                        )}
                        <Badge variant="outline" className={getStatusColor(isEditing ? editData.status : data.lead.status)}>
                          {isEditing ? (
                            <Select 
                              value={editData.status} 
                              onValueChange={(val) => setEditData({ ...editData, status: val })}
                            >
                              <SelectTrigger className="h-6 border-none p-0 bg-transparent focus:ring-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="novo">Novo</SelectItem>
                                <SelectItem value="primeiro_contato">Contato</SelectItem>
                                <SelectItem value="qualificado">Qualificado</SelectItem>
                                <SelectItem value="proposta">Proposta</SelectItem>
                                <SelectItem value="negociacao">Negociação</SelectItem>
                                <SelectItem value="fechado">Fechado</SelectItem>
                                <SelectItem value="perdido">Perdido</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            data.lead.status ? data.lead.status.replace(/_/g, " ") : "Novo"
                          )}
                        </Badge>
                      </div>
                      <SheetDescription className="text-base flex items-center gap-2">
                         {isEditing ? (
                           <>
                            <Input 
                              value={editData.empresa}
                              onChange={(e) => setEditData({ ...editData, empresa: e.target.value })}
                              placeholder="Empresa"
                              className="h-8 py-0 px-2 bg-transparent border-muted-foreground/20"
                            />
                            <Input 
                              value={editData.email}
                              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                              placeholder="Email"
                              className="h-8 py-0 px-2 bg-transparent border-muted-foreground/20"
                            />
                           </>
                         ) : (
                           <>
                            {data.lead.empresa && <span className="font-medium text-foreground/80">{data.lead.empresa}</span>}
                            {data.lead.empresa && <span className="text-muted-foreground">•</span>}
                            <span>{data.lead.email}</span>
                           </>
                         )}
                      </SheetDescription>
                    </div>
                    
                    {!isReadOnly && (
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                                Cancelar
                              </Button>
                              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? "Salvando..." : "Salvar"}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                    )}
                  </div>
                  
                  {/* Action Bar */}
                   <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar md:pb-0">
                      <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed border-muted-foreground/30 bg-muted/20" onClick={() => handleQuickAction("ligacao")}>
                          <Phone className="h-3.5 w-3.5" /> Ligar
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed border-muted-foreground/30 bg-muted/20" onClick={() => handleQuickAction("whatsapp")}>
                          <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed border-muted-foreground/30 bg-muted/20" onClick={() => handleQuickAction("email")}>
                          <Mail className="h-3.5 w-3.5" /> Email
                      </Button>
                       <Button variant="default" size="sm" className="h-8 gap-2 ml-auto" onClick={() => handleQuickAction("nota")}>
                          <FileText className="h-3.5 w-3.5" /> Nota
                      </Button>
                   </div>
                </SheetHeader>
              </div>

              {/* Main Scrollable Content */}
              <ScrollArea className="flex-1 h-full">
                <div className="flex flex-col h-full">
                   <Tabs defaultValue="detalhes" className="w-full">
                      <div className="px-6 border-b">
                          <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6">
                             <TabsTrigger 
                                  value="detalhes" 
                                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 -mb-[2px] transition-none"
                              >
                                  Detalhes
                              </TabsTrigger>
                              <TabsTrigger 
                                  value="historico" 
                                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 -mb-[2px] transition-none"
                              >
                                  Histórico
                              </TabsTrigger>
                          </TabsList>
                      </div>

                      <TabsContent value="detalhes" className="p-6 m-0 space-y-8 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                          {/* Info Grid */}
                          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                              <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Valor Estimado</Label>
                                  {isEditing ? (
                                    <Input 
                                      type="number"
                                      value={editData.valorEstimado}
                                      onChange={(e) => setEditData({ ...editData, valorEstimado: parseFloat(e.target.value) })}
                                      className="bg-transparent border-muted-foreground/20"
                                    />
                                  ) : (
                                    <div className="text-xl font-medium tracking-tight">
                                        {data.lead.valorEstimado 
                                            ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.lead.valorEstimado / 100)
                                            : <span className="text-muted-foreground text-base">Não definido</span>}
                                    </div>
                                  )}
                              </div>
                              <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Origem</Label>
                                  {isEditing ? (
                                    <Select 
                                      value={editData.origem} 
                                      onValueChange={(val) => setEditData({ ...editData, origem: val })}
                                    >
                                      <SelectTrigger className="bg-transparent border-muted-foreground/20">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                        <SelectItem value="instagram">Instagram</SelectItem>
                                        <SelectItem value="google">Google</SelectItem>
                                        <SelectItem value="indicacao">Indicação</SelectItem>
                                        <SelectItem value="site">Site</SelectItem>
                                        <SelectItem value="outro">Outro</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <div className="capitalize font-medium">{data.lead.origem || "-"}</div>
                                  )}
                              </div>
                              <div className="space-y-1 col-span-2">
                                  <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Telefone</Label>
                                  {isEditing ? (
                                    <Input 
                                      value={editData.telefone}
                                      onChange={(e) => setEditData({ ...editData, telefone: e.target.value })}
                                      placeholder="(00) 00000-0000"
                                      className="bg-transparent border-muted-foreground/20"
                                    />
                                  ) : (
                                    <div className="flex items-center gap-2 font-medium">
                                        {data.lead.telefone ? (
                                          <>
                                             <Phone className="h-4 w-4 text-muted-foreground" />
                                             <span>{data.lead.telefone}</span>
                                          </>
                                        ) : "-"}
                                    </div>
                                  )}
                              </div>
                              <div className="space-y-3 col-span-2">
                                  <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Tags</Label>
                                  {isEditing ? (
                                    <Input 
                                      value={editData.tags.join(", ")}
                                      onChange={(e) => setEditData({ ...editData, tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                                      placeholder="tag1, tag2..."
                                      className="bg-transparent border-muted-foreground/20"
                                    />
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {data.lead.tags?.length ? data.lead.tags.map(tag => (
                                            <Badge key={tag} variant="secondary" className="px-2 py-0.5 text-xs font-normal border-transparent bg-secondary/50 hover:bg-secondary">
                                              {tag}
                                            </Badge>
                                        )) : <span className="text-sm text-muted-foreground italic">Sem tags</span>}
                                    </div>
                                  )}
                              </div>
                          </div>
                      </TabsContent>

                      <TabsContent value="historico" className="p-0 m-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                          <div className="relative border-l border-border/50 ml-8 my-6 space-y-8 pr-6 min-h-[200px]">
                              {/* Create Event */}
                              <div className="relative pl-6">
                                  <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                                  <div className="space-y-1">
                                      <p className="text-sm font-medium leading-none">Lead criado</p>
                                      <span className="text-xs text-muted-foreground">
                                          {format(new Date(data.lead.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                                      </span>
                                  </div>
                              </div>

                              {/* Interactions */}
                              {(data.interacoes as Array<{ id: number; tipo: string; createdAt: Date; notas?: string | null; duracao?: number | null }>).map((interaction) => (
                                  <div key={interaction.id} className="relative pl-6">
                                      <div className="absolute -left-[9px] top-0 bg-background p-1 rounded-full border border-border/50 text-muted-foreground">
                                          {getInteractionIcon(interaction.tipo)}
                                      </div>
                                      <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="capitalize text-[10px] h-5 px-1.5 font-normal">
                                                    {interaction.tipo}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(interaction.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                                                </span>
                                            </div>
                                            {interaction.duracao && (
                                              <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted/30 px-1.5 py-0.5 rounded">
                                                  <Clock className="h-3 w-3" /> {interaction.duracao}m
                                              </span>
                                            )}
                                          </div>
                                          
                                          {interaction.notas && (
                                              <div className="bg-muted/30 p-3 rounded-lg text-sm whitespace-pre-line border border-border/30">
                                                  {interaction.notas}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </TabsContent>
                   </Tabs>
                </div>
              </ScrollArea>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <AddInteractionDialog 
        leadId={leadId!}
        isOpen={interactionDialogOpen}
        onClose={() => setInteractionDialogOpen(false)}
        defaultType={interactionType}
        onSuccess={() => refetch()}
      />
    </>
  );
}
