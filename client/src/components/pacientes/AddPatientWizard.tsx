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
  User,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  { id: 1, title: "Dados Pessoais", icon: User },
  { id: 2, title: "Contato & Endereço", icon: MapPin },
  { id: 3, title: "Convênio & Docs", icon: FileText },
  { id: 4, title: "Ficha Médica", icon: Heart },
];

export function AddPatientWizard({ open, onOpenChange }: AddPatientWizardProps) {
  const [step, setStep] = useState(1);
  // const { toast } = useToast();
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
    // Validate current step fields before moving
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (step === 1) fieldsToValidate = ["nomeCompleto", "cpf", "dataNascimento"];
    // Add logic for others if stricter validation needed per step

    // For now simple trigger
    const valid = await form.trigger(
      fieldsToValidate as ("nomeCompleto" | "cpf" | "dataNascimento")[]
    );
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl p-0 overflow-hidden bg-background border-border"
        aria-describedby={undefined}
      >
        <div className="flex h-[600px]">
          {/* Sidebar Steps */}
          <div className="w-64 bg-muted/30 border-r p-6 hidden md:block">
            <h2 className="text-xl font-bold mb-6 text-foreground">Novo Paciente</h2>
            <div className="space-y-4">
              {STEPS.map((s) => {
                const isActive = step === s.id;
                const isCompleted = step > s.id;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full border ${isActive ? "border-primary bg-primary text-primary-foreground" : isCompleted ? "border-primary text-primary" : "border-muted-foreground"}`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                    </div>
                    <span className="font-medium text-sm">{s.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-8 overflow-y-auto">
              <form id="wizard-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {step === 1 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2 col-span-2">
                            <Label>Nome Completo*</Label>
                            <Input
                              {...form.register("nomeCompleto")}
                              placeholder="Ex: Maria Silva"
                            />
                            {form.formState.errors.nomeCompleto && (
                              <span className="text-xs text-destructive">
                                {form.formState.errors.nomeCompleto.message}
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Nome Preferido (Social)</Label>
                            <Input
                              {...form.register("nomePreferido")}
                              placeholder="Como prefere ser chamado"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Data de Nascimento</Label>
                            <Input type="date" {...form.register("dataNascimento")} />
                          </div>

                          <div className="space-y-2">
                            <Label>Gênero</Label>
                            <Select
                              onValueChange={(val) =>
                                form.setValue(
                                  "genero",
                                  val as "masculino" | "feminino" | "outro" | "prefiro_nao_dizer"
                                )
                              }
                              defaultValue={form.getValues("genero")}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="feminino">Feminino</SelectItem>
                                <SelectItem value="masculino">Masculino</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                                <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>CPF</Label>
                            <Input
                              {...form.register("cpf")}
                              placeholder="000.000.000-00"
                              onChange={(e) => form.setValue("cpf", formatCPF(e.target.value))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>RG</Label>
                            <Input {...form.register("rg")} placeholder="00.000.000-0" />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2 col-span-2">
                            <Label>Email</Label>
                            <Input
                              {...form.register("email")}
                              type="email"
                              placeholder="email@exemplo.com"
                            />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label>Telefone / WhatsApp</Label>
                            <Input
                              {...form.register("telefone")}
                              placeholder="(00) 00000-0000"
                              onChange={(e) =>
                                form.setValue("telefone", formatPhone(e.target.value))
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>CEP</Label>
                            <div className="flex gap-2">
                              <Input
                                {...form.register("cep")}
                                placeholder="00000-000"
                                onChange={(e) => {
                                  const val = formatCEP(e.target.value);
                                  form.setValue("cep", val);
                                  if (val.length === 9) {
                                    // Could trigger fetch here
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Cidade</Label>
                            <Input {...form.register("cidade")} placeholder="Cidade" />
                          </div>

                          <div className="space-y-2 col-span-2">
                            <Label>Logradouro</Label>
                            <Input {...form.register("logradouro")} placeholder="Rua, Av..." />
                          </div>

                          <div className="space-y-2">
                            <Label>Número</Label>
                            <Input {...form.register("numero")} placeholder="123" />
                          </div>
                          <div className="space-y-2">
                            <Label>Bairro</Label>
                            <Input {...form.register("bairro")} placeholder="Bairro" />
                          </div>
                          <div className="space-y-2">
                            <Label>Complemento</Label>
                            <Input {...form.register("complemento")} placeholder="Apt 101" />
                          </div>
                          <div className="space-y-2">
                            <Label>UF</Label>
                            <Input {...form.register("estado")} placeholder="SP" maxLength={2} />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2 col-span-2">
                            <Label>Convênio</Label>
                            <Input
                              {...form.register("convenio")}
                              placeholder="Ex: Unimed, Bradesco"
                            />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label>Número da Carteirinha</Label>
                            <Input
                              {...form.register("numeroCarteirinha")}
                              placeholder="000000000000"
                            />
                          </div>

                          <div className="space-y-2 col-span-2">
                            <Label>Observações Gerais</Label>
                            <Textarea
                              {...form.register("observacoes")}
                              placeholder="Notas iniciais sobre o paciente..."
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Tipo Sanguíneo</Label>
                            <Select
                              onValueChange={(val) =>
                                form.setValue("infoMedica.tipoSanguineo", val)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
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
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label>Alergias Conhecidas</Label>
                            <Textarea
                              {...form.register("infoMedica.alergias")}
                              placeholder="Medicamentos, alimentos..."
                            />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label>Medicamentos em Uso</Label>
                            <Textarea
                              {...form.register("infoMedica.medicamentosAtuais")}
                              placeholder="Lista de medicamentos..."
                            />
                          </div>
                        </div>

                        <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-dashed text-center">
                          <p className="text-sm text-muted-foreground mb-4">
                            Confirmar criação do paciente?
                          </p>
                          <Button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="w-full"
                          >
                            {createMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 mr-2" />
                            )}
                            Salvar Paciente
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </form>
            </div>

            {/* Footer Navigation */}
            <div className="p-6 border-t bg-background flex justify-between">
              <Button variant="outline" onClick={prevStep} disabled={step === 1}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              {step < 4 && (
                <Button onClick={nextStep} type="button">
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
