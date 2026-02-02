/**
 * GlobalAIChat - Floating AI chat widget
 *
 * Features:
 * - FAB trigger in bottom-right corner
 * - Popup panel with chat interface
 * - Escape key to close
 * - Click outside to close
 * - Uses useOpenClaw for AI functionality
 */

import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageSquarePlus, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOpenClaw } from "@/hooks/useOpenClaw";
import { cn } from "@/lib/utils";
import { AILoadingIndicator } from "./AILoadingIndicator";
import { AIMessageBubble } from "./AIMessageBubble";
import { AIPromptInput } from "./AIPromptInput";

export function GlobalAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { isActive, createSession, messages, sendMessage, isLoading, isSending, isConnected } =
    useOpenClaw();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Check if click is on the FAB button
        const fabButton = document.getElementById("ai-chat-fab");
        if (fabButton?.contains(e.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLDivElement;
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  });

  const handleSend = useCallback(
    async (content: string) => {
      await sendMessage(content);
    },
    [sendMessage]
  );

  const handleStartSession = useCallback(async () => {
    await createSession();
  }, [createSession]);

  return (
    <>
      {/* FAB Trigger Button */}
      <motion.button
        id="ai-chat-fab"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "h-14 w-14 rounded-full shadow-lg",
          "bg-gradient-to-br from-primary to-primary/80",
          "text-primary-foreground",
          "flex items-center justify-center",
          "hover:shadow-xl hover:scale-105 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? "Fechar chat" : "Abrir assistente IA"}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Sparkles className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection indicator */}
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
            isConnected ? "bg-green-500" : "bg-amber-500"
          )}
        />
      </motion.button>

      {/* Chat Panel Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "fixed bottom-24 right-6 z-50",
              "w-[380px] max-w-[calc(100vw-3rem)]",
              "h-[500px] max-h-[calc(100vh-8rem)]",
              "rounded-2xl shadow-2xl",
              "bg-card/95 backdrop-blur-lg",
              "border border-border/50",
              "flex flex-col overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-semibold">Assistente NEON</h3>
                  <p className="text-xs text-muted-foreground">
                    {isConnected ? "Online" : "Conectando..."}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 flex flex-col min-h-0">
              {!isActive ? (
                /* Start Session View */
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Bot className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Olá! Eu sou o Assistente NEON</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Posso ajudar com análises, sugestões e acompanhamento do seu progresso.
                    </p>
                  </div>
                  <Button onClick={handleStartSession} disabled={isLoading} className="gap-2">
                    <MessageSquarePlus className="h-4 w-4" />
                    Iniciar conversa
                  </Button>
                </div>
              ) : (
                /* Chat View */
                <>
                  <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                    <div className="flex flex-col gap-3">
                      {messages.map((message) => (
                        <AIMessageBubble
                          key={message.id}
                          role={message.role}
                          content={message.content}
                          timestamp={message.createdAt}
                        />
                      ))}

                      {isSending && (
                        <div className="flex gap-2">
                          <Avatar className="h-7 w-7 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <Bot className="h-3.5 w-3.5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="rounded-2xl bg-muted px-3 py-2">
                            <AILoadingIndicator />
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="p-3 border-t border-border/50">
                    <AIPromptInput
                      onSend={handleSend}
                      isLoading={isSending}
                      placeholder="Digite sua mensagem..."
                    />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
