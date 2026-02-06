import {
  Download,
  Eye,
  File,
  FileCheck,
  FileImage,
  FilePlus,
  FileText,
  FileType,
  FileWarning,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

type TipoDocumento = "consentimento" | "exame" | "prescricao" | "outro";

interface PatientDocument {
  id: number;
  titulo: string;
  tipo: TipoDocumento;
  url: string;
  descricao: string | null;
  assinado: boolean | null;
  createdAt: Date | null;
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

export function DocumentManager({ patientId }: DocumentManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipo, setFilterTipo] = useState<"all" | TipoDocumento>("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<PatientDocument | null>(null);

  // Upload form state
  const [uploadTitulo, setUploadTitulo] = useState("");
  const [uploadTipo, setUploadTipo] = useState<TipoDocumento>("outro");
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadDescricao, setUploadDescricao] = useState("");

  const { data, isLoading, refetch } = trpc.pacientes.documentos.list.useQuery(
    { pacienteId: patientId },
    { staleTime: 30_000 }
  );

  const createMutation = trpc.pacientes.documentos.create.useMutation({
    onSuccess: () => {
      toast.success("Documento adicionado");
      setIsUploadOpen(false);
      resetUploadForm();
      refetch();
    },
    onError: (e) => toast.error(e.message || "Erro ao adicionar documento"),
  });

  const deleteMutation = trpc.pacientes.documentos.delete.useMutation({
    onSuccess: () => {
      toast.success("Documento excluído");
      setDeleteDoc(null);
      refetch();
    },
    onError: (e) => toast.error(e.message || "Erro ao excluir"),
  });

  const documents = useMemo(() => {
    let items = (data ?? []) as unknown as PatientDocument[];

    // Filter by type
    if (filterTipo !== "all") {
      items = items.filter((d) => d.tipo === filterTipo);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (d) => d.titulo.toLowerCase().includes(query) || d.descricao?.toLowerCase().includes(query)
      );
    }

    return items;
  }, [data, filterTipo, searchQuery]);

  const resetUploadForm = () => {
    setUploadTitulo("");
    setUploadTipo("outro");
    setUploadUrl("");
    setUploadDescricao("");
  };

  const handleUpload = () => {
    if (!uploadTitulo || !uploadUrl) {
      toast.error("Título e URL são obrigatórios");
      return;
    }
    createMutation.mutate({
      pacienteId: patientId,
      nome: uploadTitulo,
      tipo: uploadTipo,
      url: uploadUrl,
      observacoes: uploadDescricao || undefined,
    });
  };

  const isPDF = (url: string) =>
    url.toLowerCase().endsWith(".pdf") || url.includes("application/pdf");

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
          {/* Filters */}
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

          {/* Documents Table */}
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
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => {
                    const Icon = tipoIcons[doc.tipo];
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{doc.titulo}</p>
                              {doc.descricao && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {doc.descricao}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={tipoBadgeColors[doc.tipo]}>
                            {tipoLabels[doc.tipo]}
                          </Badge>
                          {doc.assinado && (
                            <Badge variant="default" className="ml-1">
                              Assinado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {doc.createdAt
                            ? new Date(doc.createdAt).toLocaleDateString("pt-BR")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPreviewDoc(doc)}
                              className="cursor-pointer"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" asChild className="cursor-pointer">
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" download>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteDoc(doc)}
                              className="cursor-pointer text-destructive hover:text-destructive"
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

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewDoc &&
                (() => {
                  const Icon = tipoIcons[previewDoc.tipo];
                  return <Icon className="h-5 w-5" />;
                })()}
              {previewDoc?.titulo}
            </DialogTitle>
            <DialogDescription>
              {previewDoc?.descricao || tipoLabels[previewDoc?.tipo ?? "outro"]}
            </DialogDescription>
          </DialogHeader>

          {previewDoc && (
            <div className="flex-1 min-h-[60vh]">
              {isPDF(previewDoc.url) ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-[60vh] rounded-lg border"
                  title={previewDoc.titulo}
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

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Documento</DialogTitle>
            <DialogDescription>Anexe um novo documento ao prontuário do paciente</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
              <Label>URL do Documento *</Label>
              <Input
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
                placeholder="https://..."
              />
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
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpload} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteDoc?.titulo}"? Esta ação não pode ser desfeita.
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
