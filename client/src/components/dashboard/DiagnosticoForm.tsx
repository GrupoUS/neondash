import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Briefcase,
  Clock,
  DollarSign,
  Flame,
  Loader2,
  Rocket,
  Save,
  Star,
  Target,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA - 20 fields organized by discovery call methodology
// ═══════════════════════════════════════════════════════════════════════════

const formSchema = z.object({
  // Section 1: Ponto de Partida (Context)
  atuacaoSaude: z.string().optional(),
  tempoLivre: z.string().optional(),
  jaAtuaEstetica: z.string().optional(),
  temClinica: z.string().optional(),
  // Section 2: Realidade Financeira (Financial Reality)
  rendaMensal: z.string().optional(),
  faturaEstetica: z.string().optional(),
  contas: z.string().optional(),
  custoVida: z.string().optional(),
  capacidadeInvestimento: z.string().optional(),
  // Section 3: Desafios Atuais (Current Challenges)
  incomodaRotina: z.string().optional(),
  dificuldadeCrescer: z.string().optional(),
  tentativasAnteriores: z.string().optional(),
  // Section 4: Visão de Sucesso (Success Vision)
  objetivo6Meses: z.string().optional(),
  resultadoTransformador: z.string().optional(),
  visaoUmAno: z.string().optional(),
  porqueAgora: z.string().optional(),
  // Section 5: Compromisso (Commitment)
  horasDisponiveis: z.string().optional(),
  nivelPrioridade: z.string().optional(),
  redeApoio: z.string().optional(),
  organizacao: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// SECTION CONFIG - Discovery call aligned
// ═══════════════════════════════════════════════════════════════════════════

interface SectionConfig {
  id: string;
  title: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const SECTIONS: SectionConfig[] = [
  {
    id: "context",
    title: "Ponto de Partida",
    icon: Target,
    colorClass: "text-primary",
    bgClass: "bg-primary/5 dark:bg-primary/10",
    borderClass: "border-primary/20",
  },
  {
    id: "financial",
    title: "Realidade Financeira",
    icon: DollarSign,
    colorClass: "text-amber-500 dark:text-amber-400",
    bgClass: "bg-amber-500/5 dark:bg-amber-500/10",
    borderClass: "border-amber-500/20",
  },
  {
    id: "challenges",
    title: "Desafios Atuais",
    icon: Flame,
    colorClass: "text-destructive dark:text-red-400",
    bgClass: "bg-destructive/5 dark:bg-destructive/10",
    borderClass: "border-destructive/20",
  },
  {
    id: "vision",
    title: "Visão de Sucesso",
    icon: Star,
    colorClass: "text-yellow-500 dark:text-yellow-400",
    bgClass: "bg-yellow-500/5 dark:bg-yellow-500/10",
    borderClass: "border-yellow-500/20",
  },
  {
    id: "commitment",
    title: "Compromisso",
    icon: Rocket,
    colorClass: "text-primary",
    bgClass: "bg-primary/5 dark:bg-primary/10",
    borderClass: "border-primary/20",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function DiagnosticoForm({ mentoradoId }: { mentoradoId?: number }) {
  const utils = trpc.useUtils();

  const { data: diagnostico, isLoading } = trpc.diagnostico.get.useQuery(
    { mentoradoId },
    { refetchOnWindowFocus: false }
  );

  const upsertMutation = trpc.diagnostico.upsert.useMutation({
    onSuccess: () => {
      toast.success("Diagnóstico salvo com sucesso!");
      utils.diagnostico.get.invalidate();
    },
    onError: (error) => {
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
      capacidadeInvestimento: "",
      incomodaRotina: "",
      dificuldadeCrescer: "",
      tentativasAnteriores: "",
      objetivo6Meses: "",
      resultadoTransformador: "",
      visaoUmAno: "",
      porqueAgora: "",
      horasDisponiveis: "",
      nivelPrioridade: "",
      redeApoio: "",
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
        capacidadeInvestimento: diagnostico.capacidadeInvestimento || "",
        incomodaRotina: diagnostico.incomodaRotina || "",
        dificuldadeCrescer: diagnostico.dificuldadeCrescer || "",
        tentativasAnteriores: diagnostico.tentativasAnteriores || "",
        objetivo6Meses: diagnostico.objetivo6Meses || "",
        resultadoTransformador: diagnostico.resultadoTransformador || "",
        visaoUmAno: diagnostico.visaoUmAno || "",
        porqueAgora: diagnostico.porqueAgora || "",
        horasDisponiveis: diagnostico.horasDisponiveis || "",
        nivelPrioridade: diagnostico.nivelPrioridade || "",
        redeApoio: diagnostico.redeApoio || "",
        organizacao: diagnostico.organizacao || "",
      });
    }
  }, [diagnostico, form]);

  // Calculate progress - use watch() to trigger re-render on form changes
  const watchedFields = form.watch();
  const progress = useMemo(() => {
    const fields = Object.keys(formSchema.shape);
    const filled = fields.filter((key) => {
      const value = watchedFields[key as keyof FormValues];
      return value && value.trim().length > 0;
    }).length;
    return Math.round((filled / fields.length) * 100);
  }, [watchedFields]);

  function onSubmit(values: FormValues) {
    upsertMutation.mutate({ ...values, mentoradoId });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Progress Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border"
        >
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">Diagnóstico Inicial</h3>
            <p className="text-sm text-muted-foreground">
              Preencha para nos ajudar a entender seu momento atual
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="w-24 h-2" />
            <span className="text-sm font-medium text-muted-foreground">{progress}%</span>
          </div>
        </motion.div>

        {/* Form Sections - Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(380px,1fr))] gap-6 transition-all duration-300 ease-in-out">
          {/* Section 1: Ponto de Partida */}
          <div className="h-full">
            <SectionCard section={SECTIONS[0]} delay={0.1}>
              <FormField
                control={form.control}
                name="atuacaoSaude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qual sua formação ou área de atuação?</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Biomédica, Enfermeira, Esteticista..." {...field} />
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
                    <FormLabel>Quanto tempo livre você tem por semana?</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 10 horas, Apenas finais de semana..." {...field} />
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
                      <Input placeholder="Sim, Próprio / Alugado / Atendo a domicílio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionCard>
          </div>

          {/* Section 2: Realidade Financeira */}
          <div className="h-full">
            <SectionCard section={SECTIONS[1]} delay={0.15}>
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
                    <FormLabel>Valor das contas mensais (fixo + variável)?</FormLabel>
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
              <FormField
                control={form.control}
                name="capacidadeInvestimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade de investimento mensal?</FormLabel>
                    <FormDescription>Quanto você pode investir no seu negócio</FormDescription>
                    <FormControl>
                      <Input placeholder="R$ 0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionCard>
          </div>

          {/* Section 3: Desafios Atuais */}
          <div className="h-full">
            <SectionCard section={SECTIONS[2]} delay={0.2}>
              <FormField
                control={form.control}
                name="incomodaRotina"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qual seu maior desafio neste momento?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o que mais te incomoda na sua rotina hoje..."
                        className="min-h-24 resize-none"
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
                    <FormLabel>Qual sua maior dificuldade para crescer?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Falta de clientes, Gestão, Vendas..."
                        className="min-h-24 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tentativasAnteriores"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>O que você já tentou que não funcionou?</FormLabel>
                    <FormDescription>Cursos, mentorias, estratégias anteriores</FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva suas tentativas anteriores..."
                        className="min-h-24 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionCard>
          </div>

          {/* Section 4: Visão de Sucesso */}
          <div className="h-full">
            <SectionCard section={SECTIONS[3]} delay={0.25}>
              <FormField
                control={form.control}
                name="objetivo6Meses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qual seu principal objetivo para os próximos 6 meses?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="O que você quer conquistar?"
                        className="min-h-24 resize-none"
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
                      Se a mentoria fosse um sucesso total, como seria sua vida?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva seu cenário ideal..."
                        className="min-h-24 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visaoUmAno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Onde você se vê daqui a 1 ano?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva sua visão de 1 ano..."
                        className="min-h-20 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="porqueAgora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Por que agora é o momento certo?</FormLabel>
                    <FormDescription>O que te fez decidir buscar ajuda agora?</FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="O que mudou para você agir agora..."
                        className="min-h-20 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionCard>
          </div>

          {/* Section 5: Compromisso */}
          <div className="h-full">
            <SectionCard section={SECTIONS[4]} delay={0.3}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="horasDisponiveis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Quantas horas por semana você pode dedicar?
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 5-10 horas, 20+ horas..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nivelPrioridade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>De 1 a 10, qual sua prioridade neste projeto?</FormLabel>
                      <FormDescription>10 = prioridade máxima</FormDescription>
                      <FormControl>
                        <Input placeholder="1 a 10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="redeApoio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Você tem uma rede de apoio?</FormLabel>
                      <FormDescription>
                        Família, parceiro(a), sócio(a) que apoia você
                      </FormDescription>
                      <FormControl>
                        <Input placeholder="Quem te apoia nessa jornada?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Como você pretende se organizar?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tirar do papel os fundamentos, sem antecipar estratégias..."
                          className="min-h-20 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex justify-end pt-4"
        >
          <Button
            type="submit"
            disabled={upsertMutation.isPending}
            size="lg"
            className="min-w-48 shadow-lg hover:shadow-primary/20 transition-all"
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
        </motion.div>
      </form>
    </Form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface SectionCardProps {
  section: SectionConfig;
  delay?: number;
  children: React.ReactNode;
}

function SectionCard({ section, delay = 0, children }: SectionCardProps) {
  const Icon = section.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="h-full"
    >
      <Card
        className={cn(
          "h-full transition-all duration-300 ease-in-out hover:shadow-md",
          section.bgClass,
          section.borderClass
        )}
      >
        <CardHeader className="pb-4">
          <CardTitle className={cn("flex items-center gap-3", section.colorClass)}>
            <div className={cn("p-2 rounded-lg", section.bgClass)}>
              <Icon className="w-5 h-5" />
            </div>
            {section.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">{children}</CardContent>
      </Card>
    </motion.div>
  );
}
