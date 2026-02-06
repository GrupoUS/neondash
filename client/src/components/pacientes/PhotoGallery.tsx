import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Eye,
  Grid3X3,
  ImagePlus,
  List,
  Sparkles,
  X,
  ZoomIn,
} from "lucide-react";
import { useMemo, useState } from "react";
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

export function PhotoGallery({
  patientId,
  onSelectForComparison,
  onAnalyzeWithAI,
}: PhotoGalleryProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterTipo, setFilterTipo] = useState<"all" | TipoFoto>("all");
  const [lightboxPhoto, setLightboxPhoto] = useState<PatientPhoto | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadTipo, setUploadTipo] = useState<TipoFoto>("antes");
  const [uploadRegiao, setUploadRegiao] = useState("");
  const [uploadDescricao, setUploadDescricao] = useState("");

  const { data, isLoading, refetch } = trpc.pacientes.fotos.list.useQuery(
    { pacienteId: patientId },
    { staleTime: 30_000 }
  );

  const createMutation = trpc.pacientes.fotos.create.useMutation({
    onSuccess: () => {
      toast.success("Foto adicionada");
      setIsUploadOpen(false);
      setUploadUrl("");
      setUploadDescricao("");
      setUploadRegiao("");
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

  const handleUpload = () => {
    if (!uploadUrl) {
      toast.error("URL da imagem é obrigatória");
      return;
    }
    createMutation.mutate({
      pacienteId: patientId,
      url: uploadUrl,
      tipo: uploadTipo as "antes" | "depois" | "evolucao" | "simulacao",
      areaFotografada: uploadRegiao || undefined,
      descricao: uploadDescricao || undefined,
    });
  };

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
              {(data ?? []).length} fotos • Antes e depois de procedimentos
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as typeof filterTipo)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="antes">Antes</SelectItem>
                <SelectItem value="depois">Depois</SelectItem>
                <SelectItem value="evolucao">Evolução</SelectItem>
                <SelectItem value="simulacao">Simulação</SelectItem>
              </SelectContent>
            </Select>

            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as typeof viewMode)}
            >
              <ToggleGroupItem value="grid" size="sm" className="cursor-pointer">
                <Grid3X3 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" size="sm" className="cursor-pointer">
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

        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma foto registrada</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 cursor-pointer"
                onClick={() => setIsUploadOpen(true)}
              >
                Adicionar Primeira Foto
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted"
                >
                  <button
                    type="button"
                    className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    onClick={() => setLightboxPhoto(photo)}
                    aria-label={`Abrir foto ${photo.descricao || photo.areaFotografada || photo.id}`}
                  />
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.descricao || "Foto do paciente"}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <Badge className={`absolute top-2 left-2 text-xs ${tipoColors[photo.tipo]}`}>
                    {tipoLabels[photo.tipo]}
                  </Badge>
                  {photo.areaFotografada && (
                    <Badge
                      variant="secondary"
                      className="absolute bottom-2 left-2 text-xs bg-black/60 text-white"
                    >
                      {photo.areaFotografada}
                    </Badge>
                  )}
                  {onAnalyzeWithAI && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-2 right-2 z-20 h-7 gap-1 px-2 text-[11px] cursor-pointer"
                      onClick={() => onAnalyzeWithAI(photo)}
                    >
                      <Sparkles className="h-3 w-3" />
                      Analisar com IA
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {photos.map((photo) => (
                <div key={photo.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer w-full text-left"
                    onClick={() => setLightboxPhoto(photo)}
                  >
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.descricao || "Foto"}
                      className="h-16 w-16 rounded object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={tipoColors[photo.tipo]}>{tipoLabels[photo.tipo]}</Badge>
                        {photo.areaFotografada && (
                          <Badge variant="outline">{photo.areaFotografada}</Badge>
                        )}
                      </div>
                      {photo.descricao && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {photo.descricao}
                        </p>
                      )}
                    </div>
                    {photo.dataCaptura && (
                      <span className="text-sm text-muted-foreground">
                        {new Date(photo.dataCaptura).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </button>

                  {onAnalyzeWithAI && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1 cursor-pointer"
                      onClick={() => onAnalyzeWithAI(photo)}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Analisar com IA</span>
                      <span className="sm:hidden">IA</span>
                    </Button>
                  )}
                </div>
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
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Foto</DialogTitle>
            <DialogDescription>
              Insira a URL da imagem para adicionar ao prontuário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL da Imagem *</Label>
              <Input
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

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
    </>
  );
}
