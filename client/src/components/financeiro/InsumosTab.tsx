import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { OnboardingCard } from "./OnboardingCard";

type InsumoData = {
  id?: number;
  nome: string;
  valorCompra: string;
  rendimento: string;
};

export function InsumosTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<InsumoData>({
    nome: "",
    valorCompra: "",
    rendimento: "",
  });

  const utils = trpc.useUtils();
  const { data: insumos, isLoading } = trpc.procedimentos.insumos.list.useQuery();

  const createMutation = trpc.procedimentos.insumos.create.useMutation({
    onSuccess: () => {
      toast.success("Insumo criado");
      utils.procedimentos.insumos.list.invalidate();
      closeDialog();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.procedimentos.insumos.update.useMutation({
    onSuccess: () => {
      toast.success("Insumo atualizado");
      utils.procedimentos.insumos.list.invalidate();
      closeDialog();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.procedimentos.insumos.delete.useMutation({
    onSuccess: () => {
      toast.success("Insumo removido");
      utils.procedimentos.insumos.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ nome: "", valorCompra: "", rendimento: "" });
  };

  const openEditDialog = (insumo: {
    id: number;
    nome: string;
    valorCompra: number;
    rendimento: number;
  }) => {
    setEditingId(insumo.id);
    setFormData({
      nome: insumo.nome,
      valorCompra: (insumo.valorCompra / 100).toFixed(2).replace(".", ","),
      rendimento: String(insumo.rendimento),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    const valorCompra = Math.round(Number(formData.valorCompra.replace(",", ".")) * 100);
    const rendimento = Number.parseFloat(formData.rendimento.replace(",", "."));

    if (Number.isNaN(valorCompra) || valorCompra <= 0) {
      toast.error("Valor de compra inválido");
      return;
    }
    if (Number.isNaN(rendimento) || rendimento <= 0) {
      toast.error("Rendimento inválido");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, nome: formData.nome, valorCompra, rendimento });
    } else {
      createMutation.mutate({ nome: formData.nome, valorCompra, rendimento });
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      cents / 100
    );
  };

  const calcCustoPorUso = (valorCompra: number, rendimento: number) =>
    Math.round(valorCompra / rendimento);

  const isSaving = createMutation.isPending || updateMutation.isPending;

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

  return (
    <div className="space-y-6">
      <OnboardingCard
        title="Insumos e materiais"
        storageKey="onboarding-insumos"
        steps={[
          "54 insumos padrão já foram carregados automaticamente",
          "Valores e rendimentos baseados em clínicas estéticas reais",
          "Edite os valores conforme seus custos atuais",
          "Adicione novos insumos específicos do seu negócio",
        ]}
      />

      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Novo Insumo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Insumo" : "Novo Insumo"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Ácido Hialurônico"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor de Compra (R$)</Label>
                  <Input
                    value={formData.valorCompra}
                    onChange={(e) => setFormData({ ...formData, valorCompra: e.target.value })}
                    placeholder="Ex: 250,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rendimento (usos)</Label>
                  <Input
                    value={formData.rendimento}
                    onChange={(e) => setFormData({ ...formData, rendimento: e.target.value })}
                    placeholder="Ex: 1,5"
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={isSaving} className="w-full">
                {isSaving ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Insumo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <NeonCard className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Valor de Compra</TableHead>
              <TableHead>Rendimento</TableHead>
              <TableHead>Custo por Uso</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {insumos?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum insumo cadastrado
                </TableCell>
              </TableRow>
            ) : (
              insumos?.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.nome}</TableCell>
                  <TableCell>{formatCurrency(i.valorCompra)}</TableCell>
                  <TableCell>
                    {i.rendimento % 1 === 0 ? i.rendimento : i.rendimento.toFixed(1)} usos
                  </TableCell>
                  <TableCell className="text-primary font-medium">
                    {formatCurrency(calcCustoPorUso(i.valorCompra, i.rendimento))}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditDialog(i)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate({ id: i.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </NeonCard>
    </div>
  );
}
