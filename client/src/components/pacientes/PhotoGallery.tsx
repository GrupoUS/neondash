import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Eye,
  Grid3X3,
  ImagePlus,
  List,
  Loader2,
  Sparkles,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";
import { type DragEvent, useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { trpc } from "@/lib/trpc";

type TipoFoto = "antes" | "depois" | "evolucao" | "simulacao";

interface PatientPhoto {
  id: number;
  url: string;
  thumbnailUrl: string | null;
  tipo: TipoFoto;
  areaFotografada: string | null;
  descricao: string | null;
  dataCaptura: Date | null;
  grupoId: string | null;
}

interface PhotoGalleryProps {
  patientId: number;
  onSelectForComparison?: (photo: PatientPhoto) => void;
  onAnalyzeWithAI?: (photo: PatientPhoto) => void;
}

const tipoLabels: Record<TipoFoto, string> = {
  antes: "Antes",
  depois: "Depois",
  evolucao: "Evolução",
  simulacao: "Simulação",
};

const tipoColors: Record<TipoFoto, string> = {
  antes: "bg-amber-500",
  depois: "bg-green-500",
  evolucao: "bg-blue-500",
  simulacao: "bg-purple-500",
};

// ─── Image compression helpers ───────────────────────────────────────────────

const MAX_DIMENSION = 1200;
const THUMB_DIMENSION = 300;
const QUALITY_FULL = 0.8;
const QUALITY_THUMB = 0.6;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function resizeImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context unavailable"));

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        // Extract base64 portion only (without the data:...;base64, prefix)
        const base64 = dataUrl.split(",")[1];
        if (!base64) return reject(new Error("Failed to encode image"));
        resolve(base64);
      };
      img.onerror = () => reject(new Error("Falha ao carregar imagem"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PhotoGallery({
  patientId,
  onSelectForComparison,
  onAnalyzeWithAI,
}: PhotoGalleryProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterTipo, setFilterTipo] = useState<"all" | TipoFoto>("all");
  const [lightboxPhoto, setLightboxPhoto] = useState<PatientPhoto | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Upload state
  const [uploadTipo, setUploadTipo] = useState<TipoFoto>("antes");
  const [uploadRegiao, setUploadRegiao] = useState("");
  const [uploadDescricao, setUploadDescricao] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, refetch } = trpc.pacientes.fotos.list.useQuery(
    { pacienteId: patientId },
    { staleTime: 30_000 }
  );

  const uploadMutation = trpc.pacientes.fotos.upload.useMutation({
    onSuccess: () => {
      toast.success("Foto adicionada com sucesso");
      resetUploadForm();
      setIsUploadOpen(false);
      refetch();
    },
    onError: (e) => toast.error(e.message || "Erro ao adicionar foto"),
  });

  const photos = useMemo(() => {
    const items = (data ?? []) as unknown as PatientPhoto[];
    if (filterTipo === "all") return items;
    return items.filter((p) => p.tipo === filterTipo);
  }, [data, filterTipo]);

  const lightboxIndex = lightboxPhoto ? photos.findIndex((p) => p.id === lightboxPhoto.id) : -1;

  const handleLightboxNav = (direction: "prev" | "next") => {
    if (lightboxIndex < 0) return;
    const newIndex =
      direction === "prev"
        ? (lightboxIndex - 1 + photos.length) % photos.length
        : (lightboxIndex + 1) % photos.length;
    setLightboxPhoto(photos[newIndex]);
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadTipo("antes");
    setUploadRegiao("");
    setUploadDescricao("");
    setIsDragging(false);
    setIsCompressing(false);
  };

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem (JPEG, PNG, WebP)");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }
    setSelectedFile(file);
    // Generate preview
    const reader = new FileReader();
    reader.onload = () => setFilePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

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

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Selecione uma imagem");
      return;
    }

    setIsCompressing(true);
    try {
      const [fileData, thumbnailData] = await Promise.all([
        resizeImage(selectedFile, MAX_DIMENSION, QUALITY_FULL),
        resizeImage(selectedFile, THUMB_DIMENSION, QUALITY_THUMB),
      ]);

      uploadMutation.mutate({
        pacienteId: patientId,
        fileData,
        thumbnailData,
        fileName: selectedFile.name,
        contentType: "image/jpeg",
        tipo: uploadTipo,
        areaFotografada: uploadRegiao || undefined,
        descricao: uploadDescricao || undefined,
      });
    } catch {
      toast.error("Erro ao processar imagem");
    } finally {
      setIsCompressing(false);
    }
  };

  const formatDate = (value: Date | string | null) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("pt-BR");
  };

  const isPending = uploadMutation.isPending || isCompressing;

  return (
    <>
      <Card className="border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="h-5 w-5 text-primary" />
              Galeria de Fotos
            </CardTitle>
            <CardDescription>
              {(data as unknown[] | undefined)?.length ?? 0} fotos no prontuário
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as "grid" | "list")}
              size="sm"
            >
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <Grid3X3 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button
              size="sm"
              onClick={() => setIsUploadOpen(true)}
              className="gap-1 cursor-pointer"
            >
              <ImagePlus className="h-4 w-4" />
              Nova Foto
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as typeof filterTipo)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="antes">Antes</SelectItem>
              <SelectItem value="depois">Depois</SelectItem>
              <SelectItem value="evolucao">Evolução</SelectItem>
              <SelectItem value="simulacao">Simulação</SelectItem>
            </SelectContent>
          </Select>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>
                {filterTipo !== "all" ? "Nenhuma foto nesta categoria" : "Nenhuma foto adicionada"}
              </p>
              {filterTipo === "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 cursor-pointer"
                  onClick={() => setIsUploadOpen(true)}
                >
                  Adicionar Primeira Foto
                </Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo) => (
                <button
                  type="button"
                  key={photo.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer border border-border/40 hover:border-primary/30 transition-all duration-200 hover:shadow-md p-0 text-left"
                  onClick={() => setLightboxPhoto(photo)}
                  aria-label={`Ver foto ${photo.descricao || photo.tipo}`}
                >
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.descricao || "Foto"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <Badge className={`absolute top-2 left-2 text-xs ${tipoColors[photo.tipo]}`}>
                    {tipoLabels[photo.tipo]}
                  </Badge>
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <p className="text-white text-xs truncate">
                      {photo.areaFotografada || formatDate(photo.dataCaptura)}
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="h-5 w-5 text-white drop-shadow-lg" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {photos.map((photo) => (
                <button
                  type="button"
                  key={photo.id}
                  className="flex w-full items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors bg-transparent text-left"
                  onClick={() => setLightboxPhoto(photo)}
                  aria-label={`Ver foto ${photo.descricao || photo.tipo}`}
                >
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.descricao || "Foto"}
                    className="w-16 h-16 rounded-md object-cover"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs ${tipoColors[photo.tipo]}`}>
                        {tipoLabels[photo.tipo]}
                      </Badge>
                      {photo.areaFotografada && (
                        <span className="text-sm text-muted-foreground">
                          {photo.areaFotografada}
                        </span>
                      )}
                    </div>
                    {photo.descricao && (
                      <p className="text-sm text-muted-foreground truncate">{photo.descricao}</p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(photo.dataCaptura)}
                  </span>
                  {onAnalyzeWithAI && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAnalyzeWithAI(photo);
                      }}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={!!lightboxPhoto} onOpenChange={() => setLightboxPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 cursor-pointer"
              onClick={() => setLightboxPhoto(null)}
            >
              <X className="h-5 w-5" />
            </Button>

            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 cursor-pointer"
                  onClick={() => handleLightboxNav("prev")}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 cursor-pointer"
                  onClick={() => handleLightboxNav("next")}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {lightboxPhoto && (
              <div className="flex flex-col items-center">
                <img
                  src={lightboxPhoto.url}
                  alt={lightboxPhoto.descricao || "Foto"}
                  className="max-h-[80vh] max-w-full object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <Badge className={tipoColors[lightboxPhoto.tipo]}>
                        {tipoLabels[lightboxPhoto.tipo]}
                      </Badge>
                      {lightboxPhoto.areaFotografada && (
                        <Badge variant="secondary">{lightboxPhoto.areaFotografada}</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {onAnalyzeWithAI && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1 cursor-pointer"
                          onClick={() => {
                            onAnalyzeWithAI(lightboxPhoto);
                            setLightboxPhoto(null);
                          }}
                        >
                          <Sparkles className="h-4 w-4" />
                          Analisar com IA
                        </Button>
                      )}

                      {onSelectForComparison && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1 cursor-pointer"
                          onClick={() => {
                            onSelectForComparison(lightboxPhoto);
                            setLightboxPhoto(null);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          Usar para Comparação
                        </Button>
                      )}
                    </div>
                  </div>
                  {lightboxPhoto.descricao && (
                    <p className="text-white/80 text-sm mt-2">{lightboxPhoto.descricao}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
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
              Adicionar Foto
            </DialogTitle>
            <DialogDescription>
              Arraste uma imagem ou clique para selecionar do computador
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInput}
              className="hidden"
            />

            {/* Drag-and-drop zone */}
            {!filePreview ? (
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
                aria-label="Zona de upload de imagem"
              >
                <div className="p-3 rounded-full bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {isDragging ? "Solte a imagem aqui" : "Arraste uma imagem ou clique"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPEG, PNG ou WebP • Máximo 5MB
                  </p>
                </div>
              </button>
            ) : (
              <div className="relative rounded-xl overflow-hidden border bg-muted/20">
                <img
                  src={filePreview}
                  alt="Prévia"
                  className="w-full max-h-56 object-contain bg-black/5"
                />
                <div className="absolute top-2 right-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 rounded-full cursor-pointer"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                  <Camera className="h-3.5 w-3.5" />
                  {selectedFile?.name}
                  <span className="ml-auto">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : ""}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={uploadTipo} onValueChange={(v) => setUploadTipo(v as TipoFoto)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="antes">Antes</SelectItem>
                    <SelectItem value="depois">Depois</SelectItem>
                    <SelectItem value="evolucao">Evolução</SelectItem>
                    <SelectItem value="simulacao">Simulação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Região</Label>
                <Input
                  value={uploadRegiao}
                  onChange={(e) => setUploadRegiao(e.target.value)}
                  placeholder="Ex: Face, Nariz..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={uploadDescricao}
                onChange={(e) => setUploadDescricao(e.target.value)}
                placeholder="Observações sobre a foto..."
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
              <Button onClick={handleUpload} disabled={!selectedFile || isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isCompressing ? "Comprimindo..." : "Salvando..."}
                  </>
                ) : (
                  "Adicionar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
