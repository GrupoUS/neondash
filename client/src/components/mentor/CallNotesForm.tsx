import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PenLine, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const callNotesSchema = z.object({
  principaisInsights: z.string().min(10, "Insights devem ter pelo menos 10 caracteres"),
  acoesAcordadas: z.string().min(10, "Ações devem ter pelo menos 10 caracteres"),
  proximosPassos: z.string().min(10, "Próximos passos devem ter pelo menos 10 caracteres"),
});

type CallNotesFormData = z.infer<typeof callNotesSchema>;

interface CallNotesFormProps {
  mentoradoId: number;
  onSuccess?: () => void;
}

export function CallNotesForm({ mentoradoId, onSuccess }: CallNotesFormProps) {
  const [, setLocation] = useLocation();

  const form = useForm<CallNotesFormData>({
    resolver: zodResolver(callNotesSchema),
    defaultValues: {
      principaisInsights: "",
      acoesAcordadas: "",
      proximosPassos: "",
    },
  });

  const saveNotes = trpc.mentor.saveCallNotes.useMutation({
    onSuccess: () => {
      toast.success("Notas salvas ✓");
      form.reset();
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate back to mentorados list
        setLocation("/admin/mentorados");
      }
    },
    onError: (error) => {
      toast.error(`Erro ao salvar notas: ${error.message}`);
    },
  });

  const onSubmit = (data: CallNotesFormData) => {
    saveNotes.mutate({
      mentoradoId,
      dataCall: new Date(),
      ...data,
    });
  };

  return (
    <Card className="border-2 border-dashed border-amber-300 dark:border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <PenLine className="h-4 w-4" />
          Notas desta Call
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="principaisInsights"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 dark:text-slate-300">
                    Principais Insights
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="O que você observou durante a call..."
                      className="min-h-[80px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acoesAcordadas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 dark:text-slate-300">
                    Ações Acordadas
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Lista de ações que o mentorado se comprometeu..."
                      className="min-h-[80px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proximosPassos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 dark:text-slate-300">
                    Próximos Passos
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="O que acompanhar na próxima call..."
                      className="min-h-[80px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full py-3.5 bg-primary hover:bg-primary/90"
              disabled={saveNotes.isPending}
            >
              {saveNotes.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Notas da Call
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
