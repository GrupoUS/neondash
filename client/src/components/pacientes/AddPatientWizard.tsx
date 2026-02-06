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
    createMutation.mutate(data);
  };

  // Calculate progress percentage
  const progressPercent = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl p-0 overflow-hidden bg-background border-border gap-0"
        aria-describedby="add-patient-description"
      >
        <DialogTitle className="sr-only">Cadastrar Novo Paciente</DialogTitle>
        <div id="add-patient-description" className="sr-only">
          Formulário para cadastrar um novo paciente com dados pessoais, contato, convênio e ficha
          médica.
        </div>

        <div className="flex min-h-[700px]">
          {/* Enhanced Sidebar */}
          <div className="w-80 bg-card border-r border-border p-6 hidden md:flex md:flex-col">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Novo Paciente</h2>
                  <p className="text-xs text-muted-foreground">Preencha os dados abaixo</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progresso do cadastro</span>
                  <span className="font-medium text-primary">
                    {step} de {STEPS.length}
                  </span>
                </div>
                <AnimatedProgressBar value={progressPercent} size="md" />
              </div>
            </div>

            {/* Steps */}
            <div className="flex-1 space-y-2">
              {STEPS.map((s, index) => {
                const isActive = step === s.id;
                const isCompleted = step > s.id;
                const isLast = index === STEPS.length - 1;

                return (
                  <div key={s.id} className="relative">
                    {/* Connector line */}
                    {!isLast && (
                      <div
                        className={`absolute left-5 top-14 w-0.5 h-6 transition-colors duration-300 ${
                          isCompleted ? "bg-primary" : "bg-border"
                        }`}
                      />
                    )}

                    <motion.button
                      type="button"
                      onClick={() => {
                        if (isCompleted) setStep(s.id);
                      }}
                      className={`
                        w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all duration-200
                        ${isActive ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/50"}
                        ${isCompleted ? "cursor-pointer" : "cursor-default"}
                      `}
                      whileHover={isCompleted ? { scale: 1.01 } : {}}
                      whileTap={isCompleted ? { scale: 0.99 } : {}}
                    >
                      {/* Step indicator */}
                      <div
                        className={`
                          relative flex items-center justify-center w-10 h-10 rounded-xl shrink-0
                          transition-all duration-300
                          ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                              : isCompleted
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
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
                            className="absolute inset-0 rounded-xl bg-primary/30"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                          />
                        )}
                      </div>

                      {/* Step text */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-semibold text-sm transition-colors ${
                            isActive ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {s.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {s.description}
                        </p>
                      </div>
                    </motion.button>
                  </div>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Campos com <span className="text-primary font-medium">*</span> são obrigatórios.
                  Os demais podem ser preenchidos posteriormente.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Mobile step indicator */}
            <div className="md:hidden p-4 border-b bg-card/50">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-foreground">{STEPS[step - 1].title}</h2>
                <span className="text-xs text-muted-foreground">
                  {step}/{STEPS.length}
                </span>
              </div>
              <AnimatedProgressBar value={progressPercent} size="sm" />
            </div>

            {/* Form content */}
            <div className="flex-1 p-8 overflow-y-auto">
              {/* Step header */}
              <div className="mb-8 hidden md:block">
                <h3 className="text-2xl font-bold text-foreground mb-1">{STEPS[step - 1].title}</h3>
                <p className="text-muted-foreground">{STEPS[step - 1].description}</p>
              </div>

              <form id="wizard-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    {step === 1 && (
                      <div className="space-y-6">
                        {/* Full Name - Featured */}
                        <FormField
                          label="Nome Completo"
                          required
                          error={form.formState.errors.nomeCompleto?.message}
                        >
                          <Input
                            {...form.register("nomeCompleto")}
                            placeholder="Ex: Maria Silva Santos"
                            className="h-12 text-base"
                          />
                        </FormField>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField label="Nome Preferido" hint="Como gosta de ser chamado(a)">
                            <Input
                              {...form.register("nomePreferido")}
                              placeholder="Ex: Mari"
                              className="h-11"
                            />
                          </FormField>

                          <FormField label="Data de Nascimento">
                            <Input
                              type="date"
                              {...form.register("dataNascimento")}
                              className="h-11"
                            />
                          </FormField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField label="Gênero">
                            <Select
                              onValueChange={(val) =>
                                form.setValue(
                                  "genero",
                                  val as "masculino" | "feminino" | "outro" | "prefiro_nao_dizer"
                                )
                              }
                              defaultValue={form.getValues("genero")}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="feminino">Feminino</SelectItem>
                                <SelectItem value="masculino">Masculino</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                                <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormField>

                          <FormField label="CPF" hint="Opcional">
                            <Input
                              {...form.register("cpf")}
                              placeholder="000.000.000-00"
                              onChange={(e) => form.setValue("cpf", formatCPF(e.target.value))}
                              className="h-11"
                            />
                          </FormField>
                        </div>

                        <FormField label="RG" hint="Registro Geral" className="max-w-xs">
                          <Input
                            {...form.register("rg")}
                            placeholder="00.000.000-0"
                            className="h-11"
                          />
                        </FormField>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField label="E-mail" className="md:col-span-2">
                            <Input
                              {...form.register("email")}
                              type="email"
                              placeholder="paciente@email.com"
                              className="h-11"
                            />
                          </FormField>

                          <FormField label="Telefone / WhatsApp" className="md:col-span-2">
                            <Input
                              {...form.register("telefone")}
                              placeholder="(00) 00000-0000"
                              onChange={(e) =>
                                form.setValue("telefone", formatPhone(e.target.value))
                              }
                              className="h-11"
                            />
                          </FormField>
                        </div>

                        {/* Divider */}
                        <div className="relative py-4">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                              Endereço
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField label="CEP">
                            <Input
                              {...form.register("cep")}
                              placeholder="00000-000"
                              onChange={(e) => {
                                const val = formatCEP(e.target.value);
                                form.setValue("cep", val);
                              }}
                              className="h-11"
                            />
                          </FormField>

                          <FormField label="Cidade" className="md:col-span-2">
                            <Input
                              {...form.register("cidade")}
                              placeholder="Nome da cidade"
                              className="h-11"
                            />
                          </FormField>
                        </div>

                        <FormField label="Logradouro">
                          <Input
                            {...form.register("logradouro")}
                            placeholder="Rua, Avenida, etc."
                            className="h-11"
                          />
                        </FormField>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <FormField label="Número">
                            <Input
                              {...form.register("numero")}
                              placeholder="123"
                              className="h-11"
                            />
                          </FormField>

                          <FormField label="Bairro">
                            <Input
                              {...form.register("bairro")}
                              placeholder="Nome do bairro"
                              className="h-11"
                            />
                          </FormField>

                          <FormField label="Complemento">
                            <Input
                              {...form.register("complemento")}
                              placeholder="Apt 101"
                              className="h-11"
                            />
                          </FormField>

                          <FormField label="UF">
                            <Input
                              {...form.register("estado")}
                              placeholder="SP"
                              maxLength={2}
                              className="h-11 uppercase"
                            />
                          </FormField>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-muted/30 border border-border/50 mb-6">
                          <p className="text-sm text-muted-foreground">
                            Informações sobre plano de saúde e anotações gerais. Esses dados podem
                            ser atualizados posteriormente.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField label="Convênio">
                            <Input
                              {...form.register("convenio")}
                              placeholder="Ex: Unimed, Bradesco Saúde"
                              className="h-11"
                            />
                          </FormField>

                          <FormField label="Número da Carteirinha">
                            <Input
                              {...form.register("numeroCarteirinha")}
                              placeholder="000000000000"
                              className="h-11"
                            />
                          </FormField>
                        </div>

                        <FormField label="Observações Gerais" hint="Notas livres sobre o paciente">
                          <Textarea
                            {...form.register("observacoes")}
                            placeholder="Preferências, avisos importantes, etc."
                            rows={5}
                            className="resize-none"
                          />
                        </FormField>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 mb-6">
                          <p className="text-sm text-muted-foreground">
                            <strong className="text-foreground">Importante:</strong> Informações
                            médicas são confidenciais e essenciais para um atendimento seguro.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField label="Tipo Sanguíneo">
                            <Select
                              onValueChange={(val) =>
                                form.setValue("infoMedica.tipoSanguineo", val)
                              }
                            >
                              <SelectTrigger className="h-11">
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
                        </div>

                        <FormField
                          label="Alergias Conhecidas"
                          hint="Medicamentos, alimentos, materiais..."
                        >
                          <Textarea
                            {...form.register("infoMedica.alergias")}
                            placeholder="Liste alergias conhecidas ou digite 'Nenhuma conhecida'"
                            rows={3}
                            className="resize-none"
                          />
                        </FormField>

                        <FormField label="Medicamentos em Uso" hint="Medicação de uso contínuo">
                          <Textarea
                            {...form.register("infoMedica.medicamentosAtuais")}
                            placeholder="Liste medicamentos em uso ou digite 'Nenhum'"
                            rows={3}
                            className="resize-none"
                          />
                        </FormField>

                        {/* Final confirmation */}
                        <motion.div
                          className="mt-8 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                              <Check className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground mb-1">
                                Pronto para finalizar?
                              </h4>
                              <p className="text-sm text-muted-foreground mb-4">
                                Revise as informações e clique em salvar para cadastrar o paciente.
                              </p>
                              <Button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="w-full sm:w-auto h-11 px-8"
                                size="lg"
                              >
                                {createMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <UserPlus className="w-4 h-4 mr-2" />
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
            <div className="p-6 border-t bg-card/50 flex items-center justify-between gap-4">
              <Button variant="ghost" onClick={prevStep} disabled={step === 1} className="h-11">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>

              {step < 4 && (
                <Button onClick={nextStep} type="button" className="h-11 px-6">
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
