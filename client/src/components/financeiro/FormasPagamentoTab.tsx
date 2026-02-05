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

export function FormasPagamentoTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    taxaPercentual: "",
    prazoRecebimentoDias: "",
  });

  const utils = trpc.useUtils();
  const { data: formasPagamento, isLoading } = trpc.financeiro.formasPagamento.list.useQuery();

  const createMutation = trpc.financeiro.formasPagamento.create.useMutation({
    onSuccess: () => {
      toast.success("Forma de pagamento criada");
      utils.financeiro.formasPagamento.list.invalidate();
      setIsDialogOpen(false);
      setFormData({ nome: "", taxaPercentual: "", prazoRecebimentoDias: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.financeiro.formasPagamento.delete.useMutation({
    onSuccess: () => {
      toast.success("Forma de pagamento removida");
      utils.financeiro.formasPagamento.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    const taxaPercentual = formData.taxaPercentual
      ? Math.round(Number(formData.taxaPercentual.replace(",", ".")) * 100)
      : undefined;
    const prazoRecebimentoDias = formData.prazoRecebimentoDias
      ? parseInt(formData.prazoRecebimentoDias, 10)
      : undefined;

    createMutation.mutate({
      nome: formData.nome,
      taxaPercentual,
      prazoRecebimentoDias,
    });
  };

  const formatTaxa = (taxa?: number | null) => {
    if (!taxa) return "-";
    return `${(taxa / 100).toFixed(2)}%`;
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
              Nova Forma de Pagamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Forma de Pagamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Cartão de Crédito"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Taxa (%)</Label>
                  <Input
                    value={formData.taxaPercentual}
                    onChange={(e) => setFormData({ ...formData, taxaPercentual: e.target.value })}
                    placeholder="Ex: 2,5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prazo (dias)</Label>
                  <Input
                    type="number"
                    value={formData.prazoRecebimentoDias}
                    onChange={(e) =>
                      setFormData({ ...formData, prazoRecebimentoDias: e.target.value })
                    }
                    placeholder="Ex: 30"
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Salvando..." : "Criar Forma de Pagamento"}
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
              <TableHead>Taxa</TableHead>
              <TableHead>Prazo (dias)</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {formasPagamento?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhuma forma de pagamento cadastrada
                </TableCell>
              </TableRow>
            ) : (
              formasPagamento?.map((fp) => (
                <TableRow key={fp.id}>
                  <TableCell className="font-medium">{fp.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatTaxa(fp.taxaPercentual)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {fp.prazoRecebimentoDias ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate({ id: fp.id })}
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
