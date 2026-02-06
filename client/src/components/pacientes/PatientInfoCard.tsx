import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Mail, MapPin, Pencil, Phone, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

// Schema for patient edit form
const patientFormSchema = z.object({
  nomeCompleto: z.string().min(2, "Nome é obrigatório"),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  dataNascimento: z.string().optional(),
  endereco: z.string().optional(),
  status: z.enum(["ativo", "inativo"]),
  observacoes: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

interface PatientInfoCardProps {
  patient: {
    id: number;
    nomeCompleto: string;
    telefone: string | null;
    email: string | null;
    dataNascimento: string | null;
    endereco: string | null;
    avatarUrl: string | null;
    status: "ativo" | "inativo";
    observacoes: string | null;
    updatedAt: Date | null;
  };
  onUpdate?: () => void;
}

export function PatientInfoCard({ patient, onUpdate }: PatientInfoCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const updateMutation = trpc.pacientes.update.useMutation({
    onSuccess: () => {
      toast.success("Paciente atualizado com sucesso");
      setIsEditOpen(false);
      onUpdate?.();
    },
    onError: (e) => toast.error(e.message || "Erro ao atualizar"),
  });

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      nomeCompleto: patient.nomeCompleto,
      telefone: patient.telefone ?? "",
      email: patient.email ?? "",
      dataNascimento: patient.dataNascimento ?? "",
      endereco: patient.endereco ?? "",
      status: patient.status,
      observacoes: patient.observacoes ?? "",
    },
  });

  const handleSubmit = (values: PatientFormValues) => {
    updateMutation.mutate({
      id: patient.id,
      ...values,
      email: values.email || undefined,
      telefone: values.telefone || undefined,
      dataNascimento: values.dataNascimento || undefined,
      endereco: values.endereco || undefined,
      observacoes: values.observacoes || undefined,
    });
  };

  const initials = patient.nomeCompleto
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const age = patient.dataNascimento
    ? Math.floor(
        (Date.now() - new Date(patient.dataNascimento).getTime()) / (1000 * 60 * 60 * 24 * 365)
      )
    : null;

  return (
    <>
      <Card className="border-primary/10 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20">
              <AvatarImage src={patient.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{patient.nomeCompleto}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                {age !== null && <span>{age} anos</span>}
                <Badge
                  variant={patient.status === "ativo" ? "default" : "secondary"}
                  className="ml-1"
                >
                  {patient.status === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditOpen(true)}
            className="cursor-pointer"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar paciente</span>
          </Button>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2 pt-4">
          {/* Contact Info */}
          <div className="space-y-3">
            {patient.telefone && (
              <a
                href={`tel:${patient.telefone}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <Phone className="h-4 w-4" />
                {patient.telefone}
              </a>
            )}
            {patient.email && (
              <a
                href={`mailto:${patient.email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <Mail className="h-4 w-4" />
                {patient.email}
              </a>
            )}
            {patient.endereco && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-2">{patient.endereco}</span>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="space-y-3">
            {patient.dataNascimento && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(patient.dataNascimento).toLocaleDateString("pt-BR")}
              </div>
            )}
            {patient.updatedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Atualizado em{" "}
                {new Date(patient.updatedAt).toLocaleDateString("pt-BR", {
                  month: "short",
                  year: "numeric",
                })}
              </div>
            )}
          </div>

          {/* Observations */}
          {patient.observacoes && (
            <div className="col-span-full pt-2 border-t">
              <p className="text-sm text-muted-foreground">{patient.observacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>Atualize as informações do paciente</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nomeCompleto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(11) 99999-9999" />
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
                        <Input {...field} type="email" />
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
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              </div>

              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
