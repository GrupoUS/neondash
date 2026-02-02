/**
 * ChatInterface - Main chat UI component for Moltbot
 *
 * Features:
 * - Message list with user/assistant styling
 * - Input field with send button
 * - Auto-scroll to bottom
 * - Loading states
 * - Session management
 */

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, MessageSquarePlus, Send, User, Wifi, WifiOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOpenClaw } from "@/hooks/useOpenClaw";
import { cn } from "@/lib/utils";

export function ChatInterface() {
  const {
    isActive,
    createSession,
    endSession,
    messages,
    sendMessage,
    isLoading,
    isSending,
    isConnected,
    error,
  } = useOpenClaw();

  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, []);

  // Focus input when session starts
  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus();
    }
  }, [isActive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card className="flex h-[600px] flex-col border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="flex-shrink-0 border-b border-border/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                  isConnected ? "bg-green-500" : "bg-gray-400"
                )}
              />
            </div>
            <div>
              <CardTitle className="text-lg">Assistente NEON</CardTitle>
              <p className="text-xs text-muted-foreground">
                {isConnected ? (
                  <span className="flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-500">
                    <WifiOff className="h-3 w-3" />
                    Conectando...
                  </span>
                )}
              </p>
            </div>
          </div>

          {isActive && (
            <Button
              variant="ghost"
              size="icon"
              onClick={endSession}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
        {!isActive ? (
          // Start session view
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-primary/10 p-6">
              <Bot className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Olá! Eu sou o Assistente NEON</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Seu assistente de mentoria com IA. Posso ajudar com análises, sugestões e
                acompanhamento do seu progresso.
              </p>
            </div>
            <Button onClick={createSession} disabled={isLoading} className="gap-2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquarePlus className="h-4 w-4" />
              )}
              Iniciar conversa
            </Button>
          </div>
        ) : (
          // Chat view
          <>
            <ScrollArea ref={scrollAreaRef} className="h-full min-h-0 flex-1 pr-4">
              <div className="flex flex-col gap-4 pb-2">
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn("flex gap-3", message.role === "user" && "flex-row-reverse")}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback
                          className={cn(
                            "text-xs",
                            message.role === "assistant"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-secondary-foreground"
                          )}
                        >
                          {message.role === "assistant" ? (
                            <Bot className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>

                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2.5",
                          message.role === "assistant"
                            ? "bg-muted text-foreground"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-[10px]",
                            message.role === "assistant"
                              ? "text-muted-foreground"
                              : "text-primary-foreground/70"
                          )}
                        >
                          {message.createdAt.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isSending && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" />
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Input area */}
            <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border/50 pt-4">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                disabled={isSending}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isSending}>
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
