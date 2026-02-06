import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Heart,
  Loader2,
  MapPin,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AnimatedProgressBar } from "@/components/ui/animated-progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { formatCEP, formatCPF, formatPhone } from "@/lib/patient-validators";
import { trpc } from "@/lib/trpc";

// Schema definition matching backend
const formSchema = z.object({
  nomeCompleto: z.string().min(1, "Nome é obrigatório"),
  nomePreferido: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  dataNascimento: z.string().optional(),
  genero: z.enum(["masculino", "feminino", "outro", "prefiro_nao_dizer"]).optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),

  // Address
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),

  // Insurance
  convenio: z.string().optional(),
  numeroCarteirinha: z.string().optional(),
  observacoes: z.string().optional(),

  // Medical
  infoMedica: z
    .object({
      tipoSanguineo: z.string().optional(),
      alergias: z.string().optional(),
      medicamentosAtuais: z.string().optional(),
    })
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddPatientWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  {
    id: 1,
    title: "Dados Pessoais",
    description: "Informações básicas do paciente",
    icon: User,
  },
  {
    id: 2,
    title: "Contato & Endereço",
    description: "Formas de contato e localização",
    icon: MapPin,
  },
  {
    id: 3,
    title: "Convênio & Docs",
    description: "Plano de saúde e documentos",
    icon: FileText,
  },
  {
    id: 4,
    title: "Ficha Médica",
    description: "Histórico e informações de saúde",
    icon: Heart,
  },
];

// Field wrapper for consistent styling
function FormField({
  label,
  required,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-primary ml-0.5">*</span>}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && (
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-destructive flex items-center gap-1"
        >
          {error}
        </motion.span>
      )}
    </div>
  );
}

export function AddPatientWizard({ open, onOpenChange }: AddPatientWizardProps) {
  const [step, setStep] = useState(1);
  const utils = trpc.useContext();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCompleto: "",
      genero: "prefiro_nao_dizer",
    },
  });

  const createMutation = trpc.pacientes.create.useMutation({
    onSuccess: () => {
      toast.success("Sucesso!", {
        description: "Paciente cadastrado com sucesso.",
      });
      utils.pacientes.list.invalidate();
      onOpenChange(false);
      form.reset();
      setStep(1);
    },
    onError: (error) => {
      toast.error("Erro ao criar paciente", {
        description: error.message || "Ocorreu um erro inesperado.",
      });
    },
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (step === 1) fieldsToValidate = ["nomeCompleto", "cpf", "dataNascimento"];

    const valid = await form.trigger(
      fieldsToValidate as ("nomeCompleto" | "cpf" | "dataNascimento")[]
    );
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const onSubmit = (data: FormValues) => {
    createMutation.mutate({
      ...data,
      email: data.email || null,
    });
  };

  // Calculate progress percentage
  const progressPercent = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[90vw] lg:max-w-[1500px] w-[95vw] p-0 overflow-hidden bg-background border-border/60 gap-0 shadow-2xl"
        aria-describedby="add-patient-description"
      >
        <DialogTitle className="sr-only">Cadastrar Novo Paciente</DialogTitle>
        <div id="add-patient-description" className="sr-only">
          Formulário para cadastrar um novo paciente com dados pessoais, contato, convênio e ficha
          médica.
        </div>

        <div className="flex h-auto min-h-[600px] max-h-[90vh]">
          {/* Enhanced Sidebar */}
          <div className="w-[320px] shrink-0 bg-gradient-to-b from-card to-card/95 border-r border-border/60 p-8 hidden lg:flex lg:flex-col">
            {/* Header */}
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-1 ring-primary/20 shadow-lg shadow-primary/5">
                  <UserPlus className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">
                    Novo Paciente
                  </h2>
                  <p className="text-sm text-muted-foreground">Preencha os dados abaixo</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Progresso do cadastro</span>
                  <span className="font-bold text-primary tabular-nums">
                    {step} de {STEPS.length}
                  </span>
                </div>
                <AnimatedProgressBar value={progressPercent} size="lg" className="h-2" />
              </div>
            </div>

            {/* Steps */}
            <div className="flex-1 space-y-1">
              {STEPS.map((s, index) => {
                const isActive = step === s.id;
                const isCompleted = step > s.id;
                const isLast = index === STEPS.length - 1;

                return (
                  <div key={s.id} className="relative">
                    {/* Connector line */}
                    {!isLast && (
                      <div
                        className={`absolute left-6 top-[68px] w-0.5 h-4 transition-colors duration-300 ${
                          isCompleted ? "bg-primary" : "bg-border/60"
                        }`}
                      />
                    )}

                    <motion.button
                      type="button"
                      onClick={() => {
                        if (isCompleted) setStep(s.id);
                      }}
                      className={`
                        w-full flex items-start gap-4 p-4 rounded-2xl text-left transition-all duration-200
                        ${isActive ? "bg-primary/10 ring-2 ring-primary/30 shadow-lg shadow-primary/5" : "hover:bg-muted/60"}
                        ${isCompleted ? "cursor-pointer" : "cursor-default"}
                      `}
                      whileHover={isCompleted ? { scale: 1.02 } : {}}
                      whileTap={isCompleted ? { scale: 0.98 } : {}}
                    >
                      {/* Step indicator */}
                      <div
                        className={`
                          relative flex items-center justify-center w-12 h-12 rounded-2xl shrink-0
                          transition-all duration-300
                          ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-xl shadow-primary/30"
                              : isCompleted
                                ? "bg-primary/20 text-primary"
                                : "bg-muted/80 text-muted-foreground"
                          }
                        `}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <s.icon className="w-5 h-5" />
                        )}

                        {/* Active pulse effect */}
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 rounded-2xl bg-primary/30"
                            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                          />
                        )}
                      </div>

                      {/* Step text */}
                      <div className="flex-1 min-w-0 py-0.5">
                        <p
                          className={`font-semibold transition-colors ${
                            isActive ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {s.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {s.description}
                        </p>
                      </div>
                    </motion.button>
                  </div>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-muted/40 to-muted/20 border border-border/40">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Campos com <span className="text-primary font-semibold">*</span> são obrigatórios.
                  Os demais podem ser preenchidos posteriormente.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Mobile step indicator */}
            <div className="lg:hidden p-5 border-b border-border/60 bg-card/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg text-foreground">{STEPS[step - 1].title}</h2>
                <span className="text-sm font-medium text-muted-foreground tabular-nums">
                  {step}/{STEPS.length}
                </span>
              </div>
              <AnimatedProgressBar value={progressPercent} size="md" />
            </div>

            {/* Form content */}
            <div className="flex-1 p-8 lg:p-10 overflow-y-auto">
              {/* Step header */}
              <div className="mb-10 hidden lg:block">
                <div className="flex items-center gap-4 mb-2">
                  {(() => {
                    const StepIcon = STEPS[step - 1].icon;
                    return (
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <StepIcon className="w-6 h-6 text-primary" />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-3xl font-bold text-foreground tracking-tight">
                      {STEPS[step - 1].title}
                    </h3>
                    <p className="text-muted-foreground text-lg">{STEPS[step - 1].description}</p>
                  </div>
                </div>
              </div>

              <form id="wizard-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="space-y-8"
                  >
                    {step === 1 && (
                      <div className="space-y-12">
                        {/* Section: Identificação */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <h4 className="text-lg font-semibold text-foreground">Identificação</h4>
                          </div>

                          <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-12 lg:col-span-8">
                              <FormField
                                label="Nome Completo"
                                required
                                error={form.formState.errors.nomeCompleto?.message}
                              >
                                <Input
                                  {...form.register("nomeCompleto")}
                                  placeholder="Ex: Maria Silva Santos"
                                  className="h-12 text-base px-4"
                                />
                              </FormField>
                            </div>

                            <div className="col-span-12 lg:col-span-4">
                              <FormField label="Nome Preferido" hint="Como gosta de ser chamado(a)">
                                <Input
                                  {...form.register("nomePreferido")}
                                  placeholder="Ex: Mari"
                                  className="h-12 text-base"
                                />
                              </FormField>
                            </div>

                            <div className="col-span-12 md:col-span-6 lg:col-span-4">
                              <FormField label="Data de Nascimento">
                                <Input
                                  type="date"
                                  {...form.register("dataNascimento")}
                                  className="h-12 text-base"
                                />
                              </FormField>
                            </div>

                            <div className="col-span-12 md:col-span-6 lg:col-span-4">
                              <FormField label="Gênero">
                                <Select
                                  onValueChange={(val) =>
                                    form.setValue(
                                      "genero",
                                      val as
                                        | "masculino"
                                        | "feminino"
                                        | "outro"
                                        | "prefiro_nao_dizer"
                                    )
                                  }
                                  defaultValue={form.getValues("genero")}
                                >
                                  <SelectTrigger className="h-12 text-base">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="feminino">Feminino</SelectItem>
                                    <SelectItem value="masculino">Masculino</SelectItem>
                                    <SelectItem value="outro">Outro</SelectItem>
                                    <SelectItem value="prefiro_nao_dizer">
                                      Prefiro não dizer
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormField>
                            </div>
                          </div>
                        </div>

                        {/* Section: Documentação */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <h4 className="text-lg font-semibold text-foreground">Documentação</h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <FormField label="CPF" hint="Digite apenas números">
                              <Input
                                {...form.register("cpf")}
                                placeholder="000.000.000-00"
                                onChange={(e) => form.setValue("cpf", formatCPF(e.target.value))}
                                className="h-12 text-base font-mono"
                              />
                            </FormField>

                            <FormField label="RG" hint="Registro Geral">
                              <Input
                                {...form.register("rg")}
                                placeholder="00.000.000-0"
                                className="h-12 text-base font-mono"
                              />
                            </FormField>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField label="E-mail">
                            <Input
                              {...form.register("email")}
                              type="email"
                              placeholder="paciente@email.com"
                              className="h-12 text-base"
                            />
                          </FormField>

                          <FormField label="Telefone / WhatsApp">
                            <Input
                              {...form.register("telefone")}
                              placeholder="(00) 00000-0000"
                              onChange={(e) =>
                                form.setValue("telefone", formatPhone(e.target.value))
                              }
                              className="h-12 text-base font-mono"
                            />
                          </FormField>
                        </div>

                        {/* Divider */}
                        <div className="relative py-6">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-border/60" />
                          </div>
                          <div className="relative flex justify-center">
                            <span className="bg-background px-4 py-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                              Endereço
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          <FormField label="CEP">
                            <Input
                              {...form.register("cep")}
                              placeholder="00000-000"
                              onChange={(e) => {
                                const val = formatCEP(e.target.value);
                                form.setValue("cep", val);
                              }}
                              className="h-12 text-base font-mono"
                            />
                          </FormField>

                          <FormField label="Cidade" className="lg:col-span-2">
                            <Input
                              {...form.register("cidade")}
                              placeholder="Nome da cidade"
                              className="h-12 text-base"
                            />
                          </FormField>

                          <FormField label="UF">
                            <Input
                              {...form.register("estado")}
                              placeholder="SP"
                              maxLength={2}
                              className="h-12 text-base uppercase font-mono"
                            />
                          </FormField>
                        </div>

                        <FormField label="Logradouro">
                          <Input
                            {...form.register("logradouro")}
                            placeholder="Rua, Avenida, etc."
                            className="h-12 text-base"
                          />
                        </FormField>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                          <FormField label="Número">
                            <Input
                              {...form.register("numero")}
                              placeholder="123"
                              className="h-12 text-base"
                            />
                          </FormField>

                          <FormField label="Complemento">
                            <Input
                              {...form.register("complemento")}
                              placeholder="Apt 101"
                              className="h-12 text-base"
                            />
                          </FormField>

                          <FormField label="Bairro" className="sm:col-span-1 lg:col-span-2">
                            <Input
                              {...form.register("bairro")}
                              placeholder="Nome do bairro"
                              className="h-12 text-base"
                            />
                          </FormField>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-8">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-muted/40 to-muted/20 border border-border/50">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Informações sobre plano de saúde e anotações gerais. Esses dados podem
                            ser atualizados posteriormente.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField label="Convênio">
                            <Input
                              {...form.register("convenio")}
                              placeholder="Ex: Unimed, Bradesco Saúde"
                              className="h-12 text-base"
                            />
                          </FormField>

                          <FormField label="Número da Carteirinha">
                            <Input
                              {...form.register("numeroCarteirinha")}
                              placeholder="000000000000"
                              className="h-12 text-base font-mono"
                            />
                          </FormField>
                        </div>

                        <FormField label="Observações Gerais" hint="Notas livres sobre o paciente">
                          <Textarea
                            {...form.register("observacoes")}
                            placeholder="Preferências, avisos importantes, etc."
                            rows={6}
                            className="resize-none text-base min-h-[160px]"
                          />
                        </FormField>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="space-y-8">
                        <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/20">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">Importante:</strong> Informações
                            médicas são confidenciais e essenciais para um atendimento seguro.
                          </p>
                        </div>

                        <FormField label="Tipo Sanguíneo" className="max-w-xs">
                          <Select
                            onValueChange={(val) => form.setValue("infoMedica.tipoSanguineo", val)}
                          >
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A+">A+</SelectItem>
                              <SelectItem value="A-">A-</SelectItem>
                              <SelectItem value="B+">B+</SelectItem>
                              <SelectItem value="B-">B-</SelectItem>
                              <SelectItem value="AB+">AB+</SelectItem>
                              <SelectItem value="AB-">AB-</SelectItem>
                              <SelectItem value="O+">O+</SelectItem>
                              <SelectItem value="O-">O-</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormField>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            label="Alergias Conhecidas"
                            hint="Medicamentos, alimentos, materiais..."
                          >
                            <Textarea
                              {...form.register("infoMedica.alergias")}
                              placeholder="Liste alergias conhecidas ou digite 'Nenhuma conhecida'"
                              rows={4}
                              className="resize-none text-base min-h-[120px]"
                            />
                          </FormField>

                          <FormField label="Medicamentos em Uso" hint="Medicação de uso contínuo">
                            <Textarea
                              {...form.register("infoMedica.medicamentosAtuais")}
                              placeholder="Liste medicamentos em uso ou digite 'Nenhum'"
                              rows={4}
                              className="resize-none text-base min-h-[120px]"
                            />
                          </FormField>
                        </div>

                        {/* Final confirmation */}
                        <motion.div
                          className="mt-10 p-8 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-3xl border-2 border-primary/20 shadow-xl shadow-primary/5"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="flex flex-col sm:flex-row items-start gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center shrink-0 shadow-lg shadow-primary/10">
                              <Check className="w-8 h-8 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-foreground mb-2">
                                Pronto para finalizar?
                              </h4>
                              <p className="text-muted-foreground mb-6 leading-relaxed">
                                Revise as informações e clique em salvar para cadastrar o paciente.
                              </p>
                              <Button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="h-12 px-10 text-base font-semibold shadow-lg shadow-primary/20"
                                size="lg"
                              >
                                {createMutation.isPending ? (
                                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                ) : (
                                  <UserPlus className="w-5 h-5 mr-2" />
                                )}
                                Salvar Paciente
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </form>
            </div>

            {/* Footer Navigation */}
            <div className="p-6 border-t border-border/60 bg-card/80 backdrop-blur-sm flex items-center justify-between gap-4 shrink-0">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={step === 1}
                className="h-12 px-6 text-base"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Voltar
              </Button>

              {step < 4 && (
                <Button
                  onClick={nextStep}
                  type="button"
                  className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20"
                >
                  Próximo
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
