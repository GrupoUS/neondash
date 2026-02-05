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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

interface ParsedTransaction {
  data: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
}

interface FileImportDialogProps {
  onSuccess?: () => void;
}

export function FileImportDialog({ onSuccess }: FileImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const importMutation = trpc.financeiro.transacoes.importCsv.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.imported} transações importadas com sucesso!`);
      utils.financeiro.transacoes.list.invalidate();
      utils.financeiro.transacoes.resumo.invalidate();
      setIsOpen(false);
      setParsedData([]);
      setFileName(null);
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const parseCsv = useCallback((content: string): ParsedTransaction[] => {
    const lines = content.trim().split("\n");
    const transactions: ParsedTransaction[] = [];

    // Detect if this is a bank statement format (BTG/Inter style with quoted fields)
    const isBankStatement =
      lines[0]?.includes('"Data"') ||
      lines[0]?.includes('"Descricao"') ||
      lines[0]?.includes('"Descrição"');

    // Skip header if present
    const headerLine = lines[0]?.toLowerCase() || "";
    const hasHeader =
      headerLine.includes("data") || headerLine.includes("descri") || headerLine.includes("valor");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    for (const line of dataLines) {
      if (!line.trim()) continue;

      let dataStr: string | undefined;
      let descricao: string | undefined;
      let valorStr: string | undefined;

      if (isBankStatement) {
        // Parse quoted CSV: "Data","Descricao","Credenciadora","Produto","CNPJ","Valor","Saldo"
        // Match quoted fields, handling commas inside quotes
        const matches = line.match(/"([^"]*)"/g);
        if (!matches || matches.length < 2) continue;

        // Remove quotes from matches
        const fields = matches.map((m) => m.replace(/"/g, "").trim());

        // Fields: 0=Data, 1=Descricao, 2=Credenciadora, 3=Produto, 4=CNPJ, 5=Valor, 6=Saldo
        dataStr = fields[0]; // DD/MM/YYYY format
        descricao = fields[1];
        valorStr = fields[5]; // Brazilian format: "1.234,56" or "-1.234,56"

        // Convert DD/MM/YYYY to YYYY-MM-DD
        if (dataStr && /^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
          const [day, month, year] = dataStr.split("/");
          dataStr = `${year}-${month}-${day}`;
        }
      } else {
        // Simple CSV format: data,descricao,valor
        const separator = line.includes(";") ? ";" : ",";
        const parts = line.split(separator).map((s) => s.trim());
        [dataStr, descricao, valorStr] = parts;
      }

      if (!dataStr || !descricao || !valorStr) continue;

      // Parse Brazilian number format: remove thousand separators (.) and convert decimal (,) to (.)
      // "1.234,56" -> "1234.56" ; "-791,96" -> "-791.96"
      const cleanValue = valorStr
        .replace(/\s/g, "") // remove spaces
        .replace(/\./g, "") // remove thousand separators
        .replace(",", "."); // convert decimal separator

      const valor = Math.round(Number.parseFloat(cleanValue) * 100);
      if (Number.isNaN(valor)) continue;

      transactions.push({
        data: dataStr,
        descricao,
        valor: Math.abs(valor),
        tipo: valor >= 0 ? "receita" : "despesa",
      });
    }

    return transactions;
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 5MB.");
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const content = reader.result as string;
        const parsed = parseCsv(content);

        if (parsed.length === 0) {
          toast.error("Nenhuma transação válida encontrada no arquivo.");
          return;
        }

        setParsedData(parsed);
        setFileName(file.name);
        toast.success(`${parsed.length} transações encontradas`);
      };

      reader.onerror = () => {
        toast.error("Erro ao ler arquivo");
      };

      reader.readAsText(file);
    },
    [parseCsv]
  );

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

    // Convert back to CSV format for the existing backend
    const csvLines = ["data,descricao,valor"];
    for (const t of parsedData) {
      const valorStr = t.tipo === "despesa" ? -t.valor / 100 : t.valor / 100;
      csvLines.push(`${t.data},${t.descricao},${valorStr}`);
    }

    importMutation.mutate({ csvContent: csvLines.join("\n") });
  };

  const removeTransaction = (index: number) => {
    setParsedData((prev) => prev.filter((_, i) => i !== index));
  };

  const clearData = () => {
    setParsedData([]);
    setFileName(null);
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
      <DialogContent className="max-w-2xl">
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
              </div>
              <Button variant="ghost" size="sm" onClick={clearData}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </div>

            <div className="max-h-[300px] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((t, idx) => (
                    <TableRow key={`${t.data}-${t.descricao}-${idx}`}>
                      <TableCell className="text-sm">{t.data}</TableCell>
                      <TableCell>
                        <Badge variant={t.tipo === "receita" ? "default" : "destructive"}>
                          {t.tipo === "receita" ? "Receita" : "Despesa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {t.descricao}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
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
                          className="h-6 w-6"
                          onClick={() => removeTransaction(idx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

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
