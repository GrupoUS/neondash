import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { BentoCard, BentoCardContent, BentoGrid } from "@/components/ui/bento-grid";
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

interface TransacoesTabProps {
  onNavigateToAnalysis?: () => void;
}

export function TransacoesTab({ onNavigateToAnalysis }: TransacoesTabProps) {
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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
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

        {/* Tabela */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transacoes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma transação neste período
                </TableCell>
              </TableRow>
            ) : (
              transacoes?.map((t) => (
                <TableRow key={t.id}>
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
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
