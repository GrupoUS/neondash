/**
 * Lead Chat Window Component
 * Full chat interface for lead conversations via WhatsApp
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  Settings,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ChatMessageBubble } from "./ChatMessageBubble";

interface LeadChatWindowProps {
  leadId: number;
  phone?: string;
  leadName?: string;
}

export function LeadChatWindow({ leadId, phone, leadName }: LeadChatWindowProps) {
  const [message, setMessage] = useState("");
  const [sseConnected, setSseConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get connection status
  const { data: connectionStatus, isLoading: isLoadingStatus } = trpc.zapi.getStatus.useQuery();

  // Get messages for this lead (initial fetch, no polling - SSE handles updates)
  const {
    data: messages,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = trpc.zapi.getMessages.useQuery({ leadId }, { enabled: !!leadId });

  // Get TanStack Query utils for cache invalidation
  const utils = trpc.useUtils();

  // Handle incoming SSE message
  const handleSSEMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        // Only update if message is for the current lead
        if (data.leadId === leadId) {
          utils.zapi.getMessages.invalidate({ leadId });
        }
      } catch {
        // Malformed JSON - ignore
      }
    },
    [leadId, utils.zapi.getMessages]
  );

  // Handle SSE status update
  const handleSSEStatusUpdate = useCallback(() => {
    // Invalidate to get updated status icons
    utils.zapi.getMessages.invalidate({ leadId });
  }, [leadId, utils.zapi.getMessages]);

  // Setup SSE connection
  useEffect(() => {
    if (!leadId || !phone) return;

    const eventSource = new EventSource("/api/chat/events", { withCredentials: true });

    eventSource.onopen = () => setSseConnected(true);
    eventSource.onerror = () => setSseConnected(false);

    eventSource.addEventListener("message", handleSSEMessage);
    eventSource.addEventListener("status_update", handleSSEStatusUpdate);
    eventSource.addEventListener("connected", () => setSseConnected(true));

    return () => eventSource.close();
  }, [leadId, phone, handleSSEMessage, handleSSEStatusUpdate]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional - scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message mutation
  const sendMutation = trpc.zapi.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      refetchMessages();
      textareaRef.current?.focus();
    },
  });

  const handleSend = () => {
    if (!message.trim() || sendMutation.isPending || !phone) return;
    sendMutation.mutate({ phone, message: message.trim(), leadId });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Not connected state
  if (!isLoadingStatus && !connectionStatus?.connected) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 p-6">
        <div className="p-4 rounded-full bg-muted">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h4 className="font-medium">WhatsApp não conectado</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Conecte seu WhatsApp nas configurações para enviar mensagens
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/configuracoes">
            <Settings className="w-4 h-4 mr-2" />
            Ir para Configurações
          </Link>
        </Button>
      </div>
    );
  }

  // No phone state
  if (!phone) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 p-6">
        <div className="p-4 rounded-full bg-muted">
          <MessageCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h4 className="font-medium">Sem telefone cadastrado</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Este lead não possui número de telefone cadastrado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      {/* Chat Header - WhatsApp-inspired styling */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center ring-2 ring-emerald-500/30">
            <MessageCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-100">{leadName || "Lead"}</h4>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-slate-400 font-medium">{phone}</p>
              {sseConnected ? (
                <Wifi className="w-3 h-3 text-emerald-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-amber-400" />
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetchMessages()}
          disabled={isLoadingMessages}
          className="text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingMessages ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-3 bg-slate-900/50" ref={scrollRef}>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {isLoadingMessages ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-32"
              >
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </motion.div>
            ) : messages && messages.length > 0 ? (
              messages.map((msg) => <ChatMessageBubble key={msg.id} message={msg} />)
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-32 text-center"
              >
                <div className="p-4 rounded-full bg-slate-800 mb-3">
                  <MessageCircle className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-sm text-slate-400 font-medium">Nenhuma mensagem ainda</p>
                <p className="text-xs text-slate-500 mt-1">
                  Envie a primeira mensagem para este lead
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/80">
        <div className="flex gap-3 items-end">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="min-h-[44px] max-h-32 resize-none bg-slate-700/50 border-slate-600/50 text-slate-100 placeholder:text-slate-400 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMutation.isPending}
            size="icon"
            className="shrink-0 h-11 w-11 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        {sendMutation.isError && (
          <p className="text-xs text-red-400 mt-2 font-medium">
            Erro ao enviar mensagem. Tente novamente.
          </p>
        )}
      </div>
    </div>
  );
}

export default LeadChatWindow;
