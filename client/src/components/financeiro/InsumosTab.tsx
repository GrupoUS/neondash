import { Plus, Trash2 } from "lucide-react";
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

export function InsumosTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    valorCompra: "",
    rendimento: "",
  });

  const utils = trpc.useUtils();
  const { data: insumos, isLoading } = trpc.precificacao.insumos.list.useQuery();

  const createMutation = trpc.precificacao.insumos.create.useMutation({
    onSuccess: () => {
      toast.success("Insumo criado");
      utils.precificacao.insumos.list.invalidate();
      setIsDialogOpen(false);
      setFormData({ nome: "", valorCompra: "", rendimento: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.precificacao.insumos.delete.useMutation({
    onSuccess: () => {
      toast.success("Insumo removido");
      utils.precificacao.insumos.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    const valorCompra = Math.round(Number(formData.valorCompra.replace(",", ".")) * 100);
    const rendimento = parseInt(formData.rendimento, 10);

    if (Number.isNaN(valorCompra) || valorCompra <= 0) {
      toast.error("Valor de compra inválido");
      return;
    }
    if (Number.isNaN(rendimento) || rendimento <= 0) {
      toast.error("Rendimento inválido");
      return;
    }

    createMutation.mutate({
      nome: formData.nome,
      valorCompra,
      rendimento,
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const calcCustoPorUso = (valorCompra: number, rendimento: number) => {
    return Math.round(valorCompra / rendimento);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Novo Insumo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Insumo</DialogTitle>
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
                    type="number"
                    value={formData.rendimento}
                    onChange={(e) => setFormData({ ...formData, rendimento: e.target.value })}
                    placeholder="Ex: 5"
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Salvando..." : "Criar Insumo"}
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
              <TableHead className="w-[50px]" />
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
                  <TableCell>{i.rendimento} usos</TableCell>
                  <TableCell className="text-primary font-medium">
                    {formatCurrency(calcCustoPorUso(i.valorCompra, i.rendimento))}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate({ id: i.id })}
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
  );
}
