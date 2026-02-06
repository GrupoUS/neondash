/**
 * Instagram Publisher - AI-powered content creation & scheduling
 * Two-column layout: AI Content Panel + Instagram Preview Mockup
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Check,
  Copy,
  Hash,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  NeonCard,
  NeonCardContent,
  NeonCardHeader,
  NeonCardTitle,
} from "@/components/ui/neon-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

type Tone = "professional" | "casual" | "promotional" | "educational" | "inspiring";

const toneOptions: { value: Tone; label: string; emoji: string; toneValue: string }[] = [
  {
    value: "professional",
    label: "Profissional",
    emoji: "💼",
    toneValue: "profissional e confiável",
  },
  { value: "casual", label: "Casual", emoji: "😊", toneValue: "descontraído e amigável" },
  { value: "promotional", label: "Promocional", emoji: "🎯", toneValue: "persuasivo e atraente" },
  { value: "educational", label: "Educativo", emoji: "📚", toneValue: "informativo e didático" },
  { value: "inspiring", label: "Inspirador", emoji: "✨", toneValue: "motivacional e inspirador" },
];

// Instagram Preview Mockup
function InstagramPreview({
  caption,
  imageUrl,
  isLoading,
}: {
  caption: string;
  imageUrl: string | null;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border overflow-hidden shadow-lg max-w-[350px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400" />
        <div>
          <p className="text-sm font-semibold text-foreground">sua_clinica</p>
          <p className="text-xs text-muted-foreground">Estética & Beleza</p>
        </div>
      </div>

      {/* Image Area */}
      <div className="relative aspect-square bg-muted">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-500/10 to-purple-500/10">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Gerando imagem…</p>
            </div>
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Imagem será gerada pela IA</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Icons */}
      <div className="p-3 flex gap-4">
        <svg
          className="w-6 h-6 text-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-labelledby="heart-icon-title"
        >
          <title id="heart-icon-title">Curtir</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <svg
          className="w-6 h-6 text-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-labelledby="comment-icon-title"
        >
          <title id="comment-icon-title">Comentar</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <svg
          className="w-6 h-6 text-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-labelledby="share-icon-title"
        >
          <title id="share-icon-title">Compartilhar</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </div>

      {/* Caption */}
      <div className="px-3 pb-3">
        {caption ? (
          <p className="text-sm text-foreground leading-relaxed line-clamp-4">
            <span className="font-semibold">sua_clinica</span> {caption}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Sua legenda aparecerá aqui…</p>
        )}
      </div>
    </div>
  );
}

// AI Content Panel
function AIContentPanel({
  onGenerate,
  caption,
  hashtags,
  isGenerating,
}: {
  onGenerate: (prompt: string, tone: Tone) => void;
  caption: string;
  hashtags: string[];
  isGenerating: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Digite um tema para gerar o conteúdo");
      return;
    }
    onGenerate(prompt, tone);
  };

  const handleCopy = async () => {
    const content = `${caption}\n\n${hashtags.map((h) => `#${h}`).join(" ")}`;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Conteúdo copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Prompt Input */}
      <div className="space-y-2">
        <Label htmlFor="prompt" className="text-sm font-medium">
          Tema do Post
        </Label>
        <Textarea
          id="prompt"
          placeholder="Ex: Benefícios do tratamento facial com ácido hialurônico para rejuvenescimento..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px] resize-none"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">{prompt.length}/500</p>
      </div>

      {/* Tone Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Tom da Mensagem</Label>
        <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {toneOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  <span>{opt.emoji}</span>
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full gap-2"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando conteúdo…
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            Gerar com IA
          </>
        )}
      </Button>

      {/* Generated Content Display */}
      <AnimatePresence mode="wait">
        {caption && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Caption */}
            <NeonCard variant="glow" className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Legenda Gerada
                </Label>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{caption}</p>
            </NeonCard>

            {/* Hashtags */}
            {hashtags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Hashtags Sugeridas
                </Label>
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Regenerate */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <RefreshCw className="h-4 w-4" />
              Gerar Nova Versão
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main Component
export function InstagramPublisher() {
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");

  // Get current mentorado for publishing
  const { data: mentorado } = trpc.mentorados.me.useQuery();

  // AI Content Generation mutation
  const generateContent = trpc.marketing.generateCaption.useMutation({
    onSuccess: (data) => {
      // Parse hashtags from caption
      const hashtagMatches = data.caption?.match(/#\w+/g) || [];
      const cleanHashtags = hashtagMatches.map((h) => h.slice(1));
      const captionWithoutHashtags = data.caption?.replace(/#\w+/g, "").trim() || "";

      setCaption(captionWithoutHashtags);
      setHashtags(cleanHashtags);
      toast.success("Conteúdo gerado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao gerar: ${error.message}`);
    },
  });

  // Publish mutation
  const publishPost = trpc.instagram.publishPost.useMutation({
    onSuccess: () => {
      toast.success("Post publicado com sucesso!");
      setIsPublishing(false);
    },
    onError: (error) => {
      toast.error(`Erro ao publicar: ${error.message}`);
      setIsPublishing(false);
    },
  });

  // Image generation mutation
  const generateImageMutation = trpc.marketing.generateImage.useMutation({
    onSuccess: (data) => {
      setImageUrl(data.imageUrl ?? null);
      toast.success("Imagem gerada com sucesso!");
      setIsGeneratingImage(false);
    },
    onError: (error) => {
      toast.error(`Erro ao gerar imagem: ${error.message}`);
      setIsGeneratingImage(false);
    },
  });

  const handleGenerate = async (prompt: string, tone: Tone) => {
    setIsGenerating(true);
    setCurrentPrompt(prompt);
    const toneOption = toneOptions.find((t) => t.value === tone);
    try {
      // Generate caption
      await generateContent.mutateAsync({
        topic: prompt,
        toneOfVoice: toneOption?.toneValue || "profissional",
        platform: "instagram",
        includeHashtags: true,
        includeCallToAction: true,
      });

      // Generate image
      setIsGeneratingImage(true);
      const imagePrompt = `Professional Instagram post image for aesthetic clinic: ${prompt}. Style: clean, modern, high-end beauty and wellness. Suitable for ${toneOption?.label || "professional"} tone. 1024x1024, photorealistic.`;
      await generateImageMutation.mutateAsync({
        prompt: imagePrompt,
        size: "1024x1024",
        quality: "hd",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (!currentPrompt) {
      toast.error("Digite um tema primeiro");
      return;
    }
    setIsGeneratingImage(true);
    try {
      const imagePrompt = `Professional Instagram post image for aesthetic clinic: ${currentPrompt}. Style: clean, modern, high-end beauty and wellness. 1024x1024, photorealistic.`;
      await generateImageMutation.mutateAsync({
        prompt: imagePrompt,
        size: "1024x1024",
        quality: "hd",
      });
    } catch {
      // Error handled by mutation
    }
  };

  const handlePublish = async () => {
    if (!caption) {
      toast.error("Gere uma legenda primeiro");
      return;
    }
    if (!imageUrl) {
      toast.error("Uma imagem é necessária para publicar");
      return;
    }
    if (!mentorado?.id) {
      toast.error("Erro ao obter dados do mentorado");
      return;
    }

    setIsPublishing(true);
    await publishPost.mutateAsync({
      mentoradoId: mentorado.id,
      imageUrl,
      caption: `${caption}\n\n${hashtags.map((h) => `#${h}`).join(" ")}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Criar Post Instagram
          </h2>
          <p className="text-muted-foreground mt-1">
            Use IA para gerar legendas e hashtags automaticamente
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: AI Content Panel */}
        <NeonCard className="p-6">
          <NeonCardHeader className="px-0 pt-0">
            <NeonCardTitle className="text-lg flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Gerador de Conteúdo
            </NeonCardTitle>
          </NeonCardHeader>
          <NeonCardContent className="px-0 pb-0">
            <AIContentPanel
              onGenerate={handleGenerate}
              caption={caption}
              hashtags={hashtags}
              isGenerating={isGenerating}
            />
          </NeonCardContent>
        </NeonCard>

        {/* Right: Preview + Actions */}
        <div className="space-y-6">
          {/* Preview */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
            <InstagramPreview caption={caption} imageUrl={imageUrl} isLoading={isGeneratingImage} />
            {imageUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateImage}
                disabled={isGeneratingImage || !currentPrompt}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isGeneratingImage ? "animate-spin" : ""}`} />
                Regenerar Imagem
              </Button>
            )}
          </div>

          {/* Schedule & Publish */}
          <NeonCard className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Schedule Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 flex-1">
                    <CalendarDays className="h-4 w-4" />
                    {scheduledDate ? scheduledDate.toLocaleDateString("pt-BR") : "Agendar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>

              {/* Publish Button */}
              <Button
                onClick={handlePublish}
                disabled={!caption || isPublishing}
                className="gap-2 flex-1"
                size="lg"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publicando…
                  </>
                ) : scheduledDate ? (
                  <>
                    <CalendarDays className="h-4 w-4" />
                    Agendar Post
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Publicar Agora
                  </>
                )}
              </Button>
            </div>
          </NeonCard>
        </div>
      </div>
    </div>
  );
}
