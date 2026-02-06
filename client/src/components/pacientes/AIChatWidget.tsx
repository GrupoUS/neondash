import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, Camera, ImagePlus, Lightbulb, Loader2, Send, Sparkles, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  imagemUrl: string | null;
  imagemGeradaUrl: string | null;
  createdAt: Date | null;
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

const PROMPT_SUGGESTIONS = [
  {
    icon: Sparkles,
    label: "Analisar histórico",
    prompt: "Analise o histórico de procedimentos deste paciente e sugira próximos passos",
  },
  {
    icon: Camera,
    label: "Comparar fotos",
    prompt: "Compare as fotos antes/depois e descreva a evolução do tratamento",
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data: chatHistory, isLoading: isLoadingHistory } = trpc.pacientes.chatIa.history.useQuery(
    { pacienteId: patientId, sessionId },
    { staleTime: 10_000 }
  );

  const sendMessageMutation = trpc.pacientes.chatIa.send.useMutation({
    onSuccess: () => {
      form.reset();
      setImagePreview(null);
      utils.pacientes.chatIa.history.invalidate({ pacienteId: patientId, sessionId });
    },
    onError: (e) => toast.error(e.message || "Erro ao enviar mensagem"),
  });

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
      imagemUrl: undefined,
    },
  });

  const messages = (chatHistory ?? []) as ChatMessage[];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = (values: MessageFormValues) => {
    if (!values.content.trim() && !imagePreview) return;

    sendMessageMutation.mutate({
      pacienteId: patientId,
      sessionId,
      role: "user",
      content: values.content,
      imagemUrl: imagePreview || undefined,
    });
  };

  const handlePromptClick = (prompt: string) => {
    form.setValue("content", prompt);
    inputRef.current?.focus();
  };

  const handleImageUrl = () => {
    const url = prompt("Cole a URL da imagem:");
    if (url && z.string().url().safeParse(url).success) {
      setImagePreview(url);
    } else if (url) {
      toast.error("URL inválida");
    }
  };

  const isLoading = sendMessageMutation.isPending;

  return (
    <Card className="border-primary/10 flex flex-col h-[600px]">
      <CardHeader className="pb-3 border-b shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          Assistente IA
        </CardTitle>
        <CardDescription>Converse sobre o prontuário de {patientName}</CardDescription>
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
                Pergunte sobre o paciente, peça análises de fotos ou sugestões de tratamento
              </p>

              {/* Prompt Suggestions */}
              <div className="flex flex-wrap gap-2 justify-center">
                {PROMPT_SUGGESTIONS.map((suggestion) => (
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
                        <Badge variant="secondary" className="mb-2">
                          Imagem Gerada
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
                    <span className="text-sm">Pensando...</span>
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleImageUrl}
                className="shrink-0 cursor-pointer"
                disabled={isLoading}
              >
                <ImagePlus className="h-5 w-5" />
              </Button>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        ref={inputRef}
                        placeholder="Digite sua mensagem..."
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
              {PROMPT_SUGGESTIONS.slice(0, 2).map((suggestion) => (
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
