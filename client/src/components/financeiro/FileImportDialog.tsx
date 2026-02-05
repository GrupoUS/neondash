import { FileSpreadsheet, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type DetectedPeriod, type ParsedTransaction, parseTransactions } from "@/lib/csvParser";
import { trpc } from "@/lib/trpc";

interface FileImportDialogProps {
  onSuccess?: () => void;
}

export function FileImportDialog({ onSuccess }: FileImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [detectedPeriod, setDetectedPeriod] = useState<DetectedPeriod | null>(null);

  const utils = trpc.useUtils();
  const importMutation = trpc.financeiro.transacoes.importCsv.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.imported} transações importadas com sucesso!`);
      utils.financeiro.transacoes.list.invalidate();
      utils.financeiro.transacoes.resumo.invalidate();
      setIsOpen(false);
      setParsedData([]);
      setFileName(null);
      setDetectedPeriod(null);
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const content = reader.result as string;
      const result = parseTransactions(content);

      if (result.errors.length > 0) {
        toast.warning(`Avisos: ${result.errors[0]}`);
      }

      if (result.transactions.length === 0) {
        toast.error("Nenhuma transação válida encontrada no arquivo.");
        return;
      }

      setParsedData(result.transactions);
      setFileName(file.name);
      setDetectedPeriod(result.detectedPeriod);

      const periodInfo = result.detectedPeriod
        ? ` (${result.detectedPeriod.mes.toString().padStart(2, "0")}/${result.detectedPeriod.ano})`
        : "";
      toast.success(`${result.transactions.length} transações encontradas${periodInfo}`);
    };

    reader.onerror = () => {
      toast.error("Erro ao ler arquivo");
    };

    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleImport = () => {
    if (parsedData.length === 0) return;

    // Send parsed transactions directly to backend
    importMutation.mutate({ transactions: parsedData });
  };

  const removeTransaction = (index: number) => {
    setParsedData((prev) => prev.filter((_, i) => i !== index));
  };

  const clearData = () => {
    setParsedData([]);
    setFileName(null);
    setDetectedPeriod(null);
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Transações</DialogTitle>
          <DialogDescription>Arraste um arquivo CSV ou clique para selecionar.</DialogDescription>
        </DialogHeader>

        {parsedData.length === 0 ? (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive && !isDragReject ? "border-primary bg-primary/5" : ""}
              ${isDragReject ? "border-destructive bg-destructive/5" : ""}
              ${!isDragActive ? "border-muted-foreground/25 hover:border-primary/50" : ""}
            `}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragReject ? (
              <p className="text-destructive">Formato de arquivo não suportado</p>
            ) : isDragActive ? (
              <p className="text-primary">Solte o arquivo aqui...</p>
            ) : (
              <>
                <p className="text-muted-foreground mb-2">
                  Arraste um arquivo CSV ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground">
                  Suporta extrato bancário (BTG/Inter) ou CSV simples:{" "}
                  <code>data,descricao,valor</code>
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{fileName}</span>
                <Badge variant="secondary">{parsedData.length} transações</Badge>
                {detectedPeriod && (
                  <Badge
                    variant="outline"
                    className="bg-blue-500/10 text-blue-500 border-blue-500/20"
                  >
                    {detectedPeriod.mes.toString().padStart(2, "0")}/{detectedPeriod.ano}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={clearData}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </div>

            <ScrollArea className="h-[60vh] border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-card shadow-sm">
                  <TableRow>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead className="w-[90px]">Tipo</TableHead>
                    <TableHead className="min-w-[150px]">Categoria</TableHead>
                    <TableHead className="min-w-[200px]">Descrição</TableHead>
                    <TableHead className="text-right w-[120px]">Valor</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((t, idx) => (
                    <TableRow key={`${t.data}-${t.descricao}-${idx}`} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs">{t.data}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            t.tipo === "receita"
                              ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
                              : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
                          }
                        >
                          {t.tipo === "receita" ? "Receita" : "Despesa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-xs max-w-[140px] truncate"
                          title={t.suggestedCategory}
                        >
                          {t.suggestedCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate" title={t.descricao}>
                        {t.descricao}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium font-mono ${
                          t.tipo === "receita" ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {t.tipo === "receita" ? "+" : "-"}
                        {formatCurrency(t.valor)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => removeTransaction(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={clearData}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={importMutation.isPending || parsedData.length === 0}
              >
                {importMutation.isPending ? "Importando..." : "Importar transações"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
