/**
 * Instagram Publisher - AI-powered content creation & scheduling
 * Two-column layout: AI Content Panel + Instagram Preview Mockup
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { cn } from "@/lib/utils";

type Tone = "professional" | "casual" | "promotional" | "educational" | "inspiring";

const toneOptions: { value: Tone; label: string; toneValue: string }[] = [
  {
    value: "professional",
    label: "Profissional",
    toneValue: "profissional e confiável",
  },
  { value: "casual", label: "Casual", toneValue: "descontraído e amigável" },
  { value: "promotional", label: "Promocional", toneValue: "persuasivo e atraente" },
  { value: "educational", label: "Educativo", toneValue: "informativo e didático" },
  { value: "inspiring", label: "Inspirador", toneValue: "motivacional e inspirador" },
];

const toneColorMap: Record<Tone, string> = {
  professional: "bg-blue-600",
  casual: "bg-emerald-600",
  promotional: "bg-amber-600",
  educational: "bg-sky-600",
  inspiring: "bg-pink-600",
};

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
  onEnhance,
  caption,
  hashtags,
  isGenerating,
  prompt,
  onPromptChange,
}: {
  onGenerate: (prompt: string, tone: Tone) => void;
  onEnhance: (prompt: string) => void;
  caption: string;
  hashtags: string[];
  isGenerating: boolean;
  prompt: string;
  onPromptChange: (value: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [tone, setTone] = useState<Tone>("professional");
  const [copied, setCopied] = useState(false);

  const selectedTone = toneOptions.find((option) => option.value === tone);

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
          placeholder="Ex: Benefícios do tratamento facial com ácido hialurônico para rejuvenescimento…"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          className="min-h-[100px] resize-none"
          maxLength={500}
          name="postTopic"
          autoComplete="off"
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground tabular-nums">{prompt.length}/500</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1 text-violet-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30"
            onClick={() => onEnhance(prompt)}
            disabled={!prompt.trim() || isGenerating}
          >
            <Sparkles className="h-3 w-3" />
            Aprimorar com IA
          </Button>
        </div>
      </div>

      {/* Tone Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Tom da Mensagem</Label>
        <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
          <SelectTrigger className="min-h-11 w-full" aria-label="Selecionar tom da mensagem">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {toneOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2 text-sm">
                  <span className={cn("h-2.5 w-2.5 rounded-full", toneColorMap[opt.value])} />
                  <span>{opt.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Tom atual: <span className="font-medium text-foreground">{selectedTone?.label}</span>
        </p>
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
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Caption */}
            <NeonCard variant="glow" className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Legenda Gerada
                </Label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11"
                  onClick={handleCopy}
                  aria-label="Copiar legenda e hashtags"
                >
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
                    <Badge key={tag} variant="secondary" className="select-text">
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

  // Enhance prompt mutation
  const enhancePromptMutation = trpc.marketing.enhancePrompt.useMutation({
    onSuccess: (_data) => {
      // We need to update the prompt in the child component.
      // Since prompt state is local to AIContentPanel, we might need to lift state up or pass a key to force re-render.
      // For now, let's assume valid implementation.
      // Wait, prompt state IS local to AIContentPanel.
      // I should lift the prompt state up to InstagramPublisher to control it.
      toast.success("Prompt aprimorado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao aprimorar: ${error.message}`);
    },
  });

  // State for prompt needs to be lifted up to handle the update
  const [prompt, setPrompt] = useState("");

  const handleEnhance = async (currentPrompt: string) => {
    if (!currentPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await enhancePromptMutation.mutateAsync({ prompt: currentPrompt });
      if (result.enhancedPrompt) {
        setPrompt(result.enhancedPrompt);
      }
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

    if (scheduledDate) {
      toast.error("Agendamento de post ainda não está disponível. Use Publicar Agora.");
      return;
    }

    setIsPublishing(true);
    const hashTagSuffix =
      hashtags.length > 0 ? `\n\n${hashtags.map((h) => `#${h}`).join(" ")}` : "";

    await publishPost.mutateAsync({
      imageUrl,
      caption: `${caption}${hashTagSuffix}`,
    });
  };

  return (
    <section className="space-y-6" aria-label="Editor de publicações para Instagram">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
            Criar Post Instagram
          </h2>
          <p className="text-muted-foreground mt-1">
            Use IA para gerar legendas e hashtags automaticamente
          </p>
        </div>
      </header>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: AI Content Panel */}
        <NeonCard className="p-6">
          <NeonCardHeader className="px-0 pt-0">
            <NeonCardTitle className="text-lg flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" aria-hidden="true" />
              Gerador de Conteúdo
            </NeonCardTitle>
          </NeonCardHeader>
          <NeonCardContent className="px-0 pb-0">
            <AIContentPanel
              onGenerate={handleGenerate}
              onEnhance={handleEnhance}
              caption={caption}
              hashtags={hashtags}
              isGenerating={isGenerating}
              prompt={prompt}
              onPromptChange={setPrompt}
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
                className="min-h-11 gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isGeneratingImage ? "motion-safe:animate-spin" : ""}`}
                />
                Regenerar Imagem
              </Button>
            )}
            <p className="text-center text-xs text-muted-foreground">
              Prévia visual para revisão rápida antes da publicação.
            </p>
          </div>

          {/* Schedule & Publish */}
          <NeonCard className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Schedule Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-h-11 flex-1 gap-2">
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
                className="min-h-11 flex-1 gap-2"
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
            {scheduledDate && (
              <p className="mt-2 text-xs text-muted-foreground">
                Agendamento ainda não suportado neste fluxo. A ação acima publicará imediatamente
                após remover a data.
              </p>
            )}
          </NeonCard>
        </div>
      </div>
    </section>
  );
}
