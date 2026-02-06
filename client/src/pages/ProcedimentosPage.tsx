import { zodResolver } from "@hookform/resolvers/zod";
import { MoreVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useProcedimentos } from "@/hooks/use-procedimentos";

const procedureSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  categoria: z.string().optional(),
  precoVenda: z.string().refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
    message: "Preço deve ser um número positivo",
  }),
  custoOperacional: z.string().optional(),
  percentualParceiro: z.string().optional(),
  percentualImposto: z.string().optional(),
});

type ProcedureFormValues = z.infer<typeof procedureSchema>;

interface Procedure {
  id: number;
  nome: string;
  categoria?: string | null;
  precoVenda: number;
  custoOperacional?: number | null;
  percentualParceiro?: number | null;
  percentualImposto?: number | null;
}

export default function ProcedimentosPage() {
  const { procedures, create, update, remove } = useProcedimentos();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);

  const form = useForm<ProcedureFormValues>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      nome: "",
      categoria: "Facial",
      precoVenda: "",
      custoOperacional: "",
      percentualParceiro: "",
      percentualImposto: "7",
    },
  });

  const onSubmit = async (values: ProcedureFormValues) => {
    try {
      const payload = {
        nome: values.nome,
        categoria: values.categoria,
        precoVenda: Math.round(Number(values.precoVenda) * 100), // Converte para centavos
        custoOperacional: values.custoOperacional
          ? Math.round(Number(values.custoOperacional) * 100)
          : undefined,
        percentualParceiro: values.percentualParceiro
          ? Math.round(Number(values.percentualParceiro) * 100)
          : undefined,
        percentualImposto: values.percentualImposto
          ? Math.round(Number(values.percentualImposto) * 100)
          : undefined,
      };

      if (editingProcedure) {
        await update.mutateAsync({
          id: editingProcedure.id,
          ...payload,
        });
        toast.success("Procedimento atualizado com sucesso!");
      } else {
        await create.mutateAsync(payload);
        toast.success("Procedimento criado com sucesso!");
      }
      setIsCreateOpen(false);
      setEditingProcedure(null);
      form.reset();
    } catch {
      toast.error("Erro ao salvar procedimento");
    }
  };

  const handeEdit = (proc: Procedure) => {
    setEditingProcedure(proc);
    form.reset({
      nome: proc.nome,
      categoria: proc.categoria || "Outros",
      precoVenda: (proc.precoVenda / 100).toString(),
      custoOperacional: proc.custoOperacional ? (proc.custoOperacional / 100).toString() : "",
      percentualParceiro: proc.percentualParceiro ? (proc.percentualParceiro / 100).toString() : "",
      percentualImposto: proc.percentualImposto ? (proc.percentualImposto / 100).toString() : "7",
    });
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este procedimento?")) {
      try {
        await remove.mutateAsync({ id });
        toast.success("Procedimento excluído com sucesso!");
      } catch {
        toast.error("Erro ao excluir procedimento");
      }
    }
  };

  const filteredProcedures = procedures?.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by category
  const groupedProcedures = filteredProcedures?.reduce((acc: Record<string, Procedure[]>, proc) => {
    const category = proc.categoria || "Outros";
    if (!acc[category]) acc[category] = [];
    acc[category].push(proc as Procedure);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procedimentos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seu catálogo de procedimentos e preços.
          </p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setEditingProcedure(null);
              form.reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Procedimento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingProcedure ? "Editar Procedimento" : "Novo Procedimento"}
              </DialogTitle>
              <DialogDescription>Preencha os dados do procedimento abaixo.</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Procedimento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Harmonização Facial" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Facial">Facial</SelectItem>
                            <SelectItem value="Corporal">Corporal</SelectItem>
                            <SelectItem value="Capilar">Capilar</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="precoVenda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Venda (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="custoOperacional"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="percentualParceiro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>% Parceiro</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="percentualImposto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>% Imposto</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="7" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit">
                    {editingProcedure ? "Salvar Alterações" : "Criar Procedimento"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar procedimentos..."
          className="pl-9 w-full sm:w-[300px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-6">
        {groupedProcedures &&
          Object.entries(groupedProcedures).map(([category, procs]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  {category}
                  <Badge variant="secondary" className="ml-2">
                    {procs.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {procs.map((proc) => (
                  <div
                    key={proc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{proc.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(proc.precoVenda / 100)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handeEdit(proc)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(proc.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        {(!groupedProcedures || Object.keys(groupedProcedures).length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum procedimento encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
