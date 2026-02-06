/**
 * Chat Page - WhatsApp-style conversation interface
 * Full inbox layout with contact list and conversation view
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "wouter";
import type { ConversationItemData } from "@/components/chat/ConversationItem";
import type { MessageBubbleData, MessageReaction } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import type { RenderItem } from "@/components/chat/VirtualizedMessageList";
import DashboardLayout from "@/components/DashboardLayout";
import { useSSE } from "@/hooks/useSSE";
import {
  useWhatsAppConversations,
  useWhatsAppMessages,
  useWhatsAppProvider,
  useWhatsAppSendMessage,
} from "@/hooks/useWhatsAppProvider";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ChatConversationHeader,
  ChatPageHeader,
  ConversationSidebar,
  EmptyConversationState,
  InputArea,
  MessagesArea,
  MessagesEmptyState,
  NotConnectedState,
} from "./chat/ChatPageComponents";

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
  reactions?: {
    id: number;
    messageId: number;
    phone: string;
    emoji: string;
    createdAt: Date | string;
  }[];
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
    reactions: message.reactions?.reduce((acc: MessageReaction[], reaction) => {
      const existing = acc.find((r) => r.emoji === reaction.emoji);
      if (existing) {
        existing.count = (existing.count || 0) + 1;
        existing.users?.push(reaction.phone);
        // If needed, check if reactedByMe (requires current user phone context)
      } else {
        acc.push({
          emoji: reaction.emoji,
          count: 1,
          users: [reaction.phone],
          reactedByMe: false, // TODO: Check against current user phone
        });
      }
      return acc;
    }, []),
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

  // Get current mentorado
  const { data: mentorado } = trpc.mentorados.me.useQuery();

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
  } = useWhatsAppConversations(activeProvider, {
    refetchIntervalMs: false,
    enabled: !!mentorado?.id,
  });
  const {
    messages,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useWhatsAppMessages(activeProvider, selectedPhone, {
    refetchIntervalMs: false,
    enabled: !!mentorado?.id && !!selectedPhone,
  });

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
  const toggleAiMutation = trpc.aiAgent.toggleEnabled.useMutation();

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
    onReaction,
  } = useSSE({
    mentoradoId: mentorado?.id,
    phone: selectedPhone,
    enabled: Boolean(isAnyConnected) && !!mentorado?.id,
  });

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

  // Handle reaction events
  useEffect(() => {
    return onReaction((payload) => {
      const { messageId, type, reaction, reactionId } = payload;
      if (!messageId) return;

      // Find the message in current list or overrides
      // We rely on functional update of setMessageOverrides to get efficient state update
      setMessageOverrides((prev) => {
        // Find existing reactions from message list or previous overrides
        // Search in messages array first as base
        const baseMessage = messages?.find((m) => m.id === messageId);
        // If message is not in current view, we might still want to update if it appears?
        // For now, if it's not loaded, we can skip or try to update blindly if we trust ID.
        // But we need base reactions.
        const prevOverride = prev[messageId] || {};
        const currentReactions = prevOverride.reactions || baseMessage?.reactions || [];

        let newReactions = [...currentReactions];

        if (type === "reaction-added" && reaction) {
          // Add if not exists
          if (!newReactions.find((r) => r.id === reaction.id)) {
            newReactions.push({
              id: reaction.id,
              messageId: reaction.messageId,
              phone: reaction.phone,
              emoji: reaction.emoji,
              createdAt: new Date().toISOString(),
            });
          }
        } else if (type === "reaction-removed" && reactionId) {
          newReactions = newReactions.filter((r) => r.id !== reactionId);
        }

        return {
          ...prev,
          [messageId]: {
            ...prevOverride,
            reactions: newReactions,
          },
        };
      });
    });
  }, [onReaction, messages]);

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

  // Mark as read mutation
  const markAsReadMutation = trpc.whatsapp.markAsRead.useMutation();

  // Track which messages have already been marked as read to prevent duplicate calls
  const markedMessageIdsRef = useRef<Set<number>>(new Set());

  // Mark inbound messages as read when conversation is opened
  useEffect(() => {
    if (!selectedPhone || !mergedMessages.length) return;

    // Find all unread inbound messages that haven't been marked yet
    const unreadInboundMessages = mergedMessages.filter(
      (msg) =>
        msg.direction === "inbound" &&
        msg.status !== "read" &&
        !markedMessageIdsRef.current.has(msg.id)
    );

    // Mark each unread message as read
    for (const msg of unreadInboundMessages) {
      markedMessageIdsRef.current.add(msg.id);
      markAsReadMutation.mutate({ messageId: msg.id });
    }
  }, [selectedPhone, mergedMessages, markAsReadMutation]);

  // Clear marked messages when switching conversations
  useEffect(() => {
    if (selectedPhone) {
      markedMessageIdsRef.current.clear();
    }
  }, [selectedPhone]);

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

  const handleTypingTimeout = useCallback(() => {
    if (!selectedPhone) return;
    const normalized = normalizePhone(selectedPhone);
    setTypingByPhone((previous) => {
      if (!previous[normalized]) return previous;
      const next = { ...previous };
      delete next[normalized];
      return next;
    });
  }, [selectedPhone]);

  // Not connected state - check if ANY provider is connected
  if (!statusLoading && !isAnyConnected) {
    return (
      <DashboardLayout>
        <NotConnectedState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Page Header */}
        <ChatPageHeader
          conversationCount={conversations?.length ?? 0}
          isAiEnabled={isAiEnabled}
          onToggleAi={() => toggleAiMutation.mutate()}
          isToggling={toggleAiMutation.isPending}
        />

        {/* Main Content - Inbox Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Contact List Sidebar */}
          <ConversationSidebar
            conversations={conversationItems}
            selectedPhone={selectedPhone}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectConversation={(phone) => {
              setSelectedPhone(phone);
              setShowSidebar(false);
            }}
            isLoading={conversationsLoading}
            addContactOpen={addContactOpen}
            onAddContactOpenChange={setAddContactOpen}
            newContactPhone={newContactPhone}
            onNewContactPhoneChange={setNewContactPhone}
            newContactName={newContactName}
            onNewContactNameChange={setNewContactName}
            onAddContact={handleAddContact}
          />

          {/* Conversation View */}
          <div
            className={cn(
              "flex-1 flex flex-col bg-slate-900/30",
              selectedPhone ? "flex" : "hidden sm:flex"
            )}
          >
            {selectedPhone ? (
              <>
                {/* Chat Header */}
                <ChatConversationHeader
                  selectedPhone={selectedPhone}
                  contactName={selectedConversation?.name ?? null}
                  isOnline={
                    normalizedSelectedPhone
                      ? Boolean(presenceByPhone[normalizedSelectedPhone])
                      : false
                  }
                  isAiEnabled={isAiEnabled}
                  messagesLoading={messagesLoading}
                  onBack={() => {
                    setSelectedPhone(null);
                    setShowSidebar(true);
                  }}
                  onRefresh={refetchMessages}
                  editContactOpen={editContactOpen}
                  onEditContactOpenChange={setEditContactOpen}
                  editContactName={editContactName}
                  onEditContactNameChange={setEditContactName}
                  editContactNotes={editContactNotes}
                  onEditContactNotesChange={setEditContactNotes}
                  onSaveContact={handleSaveContact}
                  isSavingContact={upsertContactMutation.isPending}
                  onOpenEditContact={openEditContact}
                />

                {/* Messages Area */}
                <MessagesArea
                  renderItems={renderItems}
                  isLoading={messagesLoading}
                  shouldAutoScroll={shouldAutoScroll}
                  footer={
                    <TypingIndicator
                      isVisible={isSelectedTyping}
                      label="Contato digitando…"
                      lastActivityAt={selectedPhoneTyping?.at}
                      timeoutMs={TYPING_TIMEOUT_MS}
                      onTimeout={handleTypingTimeout}
                    />
                  }
                  emptyState={<MessagesEmptyState />}
                  showScrollToBottom={showScrollToBottom}
                  onScrollToBottom={() => {
                    setShouldAutoScroll(true);
                    scrollToBottom("smooth");
                  }}
                />

                {/* Input Area */}
                <InputArea
                  message={message}
                  onMessageChange={setMessage}
                  onSend={handleSend}
                  selectedPhone={selectedPhone}
                  isSending={sendMutation.isPending}
                  sendError={sendMutation.isError}
                  onTypingChange={handleTypingChange}
                  onAttachmentSelect={handleAttachmentSelect}
                  onEmojiSelect={handleEmojiSelect}
                  onAudioAction={handleAudioAction}
                  videoComposerOpen={videoComposerOpen}
                  onVideoComposerOpenChange={setVideoComposerOpen}
                  leadId={selectedConversation?.leadId ?? undefined}
                  onVideoSuccess={() => {
                    refetchMessages();
                    refetchConversations();
                  }}
                />
              </>
            ) : (
              <EmptyConversationState />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ChatPage;
