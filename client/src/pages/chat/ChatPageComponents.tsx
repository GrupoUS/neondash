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
  PanelRight,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
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
  onToggleSdrSidebar: () => void;
  isSdrSidebarOpen: boolean;
}

export function ChatPageHeader({
  conversationCount,
  isAiEnabled,
  onToggleAi,
  isToggling,
  onToggleSdrSidebar,
  isSdrSidebarOpen,
}: ChatPageHeaderProps) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between px-6 py-3.5 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <MessageCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Chat</h1>
            <p className="text-xs text-muted-foreground font-medium">
              {conversationCount} conversa{conversationCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* AI SDR Chip */}
          <div
            className={cn(
              "flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-colors",
              isAiEnabled
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-muted/50 border-border/50"
            )}
          >
            <div className="flex items-center gap-1.5">
              <Bot
                className={cn(
                  "w-3.5 h-3.5",
                  isAiEnabled ? "text-emerald-500" : "text-muted-foreground"
                )}
              />
              <span className="text-xs font-semibold tracking-wide uppercase">SDR</span>
              {isAiEnabled && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
              )}
            </div>
            <Switch
              checked={isAiEnabled}
              onCheckedChange={onToggleAi}
              disabled={isToggling}
              className="scale-90 data-[state=checked]:bg-emerald-500"
            />
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href="/configuracoes">
                  <Settings className="w-4 h-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Configurações</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isSdrSidebarOpen ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={onToggleSdrSidebar}
                aria-label="Toggle SDR Sidebar"
              >
                <PanelRight className={cn("w-4 h-4", isSdrSidebarOpen && "text-emerald-500")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isSdrSidebarOpen ? "Fechar Painel SDR" : "Abrir Painel SDR"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      {/* Gradient accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            placeholder="Buscar contatos…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-muted/30 border-border/30 focus-visible:ring-emerald-500/30 placeholder:text-muted-foreground/50 h-9 text-sm"
          />
        </div>
        <Dialog open={addContactOpen} onOpenChange={onAddContactOpenChange}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs border-dashed border-border/50 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Contato
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
            <div className="p-3 rounded-full bg-muted/30 mb-3">
              <Search className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground/70">
              {searchQuery ? "Nenhum contato encontrado" : "Nenhuma conversa"}
            </p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              {searchQuery ? "Tente outro termo de busca" : "Adicione um contato para começar"}
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
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/30 bg-card/60 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Back button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="sm:hidden h-8 w-8"
          aria-label="Voltar para lista de conversas"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center ring-1 ring-emerald-500/25">
          <span className="text-sm font-bold text-emerald-500">
            {(contactName || selectedPhone || "?").charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h4 className="font-semibold text-sm leading-tight">{contactName || selectedPhone}</h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isOnline ? "bg-emerald-500" : "bg-muted-foreground/30"
              )}
              aria-hidden="true"
            />
            <p className="text-[11px] text-muted-foreground">
              {isOnline ? "Online" : selectedPhone}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {isAiEnabled && (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-semibold px-2 py-0.5 gap-1"
          >
            <Sparkles className="w-3 h-3" />
            AI
          </Badge>
        )}
        {/* Edit Contact Button */}
        <Dialog open={editContactOpen} onOpenChange={onEditContactOpenChange}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenEditContact}>
              <Pencil className="w-3.5 h-3.5" />
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
          className="h-8 w-8"
          onClick={onRefresh}
          disabled={messagesLoading}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", messagesLoading && "animate-spin")} />
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
    <div className="p-3 border-t border-border/30 bg-card/60 backdrop-blur-sm">
      <div className="flex gap-2 items-end max-w-3xl mx-auto">
        {/* Video Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onVideoComposerOpenChange(true)}
          disabled={!selectedPhone}
          className="shrink-0 h-10 w-10 hover:bg-muted/50"
        >
          <Video className="w-4 h-4" />
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
          placeholder="Digite sua mensagem…"
          className="flex-1 rounded-lg border-border/30 bg-muted/30 focus-within:ring-1 focus-within:ring-emerald-500/30"
        />

        <Button
          onClick={onSend}
          disabled={!message.trim() || isSending}
          size="icon"
          className="shrink-0 h-10 w-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
      {sendError && (
        <p className="text-xs text-destructive mt-2 text-center">
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center h-full text-center px-6"
    >
      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 ring-1 ring-emerald-500/10 mb-5">
        <MessageCircle className="w-10 h-10 text-emerald-500/60" />
      </div>
      <h3 className="text-base font-semibold mb-1.5">Selecione uma conversa</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Escolha um contato ao lado ou adicione um novo para começar
      </p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NotConnectedState - When WhatsApp is not connected
// ─────────────────────────────────────────────────────────────────────────────

export function NotConnectedState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center h-[70vh] gap-5"
    >
      <div className="p-5 rounded-2xl bg-muted/50 ring-1 ring-border/50">
        <MessageCircle className="w-10 h-10 text-muted-foreground/60" />
      </div>
      <div className="text-center max-w-sm">
        <h2 className="text-lg font-bold mb-1.5">WhatsApp não conectado</h2>
        <p className="text-sm text-muted-foreground">
          Conecte seu WhatsApp nas configurações para sincronizar conversas.
        </p>
      </div>
      <Button asChild size="lg" className="mt-2">
        <Link href="/configuracoes">
          <Settings className="w-4 h-4 mr-2" />
          Configurações
        </Link>
      </Button>
    </motion.div>
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center h-48 text-center"
    >
      <div className="p-3.5 rounded-xl bg-muted/30 ring-1 ring-border/20 mb-3">
        <Send className="w-6 h-6 text-muted-foreground/40" />
      </div>
      <p className="text-sm text-muted-foreground font-medium">Sem mensagens</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Envie a primeira mensagem</p>
    </motion.div>
  );
}
