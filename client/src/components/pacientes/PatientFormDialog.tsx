/**
 * PatientFormDialog - Create/Edit Patient Dialog
 * Unified form for creating new patients or editing existing ones
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2, User } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

const patientFormSchema = z.object({
  nomeCompleto: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  dataNascimento: z.string().optional(),
  genero: z.enum(["masculino", "feminino", "outro", "prefiro_nao_dizer"]).optional(),
  cpf: z.string().optional(),
  endereco: z.string().optional(),
  fotoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  observacoes: z.string().optional(),
  status: z.enum(["ativo", "inativo"]).optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface PatientData {
  id: number;
  nomeCompleto: string;
  email: string | null;
  telefone: string | null;
  dataNascimento: string | null;
  genero: "masculino" | "feminino" | "outro" | "prefiro_nao_dizer" | null;
  cpf: string | null;
  endereco: string | null;
  fotoUrl: string | null;
  observacoes: string | null;
  status: "ativo" | "inativo";
}

interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: PatientData | null; // If provided, edit mode; otherwise create mode
  onSuccess?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  onSuccess,
}: PatientFormDialogProps) {
  const isEdit = !!patient;
  const utils = trpc.useUtils();

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      nomeCompleto: "",
      email: "",
      telefone: "",
      dataNascimento: "",
      genero: undefined,
      cpf: "",
      endereco: "",
      fotoUrl: "",
      observacoes: "",
      status: "ativo",
    },
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (patient && open) {
      form.reset({
        nomeCompleto: patient.nomeCompleto,
        email: patient.email || "",
        telefone: patient.telefone || "",
        dataNascimento: patient.dataNascimento || "",
        genero: patient.genero || undefined,
        cpf: patient.cpf || "",
        endereco: patient.endereco || "",
        fotoUrl: patient.fotoUrl || "",
        observacoes: patient.observacoes || "",
        status: patient.status,
      });
    } else if (!open) {
      form.reset();
    }
  }, [patient, open, form]);

  const createMutation = trpc.pacientes.create.useMutation({
    onSuccess: () => {
      toast.success("Paciente criado com sucesso!");
      utils.pacientes.list.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message || "Erro ao criar paciente"),
  });

  const updateMutation = trpc.pacientes.update.useMutation({
    onSuccess: () => {
      toast.success("Paciente atualizado!");
      utils.pacientes.list.invalidate();
      utils.pacientes.getById.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message || "Erro ao atualizar paciente"),
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: PatientFormValues) => {
    // Clean empty strings to null
    const cleanData = {
      nomeCompleto: values.nomeCompleto,
      email: values.email || null,
      telefone: values.telefone || null,
      dataNascimento: values.dataNascimento || null,
      genero: values.genero || null,
      cpf: values.cpf || null,
      endereco: values.endereco || null,
      fotoUrl: values.fotoUrl || null,
      observacoes: values.observacoes || null,
    };

    if (isEdit && patient) {
      updateMutation.mutate({
        id: patient.id,
        ...cleanData,
        status: values.status,
      });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const photoUrl = form.watch("fotoUrl");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEdit ? "Editar Paciente" : "Novo Paciente"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize as informações do paciente abaixo."
              : "Preencha as informações do novo paciente."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Photo Preview */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={photoUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {form
                    .watch("nomeCompleto")
                    ?.split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || <User className="h-6 w-6" />}
                </AvatarFallback>
              </Avatar>
              <FormField
                control={form.control}
                name="fotoUrl"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>URL da Foto</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Main Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nomeCompleto"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Maria da Silva" {...field} />
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
                      <Input type="email" placeholder="paciente@email.com" {...field} />
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
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataNascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="date" {...field} />
                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="genero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gênero</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                        <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
                      </SelectContent>
                    </Select>
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

              {isEdit && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número, bairro, cidade - UF" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observations */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas sobre o paciente..."
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? "Salvar Alterações" : "Criar Paciente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
