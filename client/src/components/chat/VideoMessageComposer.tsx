/**
 * Video Message Composer Dialog
 * Allows users to send video messages via URL
 */

import { Loader2, Video, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

interface VideoMessageComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  leadId?: number;
  onSuccess?: () => void;
}

const VIDEO_URL_PATTERN = /\.(mp4|mov|3gp|avi|webm)$/i;
const VIDEO_CONTENT_PATTERN = /video/i;

function isValidVideoUrl(url: string): boolean {
  try {
    new URL(url);
    return VIDEO_URL_PATTERN.test(url) || VIDEO_CONTENT_PATTERN.test(url);
  } catch {
    return false;
  }
}

export function VideoMessageComposer({
  open,
  onOpenChange,
  phone,
  leadId,
  onSuccess,
}: VideoMessageComposerProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sendVideoMutation = trpc.metaApi.sendVideo.useMutation({
    onSuccess: () => {
      setVideoUrl("");
      setCaption("");
      setError(null);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      setError(err.message || "Erro ao enviar vídeo");
    },
  });

  const handleSend = () => {
    setError(null);

    if (!videoUrl.trim()) {
      setError("URL do vídeo é obrigatória");
      return;
    }

    if (!isValidVideoUrl(videoUrl)) {
      setError("URL deve apontar para um arquivo de vídeo (MP4, MOV, 3GP, AVI, WebM)");
      return;
    }

    sendVideoMutation.mutate({
      phone,
      videoUrl: videoUrl.trim(),
      caption: caption.trim() || undefined,
      leadId,
    });
  };

  const handleClose = () => {
    setVideoUrl("");
    setCaption("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Enviar Vídeo
          </DialogTitle>
          <DialogDescription>
            Envie um vídeo via URL pública. O arquivo deve estar acessível publicamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video URL Input */}
          <div className="space-y-2">
            <Label htmlFor="videoUrl">URL do Vídeo *</Label>
            <Input
              id="videoUrl"
              placeholder="https://example.com/video.mp4"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                setError(null);
              }}
              className={error ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Formatos suportados: MP4, MOV, 3GP, AVI, WebM
            </p>
          </div>

          {/* Caption Input */}
          <div className="space-y-2">
            <Label htmlFor="caption">Legenda (opcional)</Label>
            <Textarea
              id="caption"
              placeholder="Descrição do vídeo..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Video Preview (if valid URL) */}
          {videoUrl && isValidVideoUrl(videoUrl) && (
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              <video
                src={videoUrl}
                className="w-full h-full object-contain"
                controls
                preload="metadata"
              >
                <track kind="captions" label="Português" default />
              </video>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setVideoUrl("")}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Error Message */}
          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={sendVideoMutation.isPending || !videoUrl.trim()}>
            {sendVideoMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enviar Vídeo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default VideoMessageComposer;
