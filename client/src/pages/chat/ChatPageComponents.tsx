/**
 * Chat Page Sub-components - Extracted to reduce ChatPage complexity
 */

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Video,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "wouter";
import { ConversationItem, type ConversationItemData } from "@/components/chat/ConversationItem";
import { ConversationSkeleton } from "@/components/chat/ConversationSkeleton";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageSkeleton } from "@/components/chat/MessageSkeleton";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { VideoMessageComposer } from "@/components/chat/VideoMessageComposer";
import { type RenderItem, VirtualizedMessageList } from "@/components/chat/VirtualizedMessageList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// ChatPageHeader - AI SDR toggle and main header
// ─────────────────────────────────────────────────────────────────────────────

interface ChatPageHeaderProps {
  conversationCount: number;
  isAiEnabled: boolean;
  onToggleAi: () => void;
  isToggling: boolean;
}

export function ChatPageHeader({
  conversationCount,
  isAiEnabled,
  onToggleAi,
  isToggling,
}: ChatPageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card/50">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Chat WhatsApp</h1>
          <p className="text-sm text-muted-foreground">{conversationCount} conversas ativas</p>
        </div>
      </div>

      {/* AI SDR Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-card border border-border/50">
          <div className="flex items-center gap-2">
            <Bot
              className={cn("w-4 h-4", isAiEnabled ? "text-teal-500" : "text-muted-foreground")}
            />
            <span className="text-sm font-medium">AI SDR</span>
            {isAiEnabled && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
              </span>
            )}
          </div>
          <Switch checked={isAiEnabled} onCheckedChange={onToggleAi} disabled={isToggling} />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/configuracoes">
                <Settings className="w-4 h-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Configurações do AI SDR</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ConversationSidebar - Contact list and search
// ─────────────────────────────────────────────────────────────────────────────

interface ConversationSidebarProps {
  conversations: ConversationItemData[];
  selectedPhone: string | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectConversation: (phone: string) => void;
  isLoading: boolean;
  // Add contact dialog
  addContactOpen: boolean;
  onAddContactOpenChange: (open: boolean) => void;
  newContactPhone: string;
  onNewContactPhoneChange: (value: string) => void;
  newContactName: string;
  onNewContactNameChange: (value: string) => void;
  onAddContact: () => void;
}

export function ConversationSidebar({
  conversations,
  selectedPhone,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  isLoading,
  addContactOpen,
  onAddContactOpenChange,
  newContactPhone,
  onNewContactPhoneChange,
  newContactName,
  onNewContactNameChange,
  onAddContact,
}: ConversationSidebarProps) {
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const nameMatch = conv.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = conv.phone.includes(searchQuery);
    return nameMatch || phoneMatch;
  });

  return (
    <div
      className={cn(
        "border-r border-border/50 flex flex-col bg-card/30",
        "w-full sm:w-72 md:w-80 lg:w-80",
        selectedPhone ? "hidden sm:flex" : "flex"
      )}
    >
      {/* Search & Add */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contatos..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </div>
        <Dialog open={addContactOpen} onOpenChange={onAddContactOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Contato
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Contato</DialogTitle>
              <DialogDescription>
                Adicione um número de WhatsApp para iniciar uma conversa.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone*</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={newContactPhone}
                  onChange={(e) => onNewContactPhoneChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Com DDD, sem +55</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome (opcional)</Label>
                <Input
                  id="name"
                  placeholder="Nome do contato"
                  value={newContactName}
                  onChange={(e) => onNewContactNameChange(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onAddContactOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={onAddContact} disabled={!newContactPhone.trim()}>
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <ConversationSkeleton count={5} />
        ) : filteredConversations.length > 0 ? (
          <div className="py-2">
            {filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.phone}
                conversation={conv}
                isSelected={selectedPhone === conv.phone}
                onClick={onSelectConversation}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 px-4 text-center">
            <MessageCircle className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Nenhum contato encontrado" : "Nenhuma conversa ainda"}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ChatConversationHeader - Header for selected conversation
// ─────────────────────────────────────────────────────────────────────────────

interface ChatConversationHeaderProps {
  selectedPhone: string;
  contactName: string | null;
  isOnline: boolean;
  isAiEnabled: boolean;
  messagesLoading: boolean;
  onBack: () => void;
  onRefresh: () => void;
  // Edit contact dialog
  editContactOpen: boolean;
  onEditContactOpenChange: (open: boolean) => void;
  editContactName: string;
  onEditContactNameChange: (value: string) => void;
  editContactNotes: string;
  onEditContactNotesChange: (value: string) => void;
  onSaveContact: () => void;
  isSavingContact: boolean;
  onOpenEditContact: () => void;
}

export function ChatConversationHeader({
  selectedPhone,
  contactName,
  isOnline,
  isAiEnabled,
  messagesLoading,
  onBack,
  onRefresh,
  editContactOpen,
  onEditContactOpenChange,
  editContactName,
  onEditContactNameChange,
  editContactNotes,
  onEditContactNotesChange,
  onSaveContact,
  isSavingContact,
  onOpenEditContact,
}: ChatConversationHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-700/50 bg-slate-800/50">
      <div className="flex items-center gap-3">
        {/* Back button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="sm:hidden text-slate-400 hover:text-slate-100"
          aria-label="Voltar para lista de conversas"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center ring-2 ring-emerald-500/30">
          <MessageCircle className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-slate-100">{contactName || selectedPhone}</h4>
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-400 font-medium">{selectedPhone}</p>
            <span
              className={cn("h-2 w-2 rounded-full", isOnline ? "bg-emerald-500" : "bg-slate-500")}
              aria-hidden="true"
              title={isOnline ? "Contato online" : "Contato offline"}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isAiEnabled && (
          <Badge variant="outline" className="bg-teal-500/10 text-teal-400 border-teal-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Ativo
          </Badge>
        )}
        {/* Edit Contact Button */}
        <Dialog open={editContactOpen} onOpenChange={onEditContactOpenChange}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenEditContact}
              className="text-slate-400 hover:text-slate-100"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Contato</DialogTitle>
              <DialogDescription>Adicione um nome para identificar este contato.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={selectedPhone} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Nome*</Label>
                <Input
                  id="contactName"
                  placeholder="Nome do contato"
                  value={editContactName}
                  onChange={(e) => onEditContactNameChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactNotes">Observações</Label>
                <Textarea
                  id="contactNotes"
                  placeholder="Notas sobre o contato..."
                  value={editContactNotes}
                  onChange={(e) => onEditContactNotesChange(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onEditContactOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={onSaveContact} disabled={!editContactName.trim() || isSavingContact}>
                {isSavingContact ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={messagesLoading}
          className="text-slate-400 hover:text-slate-100"
        >
          <RefreshCw className={cn("w-4 h-4", messagesLoading && "animate-spin")} />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MessagesArea - Message display with virtualization
// ─────────────────────────────────────────────────────────────────────────────

interface MessagesAreaProps {
  renderItems: RenderItem[];
  isLoading: boolean;
  shouldAutoScroll: boolean;
  footer: ReactNode;
  emptyState: ReactNode;
  showScrollToBottom: boolean;
  onScrollToBottom: () => void;
}

export function MessagesArea({
  renderItems,
  isLoading,
  shouldAutoScroll,
  footer,
  emptyState,
  showScrollToBottom,
  onScrollToBottom,
}: MessagesAreaProps) {
  return (
    <div className="flex-1 px-4 py-4 relative">
      <div className="h-full max-w-3xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <MessageSkeleton count={4} />
          </div>
        ) : (
          <VirtualizedMessageList
            items={renderItems}
            isLoading={isLoading}
            autoScrollToBottom={shouldAutoScroll}
            footer={footer}
            emptyState={emptyState}
          />
        )}
      </div>
      {showScrollToBottom ? (
        <div className="pointer-events-none absolute bottom-4 right-4">
          <Button
            type="button"
            size="icon"
            className="pointer-events-auto rounded-full shadow-lg"
            onClick={onScrollToBottom}
            aria-label="Ir para o fim da conversa"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InputArea - Message input with video composer
// ─────────────────────────────────────────────────────────────────────────────

interface InputAreaProps {
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  selectedPhone: string | null;
  isSending: boolean;
  sendError: boolean;
  // Handlers
  onTypingChange: () => void;
  onAttachmentSelect: () => void;
  onEmojiSelect: (emoji: string) => void;
  onAudioAction: () => void;
  // Video composer
  videoComposerOpen: boolean;
  onVideoComposerOpenChange: (open: boolean) => void;
  leadId: number | undefined;
  onVideoSuccess: () => void;
}

export function InputArea({
  message,
  onMessageChange,
  onSend,
  selectedPhone,
  isSending,
  sendError,
  onTypingChange,
  onAttachmentSelect,
  onEmojiSelect,
  onAudioAction,
  videoComposerOpen,
  onVideoComposerOpenChange,
  leadId,
  onVideoSuccess,
}: InputAreaProps) {
  return (
    <div className="p-4 border-t border-slate-700/50 bg-slate-800/80">
      <div className="flex gap-3 items-end max-w-3xl mx-auto">
        {/* Video Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onVideoComposerOpenChange(true)}
          disabled={!selectedPhone}
          className="shrink-0 h-11 w-11 text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
        >
          <Video className="w-5 h-5" />
        </Button>

        <MessageInput
          value={message}
          onChange={onMessageChange}
          onSend={onSend}
          onTypingChange={onTypingChange}
          onAttachmentSelect={onAttachmentSelect}
          onEmojiSelect={onEmojiSelect}
          onAudioAction={onAudioAction}
          disabled={isSending || !selectedPhone}
          placeholder="Digite sua mensagem..."
          className="flex-1 rounded-md border-slate-600/50 bg-slate-700/50"
        />

        <Button
          onClick={onSend}
          disabled={!message.trim() || isSending}
          size="icon"
          className="shrink-0 h-11 w-11 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <MessageCircle className="w-5 h-5" />
          )}
        </Button>
      </div>
      {sendError && (
        <p className="text-xs text-red-400 mt-2 text-center">
          Erro ao enviar mensagem. Tente novamente.
        </p>
      )}

      {/* Video Message Composer */}
      <VideoMessageComposer
        open={videoComposerOpen}
        onOpenChange={onVideoComposerOpenChange}
        phone={selectedPhone ?? ""}
        leadId={leadId}
        onSuccess={onVideoSuccess}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyConversationState - When no conversation is selected
// ─────────────────────────────────────────────────────────────────────────────

export function EmptyConversationState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="p-6 rounded-full bg-slate-800/50 mb-4">
        <MessageCircle className="w-12 h-12 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-200 mb-2">Selecione uma conversa</h3>
      <p className="text-sm text-slate-400 max-w-sm">
        Escolha um contato da lista ao lado ou adicione um novo para começar a conversar
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NotConnectedState - When WhatsApp is not connected
// ─────────────────────────────────────────────────────────────────────────────

export function NotConnectedState() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-6">
      <div className="p-6 rounded-full bg-muted">
        <MessageCircle className="w-12 h-12 text-muted-foreground" />
      </div>
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold mb-2">WhatsApp não conectado</h2>
        <p className="text-muted-foreground">
          Para usar o Chat, conecte seu WhatsApp nas configurações. Escaneie o QR Code para
          sincronizar suas conversas.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/configuracoes">
          <Settings className="w-5 h-5 mr-2" />
          Ir para Configurações
        </Link>
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TypingIndicatorWrapper - Wrapped typing indicator with timeout handling
// ─────────────────────────────────────────────────────────────────────────────

interface TypingIndicatorWrapperProps {
  isVisible: boolean;
  lastActivityAt: number | undefined;
  timeoutMs: number;
  onTimeout: () => void;
}

export function TypingIndicatorWrapper({
  isVisible,
  lastActivityAt,
  timeoutMs,
  onTimeout,
}: TypingIndicatorWrapperProps) {
  return (
    <TypingIndicator
      isVisible={isVisible}
      label="Contato digitando…"
      lastActivityAt={lastActivityAt}
      timeoutMs={timeoutMs}
      onTimeout={onTimeout}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MessagesEmptyState - When conversation has no messages
// ─────────────────────────────────────────────────────────────────────────────

export function MessagesEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-48 text-center"
    >
      <div className="p-4 rounded-full bg-slate-800 mb-3">
        <MessageCircle className="w-8 h-8 text-slate-500" />
      </div>
      <p className="text-sm text-slate-400 font-medium">Nenhuma mensagem ainda</p>
      <p className="text-xs text-slate-500 mt-1">Envie a primeira mensagem</p>
    </motion.div>
  );
}
