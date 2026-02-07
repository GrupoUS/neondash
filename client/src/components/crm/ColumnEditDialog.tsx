import { zodResolver } from "@hookform/resolvers/zod";
import { GripVertical } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";

const columnSchema = z.object({
  originalId: z.string(),
  label: z.string().min(1, "Nome é obrigatório"),
  color: z.string(),
  visible: z.boolean(), // We map "sim"/"nao" to boolean for UI
  order: z.number(),
});

const configSchema = z.object({
  columns: z.array(columnSchema),
});

type ConfigFormValues = z.infer<typeof configSchema>;

interface ColumnEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultColumns: { id: string; title: string; color: string }[];
  mentoradoId?: number; // Admin can edit columns for any mentorado
}

export function ColumnEditDialog({
  isOpen,
  onClose,
  defaultColumns,
  mentoradoId,
}: ColumnEditDialogProps) {
  const trpcUtils = trpc.useUtils();
  const { data: storedColumns } = trpc.crmColumns.list.useQuery(
    mentoradoId ? { mentoradoId } : undefined,
    { enabled: isOpen }
  );

  const saveMutation = trpc.crmColumns.save.useMutation({
    onSuccess: () => {
      toast.success("Colunas atualizadas com sucesso!");
      trpcUtils.crmColumns.list.invalidate();
      onClose();
    },
    onError: (err) => {
      toast.error(`Erro ao salvar: ${err.message}`);
    },
  });

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      columns: [],
    },
  });

  const { fields, replace, move } = useFieldArray({
    control: form.control,
    name: "columns",
  });

  useEffect(() => {
    if (isOpen) {
      // Merge default columns with stored columns
      // If stored exists, use its preference. If not, use default.
      // But we must respect the order if stored.

      const merged: ConfigFormValues["columns"] = defaultColumns.map((defCol, index) => {
        const stored = storedColumns?.find((c) => c.originalId === defCol.id);
        if (stored) {
          return {
            originalId: stored.originalId,
            label: stored.label,
            color: stored.color,
            visible: stored.visible === "sim",
            order: stored.order,
          };
        }
        return {
          originalId: defCol.id,
          label: defCol.title,
          color: defCol.color,
          visible: true,
          order: index, // Default order
        };
      });

      // Sort by order if we have stored data, otherwise keep default order
      if (storedColumns && storedColumns.length > 0) {
        merged.sort((a, b) => a.order - b.order);
      }

      replace(merged);
    }
  }, [isOpen, storedColumns, defaultColumns, replace]);

  const onSubmit = (values: ConfigFormValues) => {
    // Convert back to API format
    const payload = values.columns.map((col, index) => ({
      originalId: col.originalId,
      label: col.label,
      color: col.color,
      visible: (col.visible ? "sim" : "nao") as "sim" | "nao",
      order: index, // Save current index as order
    }));

    saveMutation.mutate({ columns: payload, mentoradoId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Colunas do Pipeline</DialogTitle>
          <DialogDescription>
            Personalize os nomes, visibilidade e ordem das colunas do seu CRM.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center gap-3 p-3 border rounded-md bg-card"
                >
                  <div className="cursor-grab text-muted-foreground hover:text-foreground">
                    {/* Simple drag handle visual, actual drag logic requires dnd-kit but simple up/down buttons or just order input works too.
                       For now, let's just list them. Adding drag-drop is AT-009 or here.
                       Let's stick to simple form first. Reordering might be tricky without dnd-kit here.
                       Actually, we can use simple 'Move Up' / 'Move Down' buttons if needed, or just let them edit properties for now.
                       The prompt implies "Dynamic Columns", so reordering is key.
                       For MVP in this dialog, let's add basic Up/Down buttons.
                   */}
                    <GripVertical className="h-5 w-5" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <FormField
                      control={form.control}
                      name={`columns.${index}.label`}
                      render={({ field }) => <Input {...field} className="h-8" />}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`columns.${index}.visible`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        {/* <FormLabel className="text-xs">Visível</FormLabel> */}
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    >
                      <span className="sr-only">Move Up</span>↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, index + 1)}
                    >
                      <span className="sr-only">Move Down</span>↓
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
