import { Filter, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { BentoCard, BentoCardContent, BentoGrid } from "@/components/ui/bento-grid";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useFinancialMetrics } from "@/hooks/use-financial-metrics";
import { trpc } from "@/lib/trpc";
import { FinancialSummaryCard } from "./cards/FinancialSummaryCard";
import { GoalCard } from "./cards/GoalCard";
import { NeonCoachCard } from "./cards/NeonCoachCard";
import { QuickActionCard } from "./cards/QuickActionCard";
import { StreakCard } from "./cards/StreakCard";
import { DailyBalanceChart } from "./DailyBalanceChart";
import { FileImportDialog } from "./FileImportDialog";
import { OnboardingCard } from "./OnboardingCard";

export function TransacoesTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split("T")[0],
    tipo: "receita" as "receita" | "despesa",
    descricao: "",
    valor: "",
    categoriaId: "",
    formaPagamentoId: "",
    nomeClienteFornecedor: "",
  });

  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Filter states
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [filterTipo, setFilterTipo] = useState<"all" | "receita" | "despesa">("all");

  const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const nextMonth = mes === 12 ? 1 : mes + 1;
  const nextYear = mes === 12 ? ano + 1 : ano;
  const dataFim = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  const utils = trpc.useUtils();
  const { data: transacoes, isLoading } = trpc.financeiro.transacoes.list.useQuery({
    dataInicio,
    dataFim,
  });
  const { data: resumo } = trpc.financeiro.transacoes.resumo.useQuery({ ano, mes });
  const { data: categorias } = trpc.financeiro.categorias.list.useQuery();
  const { data: formasPagamento } = trpc.financeiro.formasPagamento.list.useQuery();
  const { streak } = useFinancialMetrics();

  const createMutation = trpc.financeiro.transacoes.create.useMutation({
    onSuccess: () => {
      toast.success("Transação adicionada");
      utils.financeiro.transacoes.list.invalidate();
      utils.financeiro.transacoes.resumo.invalidate();
      setIsDialogOpen(false);
      setFormData({
        data: new Date().toISOString().split("T")[0],
        tipo: "receita",
        descricao: "",
        valor: "",
        categoriaId: "",
        formaPagamentoId: "",
        nomeClienteFornecedor: "",
      });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.financeiro.transacoes.delete.useMutation({
    onSuccess: () => {
      toast.success("Transação removida");
      utils.financeiro.transacoes.list.invalidate();
      utils.financeiro.transacoes.resumo.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteManyMutation = trpc.financeiro.transacoes.deleteAll.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.deleted} transações removidas`);
      setSelectedIds(new Set());
      utils.financeiro.transacoes.list.invalidate();
      utils.financeiro.transacoes.resumo.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Filtered transactions
  const filteredTransactions =
    transacoes?.filter((t) => {
      if (filterTipo !== "all" && t.tipo !== filterTipo) return false;
      if (filterCategoria !== "all" && String(t.categoriaId) !== filterCategoria) return false;
      return true;
    }) ?? [];

  // Selection helpers
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Computed values for selection
  const selectedTotal = filteredTransactions
    .filter((t) => selectedIds.has(t.id))
    .reduce((acc, t) => acc + (t.tipo === "receita" ? t.valor : -t.valor), 0);

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Excluir ${selectedIds.size} transações?`)) return;
    deleteManyMutation.mutate();
  };

  const handleSubmit = () => {
    const valorCents = Math.round(Number(formData.valor.replace(",", ".")) * 100);
    if (Number.isNaN(valorCents) || valorCents <= 0) {
      toast.error("Valor inválido");
      return;
    }
    if (!formData.descricao.trim()) {
      toast.error("Descrição é obrigatória");
      return;
    }
    createMutation.mutate({
      data: formData.data,
      tipo: formData.tipo,
      descricao: formData.descricao,
      valor: valorCents,
      categoriaId: formData.categoriaId ? parseInt(formData.categoriaId, 10) : undefined,
      formaPagamentoId: formData.formaPagamentoId
        ? parseInt(formData.formaPagamentoId, 10)
        : undefined,
      nomeClienteFornecedor: formData.nomeClienteFornecedor || undefined,
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  if (isLoading) {
    return (
      <NeonCard className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
        </div>
      </NeonCard>
    );
  }

  return (
    <div className="space-y-6">
      <OnboardingCard
        title="Como registrar transações?"
        storageKey="onboarding-transacoes"
        steps={[
          "Use 'Nova Transação' para registrar uma receita ou despesa",
          "Informe data, tipo (receita/despesa) e valor",
          "Selecione categoria e forma de pagamento (opcional)",
          "Ou importe várias transações de uma vez via CSV",
        ]}
      />
      <div className="mb-8">
        <BentoGrid className="grid-cols-1 md:grid-cols-3 auto-rows-[minmax(180px,auto)]">
          {/* Hero Card: Summary (Span 2 on Desktop) */}
          <BentoCard className="md:col-span-2 md:row-span-1">
            <BentoCardContent className="h-full p-0">
              <FinancialSummaryCard
                saldo={resumo?.saldo ?? 0}
                totalReceitas={resumo?.totalReceitas ?? 0}
                totalDespesas={resumo?.totalDespesas ?? 0}
                isLoading={isLoading}
              />
            </BentoCardContent>
          </BentoCard>

          {/* Quick Action */}
          <BentoCard className="md:col-span-1">
            <BentoCardContent className="h-full p-0">
              <QuickActionCard onClick={() => setIsDialogOpen(true)} />
            </BentoCardContent>
          </BentoCard>

          {/* Streak Card */}
          <BentoCard className="md:col-span-1">
            <BentoCardContent className="h-full p-0">
              <StreakCard streak={streak} isLoading={isLoading} />
            </BentoCardContent>
          </BentoCard>

          {/* Goal Card */}
          <BentoCard className="md:col-span-1">
            <BentoCardContent className="h-full p-0">
              <GoalCard currentRevenue={resumo?.totalReceitas ?? 0} />
            </BentoCardContent>
          </BentoCard>

          {/* Neon Coach Card */}
          <BentoCard className="md:col-span-1 border-neon-gold/50">
            <BentoCardContent className="h-full p-0">
              <NeonCoachCard />
            </BentoCardContent>
          </BentoCard>
        </BentoGrid>
      </div>

      {/* Daily Balance Chart */}
      <div className="mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-150">
        <DailyBalanceChart ano={ano} mes={mes} />
      </div>

      {/* Filtros e Ações */}
      <NeonCard className="p-6">
        {/* Toolbar: Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Month/Year Filters */}
            <Select value={String(mes)} onValueChange={(v) => setMes(parseInt(v, 10))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meses.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(ano)} onValueChange={(v) => setAno(parseInt(v, 10))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="h-6 w-px bg-border mx-1" />

            {/* Tipo Filter */}
            <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
              <Button
                variant={filterTipo === "all" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs cursor-pointer"
                onClick={() => setFilterTipo("all")}
              >
                Todos
              </Button>
              <Button
                variant={filterTipo === "receita" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs text-emerald-500 cursor-pointer"
                onClick={() => setFilterTipo("receita")}
              >
                Receitas
              </Button>
              <Button
                variant={filterTipo === "despesa" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs text-red-500 cursor-pointer"
                onClick={() => setFilterTipo("despesa")}
              >
                Despesas
              </Button>
            </div>

            {/* Categoria Filter */}
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {categorias?.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <FileImportDialog />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Nova Transação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Transação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={formData.data}
                        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      />
                    </div>
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
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descrição da transação"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor (R$)</Label>
                      <Input
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={formData.categoriaId}
                        onValueChange={(v) => setFormData({ ...formData, categoriaId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias
                            ?.filter((c) => c.tipo === formData.tipo)
                            .map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.nome}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Forma de Pagamento</Label>
                      <Select
                        value={formData.formaPagamentoId}
                        onValueChange={(v) => setFormData({ ...formData, formaPagamentoId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {formasPagamento?.map((fp) => (
                            <SelectItem key={fp.id} value={String(fp.id)}>
                              {fp.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cliente/Fornecedor</Label>
                      <Input
                        value={formData.nomeClienteFornecedor}
                        onChange={(e) =>
                          setFormData({ ...formData, nomeClienteFornecedor: e.target.value })
                        }
                        placeholder="Nome (opcional)"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending}
                    className="w-full"
                  >
                    {createMutation.isPending ? "Salvando..." : "Salvar Transação"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between gap-4 mb-4 p-3 bg-muted/50 rounded-lg border border-border animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {selectedIds.size} selecionada{selectedIds.size > 1 ? "s" : ""}
              </span>
              <span className="text-sm text-muted-foreground">
                Total:{" "}
                <span className={selectedTotal >= 0 ? "text-emerald-500" : "text-red-500"}>
                  {formatCurrency(Math.abs(selectedTotal))}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs cursor-pointer"
                onClick={clearSelection}
              >
                Limpar seleção
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 cursor-pointer"
                onClick={handleBulkDelete}
                disabled={deleteManyMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </Button>
            </div>
          </div>
        )}

        {/* Tabela */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    filteredTransactions.length > 0 &&
                    selectedIds.size === filteredTransactions.length
                  }
                  onCheckedChange={selectAll}
                  aria-label="Selecionar todos"
                />
              </TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {transacoes?.length === 0
                    ? "Nenhuma transação neste período"
                    : "Nenhuma transação corresponde aos filtros"}
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((t) => (
                <TableRow
                  key={t.id}
                  className={`transition-colors hover:bg-muted/50 ${selectedIds.has(t.id) ? "bg-muted/30" : ""}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(t.id)}
                      onCheckedChange={() => toggleSelect(t.id)}
                      aria-label={`Selecionar transação ${t.descricao}`}
                    />
                  </TableCell>
                  <TableCell>{new Date(t.data).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge variant={t.tipo === "receita" ? "default" : "destructive"}>
                      {t.tipo === "receita" ? "Receita" : "Despesa"}
                    </Badge>
                  </TableCell>
                  <TableCell>{t.descricao}</TableCell>
                  <TableCell className="text-muted-foreground">{t.categoriaNome ?? "-"}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${t.tipo === "receita" ? "text-emerald-500" : "text-red-500"}`}
                  >
                    {t.tipo === "receita" ? "+" : "-"}
                    {formatCurrency(t.valor)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                      onClick={() => deleteMutation.mutate({ id: t.id })}
                    >
                      ×
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
