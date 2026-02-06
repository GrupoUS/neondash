/**
 * DeletePatientDialog - Confirmation dialog for patient deletion
 */

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface DeletePatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: number;
  patientName: string;
  onSuccess?: () => void;
}

export function DeletePatientDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  onSuccess,
}: DeletePatientDialogProps) {
  const utils = trpc.useUtils();

  const deleteMutation = trpc.pacientes.delete.useMutation({
    onSuccess: () => {
      toast.success("Paciente removido com sucesso");
      utils.pacientes.list.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message || "Erro ao remover paciente"),
  });

  const handleDelete = () => {
    deleteMutation.mutate({ id: patientId });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Remover Paciente
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover <strong>{patientName}</strong>?
            <br />
            <br />
            Esta ação irá remover permanentemente:
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li>Dados cadastrais e informações médicas</li>
              <li>Histórico de procedimentos</li>
              <li>Fotos e documentos</li>
              <li>Conversas com IA</li>
            </ul>
            <br />
            <span className="text-destructive font-medium">Esta ação não pode ser desfeita.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Remover Paciente
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
