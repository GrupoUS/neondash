import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  maskPhoneInput,
  normalizeBrazilianPhone,
  validateBrazilianPhone,
} from "../../../../shared/phone-utils";
import { ProcedimentoSelector } from "../shared/ProcedimentoSelector";

// Form schema - keeps valorEstimado as string for input
const createLeadFormSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().optional(),
  empresa: z.string().optional(),
  origem: z.enum(["instagram", "whatsapp", "google", "indicacao", "site", "outro"]),
  valorEstimado: z.string().optional(),

  // B2B / Qualificação Fields
  indicadoPor: z.string().optional(),
  profissao: z.string().optional(),
  produtoInteresse: z.string().optional(),
  possuiClinica: z.enum(["sim", "nao"]).optional(),
  anosEstetica: z.string().optional(),
  faturamentoMensal: z.string().optional(),
  dorPrincipal: z.string().optional(),
  desejoPrincipal: z.string().optional(),
  temperatura: z.enum(["frio", "morno", "quente"]).optional(),

  // Aesthetic Fields (B2C)
  dataNascimento: z.string().optional(),
  genero: z.string().optional(),
  procedimentosInteresse: z.array(z.number()).default([]),
  historicoEstetico: z.string().optional(),
  alergias: z.string().optional(),
  tipoPele: z.string().optional(),
  disponibilidade: z.string().optional(),
});

type CreateLeadFormValues = z.infer<typeof createLeadFormSchema>;

interface CreateLeadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Admin override - creates lead for this mentorado */
  mentoradoId?: number;
}

export function CreateLeadDialog({
  isOpen,
  onClose,
  onSuccess,
  mentoradoId,
}: CreateLeadDialogProps) {
  const trpcUtils = trpc.useUtils();
  const form = useForm<CreateLeadFormValues>({
    resolver: zodResolver(createLeadFormSchema) as any,
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      empresa: "",
      valorEstimado: "",
      indicadoPor: "",
      profissao: "",
      produtoInteresse: "",
      possuiClinica: undefined,
      anosEstetica: "",
      faturamentoMensal: "",
      dorPrincipal: "",
      desejoPrincipal: "",
      temperatura: undefined,
      // Aesthetic defaults
      dataNascimento: "",
      genero: "",
      procedimentosInteresse: [],
      historicoEstetico: "",
      alergias: "",
      tipoPele: "",
      disponibilidade: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const mutation = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Lead criado com sucesso!");
      trpcUtils.leads.list.invalidate();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error(`Erro ao criar lead: ${err.message}`);
    },
  });

  const onSubmit = (values: CreateLeadFormValues) => {
    // Convert valorEstimado from string to cents (number)
    const valorEstimadoCents = values.valorEstimado
      ? Math.round(
          parseFloat(values.valorEstimado.replace("R$", "").replace(".", "").replace(",", ".")) *
            100
        )
      : undefined;

    const anosEsteticaNumber =
      values.anosEstetica && !Number.isNaN(parseInt(values.anosEstetica, 10))
        ? parseInt(values.anosEstetica, 10)
        : undefined;

    // Normalize phone to 55+digits format for WhatsApp compatibility
    const normalizedTelefone = values.telefone
      ? normalizeBrazilianPhone(values.telefone)
      : undefined;

    mutation.mutate({
      nome: values.nome,
      email: values.email,
      telefone: normalizedTelefone,
      empresa: values.empresa,
      origem: values.origem,
      valorEstimado: valorEstimadoCents,
      indicadoPor: values.indicadoPor,
      profissao: values.profissao,
      produtoInteresse: values.produtoInteresse || undefined,
      possuiClinica: values.possuiClinica || undefined,
      anosEstetica: anosEsteticaNumber,
      faturamentoMensal: values.faturamentoMensal || undefined,
      dorPrincipal: values.dorPrincipal || undefined,
      desejoPrincipal: values.desejoPrincipal || undefined,
      temperatura: values.temperatura || undefined,
      // Aesthetic Fields
      dataNascimento: values.dataNascimento || undefined,
      genero: values.genero || undefined,
      procedimentosInteresse: values.procedimentosInteresse,
      historicoEstetico: values.historicoEstetico || undefined,
      alergias: values.alergias || undefined,
      tipoPele: values.tipoPele || undefined,
      disponibilidade: values.disponibilidade || undefined,
      // Admin override
      mentoradoId,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 1. Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">
                Dados Pessoais
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo*</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do lead" {...field} />
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
                      <FormLabel>Email*</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => {
                    const [phoneError, setPhoneError] = useState<string | null>(null);
                    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                      const masked = maskPhoneInput(e.target.value);
                      field.onChange(masked);
                      // Validate on change if phone has enough digits
                      const digits = masked.replace(/\D/g, "");
                      if (digits.length >= 10) {
                        const result = validateBrazilianPhone(masked);
                        setPhoneError(result.valid ? null : result.error || null);
                      } else {
                        setPhoneError(null);
                      }
                    };
                    return (
                      <FormItem>
                        <FormLabel>WhatsApp / Telefone</FormLabel>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="h-9 px-3 flex items-center shrink-0">
                            +55
                          </Badge>
                          <FormControl>
                            <Input
                              placeholder="(11) 99999-9999"
                              {...field}
                              onChange={handlePhoneChange}
                            />
                          </FormControl>
                        </div>
                        {phoneError && (
                          <p className="text-sm font-medium text-destructive">{phoneError}</p>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="profissao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profissão</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Biomédica" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataNascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Feminino">Feminino</SelectItem>
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 2. Anamnese Comercial */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">
                Anamnese Comercial
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipoPele"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Pele</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Oleosa, Seca..." {...field} />
                      </FormControl>
                      <FormMessage />
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
                        <Input placeholder="Possui alguma alergia?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="historicoEstetico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Histórico Estético</FormLabel>
                    <FormControl>
                      <Input placeholder="Já fez procedimentos anteriores? Quais?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 3. Interesse */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">Interesse</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="procedimentosInteresse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procedimentos de Interesse</FormLabel>
                      <FormControl>
                        <ProcedimentoSelector
                          value={field.value}
                          onChange={field.onChange}
                          disabled={mutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="disponibilidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponibilidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Manhã, Terças..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dorPrincipal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Queixa Principal (Dor)</FormLabel>
                      <FormControl>
                        <Input placeholder="O que mais incomoda?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="desejoPrincipal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desejo/Sonho</FormLabel>
                      <FormControl>
                        <Input placeholder="Resultado esperado?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 4. Outros (B2B / Qualificação) */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">
                Qualificação / B2B
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="origem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origem do Lead*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="indicacao">Indicação</SelectItem>
                          <SelectItem value="site">Site</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="indicadoPor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Indicado Por</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome de quem indicou" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="temperatura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperatura</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="frio">Frio ❄️</SelectItem>
                          <SelectItem value="morno">Morno 🌤️</SelectItem>
                          <SelectItem value="quente">Quente 🔥</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valorEstimado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Proposta (R$)</FormLabel>
                      <FormControl>
                        <Input placeholder="0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="possuiClinica"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Possui Clínica?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="anosEstetica"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anos na Estética</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="faturamentoMensal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faturamento Mensal</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 10k - 15k" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 sticky bottom-0 bg-background/95 backdrop-blur py-4 border-t mt-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Criando..." : "Criar Lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
