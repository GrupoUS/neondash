import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Save } from "lucide-react";
import { useEffect } from "react";

const formSchema = z.object({
  atuacaoSaude: z.string().optional(),
  tempoLivre: z.string().optional(),
  jaAtuaEstetica: z.string().optional(),
  temClinica: z.string().optional(),
  rendaMensal: z.string().optional(),
  faturaEstetica: z.string().optional(),
  contas: z.string().optional(),
  custoVida: z.string().optional(),
  incomodaRotina: z.string().optional(),
  dificuldadeCrescer: z.string().optional(),
  objetivo6Meses: z.string().optional(),
  resultadoTransformador: z.string().optional(),
  organizacao: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function DiagnosticoForm({ mentoradoId }: { mentoradoId?: number }) {
  const utils = trpc.useUtils();

  // Optimized single query
  const { data: diagnostico, isLoading } = trpc.diagnostico.get.useQuery(
    { mentoradoId },
    {
      // Refetch when mentoradoId changes, or on mount
      refetchOnWindowFocus: false,
    }
  );

  const upsertMutation = trpc.diagnostico.upsert.useMutation({
    onSuccess: () => {
      toast.success("Diagnóstico salvo com sucesso!");
      // Invalidate both potential queries to be safe
      utils.diagnostico.get.invalidate();
    },
    onError: error => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      atuacaoSaude: "",
      tempoLivre: "",
      jaAtuaEstetica: "",
      temClinica: "",
      rendaMensal: "",
      faturaEstetica: "",
      contas: "",
      custoVida: "",
      incomodaRotina: "",
      dificuldadeCrescer: "",
      objetivo6Meses: "",
      resultadoTransformador: "",
      organizacao: "",
    },
  });

  useEffect(() => {
    if (diagnostico) {
      form.reset({
        atuacaoSaude: diagnostico.atuacaoSaude || "",
        tempoLivre: diagnostico.tempoLivre || "",
        jaAtuaEstetica: diagnostico.jaAtuaEstetica || "",
        temClinica: diagnostico.temClinica || "",
        rendaMensal: diagnostico.rendaMensal || "",
        faturaEstetica: diagnostico.faturaEstetica || "",
        contas: diagnostico.contas || "",
        custoVida: diagnostico.custoVida || "",
        incomodaRotina: diagnostico.incomodaRotina || "",
        dificuldadeCrescer: diagnostico.dificuldadeCrescer || "",
        objetivo6Meses: diagnostico.objetivo6Meses || "",
        resultadoTransformador: diagnostico.resultadoTransformador || "",
        organizacao: diagnostico.organizacao || "",
      });
    }
  }, [diagnostico, form]);

  function onSubmit(values: FormValues) {
    upsertMutation.mutate({ ...values, mentoradoId });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Sobre o Momento Atual */}
          <Card className="border-neon-purple/20 bg-neon-purple/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neon-purple-light">
                <CheckCircle2 className="w-5 h-5" />
                Sobre o Momento Atual Profissional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="atuacaoSaude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qual sua área de atuação na saúde?</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Biomédica, Enfermeira..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tempoLivre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Quanto tempo livre você tem por semana?
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 10 horas, Apenas finais de semana..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jaAtuaEstetica"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Você já atua na estética?</FormLabel>
                    <FormControl>
                      <Input placeholder="Sim/Não/Iniciando" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="temClinica"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Possui clínica ou consultório?</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Sim, Próprio / Alugado / Atendo a domicílio"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Card 2: Resultados Atuais */}
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="text-blue-400">
                Resultados Atuais (Financeiro)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="rendaMensal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qual sua renda mensal atual (aprox)?</FormLabel>
                    <FormControl>
                      <Input placeholder="R$ 0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="faturaEstetica"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quanto você já fatura com estética?</FormLabel>
                    <FormControl>
                      <Input placeholder="R$ 0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Valor contas mensais (fixo + variável)?
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="R$ 0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="custoVida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qual seria seu custo de vida ideal?</FormLabel>
                    <FormControl>
                      <Input placeholder="R$ 0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Card 3: Dores e Desafios */}
          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-red-400">Dores e Desafios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="incomodaRotina"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      O que mais te incomoda na sua rotina hoje?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva suas frustrações..."
                        className="h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dificuldadeCrescer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Qual sua maior dificuldade para crescer?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Falta de clientes, Gestão, Vendas..."
                        className="h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Card 4: Objetivos e Sonhos */}
          <Card className="border-neon-gold/20 bg-neon-gold/5">
            <CardHeader>
              <CardTitle className="text-neon-gold">
                Objetivos e Sonhos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="objetivo6Meses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Qual seu principal objetivo para os próximos 6 meses?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="O que você quer conquistar?"
                        className="h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resultadoTransformador"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Qual resultado seria transformador para você agora?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="O que mudaria o jogo?"
                        className="h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Card 5: Primeiros Passos */}
          <Card className="md:col-span-2 border-neon-pink/20 bg-neon-pink/5">
            <CardHeader>
              <CardTitle className="text-neon-pink">
                5. Primeiros Passos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="organizacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organização</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tirar do papel os fundamentos, sem antecipar estratégias..."
                        className="h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            disabled={upsertMutation.isPending}
            className="bg-neon-blue hover:bg-neon-blue-dark text-white font-bold py-6 px-8 text-lg shadow-lg hover:shadow-neon-blue/20 transition-all"
          >
            {upsertMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Salvar Diagnóstico
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
