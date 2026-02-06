import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Heart,
  Pencil,
  Pill,
  Scale,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const medicalInfoSchema = z.object({
  tipoSanguineo: z.string().optional(),
  alergias: z.string().optional(),
  medicamentosEmUso: z.string().optional(),
  historicoMedico: z.string().optional(),
  peso: z.number().optional().nullable(),
  altura: z.number().optional().nullable(),
  antecedentesEsteticos: z.string().optional(),
  expectativas: z.string().optional(),
});

type MedicalFormValues = z.infer<typeof medicalInfoSchema>;

interface PatientMedicalCardProps {
  patientId: number;
  medicalInfo: {
    id?: number;
    tipoSanguineo: string | null;
    alergias: string | null;
    medicamentosEmUso: string | null;
    historicoMedico: string | null;
    peso: number | null;
    altura: number | null;
    antecedentesEsteticos: string | null;
    expectativas: string | null;
  } | null;
  onUpdate?: () => void;
}

export function PatientMedicalCard({ patientId, medicalInfo, onUpdate }: PatientMedicalCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const upsertMutation = trpc.pacientes.infoMedica.upsert.useMutation({
    onSuccess: () => {
      toast.success("Informações médicas atualizadas");
      setIsEditOpen(false);
      onUpdate?.();
    },
    onError: (e) => toast.error(e.message || "Erro ao salvar"),
  });

  const form = useForm<MedicalFormValues>({
    resolver: zodResolver(medicalInfoSchema),
    defaultValues: {
      tipoSanguineo: medicalInfo?.tipoSanguineo ?? "",
      alergias: medicalInfo?.alergias ?? "",
      medicamentosEmUso: medicalInfo?.medicamentosEmUso ?? "",
      historicoMedico: medicalInfo?.historicoMedico ?? "",
      peso: medicalInfo?.peso ?? null,
      altura: medicalInfo?.altura ?? null,
      antecedentesEsteticos: medicalInfo?.antecedentesEsteticos ?? "",
      expectativas: medicalInfo?.expectativas ?? "",
    },
  });

  const handleSubmit = (values: MedicalFormValues) => {
    upsertMutation.mutate({
      pacienteId: patientId,
      tipoSanguineo: values.tipoSanguineo || undefined,
      alergias: values.alergias || undefined,
      medicamentosAtuais: values.medicamentosEmUso || undefined,
      historicoCircurgico: values.historicoMedico || undefined,
      condicoesPreexistentes: values.antecedentesEsteticos || undefined,
      contraindacacoes: values.expectativas || undefined,
    });
  };

  const hasAlerts = medicalInfo?.alergias && medicalInfo.alergias.trim().length > 0;

  const bmi =
    medicalInfo?.peso && medicalInfo?.altura
      ? (medicalInfo.peso / (medicalInfo.altura / 100) ** 2).toFixed(1)
      : null;

  return (
    <>
      <Card className="border-primary/10 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-primary" />
              Informações Médicas
            </CardTitle>
            <CardDescription>Histórico e dados de saúde</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditOpen(true)}
            className="cursor-pointer"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar informações médicas</span>
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Allergy Alert */}
          {hasAlerts && (
            <Alert variant="destructive" className="border-destructive/50">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Alergias</AlertTitle>
              <AlertDescription>{medicalInfo.alergias}</AlertDescription>
            </Alert>
          )}

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {medicalInfo?.tipoSanguineo && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Heart className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-xs text-muted-foreground">Tipo Sanguíneo</p>
                  <p className="font-medium">{medicalInfo.tipoSanguineo}</p>
                </div>
              </div>
            )}
            {medicalInfo?.peso && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Scale className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Peso</p>
                  <p className="font-medium">{medicalInfo.peso} kg</p>
                </div>
              </div>
            )}
            {medicalInfo?.altura && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Scale className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Altura</p>
                  <p className="font-medium">{medicalInfo.altura} cm</p>
                </div>
              </div>
            )}
            {bmi && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Scale className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">IMC</p>
                  <p className="font-medium">{bmi}</p>
                </div>
              </div>
            )}
          </div>

          {/* Medications */}
          {medicalInfo?.medicamentosEmUso && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Pill className="h-4 w-4 text-primary" />
                Medicamentos em Uso
              </div>
              <div className="flex flex-wrap gap-2">
                {medicalInfo.medicamentosEmUso.split(",").map((med, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {med.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Collapsible History */}
          {medicalInfo?.historicoMedico && (
            <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between cursor-pointer">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Histórico Médico
                  </span>
                  {historyOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 bg-muted/30 rounded-lg">
                  {medicalInfo.historicoMedico}
                </p>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* No data state */}
          {!medicalInfo && (
            <div className="text-center py-8 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma informação médica registrada</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 cursor-pointer"
                onClick={() => setIsEditOpen(true)}
              >
                Adicionar Informações
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Informações Médicas</DialogTitle>
            <DialogDescription>Atualize o prontuário médico do paciente</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="tipoSanguineo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Sanguíneo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="A+" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="peso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="altura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altura (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="alergias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-destructive">Alergias</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Liste alergias conhecidas..." rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="medicamentosEmUso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medicamentos em Uso</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Separados por vírgula: Rivotril, Omeprazol..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="historicoMedico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Histórico Médico</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Cirurgias anteriores, doenças crônicas..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="antecedentesEsteticos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Antecedentes Estéticos</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Procedimentos estéticos anteriores..."
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectativas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expectativas do Paciente</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Objetivos e expectativas do tratamento..."
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
