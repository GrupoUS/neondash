import {
  Download,
  Eye,
  File,
  FileCheck,
  FileImage,
  FilePlus,
  FileSignature,
  FileText,
  FileType,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

type TipoDocumento = "consentimento" | "exame" | "prescricao" | "outro";

interface PatientDocument {
  id: number;
  nome: string;
  tipo: TipoDocumento;
  url: string;
  observacoes: string | null;
  assinadoPor: string | null;
  dataAssinatura: Date | string | null;
  createdAt: Date | string | null;
}

interface DocumentManagerProps {
  patientId: number;
}

const tipoLabels: Record<TipoDocumento, string> = {
  consentimento: "Consentimento",
  exame: "Exame",
  prescricao: "Prescrição",
  outro: "Outro",
};

const tipoIcons: Record<TipoDocumento, typeof File> = {
  consentimento: FileCheck,
  exame: FileImage,
  prescricao: FileType,
  outro: File,
};

const tipoBadgeColors: Record<TipoDocumento, string> = {
  consentimento: "bg-green-500/10 text-green-700",
  exame: "bg-orange-500/10 text-orange-700",
  prescricao: "bg-blue-500/10 text-blue-700",
  outro: "bg-gray-500/10 text-gray-700",
};

const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (!base64) return reject(new Error("Failed to encode file"));
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const parts = dataUrl.split(",");
  const mime = parts[0]?.match(/:(.*?);/)?.[1] || "application/octet-stream";
  const raw = atob(parts[1] || "");
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  const blob = new Blob([arr], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DocumentManager({ patientId }: DocumentManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipo, setFilterTipo] = useState<"all" | TipoDocumento>("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<PatientDocument | null>(null);

  const [signatureDoc, setSignatureDoc] = useState<PatientDocument | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signatureMode, setSignatureMode] = useState<"draw" | "upload">("draw");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [uploadTitulo, setUploadTitulo] = useState("");
  const [uploadTipo, setUploadTipo] = useState<TipoDocumento>("outro");
  const [uploadDescricao, setUploadDescricao] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEncoding, setIsEncoding] = useState(false);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.pacientes.documentos.list.useQuery(
    { pacienteId: patientId },
    { staleTime: 30_000 }
  );

  const invalidateDocumentQueries = async () => {
    await Promise.all([
      utils.pacientes.documentos.list.invalidate({ pacienteId: patientId }),
      utils.pacientes.getById.invalidate({ id: patientId }),
    ]);
  };

  const uploadMutation = trpc.pacientes.documentos.upload.useMutation({
    onSuccess: () => {
      toast.success("Documento enviado com sucesso");
      setIsUploadOpen(false);
      resetUploadForm();
      void invalidateDocumentQueries();
    },
    onError: (e) => toast.error(e.message || "Erro ao enviar documento"),
  });

  const signMutation = trpc.pacientes.documentos.update.useMutation({
    onSuccess: () => {
      toast.success("Documento assinado");
      closeSignatureDialog();
      void invalidateDocumentQueries();
    },
    onError: (e) => toast.error(e.message || "Erro ao assinar documento"),
  });

  const deleteMutation = trpc.pacientes.documentos.delete.useMutation({
    onSuccess: () => {
      toast.success("Documento excluído");
      setDeleteDoc(null);
      void invalidateDocumentQueries();
    },
    onError: (e) => toast.error(e.message || "Erro ao excluir"),
  });

  const documents = useMemo(() => {
    let items = (data ?? []) as unknown as PatientDocument[];

    if (filterTipo !== "all") {
      items = items.filter((d) => d.tipo === filterTipo);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (d) => d.nome.toLowerCase().includes(query) || d.observacoes?.toLowerCase().includes(query)
      );
    }

    return items;
  }, [data, filterTipo, searchQuery]);

  const resetUploadForm = () => {
    setUploadTitulo("");
    setUploadTipo("outro");
    setUploadDescricao("");
    setSelectedFile(null);
    setIsDragging(false);
    setIsEncoding(false);
  };

  const processFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("Tipo de arquivo não suportado. Use PDF, DOC, DOCX, JPEG, PNG ou WebP.");
        return;
      }
      if (file.size > MAX_DOC_SIZE) {
        toast.error("Arquivo muito grande. Máximo 10MB.");
        return;
      }
      setSelectedFile(file);
      // Auto-fill title from filename if empty
      if (!uploadTitulo) {
        const nameWithoutExt = file.name.replace(/\.[^.]+$/, "");
        setUploadTitulo(nameWithoutExt);
      }
    },
    [uploadTitulo]
  );

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const getFileIcon = (file: File | null) => {
    if (!file) return FileText;
    if (file.type === "application/pdf") return FileText;
    if (file.type.startsWith("image/")) return FileImage;
    return File;
  };

  const isDocumentSigned = (doc: PatientDocument) => Boolean(doc.assinadoPor && doc.dataAssinatura);

  const formatDate = (value: Date | string | null) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("pt-BR");
  };

  const formatDateTime = (value: Date | string | null) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleString("pt-BR");
  };

  const initializeSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#111827";
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
  };

  const clearCanvasSignature = () => {
    initializeSignatureCanvas();
    setHasDrawnSignature(false);
    setSignaturePreview(null);
  };

  const closeSignatureDialog = () => {
    setSignatureDoc(null);
    setSignerName("");
    setSignatureMode("draw");
    setIsDrawing(false);
    setHasDrawnSignature(false);
    setSignaturePreview(null);
  };

  const openSignatureDialog = (doc: PatientDocument) => {
    setSignatureDoc(doc);
    setSignerName(doc.assinadoPor ?? "");
    setSignatureMode("draw");
    setIsDrawing(false);
    setHasDrawnSignature(false);
    setSignaturePreview(null);
    requestAnimationFrame(() => {
      initializeSignatureCanvas();
    });
  };

  const getSignaturePoint = (
    event: ReactPointerEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const { x, y } = getSignaturePoint(event, canvas);
    context.beginPath();
    context.moveTo(x, y);

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDrawing(true);
  };

  const handleCanvasPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const { x, y } = getSignaturePoint(event, canvas);
    context.lineTo(x, y);
    context.stroke();
    setHasDrawnSignature(true);
  };

  const handleCanvasPointerEnd = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    setSignaturePreview(canvas.toDataURL("image/png"));
  };

  const handleUploadSignatureImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida para assinatura");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSignaturePreview(reader.result);
        setHasDrawnSignature(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSignDocument = () => {
    if (!signatureDoc) return;

    if (!signerName.trim()) {
      toast.error("Informe o nome de quem está assinando");
      return;
    }

    const signatureReady = signatureMode === "draw" ? hasDrawnSignature : Boolean(signaturePreview);
    if (!signatureReady) {
      toast.error(
        signatureMode === "draw"
          ? "Desenhe a assinatura no canvas"
          : "Envie uma imagem de assinatura"
      );
      return;
    }

    signMutation.mutate({
      id: signatureDoc.id,
      pacienteId: patientId,
      assinadoPor: signerName.trim(),
      dataAssinatura: new Date().toISOString(),
    });
  };

  const handleUpload = async () => {
    if (!uploadTitulo) {
      toast.error("Título é obrigatório");
      return;
    }
    if (!selectedFile) {
      toast.error("Selecione um arquivo");
      return;
    }

    setIsEncoding(true);
    try {
      const fileData = await fileToBase64(selectedFile);
      uploadMutation.mutate({
        pacienteId: patientId,
        fileData,
        fileName: selectedFile.name,
        contentType: selectedFile.type || "application/octet-stream",
        tipo: uploadTipo,
        nome: uploadTitulo,
        observacoes: uploadDescricao || undefined,
      });
    } catch {
      toast.error("Erro ao processar arquivo");
    } finally {
      setIsEncoding(false);
    }
  };

  const isPDF = (url: string) =>
    url.toLowerCase().endsWith(".pdf") || url.includes("application/pdf");

  const isDataUrl = (url: string) => url.startsWith("data:");

  const handleDownload = (doc: PatientDocument) => {
    if (isDataUrl(doc.url)) {
      downloadDataUrl(doc.url, doc.nome);
    } else {
      window.open(doc.url, "_blank");
    }
  };

  const isUploadPending = uploadMutation.isPending || isEncoding;

  return (
    <>
      <Card className="border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Documentos
            </CardTitle>
            <CardDescription>
              {(data as unknown[] | undefined)?.length ?? 0} documentos anexados ao prontuário
            </CardDescription>
          </div>

          <Button size="sm" onClick={() => setIsUploadOpen(true)} className="gap-1 cursor-pointer">
            <FilePlus className="h-4 w-4" />
            Novo Documento
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as typeof filterTipo)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(tipoLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>
                {searchQuery || filterTipo !== "all"
                  ? "Nenhum documento encontrado"
                  : "Nenhum documento anexado"}
              </p>
              {!searchQuery && filterTipo === "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 cursor-pointer"
                  onClick={() => setIsUploadOpen(true)}
                >
                  Adicionar Primeiro Documento
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Assinatura</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => {
                    const Icon = tipoIcons[doc.tipo];
                    const signed = isDocumentSigned(doc);

                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{doc.nome}</p>
                              {doc.observacoes && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {doc.observacoes}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={tipoBadgeColors[doc.tipo]}>
                            {tipoLabels[doc.tipo]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(doc.createdAt)}
                        </TableCell>
                        <TableCell>
                          {signed ? (
                            <div className="space-y-1">
                              <Badge className="bg-emerald-600">Assinado</Badge>
                              <p className="text-xs text-muted-foreground">por {doc.assinadoPor}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(doc.dataAssinatura)}
                              </p>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!signed && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openSignatureDialog(doc)}
                                className="cursor-pointer"
                                aria-label={`Assinar ${doc.nome}`}
                              >
                                <FileSignature className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPreviewDoc(doc)}
                              className="cursor-pointer"
                              aria-label={`Visualizar ${doc.nome}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="cursor-pointer"
                              onClick={() => handleDownload(doc)}
                              aria-label={`Baixar ${doc.nome}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteDoc(doc)}
                              className="cursor-pointer text-destructive hover:text-destructive"
                              aria-label={`Excluir ${doc.nome}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewDoc &&
                (() => {
                  const Icon = tipoIcons[previewDoc.tipo];
                  return <Icon className="h-5 w-5" />;
                })()}
              {previewDoc?.nome}
            </DialogTitle>
            <DialogDescription>
              {previewDoc?.observacoes || tipoLabels[previewDoc?.tipo ?? "outro"]}
            </DialogDescription>
          </DialogHeader>

          {previewDoc && (
            <div className="flex-1 min-h-[60vh]">
              <div className="rounded-lg border bg-muted/20 p-3 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">Status de assinatura</p>
                    {isDocumentSigned(previewDoc) ? (
                      <p className="text-sm text-muted-foreground">
                        Assinado por {previewDoc.assinadoPor} em{" "}
                        {formatDateTime(previewDoc.dataAssinatura)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Documento pendente de assinatura.
                      </p>
                    )}
                  </div>
                  {!isDocumentSigned(previewDoc) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        setPreviewDoc(null);
                        openSignatureDialog(previewDoc);
                      }}
                    >
                      <FileSignature className="h-4 w-4" />
                      Assinar Documento
                    </Button>
                  )}
                </div>
              </div>

              {isPDF(previewDoc.url) ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-[60vh] rounded-lg border"
                  title={previewDoc.nome}
                />
              ) : (
                <div className="flex items-center justify-center h-[60vh] bg-muted rounded-lg">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Visualização não disponível</p>
                    <Button asChild>
                      <a href={previewDoc.url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Documento
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isUploadOpen}
        onOpenChange={(open) => {
          if (!open) resetUploadForm();
          setIsUploadOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Adicionar Documento
            </DialogTitle>
            <DialogDescription>
              Arraste um arquivo ou clique para selecionar do computador
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileInput}
              className="hidden"
            />

            {/* Drag-and-drop zone */}
            {!selectedFile ? (
              <button
                type="button"
                className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 w-full cursor-pointer transition-all duration-200 bg-transparent ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                aria-label="Zona de upload de documento"
              >
                <div className="p-3 rounded-full bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {isDragging ? "Solte o arquivo aqui" : "Arraste um arquivo ou clique"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, DOCX, JPEG, PNG ou WebP • Máximo 10MB
                  </p>
                </div>
              </button>
            ) : (
              (() => {
                const FileIcon = getFileIcon(selectedFile);
                return (
                  <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 cursor-pointer"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })()
            )}

            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={uploadTitulo}
                onChange={(e) => setUploadTitulo(e.target.value)}
                placeholder="Ex: Termo de Consentimento - Botox"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={uploadTipo} onValueChange={(v) => setUploadTipo(v as TipoDocumento)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={uploadDescricao}
                onChange={(e) => setUploadDescricao(e.target.value)}
                placeholder="Observações sobre o documento..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetUploadForm();
                  setIsUploadOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !uploadTitulo || isUploadPending}
              >
                {isUploadPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEncoding ? "Processando..." : "Salvando..."}
                  </>
                ) : (
                  "Adicionar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!signatureDoc}
        onOpenChange={(open) => {
          if (!open) closeSignatureDialog();
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-primary" />
              Assinar Documento
            </DialogTitle>
            <DialogDescription>
              Registre a assinatura digital de <strong>{signatureDoc?.nome}</strong> com o nome do
              responsável.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doc-signer-name">Assinado por *</Label>
              <Input
                id="doc-signer-name"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Nome de quem está assinando"
                autoComplete="name"
                name="assinadoPor"
              />
            </div>

            <Tabs
              value={signatureMode}
              onValueChange={(value) => {
                const nextMode = value as "draw" | "upload";
                setSignatureMode(nextMode);
                setSignaturePreview(null);
                setHasDrawnSignature(false);
                if (nextMode === "draw") {
                  requestAnimationFrame(() => {
                    initializeSignatureCanvas();
                  });
                }
              }}
              className="space-y-3"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="draw" className="gap-2">
                  <FileSignature className="h-4 w-4" />
                  Desenhar
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Enviar Imagem
                </TabsTrigger>
              </TabsList>

              <TabsContent value="draw" className="space-y-3">
                <div className="rounded-lg border bg-muted/30 p-2">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={180}
                    className="w-full h-[180px] rounded-md bg-white touch-none"
                    onPointerDown={handleCanvasPointerDown}
                    onPointerMove={handleCanvasPointerMove}
                    onPointerUp={handleCanvasPointerEnd}
                    onPointerCancel={handleCanvasPointerEnd}
                    onPointerLeave={handleCanvasPointerEnd}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Desenhe com mouse ou toque para registrar a assinatura.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={clearCanvasSignature}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Limpar
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="signature-upload">Imagem da assinatura</Label>
                  <Input
                    id="signature-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleUploadSignatureImage}
                  />
                </div>

                {signaturePreview ? (
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <img
                      src={signaturePreview}
                      alt="Prévia da assinatura"
                      className="max-h-40 w-auto rounded-md object-contain"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma imagem de assinatura selecionada.
                  </p>
                )}
              </TabsContent>
            </Tabs>

            <p className="text-xs text-muted-foreground">
              O backend persiste os campos <strong>assinadoPor</strong> e{" "}
              <strong>dataAssinatura</strong> para refletir o status oficial de assinatura do
              documento.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeSignatureDialog}>
                Cancelar
              </Button>
              <Button
                onClick={handleSignDocument}
                disabled={signMutation.isPending}
                className="gap-2"
              >
                {signMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSignature className="h-4 w-4" />
                )}
                {signMutation.isPending ? "Assinando..." : "Confirmar Assinatura"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteDoc?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteDoc && deleteMutation.mutate({ id: deleteDoc.id, pacienteId: patientId })
              }
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
