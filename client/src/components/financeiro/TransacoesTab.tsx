import { ArrowDownCircle, ArrowUpCircle, Plus, Upload } from "lucide-react";
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

export function TransacoesTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvContent, setCsvContent] = useState("");
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

  const importMutation = trpc.financeiro.transacoes.importCsv.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.imported} transações importadas`);
      utils.financeiro.transacoes.list.invalidate();
      utils.financeiro.transacoes.resumo.invalidate();
      setIsImportDialogOpen(false);
      setCsvContent("");
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
          <Skeleton className="h-64 w-full" />
        </div>
      </NeonCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NeonCard className="p-4 bg-emerald-500/10 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Receitas</p>
              <p className="text-2xl font-bold text-emerald-500">
                {formatCurrency(resumo?.totalReceitas ?? 0)}
              </p>
            </div>
            <ArrowUpCircle className="h-8 w-8 text-emerald-500/50" />
          </div>
        </NeonCard>
        <NeonCard className="p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Despesas</p>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(resumo?.totalDespesas ?? 0)}
              </p>
            </div>
            <ArrowDownCircle className="h-8 w-8 text-red-500/50" />
          </div>
        </NeonCard>
        <NeonCard className="p-4 bg-primary/10 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p
                className={`text-2xl font-bold ${(resumo?.saldo ?? 0) >= 0 ? "text-primary" : "text-red-500"}`}
              >
                {formatCurrency(resumo?.saldo ?? 0)}
              </p>
            </div>
          </div>
        </NeonCard>
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
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Upload className="h-4 w-4" />
                  Importar CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Importar Transações (CSV)</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Formato esperado: data,descricao,valor (valores positivos = receita, negativos =
                    despesa)
                  </p>
                  <Textarea
                    placeholder={
                      "2024-01-15,Venda procedimento,350.00\n2024-01-16,Compra insumos,-120.00"
                    }
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    rows={8}
                  />
                  <Button
                    onClick={() => importMutation.mutate({ csvContent })}
                    disabled={importMutation.isPending || !csvContent.trim()}
                    className="w-full"
                  >
                    {importMutation.isPending ? "Importando..." : "Importar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

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
