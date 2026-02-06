import { Download, FileText, Image as ImageIcon, Music2, PlayCircle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MediaPreviewType = "image" | "audio" | "video" | "file";

export interface MediaPreviewData {
  type: MediaPreviewType;
  url?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  durationSeconds?: number | null;
  thumbnailUrl?: string | null;
}

export interface MediaPreviewProps {
  media: MediaPreviewData;
  className?: string;
  compact?: boolean;
}

function formatSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let index = 0;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function isImageMime(mimeType?: string | null): boolean {
  return Boolean(mimeType?.toLowerCase().startsWith("image/"));
}

function isVideoMime(mimeType?: string | null): boolean {
  return Boolean(mimeType?.toLowerCase().startsWith("video/"));
}

export function MediaPreview({ media, className, compact = false }: MediaPreviewProps) {
  const hasUrl = Boolean(media.url && media.url.trim().length > 0);
  const itemLabel = media.fileName ?? "Arquivo";
  const metaText = [
    media.mimeType,
    formatSize(media.sizeBytes),
    formatDuration(media.durationSeconds),
  ]
    .filter(Boolean)
    .join(" • ");

  if (media.type === "image" && hasUrl) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <div className="overflow-hidden rounded-lg border border-border/60 bg-black/15">
          <img
            src={media.url ?? undefined}
            alt={itemLabel}
            loading="lazy"
            className={cn("w-full object-cover", compact ? "max-h-36" : "max-h-64")}
          />
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="truncate">{itemLabel}</span>
          {hasUrl ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              asChild
              className="h-6 w-6 shrink-0"
              aria-label="Baixar mídia"
            >
              <a href={media.url ?? undefined} target="_blank" rel="noopener noreferrer">
                <Download className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (media.type === "video" || isVideoMime(media.mimeType)) {
    return (
      <div className={cn("rounded-md border border-border/60 bg-black/10 p-2 text-xs", className)}>
        {hasUrl ? (
          <video
            src={media.url ?? undefined}
            controls
            preload="metadata"
            className={cn("mb-2 w-full rounded", compact ? "max-h-40" : "max-h-56")}
          >
            <track kind="captions" label="Português" default />
          </video>
        ) : (
          <div className="mb-2 flex items-center gap-2 rounded bg-black/20 px-2 py-1.5 text-muted-foreground">
            <PlayCircle className="h-4 w-4" />
            <span>Pré-visualização de vídeo indisponível</span>
          </div>
        )}

        <div className="flex items-center gap-2 font-medium text-foreground">
          <Video className="h-3.5 w-3.5" />
          Vídeo
        </div>

        {itemLabel ? <p className="mt-1 truncate text-muted-foreground">{itemLabel}</p> : null}
        {metaText ? <p className="mt-0.5 text-muted-foreground">{metaText}</p> : null}
      </div>
    );
  }

  if (media.type === "audio") {
    return (
      <div className={cn("rounded-md border border-border/60 bg-black/10 p-2 text-xs", className)}>
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Music2 className="h-3.5 w-3.5" />
          Áudio
        </div>

        {hasUrl ? (
          <audio src={media.url ?? undefined} controls className="mt-2 w-full" preload="metadata">
            <track kind="captions" label="Português" default />
          </audio>
        ) : null}

        {metaText ? <p className="mt-1 text-muted-foreground">{metaText}</p> : null}
      </div>
    );
  }

  const maybeImage = isImageMime(media.mimeType);

  return (
    <div
      className={cn(
        "rounded-md border border-border/60 bg-black/10 p-2 text-xs text-muted-foreground",
        className
      )}
    >
      <div className="flex items-center gap-2 font-medium text-foreground">
        {maybeImage ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
        Arquivo
      </div>

      <p className="mt-1 truncate">{itemLabel}</p>
      <p className="mt-0.5">{metaText || "Metadados indisponíveis"}</p>

      {hasUrl ? (
        <Button type="button" variant="link" asChild className="mt-1 h-auto p-0 text-xs">
          <a href={media.url ?? undefined} target="_blank" rel="noopener noreferrer">
            Baixar
          </a>
        </Button>
      ) : null}
    </div>
  );
}

export default MediaPreview;
