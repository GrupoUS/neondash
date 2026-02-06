import { ArrowLeftRight, Camera, Move, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";

interface ComparisonPhoto {
  id: number;
  url: string;
  tipo: "antes" | "depois" | "evolucao" | "simulacao";
  areaFotografada: string | null;
  dataCaptura: Date | null;
}

interface PhotoComparisonProps {
  patientId: number;
  initialBefore?: ComparisonPhoto;
  initialAfter?: ComparisonPhoto;
}

export function PhotoComparison({ patientId, initialBefore, initialAfter }: PhotoComparisonProps) {
  const [beforePhoto, setBeforePhoto] = useState<ComparisonPhoto | null>(initialBefore ?? null);
  const [afterPhoto, setAfterPhoto] = useState<ComparisonPhoto | null>(initialAfter ?? null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: comparisons, isLoading } = trpc.pacientes.fotos.getComparacoes.useQuery(
    { pacienteId: patientId },
    { staleTime: 30_000 }
  );

  const { data: photosData } = trpc.pacientes.fotos.list.useQuery(
    { pacienteId: patientId },
    { staleTime: 30_000 }
  );

  const photos = (photosData ?? []) as unknown as ComparisonPhoto[];
  const beforePhotos = photos.filter((p) => p.tipo === "antes");
  const afterPhotos = photos.filter((p) => p.tipo === "depois" || p.tipo === "evolucao");

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleMouseMove);
      document.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleMouseMove);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleReset = () => {
    setSliderPosition(50);
  };

  const handleSwap = () => {
    const temp = beforePhoto;
    setBeforePhoto(afterPhoto);
    setAfterPhoto(temp);
  };

  return (
    <Card className="border-primary/10">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Comparação Antes/Depois
          </CardTitle>
          <CardDescription>Arraste o slider para comparar as fotos</CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleReset} className="cursor-pointer">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwap}
            disabled={!beforePhoto || !afterPhoto}
            className="cursor-pointer"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Photo Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="before-photo-select" className="text-sm font-medium">
              Foto Antes
            </label>
            <Select
              value={beforePhoto?.id.toString() ?? ""}
              onValueChange={(v) => {
                const photo = beforePhotos.find((p) => p.id.toString() === v);
                setBeforePhoto(photo ?? null);
              }}
            >
              <SelectTrigger id="before-photo-select">
                <SelectValue placeholder="Selecionar foto" />
              </SelectTrigger>
              <SelectContent>
                {beforePhotos.map((photo) => (
                  <SelectItem key={photo.id} value={photo.id.toString()}>
                    {photo.areaFotografada ?? "Foto"} -{" "}
                    {photo.dataCaptura
                      ? new Date(photo.dataCaptura).toLocaleDateString("pt-BR")
                      : "Sem data"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="after-photo-select" className="text-sm font-medium">
              Foto Depois
            </label>
            <Select
              value={afterPhoto?.id.toString() ?? ""}
              onValueChange={(v) => {
                const photo = afterPhotos.find((p) => p.id.toString() === v);
                setAfterPhoto(photo ?? null);
              }}
            >
              <SelectTrigger id="after-photo-select">
                <SelectValue placeholder="Selecionar foto" />
              </SelectTrigger>
              <SelectContent>
                {afterPhotos.map((photo) => (
                  <SelectItem key={photo.id} value={photo.id.toString()}>
                    {photo.areaFotografada ?? "Foto"} -{" "}
                    {photo.dataCaptura
                      ? new Date(photo.dataCaptura).toLocaleDateString("pt-BR")
                      : "Sem data"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comparison View */}
        {beforePhoto && afterPhoto ? (
          <div
            ref={containerRef}
            role="slider"
            aria-label="Comparar fotos antes e depois"
            aria-valuenow={Math.round(sliderPosition)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-muted cursor-ew-resize select-none"
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                setSliderPosition((prev) => Math.max(0, prev - 5));
              } else if (e.key === "ArrowRight") {
                setSliderPosition((prev) => Math.min(100, prev + 5));
              }
            }}
          >
            {/* After Photo (Background) */}
            <div className="absolute inset-0">
              <img
                src={afterPhoto.url}
                alt="Depois"
                className="w-full h-full object-cover"
                draggable={false}
              />
              <Badge className="absolute top-3 right-3 bg-green-500">Depois</Badge>
            </div>

            {/* Before Photo (Clipped) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={beforePhoto.url}
                alt="Antes"
                className="w-full h-full object-cover"
                style={{ width: `${100 / (sliderPosition / 100)}%` }}
                draggable={false}
              />
              <Badge className="absolute top-3 left-3 bg-amber-500">Antes</Badge>
            </div>

            {/* Slider Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
              style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                <Move className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        ) : (
          <div className="aspect-[4/3] w-full rounded-lg bg-muted/30 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Selecione as fotos para comparar</p>
            </div>
          </div>
        )}

        {/* Manual Slider Control */}
        {beforePhoto && afterPhoto && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Antes</span>
            <Slider
              value={[sliderPosition]}
              onValueChange={([v]) => setSliderPosition(v)}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">Depois</span>
          </div>
        )}

        {/* Pre-saved Comparison Groups */}
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : comparisons && comparisons.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Comparações Salvas</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {comparisons.map((group) => (
                <button
                  key={group.grupoId}
                  type="button"
                  className="text-left p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-primary/20"
                  onClick={() => {
                    if (group.antes) setBeforePhoto(group.antes as ComparisonPhoto);
                    if (group.depois) setAfterPhoto(group.depois as ComparisonPhoto);
                  }}
                >
                  <p className="font-medium text-sm">{group.areaFotografada || group.grupoId}</p>
                  <p className="text-xs text-muted-foreground">
                    {[group.antes, group.depois].filter(Boolean).length} fotos
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
