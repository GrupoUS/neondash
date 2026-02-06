/**
 * Chat Page - WhatsApp-style conversation interface
 * Full inbox layout with contact list and conversation view
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { ConversationItem, type ConversationItemData } from "@/components/chat/ConversationItem";
import { ConversationSkeleton } from "@/components/chat/ConversationSkeleton";
import type { MessageBubbleData } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageSkeleton } from "@/components/chat/MessageSkeleton";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { VideoMessageComposer } from "@/components/chat/VideoMessageComposer";
import { type RenderItem, VirtualizedMessageList } from "@/components/chat/VirtualizedMessageList";
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
import { useSSE } from "@/hooks/useSSE";
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
  profileThumbnail?: string | null;
}

type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";

interface WhatsAppMessage {
  id: number;
  mentoradoId: number;
  leadId: number | null;
  phone: string;
  direction: "inbound" | "outbound";
  content: string;
  zapiMessageId: string | null;
  status: MessageStatus;
  isFromAi: "sim" | "nao" | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  mediaThumbnail?: string | null;
  mediaSize?: number | null;
  quotedMessageId?: number | null;
  createdAt: Date | string;
  readAt?: Date | string | null;
}

type TypingState = Record<string, { isTyping: boolean; at: number }>;
type PresenceState = Record<string, boolean>;

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

function phonesMatch(left: string, right: string): boolean {
  const a = normalizePhone(left);
  const b = normalizePhone(right);
  return a === b || (a.length >= 8 && b.length >= 8 && a.slice(-8) === b.slice(-8));
}

function ensureStatus(value: string | null | undefined): MessageStatus {
  switch (value) {
    case "pending":
    case "sent":
    case "delivered":
    case "read":
    case "failed":
      return value;
    default:
      return "pending";
  }
}

function mediaTypeFromRaw(
  type: string | null | undefined
): "image" | "audio" | "video" | "file" | null {
  if (!type) return null;
  const normalized = type.toLowerCase();

  if (normalized.includes("image") || normalized.includes("foto")) return "image";
  if (normalized.includes("audio") || normalized.includes("voice")) return "audio";
  if (normalized.includes("video")) return "video";
  if (normalized.includes("document") || normalized.includes("file")) return "file";

  return "file";
}

function mapMessageToBubble(message: WhatsAppMessage): MessageBubbleData {
  const type = mediaTypeFromRaw(message.mediaType);

  return {
    id: message.id,
    direction: message.direction,
    content: message.content ?? "",
    createdAt: message.createdAt,
    status: ensureStatus(message.status),
    isFromAi: message.isFromAi,
    media:
      type && (message.mediaUrl || message.mediaThumbnail || message.mediaSize)
        ? {
            type,
            url: message.mediaUrl ?? null,
            thumbnailUrl: message.mediaThumbnail ?? null,
            sizeBytes: message.mediaSize ?? null,
          }
        : null,
    quote: null,
    reactions: undefined,
  };
}

function dayKey(value: Date | string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "invalid";
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

const TYPING_TIMEOUT_MS = 4500;

export function ChatPage() {
  const search = useSearch();
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [videoComposerOpen, setVideoComposerOpen] = useState(false);
  const [_showSidebar, setShowSidebar] = useState(true);

  // Parse query params for initial phone/lead selection
  const queryParams = useMemo(() => new URLSearchParams(search), [search]);
  const initialPhone = queryParams.get("phone");
  const initialLeadId = queryParams.get("leadId");

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
  } = useWhatsAppConversations(activeProvider, { refetchIntervalMs: false });
  const {
    messages,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useWhatsAppMessages(activeProvider, selectedPhone, { refetchIntervalMs: false });

  // Auto-select conversation from query params
  useEffect(() => {
    if (!conversations || conversations.length === 0) return;

    // If phone param provided, try to find matching conversation
    if (initialPhone && !selectedPhone) {
      const match = conversations.find((c: Conversation) => phonesMatch(c.phone, initialPhone));
      if (match) {
        setSelectedPhone(match.phone);
      } else {
        // If no existing conversation, set the phone for new conversation
        setSelectedPhone(initialPhone);
      }
    }

    // If leadId param provided without phone, find by leadId
    if (initialLeadId && !initialPhone && !selectedPhone) {
      const leadIdNum = parseInt(initialLeadId, 10);
      const match = conversations.find((c: Conversation) => c.leadId === leadIdNum);
      if (match) {
        setSelectedPhone(match.phone);
      }
    }
  }, [conversations, initialPhone, initialLeadId, selectedPhone]);

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

  const [typingByPhone, setTypingByPhone] = useState<TypingState>({});
  const [presenceByPhone, setPresenceByPhone] = useState<PresenceState>({});
  const [messageOverrides, setMessageOverrides] = useState<
    Record<number, Partial<WhatsAppMessage>>
  >({});
  const [pendingNewMessagesByPhone, setPendingNewMessagesByPhone] = useState<
    Record<string, MessageBubbleData[]>
  >({});

  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showScrollToBottom, _setShowScrollToBottom] = useState(false);

  const {
    onNewMessage,
    onMessageRead,
    onTypingStart,
    onTypingStop,
    onContactOnline,
    onContactOffline,
  } = useSSE({ enabled: Boolean(isAnyConnected) });

  const selectedConversationLeadId = useMemo(() => {
    if (!selectedPhone || !conversations) return null;
    const found = (conversations as Conversation[]).find(
      (conversation) => conversation.phone === selectedPhone
    );
    return found?.leadId ?? null;
  }, [conversations, selectedPhone]);

  const mergedMessages = useMemo<WhatsAppMessage[]>(() => {
    const safeMessages = ((messages as WhatsAppMessage[] | undefined) ?? []).map((msg) => {
      const override = messageOverrides[msg.id];
      return override ? { ...msg, ...override } : msg;
    });

    const pendings = selectedPhone ? (pendingNewMessagesByPhone[selectedPhone] ?? []) : [];
    if (pendings.length === 0) return safeMessages;

    const minNegativeId = safeMessages.reduce(
      (current, item) => Math.min(current, Number(item.id) || 0),
      0
    );

    const pendingAsMessages: WhatsAppMessage[] = pendings.map((pending, index) => {
      const fallbackId = minNegativeId - index - 1;

      return {
        id: Number.isFinite(pending.id) ? pending.id : fallbackId,
        mentoradoId: -1,
        leadId: selectedConversationLeadId,
        phone: selectedPhone ?? "",
        direction: pending.direction,
        content: pending.content,
        zapiMessageId: null,
        status: pending.status,
        isFromAi: pending.isFromAi ?? null,
        mediaType: pending.media?.type ?? null,
        mediaUrl: pending.media?.url ?? null,
        mediaThumbnail: pending.media?.thumbnailUrl ?? null,
        mediaSize: pending.media?.sizeBytes ?? null,
        quotedMessageId: pending.quote?.messageId ?? null,
        createdAt: pending.createdAt,
        readAt: null,
      };
    });

    return [...safeMessages, ...pendingAsMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [
    messages,
    messageOverrides,
    pendingNewMessagesByPhone,
    selectedConversationLeadId,
    selectedPhone,
  ]);

  const renderItems = useMemo<RenderItem[]>(() => {
    const items: RenderItem[] = [];
    let previousDay = "";

    for (const rawMessage of mergedMessages) {
      const bubble = mapMessageToBubble(rawMessage);
      const keyDay = dayKey(bubble.createdAt);

      if (previousDay !== keyDay) {
        previousDay = keyDay;
        items.push({
          type: "date",
          key: `date-${keyDay}-${bubble.id}`,
          date: bubble.createdAt,
        });
      }

      items.push({
        type: "message",
        key: `message-${bubble.id}`,
        message: bubble,
      });
    }

    return items;
  }, [mergedMessages]);

  const normalizedSelectedPhone = selectedPhone ? normalizePhone(selectedPhone) : null;
  const selectedPhoneTyping = normalizedSelectedPhone
    ? (typingByPhone[normalizedSelectedPhone] ?? typingByPhone[selectedPhone ?? ""])
    : undefined;
  const isSelectedTyping = Boolean(
    selectedPhoneTyping?.isTyping && Date.now() - selectedPhoneTyping.at < TYPING_TIMEOUT_MS
  );

  const conversationItems = useMemo<ConversationItemData[]>(() => {
    return (
      (conversations as Conversation[] | undefined)?.map((conversation) => {
        const normalizedPhone = normalizePhone(conversation.phone);
        const typing = typingByPhone[normalizedPhone] ?? typingByPhone[conversation.phone];
        const online = presenceByPhone[normalizedPhone] ?? presenceByPhone[conversation.phone];

        return {
          phone: conversation.phone,
          name: conversation.name,
          avatarUrl: conversation.profileThumbnail ?? null,
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount: conversation.unreadCount,
          isOnline: Boolean(online),
          isTyping: Boolean(typing?.isTyping && Date.now() - typing.at < TYPING_TIMEOUT_MS),
        };
      }) ?? []
    );
  }, [conversations, presenceByPhone, typingByPhone]);

  // Get selected conversation data
  const selectedConversation = conversations?.find((c: Conversation) => c.phone === selectedPhone);

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

  useEffect(() => {
    if (!selectedPhone) return;

    const normalized = normalizePhone(selectedPhone);
    setTypingByPhone((previous) => {
      if (!previous[normalized]) return previous;
      const next = { ...previous };
      delete next[normalized];
      return next;
    });

    setPendingNewMessagesByPhone((previous) => {
      if (!previous[normalized] && !previous[selectedPhone]) return previous;
      const next = { ...previous };
      delete next[normalized];
      delete next[selectedPhone];
      return next;
    });
  }, [selectedPhone]);

  useEffect(() => {
    if (!selectedPhone) return;

    const normalizedSelected = normalizePhone(selectedPhone);

    const unsubscribeNewMessage = onNewMessage((payload) => {
      if (!payload.phone || (payload.direction !== "inbound" && payload.direction !== "outbound"))
        return;

      const payloadPhone = normalizePhone(payload.phone);
      const isCurrentConversation =
        payloadPhone === normalizedSelected || phonesMatch(payload.phone, selectedPhone);

      if (!isCurrentConversation) {
        refetchConversations();
        return;
      }

      const incomingMessage: MessageBubbleData = {
        id: Number(payload.id ?? Date.now()),
        direction: payload.direction,
        content: payload.content ?? "",
        createdAt: payload.createdAt ?? new Date().toISOString(),
        status: ensureStatus(payload.status),
        media: payload.mediaType
          ? {
              type: mediaTypeFromRaw(payload.mediaType) ?? "file",
              url: payload.mediaUrl ?? null,
            }
          : null,
      };

      setPendingNewMessagesByPhone((previous) => {
        const key = payloadPhone;
        const existing = previous[key] ?? [];

        const alreadyExists = existing.some((item) => item.id === incomingMessage.id);
        if (alreadyExists) return previous;

        return {
          ...previous,
          [key]: [...existing, incomingMessage],
        };
      });

      refetchMessages();
      refetchConversations();

      setTypingByPhone((previous) => {
        if (!previous[payloadPhone]) return previous;
        const next = { ...previous };
        delete next[payloadPhone];
        return next;
      });
    });

    const unsubscribeMessageRead = onMessageRead((payload) => {
      if (!payload.messageId) return;

      setMessageOverrides((previous) => ({
        ...previous,
        [payload.messageId as number]: {
          status: ensureStatus(payload.status ?? "read"),
          readAt: payload.readAt ? new Date(payload.readAt) : new Date(),
        },
      }));
    });

    const unsubscribeTypingStart = onTypingStart((payload) => {
      if (!payload.phone) return;

      const payloadPhone = normalizePhone(payload.phone);
      const isCurrentConversation =
        payloadPhone === normalizedSelected || phonesMatch(payload.phone, selectedPhone);
      if (!isCurrentConversation) return;

      setTypingByPhone((previous) => ({
        ...previous,
        [payloadPhone]: {
          isTyping: true,
          at: payload.at ? new Date(payload.at).getTime() : Date.now(),
        },
      }));
    });

    const unsubscribeTypingStop = onTypingStop((payload) => {
      if (!payload.phone) return;
      const payloadPhone = normalizePhone(payload.phone);

      setTypingByPhone((previous) => {
        if (!previous[payloadPhone]) return previous;
        const next = { ...previous };
        delete next[payloadPhone];
        return next;
      });
    });

    const unsubscribeContactOnline = onContactOnline((payload) => {
      if (!payload.phone) return;
      const payloadPhone = normalizePhone(payload.phone);
      setPresenceByPhone((previous) => ({
        ...previous,
        [payloadPhone]: true,
      }));
    });

    const unsubscribeContactOffline = onContactOffline((payload) => {
      if (!payload.phone) return;
      const payloadPhone = normalizePhone(payload.phone);
      setPresenceByPhone((previous) => ({
        ...previous,
        [payloadPhone]: false,
      }));
    });

    return () => {
      unsubscribeNewMessage();
      unsubscribeMessageRead();
      unsubscribeTypingStart();
      unsubscribeTypingStop();
      unsubscribeContactOnline();
      unsubscribeContactOffline();
    };
  }, [
    onContactOffline,
    onContactOnline,
    onMessageRead,
    onNewMessage,
    onTypingStart,
    onTypingStop,
    refetchConversations,
    refetchMessages,
    selectedPhone,
  ]);

  const scrollToBottom = useCallback((_behavior: ScrollBehavior = "smooth") => {
    // VirtualizedMessageList handles scrolling internally via autoScrollToBottom prop
    setShouldAutoScroll(true);
  }, []);

  const messageCount = mergedMessages.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally trigger only on message count change
  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom("smooth");
    }
  }, [messageCount, shouldAutoScroll, scrollToBottom]);

  const handleTypingChange = useCallback(() => {
    // Front-only typing UX in this phase; backend sendTyping mutation can be wired in next phase.
  }, []);

  const handleAttachmentSelect = useCallback(() => {
    // Placeholder for Phase 4 media upload.
  }, []);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessage((previous) => `${previous}${emoji}`);
  }, []);

  const handleAudioAction = useCallback(() => {
    // Placeholder for audio recording in future phase.
  }, []);

  // Filter conversations by search
  const filteredConversationItems = conversationItems.filter((conv) => {
    if (!searchQuery) return true;
    const nameMatch = conv.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = conv.phone.includes(searchQuery);
    return nameMatch || phoneMatch;
  });

  const handleSend = () => {
    if (!message.trim() || sendMutation.isPending || !selectedPhone) return;

    const leadId = selectedConversation?.leadId ?? undefined;
    sendMutation.mutate({
      phone: selectedPhone,
      message: message.trim(),
      ...(leadId && { leadId }),
    });
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
          {/* Contact List Sidebar - Hidden on mobile when conversation selected */}
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
                <ConversationSkeleton count={5} />
              ) : filteredConversationItems.length > 0 ? (
                <div className="py-2">
                  {filteredConversationItems.map((conv) => (
                    <ConversationItem
                      key={conv.phone}
                      conversation={conv}
                      isSelected={selectedPhone === conv.phone}
                      onClick={(phone) => {
                        setSelectedPhone(phone);
                        setShowSidebar(false);
                      }}
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

          {/* Conversation View - Full width on mobile when selected */}
          <div
            className={cn(
              "flex-1 flex flex-col bg-slate-900/30",
              selectedPhone ? "flex" : "hidden sm:flex"
            )}
          >
            {selectedPhone ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-700/50 bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    {/* Back button for mobile */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedPhone(null);
                        setShowSidebar(true);
                      }}
                      className="sm:hidden text-slate-400 hover:text-slate-100"
                      aria-label="Voltar para lista de conversas"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center ring-2 ring-emerald-500/30">
                      <MessageCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-100">
                        {selectedConversation?.name || selectedPhone}
                      </h4>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-400 font-medium">{selectedPhone}</p>
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            normalizedSelectedPhone
                              ? presenceByPhone[normalizedSelectedPhone]
                                ? "bg-emerald-500"
                                : "bg-slate-500"
                              : "bg-slate-500"
                          )}
                          aria-hidden="true"
                          title={
                            normalizedSelectedPhone && presenceByPhone[normalizedSelectedPhone]
                              ? "Contato online"
                              : "Contato offline"
                          }
                        />
                      </div>
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
                <div className="flex-1 px-4 py-4 relative">
                  <div className="h-full max-w-3xl mx-auto">
                    {messagesLoading ? (
                      <div className="flex flex-col items-center justify-center h-48">
                        <MessageSkeleton count={4} />
                      </div>
                    ) : (
                      <VirtualizedMessageList
                        items={renderItems}
                        isLoading={messagesLoading}
                        autoScrollToBottom={shouldAutoScroll}
                        footer={
                          <TypingIndicator
                            isVisible={isSelectedTyping}
                            label="Contato digitando…"
                            lastActivityAt={selectedPhoneTyping?.at}
                            timeoutMs={TYPING_TIMEOUT_MS}
                            onTimeout={() => {
                              if (!selectedPhone) return;
                              const normalized = normalizePhone(selectedPhone);
                              setTypingByPhone((previous) => {
                                if (!previous[normalized]) return previous;
                                const next = { ...previous };
                                delete next[normalized];
                                return next;
                              });
                            }}
                          />
                        }
                        emptyState={
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
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
                        }
                      />
                    )}
                  </div>
                  {showScrollToBottom ? (
                    <div className="pointer-events-none absolute bottom-4 right-4">
                      <Button
                        type="button"
                        size="icon"
                        className="pointer-events-auto rounded-full shadow-lg"
                        onClick={() => {
                          setShouldAutoScroll(true);
                          scrollToBottom("smooth");
                        }}
                        aria-label="Ir para o fim da conversa"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                </div>

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

                    <MessageInput
                      value={message}
                      onChange={setMessage}
                      onSend={handleSend}
                      onTypingChange={handleTypingChange}
                      onAttachmentSelect={handleAttachmentSelect}
                      onEmojiSelect={handleEmojiSelect}
                      onAudioAction={handleAudioAction}
                      disabled={sendMutation.isPending || !selectedPhone}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 rounded-md border-slate-600/50 bg-slate-700/50"
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
