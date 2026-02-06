import {
  Activity,
  Calendar,
  Camera,
  Clock,
  FileText,
  MessageSquare,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

interface TimelineEvent {
  id: number;
  type: "procedimento" | "foto" | "documento" | "chat";
  title: string;
  description: string | null;
  date: Date | string | null;
  metadata?: Record<string, unknown>;
}

interface PatientProcedure {
  id: number;
  nomeProcedimento: string;
  dataRealizacao: Date | string | null;
  profissionalResponsavel: string | null;
  valorCobrado: number | null;
  observacoes: string | null;
}

interface ProcedureFormState {
  nomeProcedimento: string;
  dataRealizacao: string;
  profissionalResponsavel: string;
  valorCobrado: string;
  observacoes: string;
}

interface PatientTimelineProps {
  patientId: number;
}

const eventIcons: Record<TimelineEvent["type"], typeof Activity> = {
  procedimento: Activity,
  foto: Camera,
  documento: FileText,
  chat: MessageSquare,
};

const eventColors: Record<TimelineEvent["type"], string> = {
  procedimento: "bg-primary text-primary-foreground",
  foto: "bg-blue-500 text-white",
  documento: "bg-green-500 text-white",
  chat: "bg-purple-500 text-white",
};

const createEmptyProcedureForm = (): ProcedureFormState => ({
  nomeProcedimento: "",
  dataRealizacao: new Date().toISOString().slice(0, 10),
  profissionalResponsavel: "",
  valorCobrado: "",
  observacoes: "",
});

export function PatientTimeline({ patientId }: PatientTimelineProps) {
  const [filter, setFilter] = useState<"all" | TimelineEvent["type"]>("all");
  const [isProcedureDialogOpen, setIsProcedureDialogOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<PatientProcedure | null>(null);
  const [procedureToDelete, setProcedureToDelete] = useState<PatientProcedure | null>(null);
  const [procedureForm, setProcedureForm] = useState<ProcedureFormState>(() =>
    createEmptyProcedureForm()
  );

  const utils = trpc.useUtils();

  const { data: timeline, isLoading } = trpc.pacientes.getTimeline.useQuery(
    { pacienteId: patientId },
    { staleTime: 30_000 }
  );

  const { data: procedimentosData } = trpc.pacientes.procedimentos.list.useQuery(
    { pacienteId: patientId },
    { staleTime: 30_000 }
  );

  const procedimentos = (procedimentosData ?? []) as unknown as PatientProcedure[];

  const procedureById = useMemo(
    () => new Map(procedimentos.map((procedure) => [procedure.id, procedure])),
    [procedimentos]
  );

  const invalidatePatientProcedureViews = async () => {
    await Promise.all([
      utils.pacientes.getById.invalidate({ id: patientId }),
      utils.pacientes.getTimeline.invalidate({ pacienteId: patientId }),
      utils.pacientes.procedimentos.list.invalidate({ pacienteId: patientId }),
    ]);
  };

  const createProcedureMutation = trpc.pacientes.procedimentos.create.useMutation({
    onSuccess: () => {
      toast.success("Procedimento criado");
      closeProcedureDialog();
      void invalidatePatientProcedureViews();
    },
    onError: (error) => toast.error(error.message || "Erro ao criar procedimento"),
  });

  const updateProcedureMutation = trpc.pacientes.procedimentos.update.useMutation({
    onSuccess: () => {
      toast.success("Procedimento atualizado");
      closeProcedureDialog();
      void invalidatePatientProcedureViews();
    },
    onError: (error) => toast.error(error.message || "Erro ao atualizar procedimento"),
  });

  const deleteProcedureMutation = trpc.pacientes.procedimentos.delete.useMutation({
    onSuccess: () => {
      toast.success("Procedimento removido");
      setProcedureToDelete(null);
      void invalidatePatientProcedureViews();
    },
    onError: (error) => toast.error(error.message || "Erro ao remover procedimento"),
  });

  const events = useMemo(
    () =>
      (timeline ?? []).map(
        (item): TimelineEvent => ({
          id: item.id,
          type: item.tipo as TimelineEvent["type"],
          title: item.titulo ?? "Sem título",
          description: item.descricao,
          date: item.data ?? new Date(),
          metadata:
            "metadata" in item && item.metadata && typeof item.metadata === "object"
              ? (item.metadata as Record<string, unknown>)
              : undefined,
        })
      ),
    [timeline]
  );

  const filteredEvents =
    filter === "all" ? events : events.filter((event) => event.type === filter);

  const groupedByMonth = filteredEvents.reduce(
    (acc: Record<string, TimelineEvent[]>, event) => {
      const dateValue = event.date ?? new Date();
      const monthKey = new Date(dateValue).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(event);
      return acc;
    },
    {} as Record<string, TimelineEvent[]>
  );

  const parseCurrencyToCents = (value: string) => {
    if (!value.trim()) return null;

    const normalized = Number(value.replace(",", "."));
    if (Number.isNaN(normalized) || normalized < 0) return undefined;
    return Math.round(normalized * 100);
  };

  const formatDateForInput = (value: Date | string | null) => {
    if (!value) return new Date().toISOString().slice(0, 10);
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
    return parsed.toISOString().slice(0, 10);
  };

  const getProcedureFromEvent = (event: TimelineEvent): PatientProcedure => {
    const existing = procedureById.get(event.id);
    if (existing) return existing;

    return {
      id: event.id,
      nomeProcedimento: event.title,
      dataRealizacao: event.date,
      profissionalResponsavel: null,
      valorCobrado: null,
      observacoes: event.description,
    };
  };

  const openCreateDialog = () => {
    setEditingProcedure(null);
    setProcedureForm(createEmptyProcedureForm());
    setIsProcedureDialogOpen(true);
  };

  const openEditDialog = (procedure: PatientProcedure) => {
    setEditingProcedure(procedure);
    setProcedureForm({
      nomeProcedimento: procedure.nomeProcedimento,
      dataRealizacao: formatDateForInput(procedure.dataRealizacao),
      profissionalResponsavel: procedure.profissionalResponsavel ?? "",
      valorCobrado:
        typeof procedure.valorCobrado === "number" ? (procedure.valorCobrado / 100).toString() : "",
      observacoes: procedure.observacoes ?? "",
    });
    setIsProcedureDialogOpen(true);
  };

  const closeProcedureDialog = () => {
    setIsProcedureDialogOpen(false);
    setEditingProcedure(null);
    setProcedureForm(createEmptyProcedureForm());
  };

  const handleSubmitProcedure = () => {
    if (!procedureForm.nomeProcedimento.trim()) {
      toast.error("Informe o nome do procedimento");
      return;
    }

    if (!procedureForm.dataRealizacao) {
      toast.error("Informe a data de realização");
      return;
    }

    const valorCobrado = parseCurrencyToCents(procedureForm.valorCobrado);
    if (valorCobrado === undefined) {
      toast.error("Valor cobrado inválido");
      return;
    }

    const payload = {
      pacienteId: patientId,
      nomeProcedimento: procedureForm.nomeProcedimento.trim(),
      dataRealizacao: procedureForm.dataRealizacao,
      profissionalResponsavel: procedureForm.profissionalResponsavel.trim() || null,
      valorCobrado,
      observacoes: procedureForm.observacoes.trim() || null,
    };

    if (editingProcedure) {
      updateProcedureMutation.mutate({
        id: editingProcedure.id,
        ...payload,
      });
      return;
    }

    createProcedureMutation.mutate(payload);
  };

  const isSavingProcedure = createProcedureMutation.isPending || updateProcedureMutation.isPending;

  return (
    <>
      <Card className="border-primary/10">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Linha do Tempo
            </CardTitle>
            <CardDescription>Histórico cronológico de atividades</CardDescription>
          </div>

          <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="procedimento">Procedimentos</SelectItem>
                <SelectItem value="foto">Fotos</SelectItem>
                <SelectItem value="documento">Documentos</SelectItem>
                <SelectItem value="chat">Chat IA</SelectItem>
              </SelectContent>
            </Select>

            <Button size="sm" className="gap-1.5" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Novo Procedimento
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma atividade registrada</p>
              {(filter === "all" || filter === "procedimento") && (
                <Button variant="outline" size="sm" className="mt-4" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar primeiro procedimento
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedByMonth).map(([month, monthEvents]) => (
                <div key={month}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-4 capitalize">
                    {month}
                  </h3>

                  <div className="relative space-y-6 pl-8 border-l-2 border-muted">
                    {monthEvents.map((event) => {
                      const Icon = eventIcons[event.type];
                      const isProcedureEvent = event.type === "procedimento";
                      const procedure = isProcedureEvent ? getProcedureFromEvent(event) : null;

                      return (
                        <div key={`${event.type}-${event.id}`} className="relative">
                          <div
                            className={`absolute -left-[calc(1rem+5px)] p-2 rounded-full ${eventColors[event.type]}`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{event.title}</p>
                                {event.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {event.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <Badge variant="outline" className="shrink-0">
                                  {new Date(event.date ?? new Date()).toLocaleDateString("pt-BR", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </Badge>

                                {isProcedureEvent && procedure && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => openEditDialog(procedure)}
                                      aria-label={`Editar ${procedure.nomeProcedimento}`}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={() => setProcedureToDelete(procedure)}
                                      aria-label={`Excluir ${procedure.nomeProcedimento}`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>

                            {event.metadata && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {event.type === "procedimento" &&
                                typeof event.metadata.valor === "number" ? (
                                  <Badge variant="secondary" className="text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    {new Intl.NumberFormat("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    }).format(event.metadata.valor / 100)}
                                  </Badge>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isProcedureDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeProcedureDialog();
            return;
          }
          setIsProcedureDialogOpen(true);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProcedure ? "Editar Procedimento" : "Novo Procedimento"}
            </DialogTitle>
            <DialogDescription>
              {editingProcedure
                ? "Atualize os dados do procedimento para manter o prontuário completo."
                : "Registre um novo procedimento para atualizar timeline e indicadores do paciente."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="procedure-name">Nome do procedimento *</Label>
              <Input
                id="procedure-name"
                name="nomeProcedimento"
                value={procedureForm.nomeProcedimento}
                onChange={(event) =>
                  setProcedureForm((current) => ({
                    ...current,
                    nomeProcedimento: event.target.value,
                  }))
                }
                placeholder="Ex: Toxina Botulínica"
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="procedure-date">Data *</Label>
                <Input
                  id="procedure-date"
                  type="date"
                  name="dataRealizacao"
                  value={procedureForm.dataRealizacao}
                  onChange={(event) =>
                    setProcedureForm((current) => ({
                      ...current,
                      dataRealizacao: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="procedure-value">Valor cobrado (R$)</Label>
                <Input
                  id="procedure-value"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  name="valorCobrado"
                  value={procedureForm.valorCobrado}
                  onChange={(event) =>
                    setProcedureForm((current) => ({
                      ...current,
                      valorCobrado: event.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedure-professional">Profissional responsável</Label>
              <Input
                id="procedure-professional"
                name="profissionalResponsavel"
                value={procedureForm.profissionalResponsavel}
                onChange={(event) =>
                  setProcedureForm((current) => ({
                    ...current,
                    profissionalResponsavel: event.target.value,
                  }))
                }
                placeholder="Nome do profissional"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedure-observacoes">Observações</Label>
              <Textarea
                id="procedure-observacoes"
                name="observacoes"
                rows={3}
                value={procedureForm.observacoes}
                onChange={(event) =>
                  setProcedureForm((current) => ({
                    ...current,
                    observacoes: event.target.value,
                  }))
                }
                placeholder="Detalhes importantes sobre o procedimento..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeProcedureDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitProcedure} disabled={isSavingProcedure}>
              {isSavingProcedure
                ? "Salvando..."
                : editingProcedure
                  ? "Salvar Alterações"
                  : "Criar Procedimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!procedureToDelete}
        onOpenChange={(open) => {
          if (!open) setProcedureToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir procedimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá "{procedureToDelete?.nomeProcedimento}" do prontuário e da linha do
              tempo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProcedureMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProcedureMutation.isPending}
              onClick={() => {
                if (!procedureToDelete) return;
                deleteProcedureMutation.mutate({
                  id: procedureToDelete.id,
                  pacienteId: patientId,
                });
              }}
            >
              {deleteProcedureMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
