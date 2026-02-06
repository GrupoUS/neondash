import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const objectionFormSchema = z.object({
  objection: z.string().min(1, "A objeção é obrigatória"),
});

type ObjectionFormValues = z.infer<typeof objectionFormSchema>;

interface AddObjectionDialogProps {
  leadId: number;
  currentObjections?: string[] | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddObjectionDialog({
  leadId,
  currentObjections = [],
  isOpen,
  onClose,
  onSuccess,
}: AddObjectionDialogProps) {
  const trpcUtils = trpc.useUtils();
  const form = useForm<ObjectionFormValues>({
    resolver: zodResolver(objectionFormSchema),
    defaultValues: {
      objection: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ objection: "" });
    }
  }, [isOpen, form]);

  const updateMutation = trpc.leads.update.useMutation({
    onSuccess: () => {
      toast.success("Objeção registrada!");
      trpcUtils.leads.list.invalidate();
      trpcUtils.leads.getById.invalidate({ id: leadId });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: () => {
      toast.error("Erro ao registrar objeção");
    },
  });

  const onSubmit = (values: ObjectionFormValues) => {
    const newObjections = [...(currentObjections || []), values.objection];
    updateMutation.mutate({
      id: leadId,
      objecoes: newObjections,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Registrar Objeção
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="objection"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qual foi a objeção?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Cliente achou o valor acima do orçamento..."
                      className="min-h-[100px] bg-background/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
