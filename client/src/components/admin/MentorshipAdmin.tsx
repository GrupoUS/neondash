"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardList,
  Edit3,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════
// FORM SCHEMA
// ═══════════════════════════════════════════════════════════════════════════
const sessionFormSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  summary: z.string().min(1, "Resumo da sessão é obrigatório"),
  sessionDate: z.string().optional(),
  actionItems: z
    .array(
      z.object({
        id: z.number().optional(),
        description: z.string().min(1, "Descrição é obrigatória"),
        dueDate: z.string().optional(),
      })
    )
    .default([]),
});

type SessionFormValues = z.infer<typeof sessionFormSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export function MentorshipAdmin() {
  const [selectedMentoradoId, setSelectedMentoradoId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);

  // Fetch mentorados list for selector
  const { data: mentorados, isLoading: isLoadingMentorados } = trpc.mentorados.list.useQuery();

  // Fetch sessions when mentorado is selected
  const { data: sessions, isLoading: isLoadingSessions } = trpc.mentorship.listByMentorado.useQuery(
    { mentoradoId: selectedMentoradoId ?? 0 },
    { enabled: selectedMentoradoId !== null }
  );

  // Mutations
  const createSession = trpc.mentorship.createSession.useMutation({
    onSuccess: () => {
      toast.success("Sessão criada com sucesso!");
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateSession = trpc.mentorship.updateSession.useMutation({
    onSuccess: () => {
      toast.success("Sessão atualizada com sucesso!");
      setIsDialogOpen(false);
      setEditingSessionId(null);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Form - use type assertion to fix deep type instantiation error
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema) as never,
    defaultValues: {
      title: "",
      summary: "",
      sessionDate: new Date().toISOString(),
      actionItems: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control as never,
    name: "actionItems",
  });

  // Filter mentorados
  const filteredMentorados = mentorados?.filter((m) =>
    m.nomeCompleto.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle form submit
  const onSubmit = (values: SessionFormValues) => {
    if (!selectedMentoradoId) {
      toast.error("Selecione um mentorado primeiro");
      return;
    }

    if (editingSessionId) {
      updateSession.mutate({
        sessionId: editingSessionId,
        ...values,
      });
    } else {
      createSession.mutate({
        mentoradoId: selectedMentoradoId,
        ...values,
      });
    }
  };

  // Open dialog for editing
  const openEditDialog = (session: NonNullable<typeof sessions>[number]) => {
    setEditingSessionId(session.id);
    form.reset({
      title: session.title,
      summary: session.summary,
      sessionDate: session.sessionDate ? new Date(session.sessionDate).toISOString() : undefined,
      actionItems: session.actionItems.map((item) => ({
        id: item.id,
        description: item.description,
        dueDate: item.dueDate ?? undefined,
      })),
    });
    setIsDialogOpen(true);
  };

  // Open dialog for new session
  const openNewSessionDialog = () => {
    setEditingSessionId(null);
    form.reset({
      title: "",
      summary: "",
      sessionDate: new Date().toISOString(),
      actionItems: [],
    });
    setIsDialogOpen(true);
  };

  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Mentee Selector - Left Panel */}
      <Card className="lg:col-span-4 border-none bg-card/40 backdrop-blur-md shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-primary" />
            Selecionar Mentorado
          </CardTitle>
          <CardDescription>Escolha para ver e gerenciar sessões</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mentorado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Users List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {isLoadingMentorados ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                filteredMentorados?.map((mentorado) => (
                  <button
                    type="button"
                    key={mentorado.id}
                    onClick={() => setSelectedMentoradoId(mentorado.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                      "hover:bg-muted/60",
                      selectedMentoradoId === mentorado.id && "bg-primary/10 ring-1 ring-primary/30"
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {mentorado.nomeCompleto.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{mentorado.nomeCompleto}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {mentorado.turma?.replace("_", " ")}
                      </p>
                    </div>
                    {selectedMentoradoId === mentorado.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Sessions Panel - Right */}
      <Card className="lg:col-span-8 border-none bg-card/40 backdrop-blur-md shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="w-5 h-5 text-primary" />
              Sessões de Mentoria
            </CardTitle>
            <CardDescription>
              {selectedMentoradoId
                ? `${sessions?.length || 0} sessões registradas`
                : "Selecione um mentorado para ver sessões"}
            </CardDescription>
          </div>

          {selectedMentoradoId && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewSessionDialog} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Sessão
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingSessionId ? "Editar Sessão" : "Nova Sessão de Mentoria"}
                  </DialogTitle>
                  <DialogDescription>
                    Registre os detalhes da sessão e action items
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título da Sessão</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Revisão de Metas Q1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="summary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resumo / Anotações</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Resumo do que foi discutido, insights, próximos passos..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Action Items */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel>Action Items</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => append({ description: "", dueDate: "" })}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>

                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex gap-2 items-start p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex-1 space-y-2">
                            <FormField
                              control={form.control}
                              name={`actionItems.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Descrição da tarefa" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`actionItems.${index}.dueDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createSession.isPending || updateSession.isPending}
                      >
                        {createSession.isPending || updateSession.isPending
                          ? "Salvando..."
                          : editingSessionId
                            ? "Salvar Alterações"
                            : "Criar Sessão"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>

        <CardContent>
          {!selectedMentoradoId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <User className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum mentorado selecionado</p>
              <p className="text-sm">Selecione um mentorado na lista à esquerda</p>
            </div>
          ) : isLoadingSessions ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : sessions?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <ClipboardList className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma sessão registrada</p>
              <p className="text-sm">Clique em "Nova Sessão" para começar</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4 pr-4">
                {sessions?.map((session) => (
                  <Collapsible key={session.id} className="group">
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
                              {session.actionItems.length} itens
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(session);
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
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
                                    className="flex items-center gap-3 p-2 rounded-md bg-muted/30"
                                  >
                                    {item.status === "completed" ? (
                                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                    ) : (
                                      <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    )}
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
                                      variant={
                                        item.status === "completed" ? "default" : "secondary"
                                      }
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
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
