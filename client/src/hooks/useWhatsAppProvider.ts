/**
 * useWhatsAppProvider - Custom hook for multi-provider WhatsApp support
 * Handles Meta, Baileys, and Z-API providers with priority logic
 */

import { trpc } from "@/lib/trpc";

export type WhatsAppProvider = "meta" | "baileys" | "zapi";

interface WhatsAppMessage {
  id: number;
  content: string | null;
  direction: string;
  createdAt: Date | null;
  status: string | null;
  isFromAi: string | null;
  [key: string]: unknown;
}

interface Conversation {
  phone: string;
  name: string | null;
  leadId: number | null;
  lastMessage: string | null;
  lastMessageAt: Date | string | null;
  unreadCount: number;
}

export function useWhatsAppProvider() {
  // Get status for all providers
  const { data: zapiStatus, isLoading: zapiStatusLoading } = trpc.zapi.getStatus.useQuery();
  const { data: metaStatus, isLoading: metaStatusLoading } = trpc.metaApi.getStatus.useQuery();
  const { data: baileysStatus, isLoading: baileysStatusLoading } =
    trpc.baileys.getStatus.useQuery();

  // Determine active provider (priority: Meta > Baileys > Z-API)
  const activeProvider: WhatsAppProvider | null = metaStatus?.connected
    ? "meta"
    : baileysStatus?.connected
      ? "baileys"
      : zapiStatus?.connected
        ? "zapi"
        : null;

  const isConnected = !!activeProvider;
  const isLoading = zapiStatusLoading || metaStatusLoading || baileysStatusLoading;

  return {
    activeProvider,
    isConnected,
    isLoading,
    zapiStatus,
    metaStatus,
    baileysStatus,
  };
}

export function useWhatsAppConversations(activeProvider: WhatsAppProvider | null) {
  const {
    data: zapiConversations,
    isLoading: zapiLoading,
    refetch: refetchZapi,
  } = trpc.zapi.getAllConversations.useQuery(undefined, {
    enabled: activeProvider === "zapi",
    refetchInterval: 10000,
  });

  const {
    data: metaConversations,
    isLoading: metaLoading,
    refetch: refetchMeta,
  } = trpc.metaApi.getAllConversations.useQuery(undefined, {
    enabled: activeProvider === "meta",
    refetchInterval: 10000,
  });

  const {
    data: baileysConversations,
    isLoading: baileysLoading,
    refetch: refetchBaileys,
  } = trpc.baileys.getAllConversations.useQuery(undefined, {
    enabled: activeProvider === "baileys",
    refetchInterval: 10000,
  });

  const conversations: Conversation[] | undefined =
    activeProvider === "meta"
      ? metaConversations
      : activeProvider === "baileys"
        ? baileysConversations
        : zapiConversations;

  const isLoading =
    activeProvider === "meta"
      ? metaLoading
      : activeProvider === "baileys"
        ? baileysLoading
        : zapiLoading;

  const refetch =
    activeProvider === "meta"
      ? refetchMeta
      : activeProvider === "baileys"
        ? refetchBaileys
        : refetchZapi;

  return { conversations, isLoading, refetch };
}

export function useWhatsAppMessages(activeProvider: WhatsAppProvider | null, phone: string | null) {
  const {
    data: zapiMessages,
    isLoading: zapiLoading,
    refetch: refetchZapi,
  } = trpc.zapi.getMessagesByPhone.useQuery(
    { phone: phone ?? "" },
    { enabled: !!phone && activeProvider === "zapi", refetchInterval: 5000 }
  );

  const {
    data: metaMessages,
    isLoading: metaLoading,
    refetch: refetchMeta,
  } = trpc.metaApi.getMessagesByPhone.useQuery(
    { phone: phone ?? "" },
    { enabled: !!phone && activeProvider === "meta", refetchInterval: 5000 }
  );

  const {
    data: baileysMessages,
    isLoading: baileysLoading,
    refetch: refetchBaileys,
  } = trpc.baileys.getMessagesByPhone.useQuery(
    { phone: phone ?? "" },
    { enabled: !!phone && activeProvider === "baileys", refetchInterval: 5000 }
  );

  const messages: WhatsAppMessage[] | undefined =
    activeProvider === "meta"
      ? metaMessages
      : activeProvider === "baileys"
        ? baileysMessages
        : zapiMessages;

  const isLoading =
    activeProvider === "meta"
      ? metaLoading
      : activeProvider === "baileys"
        ? baileysLoading
        : zapiLoading;

  const refetch =
    activeProvider === "meta"
      ? refetchMeta
      : activeProvider === "baileys"
        ? refetchBaileys
        : refetchZapi;

  return { messages, isLoading, refetch };
}

export function useWhatsAppSendMessage(
  activeProvider: WhatsAppProvider | null,
  onSuccess: () => void
) {
  const zapiMutation = trpc.zapi.sendMessage.useMutation({ onSuccess });
  const metaMutation = trpc.metaApi.sendMessage.useMutation({ onSuccess });
  const baileysMutation = trpc.baileys.sendMessage.useMutation({ onSuccess });

  const mutation =
    activeProvider === "meta"
      ? metaMutation
      : activeProvider === "baileys"
        ? baileysMutation
        : zapiMutation;

  return mutation;
}
