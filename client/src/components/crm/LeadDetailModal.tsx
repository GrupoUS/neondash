import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Phone, Mail, MessageSquare, Calendar, FileText, 
  MapPin, Clock, Edit2, Trash2, CheckCircle2 
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AddInteractionDialog } from "./AddInteractionDialog";

interface LeadDetailModalProps {
  leadId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadDetailModal({ leadId, isOpen, onClose }: LeadDetailModalProps) {
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [interactionType, setInteractionType] = useState<any>("nota");

  const { data, isLoading, refetch } = trpc.leads.getById.useQuery(
    { id: leadId! },
    { enabled: !!leadId }
  );

  const handleQuickAction = (type: string) => {
    setInteractionType(type);
    setInteractionDialogOpen(true);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "novo": return "bg-blue-500";
      case "em_contato": return "bg-purple-500";
      case "fechado_ganho": return "bg-green-500";
      case "perdido": return "bg-red-500";
      default: return "bg-gray-500";
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
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
          {isLoading ? (
            <div className="p-10 flex justify-center">Carregando...</div>
          ) : data ? (
            <>
              <DialogHeader className="p-6 pb-4 border-b">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <DialogTitle className="text-2xl">{data.lead.nome}</DialogTitle>
                      <Badge className={getStatusColor(data.lead.status)}>
                        {data.lead.status}
                      </Badge>
                    </div>
                    <DialogDescription className="text-base flex items-center gap-2">
                      {data.lead.empresa && <span>{data.lead.empresa} •</span>}
                      <span>{data.lead.email}</span>
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {/* Edit */}}>
                      <Edit2 className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                <main className="flex-1 overflow-hidden flex flex-col">
                  <Tabs defaultValue="historico" className="flex-1 flex flex-col">
                    <div className="px-6 pt-4">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                            <TabsTrigger 
                                value="historico" 
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2"
                            >
                                Histórico
                            </TabsTrigger>
                            <TabsTrigger 
                                value="detalhes" 
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2"
                            >
                                Detalhes
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="historico" className="flex-1 overflow-hidden flex flex-col mt-0">
                        <ScrollArea className="flex-1 p-6">
                            <div className="relative border-l border-muted ml-4 space-y-8 pb-10">
                                {data.interacoes.map((interaction) => (
                                    <div key={interaction.id} className="relative pl-8">
                                        <div className="absolute -left-[9px] top-1 bg-background p-1 rounded-full border">
                                            {getInteractionIcon(interaction.tipo)}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="capitalize">
                                                    {interaction.tipo}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(interaction.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                                                </span>
                                            </div>
                                            {interaction.notas && (
                                                <div className="bg-muted/40 p-3 rounded-lg text-sm whitespace-pre-line">
                                                    {interaction.notas}
                                                </div>
                                            )}
                                            {interaction.duracao && (
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Duração: {interaction.duracao} min
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="relative pl-8">
                                    <div className="absolute -left-[9px] top-1 bg-primary text-primary-foreground p-1 rounded-full">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Lead criado</p>
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(data.lead.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="detalhes" className="p-6 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Valor Estimado</Label>
                                <div className="text-lg font-medium">
                                    {data.lead.valorEstimado 
                                        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.lead.valorEstimado)
                                        : "Não definido"}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Origem</Label>
                                <div className="capitalize">{data.lead.origem}</div>
                            </div>
                            <div className="space-y-2">
                                <Label>Telefone</Label>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    {data.lead.telefone || "-"}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Tags</Label>
                                <div className="flex flex-wrap gap-2">
                                    {data.lead.tags?.map(tag => (
                                        <Badge key={tag} variant="secondary">{tag}</Badge>
                                    )) || "-"}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                  </Tabs>
                </main>

                <aside className="border-t md:border-t-0 md:border-l bg-muted/10 p-6 w-full md:w-64 space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Ações Rápidas</h4>
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                    <Button variant="outline" className="justify-start" onClick={() => handleQuickAction("ligacao")}>
                        <Phone className="h-4 w-4 mr-2" /> Registrar Ligação
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => handleQuickAction("whatsapp")}>
                        <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => handleQuickAction("email")}>
                        <Mail className="h-4 w-4 mr-2" /> Email
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => handleQuickAction("reuniao")}>
                        <Calendar className="h-4 w-4 mr-2" /> Agendar
                    </Button>
                    <Button variant="default" className="justify-start" onClick={() => handleQuickAction("nota")}>
                        <FileText className="h-4 w-4 mr-2" /> Adicionar Nota
                    </Button>
                  </div>
                </aside>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

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
