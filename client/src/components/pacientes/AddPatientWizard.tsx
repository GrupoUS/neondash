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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

// Schema Definitions
const personalSchema = z.object({
  nomeCompleto: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").or(z.literal("")),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  dataNascimento: z.string().optional(),
  genero: z.enum(["masculino", "feminino", "outro", "prefiro_nao_dizer"]).optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  convenio: z.string().optional(),
  numeroCarteirinha: z.string().optional(),
});

const addressSchema = z.object({
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
});

const medicalSchema = z.object({
  tipoSanguineo: z.string().optional(),
  alergias: z.string().optional(),
  medicamentosAtuais: z.string().optional(),
  queixasPrincipais: z.string().optional(), // Converted to array on submit
  observacoes: z.string().optional(),
});

// Merged Document Type for Form
const documentSchema = z.object({
  file: z.instanceof(File),
  tipo: z.enum(["consentimento", "exame", "prescricao", "outro"]),
});

const formSchema = z.intersection(
  z.intersection(personalSchema, addressSchema),
  z.object({
    ...medicalSchema.shape,
    documentos: z.array(documentSchema).optional(),
  })
);

type FormValues = z.infer<typeof formSchema>;

interface AddPatientWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const steps = [
  {
    id: "personal",
    title: "Dados Pessoais",
    description: "Identificação básica",
    icon: User,
    fields: ["nomeCompleto", "email", "telefone", "cpf", "convenio"],
  },
  {
    id: "address",
    title: "Endereço",
    description: "Localização",
    icon: MapPin,
    fields: ["cep", "cidade", "estado"],
  },
  {
    id: "medical",
    title: "Ficha Médica",
    description: "Histórico e Documentos",
    icon: Heart,
    fields: ["tipoSanguineo", "alergias", "observacoes"],
  },
];

export function AddPatientWizard({ open, onOpenChange, onSuccess }: AddPatientWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCompleto: "",
      email: "",
      telefone: "",
      documentos: [],
    },
    mode: "onChange",
  });

  const utils = trpc.useContext();
  const createMutation = trpc.pacientes.create.useMutation({
    onSuccess: () => {
      toast.success("Paciente cadastrado com sucesso!");
      utils.pacientes.list.invalidate();
      onOpenChange(false);
      form.reset();
      setUploadedFiles([]);
      setCurrentStep(0);
      onSuccess();
    },
    onError: (err) => {
      toast.error(`Erro ao cadastrar: ${err.message}`);
    },
  });

  const uploadMutation = trpc.pacientes.uploadDocument.useMutation();

  const handleNext = async () => {
    const fields = steps[currentStep].fields as unknown as (keyof FormValues)[];
    const output = await form.trigger(fields);

    if (output) {
      if (currentStep < steps.length - 1) {
        setDirection(1);
        setCurrentStep((prev) => prev + 1);
      } else {
        await handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const data = form.getValues();

    try {
      // 1. Upload Documents first
      const processedDocs = await Promise.all(
        uploadedFiles.map(async (file) => {
          // Convert file to base64
          const buffer = await file.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");

          const uploadRes = await uploadMutation.mutateAsync({
            file: base64,
            fileName: file.name,
            contentType: file.type,
          });

          return {
            tipo: "exame" as const, // Default to exam for wizard uploads
            nome: file.name,
            url: uploadRes.url,
            mimeType: file.type,
            tamanhoBytes: file.size,
          };
        })
      );

      // 2. Create Patient
      await createMutation.mutateAsync({
        ...data,
        infoMedica: {
          tipoSanguineo: data.tipoSanguineo || null,
          alergias: data.alergias || null,
          medicamentosAtuais: data.medicamentosAtuais || null,
          queixasPrincipais: data.queixasPrincipais
            ? data.queixasPrincipais.split(",").map((s) => s.trim())
            : [],
        },
        documentos: processedDocs,
      });
    } catch {
      // Log handled by mutation error
      toast.error("Falha ao salvar paciente ou documentos");
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -50 : 50,
      opacity: 0,
    }),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-[calc(100vw-1rem)] sm:w-full p-0 gap-0 overflow-hidden border-border/40 shadow-2xl bg-card">
        <div className="flex flex-col md:flex-row h-[92dvh] sm:h-[90dvh] md:h-[88dvh] max-h-[920px] w-full min-h-0">
          {/* Sidebar - Steps */}
          <div className="w-full md:w-[280px] md:shrink-0 bg-muted/30 border-r border-border/40 p-6 flex flex-col gap-8 min-h-0 overflow-y-auto">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-primary" />
                Novo Paciente
              </h2>
              <p className="text-sm text-muted-foreground">Cadastre um novo paciente no sistema</p>
            </div>

            <div className="relative z-10 space-y-6 flex-1">
              {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                  <div key={step.id} className="relative">
                    <div className="flex items-center gap-4 group">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-primary/25 ring-2 ring-primary/20"
                            : isCompleted
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <step.icon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={cn(
                            "text-sm font-medium transition-colors duration-200",
                            isActive ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {step.title}
                        </span>
                        <span className="text-xs text-muted-foreground/50">{step.description}</span>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "absolute left-5 top-12 w-0.5 h-6 -ml-px transition-colors duration-300",
                          isCompleted ? "bg-primary/20" : "bg-border/30"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="relative z-10">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/5">
                <div className="flex items-center gap-2 text-xs text-primary/80 mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Dica IA</span>
                </div>
                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                  Preencha o máximo de dados possível para que a IA possa gerar insights melhores.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-card/50 overflow-hidden min-h-0">
            <DialogHeader className="px-8 py-6 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    {steps[currentStep].title}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Passo {currentStep + 1} de {steps.length}
                  </p>
                </div>
                <div className="w-32">
                  <AnimatedProgressBar
                    value={((currentStep + 1) / steps.length) * 100}
                    className="h-2"
                  />
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 min-h-0" type="always">
              <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-8">
                <Form {...form}>
                  <form className="space-y-6">
                    <AnimatePresence custom={direction} mode="wait">
                      <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                          x: { type: "spring", stiffness: 300, damping: 30 },
                          opacity: { duration: 0.2 },
                        }}
                        className="space-y-6"
                      >
                        {currentStep === 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="nomeCompleto"
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Nome Completo</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        className="pl-9"
                                        placeholder="Ex: Maria Silva"
                                        {...field}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input placeholder="maria@email.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="telefone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Telefone (WhatsApp)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="(11) 99999-9999" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="cpf"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CPF</FormLabel>
                                  <FormControl>
                                    <Input placeholder="000.000.000-00" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="rg"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>RG</FormLabel>
                                  <FormControl>
                                    <Input placeholder="00.000.000-0" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="md:col-span-2 h-px bg-border/50 my-2" />
                            <FormField
                              control={form.control}
                              name="convenio"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Convênio</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ex: Unimed, Bradesco..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="numeroCarteirinha"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nº Carteirinha</FormLabel>
                                  <FormControl>
                                    <Input placeholder="0000 0000 0000 00" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}

                        {currentStep === 1 && (
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                            <FormField
                              control={form.control}
                              name="cep"
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>CEP</FormLabel>
                                  <FormControl>
                                    <Input placeholder="00000-000" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="logradouro"
                              render={({ field }) => (
                                <FormItem className="md:col-span-4">
                                  <FormLabel>Endereço</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Rua das Flores" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="numero"
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Número</FormLabel>
                                  <FormControl>
                                    <Input placeholder="123" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="complemento"
                              render={({ field }) => (
                                <FormItem className="md:col-span-4">
                                  <FormLabel>Complemento</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Apto 42" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="bairro"
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Bairro</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Centro" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="cidade"
                              render={({ field }) => (
                                <FormItem className="md:col-span-3">
                                  <FormLabel>Cidade</FormLabel>
                                  <FormControl>
                                    <Input placeholder="São Paulo" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="estado"
                              render={({ field }) => (
                                <FormItem className="md:col-span-1">
                                  <FormLabel>UF</FormLabel>
                                  <FormControl>
                                    <Input placeholder="SP" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}

                        {currentStep === 2 && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={form.control}
                                name="tipoSanguineo"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Tipo Sanguíneo</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                      </FormControl>
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
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="alergias"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Alergias</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Ex: Dipirona, Latex" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="medicamentosAtuais"
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel>Medicamentos em uso</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Ex: Roacutan 20mg" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="queixasPrincipais"
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel>Queixas Principais</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Descreva as principais queixas..."
                                        className="min-h-[120px] max-h-[120px] overflow-y-auto resize-none"
                                        {...field}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="observacoes"
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel>Observações Gerais</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Outras observações importantes..."
                                        className="min-h-[120px] max-h-[120px] overflow-y-auto resize-none"
                                        {...field}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="pt-4 border-t border-border/50">
                              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Documentos e Anexos
                              </h3>
                              <FileUpload
                                onFilesSelected={setUploadedFiles}
                                maxFiles={3}
                                accept={{
                                  "image/*": [".png", ".jpg", ".jpeg"],
                                  "application/pdf": [".pdf"],
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </form>
                </Form>
              </div>
            </ScrollArea>

            <div className="p-6 border-t border-border/10 bg-muted/10 flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0 || createMutation.isPending || uploadMutation.isPending}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>
              <Button
                onClick={handleNext}
                disabled={createMutation.isPending || uploadMutation.isPending}
                className="gap-2 bg-primary hover:bg-primary/90 text-white min-w-[140px]"
              >
                {currentStep === steps.length - 1 ? (
                  createMutation.isPending || uploadMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      Concluir Cadastro
                      <Check className="w-4 h-4" />
                    </>
                  )
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
