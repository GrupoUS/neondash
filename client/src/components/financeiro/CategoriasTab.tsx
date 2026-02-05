import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NeonCard } from "@/components/ui/neon-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { OnboardingCard } from "./OnboardingCard";

export function CategoriasTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: "receita" as "receita" | "despesa",
    nome: "",
    descricao: "",
  });

  const utils = trpc.useUtils();
  const { data: categorias, isLoading } = trpc.financeiro.categorias.list.useQuery();

  const createMutation = trpc.financeiro.categorias.create.useMutation({
    onSuccess: () => {
      toast.success("Categoria criada");
      utils.financeiro.categorias.list.invalidate();
      setIsDialogOpen(false);
      setFormData({ tipo: "receita", nome: "", descricao: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.financeiro.categorias.delete.useMutation({
    onSuccess: () => {
      toast.success("Categoria removida");
      utils.financeiro.categorias.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const seedMutation = trpc.financeiro.seedDefaults.useMutation({
    onSuccess: (data) => {
      if (data.categoriasCriadas > 0) {
        toast.success(`${data.categoriasCriadas} categorias padrão criadas!`);
        utils.financeiro.categorias.list.invalidate();
      } else {
        toast.info("Você já possui categorias cadastradas");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    createMutation.mutate({
      tipo: formData.tipo,
      nome: formData.nome,
      descricao: formData.descricao || undefined,
    });
  };

  if (isLoading) {
    return (
      <NeonCard className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </NeonCard>
    );
  }

  const receitas = categorias?.filter((c) => c.tipo === "receita") ?? [];
  const despesas = categorias?.filter((c) => c.tipo === "despesa") ?? [];

  return (
    <div className="space-y-6">
      <OnboardingCard
        title="Como organizar categorias?"
        storageKey="onboarding-categorias"
        steps={[
          "Crie categorias para classificar suas transações",
          "Defina se é uma categoria de Receita ou Despesa",
          "Exemplos de Receita: Consultas, Procedimentos, Vendas",
          "Exemplos de Despesa: Aluguel, Insumos, Marketing",
        ]}
        actionLabel="Carregar Categorias Padrão"
        onAction={() => seedMutation.mutate()}
        isActionLoading={seedMutation.isPending}
      />

      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Categoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v) =>
                    setFormData({ ...formData, tipo: v as "receita" | "despesa" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Consultas"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição da categoria"
                />
              </div>
              <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Salvando..." : "Criar Categoria"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receitas */}
        <NeonCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge variant="default">Receitas</Badge>
            <span className="text-muted-foreground text-sm">({receitas.length})</span>
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {receitas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                    Nenhuma categoria de receita
                  </TableCell>
                </TableRow>
              ) : (
                receitas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{c.descricao ?? "-"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate({ id: c.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </NeonCard>

        {/* Despesas */}
        <NeonCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge variant="destructive">Despesas</Badge>
            <span className="text-muted-foreground text-sm">({despesas.length})</span>
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {despesas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                    Nenhuma categoria de despesa
                  </TableCell>
                </TableRow>
              ) : (
                despesas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{c.descricao ?? "-"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate({ id: c.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </NeonCard>
      </div>
    </div>
  );
}
