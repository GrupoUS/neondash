import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bot,
  Camera,
  ExternalLink,
  Image,
  ImagePlus,
  Lightbulb,
  Loader2,
  Send,
  Sparkles,
  Syringe,
  User,
  Wand2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";

interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  imagemUrl: string | null;
  imagemGeradaUrl: string | null;
  createdAt: Date | null;
}

interface PatientPhoto {
  id: number;
  url: string;
  thumbnailUrl: string | null;
  tipo: string;
  areaFotografada: string | null;
  dataCaptura: Date | null;
}

interface AIChatWidgetProps {
  patientId: number;
  patientName: string;
}

const messageSchema = z.object({
  content: z.string().min(1),
  imagemUrl: z.string().url().optional(),
});

type MessageFormValues = z.infer<typeof messageSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT SUGGESTIONS - Categorized for aesthetic clinic use
// ─────────────────────────────────────────────────────────────────────────────

const PROMPT_CATEGORIES = [
  {
    title: "Análise",
    icon: Sparkles,
    suggestions: [
      {
        label: "Analisar histórico",
        prompt:
          "Analise o histórico completo de procedimentos deste paciente e sugira os próximos passos do tratamento",
      },
      {
        label: "Avaliar evolução",
        prompt:
          "Avalie a evolução clínica do paciente com base nas fotos antes/depois e métricas registradas",
      },
    ],
  },
  {
    title: "Simulação",
    icon: Wand2,
    suggestions: [
      {
        label: "Simular botox",
        prompt: "Simule o resultado de aplicação de toxina botulínica na região frontal e glabela",
      },
      {
        label: "Simular preenchimento",
        prompt:
          "Simule o resultado de preenchimento labial com ácido hialurônico, mantendo aspecto natural",
      },
      {
        label: "Simular harmonização",
        prompt:
          "Simule uma harmonização facial completa com botox, preenchimento e bioestimuladores",
      },
    ],
  },
  {
    title: "Recomendações",
    icon: Syringe,
    suggestions: [
      {
        label: "Protocolo anti-aging",
        prompt:
          "Sugira um protocolo anti-aging personalizado considerando idade, tipo de pele e histórico do paciente",
      },
      {
        label: "Próximos procedimentos",
        prompt:
          "Com base no perfil e objetivos do paciente, quais procedimentos você recomendaria como próxima etapa?",
      },
    ],
  },
];

// Flattened for quick access
const QUICK_PROMPTS = [
  {
    icon: Sparkles,
    label: "Analisar histórico",
    prompt: PROMPT_CATEGORIES[0].suggestions[0].prompt,
  },
  {
    icon: Camera,
    label: "Comparar fotos",
    prompt: "Compare as fotos antes/depois e descreva detalhadamente a evolução do tratamento",
  },
  {
    icon: Lightbulb,
    label: "Sugerir procedimentos",
    prompt: "Com base no perfil do paciente, quais procedimentos você recomendaria?",
  },
];

export function AIChatWidget({ patientId, patientName }: AIChatWidgetProps) {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  // Fetch chat history
  const { data: chatHistory, isLoading: isLoadingHistory } =
    trpc.pacientes.chatIa.getSession.useQuery(
      { pacienteId: patientId, sessionId },
      { staleTime: 10_000 }
    );

  // Fetch patient photos for gallery selection
  const { data: patientPhotos } = trpc.pacientes.fotos.list.useQuery(
    { pacienteId: patientId },
    { staleTime: 30_000 }
  );

  // Generate AI response mutation (saves user message, generates AI response, saves AI response)
  const generateResponseMutation = trpc.pacientes.chatIa.generateResponse.useMutation({
    onSuccess: () => {
      form.reset();
      setImagePreview(null);
      utils.pacientes.chatIa.getSession.invalidate({ pacienteId: patientId, sessionId });
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Erro ao enviar mensagem"),
  });

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
      imagemUrl: undefined,
    },
  });

  const messages = (chatHistory ?? []) as ChatMessage[];
  const photos = (patientPhotos ?? []) as PatientPhoto[];

  // Auto-scroll to bottom on new messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentional - scroll on message count change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (values: MessageFormValues) => {
    if (!values.content.trim() && !imagePreview) return;

    generateResponseMutation.mutate({
      pacienteId: patientId,
      sessionId,
      userMessage: values.content,
      imagemUrl: imagePreview || undefined,
    });
  };

  const handlePromptClick = (prompt: string) => {
    form.setValue("content", prompt);
    setPromptDialogOpen(false);
    inputRef.current?.focus();
  };

  const handleImageUrlSubmit = () => {
    if (z.string().url().safeParse(imageUrlInput).success) {
      setImagePreview(imageUrlInput);
      setImageUrlInput("");
      setImageUploadOpen(false);
    } else {
      toast.error("URL inválida");
    }
  };

  const handlePhotoSelect = (photo: PatientPhoto) => {
    setImagePreview(photo.url);
    setImageUploadOpen(false);
  };

  const isLoading = generateResponseMutation.isPending;

  return (
    <Card className="border-primary/10 flex flex-col h-[600px]">
      <CardHeader className="pb-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-primary" />
              Assistente IA
            </CardTitle>
            <CardDescription>Converse sobre o prontuário de {patientName}</CardDescription>
          </div>

          {/* Prompt Suggestions Dialog */}
          <Dialog open={promptDialogOpen} onOpenChange={setPromptDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer">
                <Lightbulb className="h-4 w-4" />
                Sugestões
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Sugestões de Prompts</DialogTitle>
                <DialogDescription>
                  Selecione um prompt para começar a conversa com a IA
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {PROMPT_CATEGORIES.map((category) => (
                  <div key={category.title}>
                    <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
                      <category.icon className="h-4 w-4 text-primary" />
                      {category.title}
                    </h4>
                    <div className="grid gap-2">
                      {category.suggestions.map((suggestion) => (
                        <Button
                          key={suggestion.label}
                          variant="outline"
                          className="justify-start h-auto py-2 px-3 text-left cursor-pointer"
                          onClick={() => handlePromptClick(suggestion.prompt)}
                        >
                          <span className="text-sm">{suggestion.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Chat Messages */}
        <ScrollArea ref={scrollRef as React.LegacyRef<HTMLDivElement>} className="flex-1 p-4">
          {isLoadingHistory ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-16 flex-1 rounded-lg" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-medium mb-1">Assistente Prontuário</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Pergunte sobre o paciente, peça análises de fotos ou simulações de procedimentos
              </p>

              {/* Quick Prompt Suggestions */}
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_PROMPTS.map((suggestion) => (
                  <Button
                    key={suggestion.label}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 cursor-pointer"
                    onClick={() => handlePromptClick(suggestion.prompt)}
                  >
                    <suggestion.icon className="h-3.5 w-3.5" />
                    {suggestion.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {message.imagemUrl && (
                      <img
                        src={message.imagemUrl}
                        alt="Imagem anexada"
                        className="max-w-[200px] rounded mb-2"
                      />
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.imagemGeradaUrl && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="mb-2 gap-1">
                          <Wand2 className="h-3 w-3" />
                          Simulação Gerada
                        </Badge>
                        <img
                          src={message.imagemGeradaUrl}
                          alt="Imagem gerada pela IA"
                          className="max-w-full rounded"
                        />
                      </div>
                    )}
                    <span className="text-xs opacity-60 mt-1 block">
                      {message.createdAt &&
                        new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-muted">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Pensando…</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Image Preview */}
        {imagePreview && (
          <div className="px-4 py-2 border-t bg-muted/30">
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-16 rounded border" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full cursor-pointer"
                onClick={() => setImagePreview(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t shrink-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSend)} className="flex gap-2">
              {/* Image Upload Popover */}
              <Popover open={imageUploadOpen} onOpenChange={setImageUploadOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 cursor-pointer"
                    disabled={isLoading}
                  >
                    <ImagePlus className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <Tabs defaultValue="url" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="url" className="gap-1.5 cursor-pointer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        URL
                      </TabsTrigger>
                      <TabsTrigger value="gallery" className="gap-1.5 cursor-pointer">
                        <Image className="h-3.5 w-3.5" />
                        Galeria
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="url" className="space-y-3 pt-3">
                      <div className="space-y-2">
                        <Label htmlFor="image-url">URL da Imagem</Label>
                        <div className="flex gap-2">
                          <Input
                            id="image-url"
                            placeholder="https://..."
                            value={imageUrlInput}
                            onChange={(e) => setImageUrlInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleImageUrlSubmit()}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleImageUrlSubmit}
                            className="cursor-pointer"
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="gallery" className="pt-3">
                      {photos.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhuma foto disponível
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {photos.map((photo) => (
                            <button
                              key={photo.id}
                              type="button"
                              className="relative aspect-square rounded overflow-hidden border hover:ring-2 ring-primary transition-all cursor-pointer"
                              onClick={() => handlePhotoSelect(photo)}
                            >
                              <img
                                src={photo.thumbnailUrl || photo.url}
                                alt={photo.areaFotografada || "Foto"}
                                className="w-full h-full object-cover"
                              />
                              {photo.tipo && (
                                <Badge
                                  variant="secondary"
                                  className="absolute bottom-1 left-1 text-[10px] px-1 py-0"
                                >
                                  {photo.tipo}
                                </Badge>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </PopoverContent>
              </Popover>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        ref={inputRef}
                        placeholder="Digite sua mensagem…"
                        disabled={isLoading}
                        className="flex-1"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="icon"
                disabled={isLoading || (!form.watch("content")?.trim() && !imagePreview)}
                className="shrink-0 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </Form>

          {/* Quick Prompts (when chat has messages) */}
          {messages.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {QUICK_PROMPTS.slice(0, 2).map((suggestion) => (
                <Button
                  key={suggestion.label}
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 h-7 cursor-pointer"
                  onClick={() => handlePromptClick(suggestion.prompt)}
                  disabled={isLoading}
                >
                  <suggestion.icon className="h-3 w-3" />
                  {suggestion.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
