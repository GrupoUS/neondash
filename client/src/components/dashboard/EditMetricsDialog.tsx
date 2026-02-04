import { Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SubmitMetricsForm } from "./SubmitMetricsForm";

interface EditMetricsDialogProps {
  ano: number;
  mes: number;
  /** Optional trigger, defaults to icon button */
  trigger?: React.ReactNode;
}

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/**
 * Dialog for editing past month metrics.
 * Wraps SubmitMetricsForm in a dialog triggered by an edit button.
 */
export function EditMetricsDialog({ ano, mes, trigger }: EditMetricsDialogProps) {
  const [open, setOpen] = useState(false);
  const mesNome = MESES[mes - 1];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary/10 cursor-pointer"
            aria-label={`Editar métricas de ${mesNome}/${ano}`}
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Métricas</DialogTitle>
          <DialogDescription>
            Editando métricas de {mesNome}/{ano}
          </DialogDescription>
        </DialogHeader>

        <EditableMetricsForm ano={ano} mes={mes} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Wrapper that passes fixed ano/mes to SubmitMetricsForm
 * and disables period change.
 */
function EditableMetricsForm({
  ano,
  mes,
  onSuccess,
}: {
  ano: number;
  mes: number;
  onSuccess: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
        <strong>Período:</strong> {MESES[mes - 1]}/{ano}
      </div>
      <SubmitMetricsForm
        onSuccess={onSuccess}
        className="bg-transparent"
        defaultAno={ano}
        defaultMes={mes}
        lockPeriod
      />
    </div>
  );
}
