import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import Papa from "papaparse";
import { useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface ImportPatientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TARGET_FIELDS = [
  { value: "nomeCompleto", label: "Nome Completo (Obrigatório)" },
  { value: "email", label: "Email" },
  { value: "telefone", label: "Telefone" },
  { value: "dataNascimento", label: "Data de Nascimento" },
  { value: "cpf", label: "CPF" },
  { value: "rg", label: "RG" },
  { value: "genero", label: "Gênero" },
  { value: "endereco", label: "Endereço" },
  { value: "bairro", label: "Bairro" },
  { value: "cidade", label: "Cidade" },
  { value: "estado", label: "Estado (UF)" },
  { value: "convenio", label: "Convênio" },
  { value: "numeroCarteirinha", label: "Nº Carteirinha" },
  { value: "numeroProntuario", label: "Nº Prontuário" },
  { value: "observacoes", label: "Observações" },
];

export function ImportPatientsDialog({ open, onOpenChange, onSuccess }: ImportPatientsDialogProps) {
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing">("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getMappingMutation = trpc.pacientes.getImportMapping.useMutation();
  const bulkCreateMutation = trpc.pacientes.bulkCreate.useMutation();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    await processFile(selectedFile);
  };

  const processFile = async (file: File) => {
    const isCsv = file.name.endsWith(".csv");
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    if (!isCsv && !isExcel) {
      toast.error("Formato de arquivo não suportado. Use CSV ou Excel.");
      return;
    }

    try {
      if (isCsv) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedData = results.data as Record<string, unknown>[];
            const parsedHeaders = results.meta.fields || [];
            if (parsedHeaders.length === 0) {
              toast.error("Não foi possível identificar as colunas do arquivo.");
              return;
            }
            setHeaders(parsedHeaders);
            setData(parsedData);
            analyzeMapping(parsedHeaders, parsedData);
          },
          error: (error) => {
            toast.error(`Erro ao ler CSV: ${error.message}`);
          },
        });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const buffer = e.target?.result;
          const workbook = XLSX.read(buffer, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const parsedData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

          if (parsedData.length === 0) {
            toast.error("Planilha vazia.");
            return;
          }

          // Get headers from the first row keys
          const parsedHeaders = Object.keys(parsedData[0]);
          setHeaders(parsedHeaders);
          setData(parsedData);
          analyzeMapping(parsedHeaders, parsedData);
        };
        reader.readAsArrayBuffer(file);
      }
    } catch {
      toast.error("Erro ao processar arquivo.");
    }
  };

  const analyzeMapping = (headers: string[], sampleData: Record<string, unknown>[]) => {
    setStep("mapping");
    getMappingMutation.mutate(
      { headers, sampleRows: sampleData.slice(0, 3) },
      {
        onSuccess: (suggestedMapping) => {
          setMapping(suggestedMapping as Record<string, string>);
          toast.success("Mapeamento sugerido pela IA gerado com sucesso!");
        },
        onError: () => {
          toast.error("Não foi possível usar a IA para mapear. Faça o mapeamento manual.");
          // Initialize empty mapping
          setMapping({});
        },
      }
    );
  };

  const handleMappingChange = (header: string, field: string) => {
    setMapping((prev) => ({ ...prev, [header]: field }));
  };

  const handleImport = () => {
    // Validate mapping
    const mappedFields = Object.values(mapping);
    if (!mappedFields.includes("nomeCompleto")) {
      toast.error("O campo 'Nome Completo' é obrigatório.");
      return;
    }

    setStep("importing");

    // Transform data
    const transformedData = data.map((row) => {
      const newRow: Record<string, unknown> = {};
      Object.entries(mapping).forEach(([header, field]) => {
        if (field && field !== "ignore") {
          newRow[field] = row[header];
        }
      });
      return newRow;
    });

    bulkCreateMutation.mutate(transformedData as any, {
      onSuccess: (result) => {
        toast.success(`${result.count} pacientes importados com sucesso!`);
        onSuccess();
        onOpenChange(false);
        setStep("upload");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setData([]);
        setHeaders([]);
        setMapping({});
      },
      onError: (error) => {
        toast.error(`Erro na importação: ${error.message}`);
        setStep("mapping");
      },
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Pacientes</DialogTitle>
          <DialogDescription>
            Carregue uma planilha CSV ou Excel para importar pacientes em massa. A IA irá sugerir o
            mapeamento das colunas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {step === "upload" && (
            <button
              type="button"
              className="w-full border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
              />
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <UploadCloud className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Clique para carregar ou arraste o arquivo
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Suporta arquivos .CSV e .XLSX (Excel). Certifique-se que a primeira linha contém os
                nomes das colunas.
              </p>
            </button>
          )}

          {step === "mapping" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 bg-blue-500/10 text-blue-500 p-4 rounded-md text-sm border border-blue-500/20">
                {getMappingMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analisando arquivo com IA e sugerindo mapeamento...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Verifique o mapeamento das colunas abaixo. Ajuste se necessário.</span>
                  </>
                )}
              </div>

              <ScrollArea className="h-[400px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Coluna do Arquivo</TableHead>
                      <TableHead>Amostra (Linha 1)</TableHead>
                      <TableHead className="w-[300px]">Campo no Sistema</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {headers.map((header) => (
                      <TableRow key={header}>
                        <TableCell className="font-medium">{header}</TableCell>
                        <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">
                          {String(data[0]?.[header] ?? "")}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={mapping[header] || ""}
                            onValueChange={(value) => handleMappingChange(header, value)}
                            disabled={getMappingMutation.isPending}
                          >
                            <SelectTrigger
                              className={cn(
                                "w-full",
                                mapping[header] ? "border-green-500/50 bg-green-500/5" : ""
                              )}
                            >
                              <SelectValue placeholder="Ignorar coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ignore">Ignorar coluna</SelectItem>
                              {TARGET_FIELDS.map((field) => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="text-xs text-muted-foreground text-right">
                {data.length} registros encontrados no arquivo.
              </div>
            </div>
          )}

          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <h3 className="text-lg font-medium">Importando {data.length} pacientes...</h3>
              <p className="text-muted-foreground">Isso pode levar alguns instantes.</p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={step === "importing"}
          >
            Cancelar
          </Button>
          {step === "mapping" && (
            <Button
              onClick={handleImport}
              disabled={
                getMappingMutation.isPending ||
                !Object.values(mapping).some((v) => v === "nomeCompleto")
              }
            >
              {bulkCreateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importando...
                </>
              ) : (
                "Confirmar Importação"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
