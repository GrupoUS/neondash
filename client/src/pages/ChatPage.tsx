/**
 * Chat Page - WhatsApp-style conversation interface
 * Full inbox layout with contact list and conversation view
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  User,
  Video,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import { VideoMessageComposer } from "@/components/chat/VideoMessageComposer";
import DashboardLayout from "@/components/DashboardLayout";
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
import {
  useWhatsAppConversations,
  useWhatsAppMessages,
  useWhatsAppProvider,
  useWhatsAppSendMessage,
} from "@/hooks/useWhatsAppProvider";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

// Types for conversations
interface Conversation {
  phone: string;
  name: string | null;
  leadId: number | null;
  lastMessage: string | null;
  lastMessageAt: Date | string | null;
  unreadCount: number;
}

export function ChatPage() {
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [videoComposerOpen, setVideoComposerOpen] = useState(false);

  // Use extracted hooks for multi-provider support
  const {
    activeProvider,
    isConnected: isAnyConnected,
    isLoading: statusLoading,
  } = useWhatsAppProvider();
  const {
    conversations,
    isLoading: conversationsLoading,
    refetch: refetchConversations,
  } = useWhatsAppConversations(activeProvider);
  const {
    messages,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useWhatsAppMessages(activeProvider, selectedPhone);

  // Get AI Agent config
  const { data: aiConfig } = trpc.aiAgent.getConfig.useQuery();
  const toggleAiMutation = trpc.aiAgent.toggleEnabled.useMutation({
    onSuccess: () => {
      // Invalidate the query to get updated state
    },
  });

  // Send message mutation with success callback
  const sendMutation = useWhatsAppSendMessage(activeProvider, () => {
    setMessage("");
    refetchMessages();
    refetchConversations();
  });

  // Edit contact state and mutation
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [editContactName, setEditContactName] = useState("");
  const [editContactNotes, setEditContactNotes] = useState("");

  const upsertContactMutation = trpc.zapi.upsertContact.useMutation({
    onSuccess: () => {
      setEditContactOpen(false);
      refetchConversations();
    },
  });

  // Open edit contact dialog with current values
  const openEditContact = () => {
    setEditContactName(selectedConversation?.name ?? "");
    setEditContactNotes("");
    setEditContactOpen(true);
  };

  const handleSaveContact = () => {
    if (!selectedPhone || !editContactName.trim()) return;
    upsertContactMutation.mutate({
      phone: selectedPhone,
      name: editContactName.trim(),
      notes: editContactNotes.trim() || undefined,
    });
  };

  // Filter conversations by search
  const filteredConversations =
    conversations?.filter((conv: Conversation) => {
      if (!searchQuery) return true;
      const nameMatch = conv.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const phoneMatch = conv.phone.includes(searchQuery);
      return nameMatch || phoneMatch;
    }) ?? [];

  // Get selected conversation data
  const selectedConversation = conversations?.find((c: Conversation) => c.phone === selectedPhone);

  const handleSend = () => {
    if (!message.trim() || sendMutation.isPending || !selectedPhone) return;

    const leadId = selectedConversation?.leadId ?? undefined;
    sendMutation.mutate({
      phone: selectedPhone,
      message: message.trim(),
      ...(leadId && { leadId }),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddContact = () => {
    if (!newContactPhone.trim()) return;
    // Format phone number
    let phone = newContactPhone.replace(/\D/g, "");
    if (!phone.startsWith("55")) {
      phone = `55${phone}`;
    }
    setSelectedPhone(phone);
    setAddContactOpen(false);
    setNewContactPhone("");
    setNewContactName("");
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const isAiEnabled = aiConfig?.enabled === "sim";

  // Not connected state - check if ANY provider is connected
  if (!statusLoading && !isAnyConnected) {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Page Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Chat WhatsApp</h1>
              <p className="text-sm text-muted-foreground">
                {conversations?.length ?? 0} conversas ativas
              </p>
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
              <Switch
                checked={isAiEnabled}
                onCheckedChange={() => toggleAiMutation.mutate()}
                disabled={toggleAiMutation.isPending}
              />
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

        {/* Main Content - Inbox Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Contact List Sidebar */}
          <div className="w-80 border-r border-border/50 flex flex-col bg-card/30">
            {/* Search & Add */}
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contatos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>
              <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
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
                        onChange={(e) => setNewContactPhone(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Com DDD, sem +55</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome (opcional)</Label>
                      <Input
                        id="name"
                        placeholder="Nome do contato"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddContactOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddContact} disabled={!newContactPhone.trim()}>
                      Adicionar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Separator />

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              {conversationsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredConversations.length > 0 ? (
                <div className="py-2">
                  {filteredConversations.map((conv: Conversation) => (
                    <button
                      type="button"
                      key={conv.phone}
                      onClick={() => setSelectedPhone(conv.phone)}
                      className={cn(
                        "w-full px-4 py-3 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left",
                        selectedPhone === conv.phone && "bg-accent"
                      )}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {conv.leadId ? (
                          <User className="w-5 h-5 text-primary" />
                        ) : (
                          <MessageCircle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">
                            {conv.name || conv.phone}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessage || "Sem mensagens"}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge variant="default" className="h-5 min-w-5 text-xs">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
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

          {/* Conversation View */}
          <div className="flex-1 flex flex-col bg-slate-900/30">
            {selectedPhone ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center ring-2 ring-emerald-500/30">
                      <MessageCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-100">
                        {selectedConversation?.name || selectedPhone}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">{selectedPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAiEnabled && (
                      <Badge
                        variant="outline"
                        className="bg-teal-500/10 text-teal-400 border-teal-500/30"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Ativo
                      </Badge>
                    )}
                    {/* Edit Contact Button */}
                    <Dialog open={editContactOpen} onOpenChange={setEditContactOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={openEditContact}
                          className="text-slate-400 hover:text-slate-100"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Contato</DialogTitle>
                          <DialogDescription>
                            Adicione um nome para identificar este contato.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Telefone</Label>
                            <Input value={selectedPhone ?? ""} disabled />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contactName">Nome*</Label>
                            <Input
                              id="contactName"
                              placeholder="Nome do contato"
                              value={editContactName}
                              onChange={(e) => setEditContactName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contactNotes">Observações</Label>
                            <Textarea
                              id="contactNotes"
                              placeholder="Notas sobre o contato..."
                              value={editContactNotes}
                              onChange={(e) => setEditContactNotes(e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditContactOpen(false)}>
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleSaveContact}
                            disabled={!editContactName.trim() || upsertContactMutation.isPending}
                          >
                            {upsertContactMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Salvar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => refetchMessages()}
                      disabled={messagesLoading}
                      className="text-slate-400 hover:text-slate-100"
                    >
                      <RefreshCw className={cn("w-4 h-4", messagesLoading && "animate-spin")} />
                    </Button>
                  </div>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 px-4 py-4">
                  <div className="space-y-3 max-w-3xl mx-auto">
                    <AnimatePresence mode="popLayout">
                      {messagesLoading ? (
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
                          className="flex flex-col items-center justify-center h-48 text-center"
                        >
                          <div className="p-4 rounded-full bg-slate-800 mb-3">
                            <MessageCircle className="w-8 h-8 text-slate-500" />
                          </div>
                          <p className="text-sm text-slate-400 font-medium">
                            Nenhuma mensagem ainda
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Envie a primeira mensagem</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-700/50 bg-slate-800/80">
                  <div className="flex gap-3 items-end max-w-3xl mx-auto">
                    {/* Video Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setVideoComposerOpen(true)}
                      disabled={!selectedPhone}
                      className="shrink-0 h-11 w-11 text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
                    >
                      <Video className="w-5 h-5" />
                    </Button>
                    <Textarea
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
                        <MessageCircle className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                  {sendMutation.isError && (
                    <p className="text-xs text-red-400 mt-2 text-center">
                      Erro ao enviar mensagem. Tente novamente.
                    </p>
                  )}

                  {/* Video Message Composer */}
                  <VideoMessageComposer
                    open={videoComposerOpen}
                    onOpenChange={setVideoComposerOpen}
                    phone={selectedPhone ?? ""}
                    leadId={selectedConversation?.leadId ?? undefined}
                    onSuccess={() => {
                      refetchMessages();
                      refetchConversations();
                    }}
                  />
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="p-6 rounded-full bg-slate-800/50 mb-4">
                  <MessageCircle className="w-12 h-12 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-200 mb-2">
                  Selecione uma conversa
                </h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  Escolha um contato da lista ao lado ou adicione um novo para começar a conversar
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ChatPage;
