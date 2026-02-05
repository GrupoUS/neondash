import { Calculator, Plus, Trash2 } from "lucide-react";
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

import { trpc } from "@/lib/trpc";

type InsumoProcedimento = {
  insumoId: number;
  quantidade: number;
};

export function PrecificacaoTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProcedimentoId, setSelectedProcedimentoId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    precoVenda: "",
    custoOperacional: "",
    custoInvestimento: "",
    percentualParceiro: "",
    percentualImposto: "7",
    insumos: [] as InsumoProcedimento[],
  });
  const [tempInsumo, setTempInsumo] = useState({ insumoId: "", quantidade: "1" });

  const utils = trpc.useUtils();
  const { data: procedimentos, isLoading } = trpc.precificacao.procedimentos.list.useQuery();
  const { data: insumosDisponiveis } = trpc.precificacao.insumos.list.useQuery();
  const { data: custoCalc } = trpc.precificacao.procedimentos.calcularCusto.useQuery(
    { id: selectedProcedimentoId! },
    { enabled: !!selectedProcedimentoId }
  );

  const createMutation = trpc.precificacao.procedimentos.create.useMutation({
    onSuccess: () => {
      toast.success("Procedimento criado");
      utils.precificacao.procedimentos.list.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.precificacao.procedimentos.delete.useMutation({
    onSuccess: () => {
      toast.success("Procedimento removido");
      utils.precificacao.procedimentos.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      precoVenda: "",
      custoOperacional: "",
      custoInvestimento: "",
      percentualParceiro: "",
      percentualImposto: "7",
      insumos: [],
    });
    setTempInsumo({ insumoId: "", quantidade: "1" });
  };

  const handleAddInsumo = () => {
    if (!tempInsumo.insumoId) return;
    const insumoId = parseInt(tempInsumo.insumoId, 10);
    const quantidade = parseInt(tempInsumo.quantidade, 10) || 1;

    if (formData.insumos.some((i) => i.insumoId === insumoId)) {
      toast.error("Insumo já adicionado");
      return;
    }

    setFormData({
      ...formData,
      insumos: [...formData.insumos, { insumoId, quantidade }],
    });
    setTempInsumo({ insumoId: "", quantidade: "1" });
  };

  const handleRemoveInsumo = (insumoId: number) => {
    setFormData({
      ...formData,
      insumos: formData.insumos.filter((i) => i.insumoId !== insumoId),
    });
  };

  const handleSubmit = () => {
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    const precoVenda = Math.round(Number(formData.precoVenda.replace(",", ".")) * 100);
    if (Number.isNaN(precoVenda) || precoVenda <= 0) {
      toast.error("Preço de venda inválido");
      return;
    }

    const custoOperacional = formData.custoOperacional
      ? Math.round(Number(formData.custoOperacional.replace(",", ".")) * 100)
      : undefined;
    const custoInvestimento = formData.custoInvestimento
      ? Math.round(Number(formData.custoInvestimento.replace(",", ".")) * 100)
      : undefined;
    const percentualParceiro = formData.percentualParceiro
      ? Math.round(Number(formData.percentualParceiro.replace(",", ".")) * 100)
      : undefined;
    const percentualImposto = formData.percentualImposto
      ? Math.round(Number(formData.percentualImposto.replace(",", ".")) * 100)
      : 700;

    createMutation.mutate({
      nome: formData.nome,
      precoVenda,
      custoOperacional,
      custoInvestimento,
      percentualParceiro,
      percentualImposto,
      insumos: formData.insumos.length > 0 ? formData.insumos : undefined,
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const getInsumoName = (insumoId: number) => {
    return insumosDisponiveis?.find((i) => i.id === insumoId)?.nome ?? "Desconhecido";
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
              Novo Procedimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Procedimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Procedimento</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Botox Facial"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço de Venda (R$)</Label>
                  <Input
                    value={formData.precoVenda}
                    onChange={(e) => setFormData({ ...formData, precoVenda: e.target.value })}
                    placeholder="Ex: 800,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Custo Operacional (R$)</Label>
                  <Input
                    value={formData.custoOperacional}
                    onChange={(e) => setFormData({ ...formData, custoOperacional: e.target.value })}
                    placeholder="Ex: 50,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Custo Investimento (R$)</Label>
                  <Input
                    value={formData.custoInvestimento}
                    onChange={(e) =>
                      setFormData({ ...formData, custoInvestimento: e.target.value })
                    }
                    placeholder="Ex: 20,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>% Parceiro</Label>
                  <Input
                    value={formData.percentualParceiro}
                    onChange={(e) =>
                      setFormData({ ...formData, percentualParceiro: e.target.value })
                    }
                    placeholder="Ex: 30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>% Imposto</Label>
                <Input
                  value={formData.percentualImposto}
                  onChange={(e) => setFormData({ ...formData, percentualImposto: e.target.value })}
                  placeholder="Ex: 7"
                />
              </div>

              {/* Insumos */}
              <div className="space-y-2">
                <Label>Insumos</Label>
                <div className="flex gap-2">
                  <Select
                    value={tempInsumo.insumoId}
                    onValueChange={(v) => setTempInsumo({ ...tempInsumo, insumoId: v })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um insumo" />
                    </SelectTrigger>
                    <SelectContent>
                      {insumosDisponiveis?.map((i) => (
                        <SelectItem key={i.id} value={String(i.id)}>
                          {i.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="w-20"
                    type="number"
                    value={tempInsumo.quantidade}
                    onChange={(e) => setTempInsumo({ ...tempInsumo, quantidade: e.target.value })}
                    placeholder="Qtd"
                  />
                  <Button type="button" variant="outline" onClick={handleAddInsumo}>
                    +
                  </Button>
                </div>
                {formData.insumos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.insumos.map((i) => (
                      <Badge key={i.insumoId} variant="secondary" className="gap-1">
                        {getInsumoName(i.insumoId)} x{i.quantidade}
                        <button
                          type="button"
                          onClick={() => handleRemoveInsumo(i.insumoId)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Salvando..." : "Criar Procedimento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Procedimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {procedimentos?.length === 0 ? (
          <NeonCard className="p-8 col-span-full text-center text-muted-foreground">
            Nenhum procedimento cadastrado
          </NeonCard>
        ) : (
          procedimentos?.map((p) => (
            <NeonCard key={p.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{p.nome}</h3>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(p.precoVenda)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setSelectedProcedimentoId(selectedProcedimentoId === p.id ? null : p.id)
                    }
                    className={selectedProcedimentoId === p.id ? "bg-primary/10" : ""}
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate({ id: p.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Insumos do procedimento */}
              {p.insumos && p.insumos.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Insumos:</p>
                  <div className="flex flex-wrap gap-1">
                    {p.insumos.map((i) => (
                      <Badge key={i.insumoId} variant="outline" className="text-xs">
                        {i.insumoNome} x{i.quantidade}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Cálculo de custos */}
              {selectedProcedimentoId === p.id && custoCalc && (
                <div className="border-t pt-4 mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo Insumos:</span>
                    <span>{formatCurrency(custoCalc.custoInsumos)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo Operacional:</span>
                    <span>{formatCurrency(custoCalc.custoOperacional)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo Investimento:</span>
                    <span>{formatCurrency(custoCalc.custoInvestimento)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo Parceiro:</span>
                    <span>{formatCurrency(custoCalc.custoParceiro)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Custo Total:</span>
                    <span className="text-red-500">{formatCurrency(custoCalc.custoTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lucro Parcial:</span>
                    <span>{formatCurrency(custoCalc.lucroParcial)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Imposto:</span>
                    <span className="text-red-500">-{formatCurrency(custoCalc.imposto)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Lucro Final:</span>
                    <span
                      className={custoCalc.lucroFinal >= 0 ? "text-emerald-500" : "text-red-500"}
                    >
                      {formatCurrency(custoCalc.lucroFinal)}
                    </span>
                  </div>
                </div>
              )}
            </NeonCard>
          ))
        )}
      </div>
    </div>
  );
}
