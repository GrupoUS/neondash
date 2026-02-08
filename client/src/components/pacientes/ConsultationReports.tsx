/**
 * ConsultationReports - Timeline of consultation reports for patient progression tracking
 * Displays date-stamped observations per appointment with CRUD operations
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, ClipboardList, Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

const reportSchema = z.object({
  dataConsulta: z.string().min(1, "Data é obrigatória"),
  observacao: z.string().min(1, "Observação é obrigatória"),
});

type ReportFormValues = z.infer<typeof reportSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ConsultationReportsProps {
  patientId: number;
}

interface EditingReport {
  id: number;
  dataConsulta: string;
  observacao: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function formatDateBR(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem. atrás`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
  return `${Math.floor(diffDays / 365)} anos atrás`;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ConsultationReports({ patientId }: ConsultationReportsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EditingReport | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data: reports = [], isLoading } = trpc.pacientes.relatorios.list.useQuery(
    { pacienteId: patientId },
    { enabled: !!patientId }
  );

  const createMutation = trpc.pacientes.relatorios.create.useMutation({
    onSuccess: () => {
      toast.success("Relatório adicionado");
      utils.pacientes.relatorios.list.invalidate({ pacienteId: patientId });
      utils.pacientes.getById.invalidate({ id: patientId });
      closeDialog();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.pacientes.relatorios.update.useMutation({
    onSuccess: () => {
      toast.success("Relatório atualizado");
      utils.pacientes.relatorios.list.invalidate({ pacienteId: patientId });
      utils.pacientes.getById.invalidate({ id: patientId });
      closeDialog();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.pacientes.relatorios.delete.useMutation({
    onSuccess: () => {
      toast.success("Relatório removido");
      utils.pacientes.relatorios.list.invalidate({ pacienteId: patientId });
      utils.pacientes.getById.invalidate({ id: patientId });
      setDeletingId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { dataConsulta: "", observacao: "" },
  });

  function openCreate() {
    setEditing(null);
    form.reset({
      dataConsulta: new Date().toISOString().slice(0, 10),
      observacao: "",
    });
    setDialogOpen(true);
  }

  function openEdit(report: EditingReport) {
    setEditing(report);
    form.reset({
      dataConsulta: report.dataConsulta,
      observacao: report.observacao,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    form.reset();
  }

  function onSubmit(values: ReportFormValues) {
    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        pacienteId: patientId,
        ...values,
      });
    } else {
      createMutation.mutate({
        pacienteId: patientId,
        ...values,
      });
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Relatórios de Consulta</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {reports.length}
            </Badge>
          </div>
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nova Consulta
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Carregando...
            </div>
          ) : reports.length === 0 ? (
            <EmptyState onAdd={openCreate} />
          ) : (
            <ScrollArea className={reports.length > 4 ? "h-[420px]" : ""}>
              <div className="space-y-0">
                {reports.map((report, index) => (
                  <TimelineEntry
                    key={report.id}
                    report={report}
                    isLast={index === reports.length - 1}
                    onEdit={() =>
                      openEdit({
                        id: report.id,
                        dataConsulta: report.dataConsulta,
                        observacao: report.observacao,
                      })
                    }
                    onDelete={() => setDeletingId(report.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-primary" />
              {editing ? "Editar Relatório" : "Novo Relatório de Consulta"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Atualize as informações deste relatório."
                : "Registre a data e as observações desta consulta."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="dataConsulta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Consulta</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva as observações, evolução do paciente, procedimentos realizados..."
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Salvando..." : editing ? "Salvar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingId) {
                  deleteMutation.mutate({ id: deletingId, pacienteId: patientId });
                }
              }}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <ClipboardList className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="mb-1 text-sm font-medium text-foreground">Nenhum relatório de consulta</p>
      <p className="mb-4 max-w-[260px] text-xs text-muted-foreground">
        Registre as consultas do paciente para acompanhar sua evolução ao longo do tempo.
      </p>
      <Button size="sm" variant="outline" onClick={onAdd} className="gap-1.5">
        <CalendarPlus className="h-4 w-4" />
        Registrar Primeira Consulta
      </Button>
    </div>
  );
}

interface TimelineEntryProps {
  report: {
    id: number;
    dataConsulta: string;
    observacao: string;
    createdAt: string | Date;
  };
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function TimelineEntry({ report, isLast, onEdit, onDelete }: TimelineEntryProps) {
  return (
    <div className="group relative flex gap-4 pb-6 last:pb-0">
      {/* Timeline connector line */}
      {!isLast && <div className="absolute bottom-0 left-[11px] top-7 w-px bg-border" />}

      {/* Timeline dot */}
      <div className="relative z-10 mt-1.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background">
        <div className="h-2 w-2 rounded-full bg-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-sm font-semibold text-foreground">
              {formatDateBR(report.dataConsulta)}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              {getRelativeTime(report.dataConsulta)}
            </span>
          </div>

          {/* Actions — visible on hover */}
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {report.observacao}
        </p>
      </div>
    </div>
  );
}
