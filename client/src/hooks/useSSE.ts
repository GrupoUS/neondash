import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type ChatSSEEventName =
  | "connected"
  | "new-message"
  | "message-read"
  | "typing-start"
  | "typing-stop"
  | "contact-online"
  | "contact-offline";

interface BaseSSEPayload {
  phone?: string;
}

export interface ChatSSEConnectedPayload {
  mentoradoId: number;
}

export interface ChatSSENewMessagePayload extends BaseSSEPayload {
  id?: number;
  leadId?: number | null;
  direction?: "inbound" | "outbound";
  content?: string;
  status?: string;
  mediaType?: string | null;
  mediaUrl?: string | null;
  quotedMessageId?: number | null;
  senderName?: string;
  createdAt?: string;
}

export interface ChatSSEMessageReadPayload extends BaseSSEPayload {
  messageId?: number;
  zapiMessageId?: string;
  status?: "read" | "sent" | "delivered" | "failed";
  readAt?: string | Date | null;
}

export interface ChatSSETypingPayload extends BaseSSEPayload {
  isTyping?: boolean;
  at?: string;
  provider?: "meta" | "baileys" | "zapi";
}

export interface ChatSSEPresencePayload extends BaseSSEPayload {
  isOnline?: boolean;
  lastSeen?: string | null;
}

export interface ChatSSEPayloadMap {
  connected: ChatSSEConnectedPayload;
  "new-message": ChatSSENewMessagePayload;
  "message-read": ChatSSEMessageReadPayload;
  "typing-start": ChatSSETypingPayload;
  "typing-stop": ChatSSETypingPayload;
  "contact-online": ChatSSEPresencePayload;
  "contact-offline": ChatSSEPresencePayload;
}

type EventHandlerMap = {
  [K in ChatSSEEventName]: Set<(payload: ChatSSEPayloadMap[K]) => void>;
};

export interface UseSSEOptions {
  mentoradoId?: number | null;
  phone?: string | null;
  enabled?: boolean;
  reconnectInitialDelayMs?: number;
  reconnectMaxDelayMs?: number;
  reconnectBackoffMultiplier?: number;
}

export interface UseSSEReturn {
  isConnected: boolean;
  reconnectAttempt: number;
  lastError: string | null;
  subscribe: <K extends ChatSSEEventName>(
    eventName: K,
    callback: (payload: ChatSSEPayloadMap[K]) => void
  ) => () => void;
  onConnected: (callback: (payload: ChatSSEPayloadMap["connected"]) => void) => () => void;
  onNewMessage: (callback: (payload: ChatSSEPayloadMap["new-message"]) => void) => () => void;
  onMessageRead: (callback: (payload: ChatSSEPayloadMap["message-read"]) => void) => () => void;
  onTypingStart: (callback: (payload: ChatSSEPayloadMap["typing-start"]) => void) => () => void;
  onTypingStop: (callback: (payload: ChatSSEPayloadMap["typing-stop"]) => void) => () => void;
  onContactOnline: (callback: (payload: ChatSSEPayloadMap["contact-online"]) => void) => () => void;
  onContactOffline: (
    callback: (payload: ChatSSEPayloadMap["contact-offline"]) => void
  ) => () => void;
}

const DEFAULT_EVENTS: ChatSSEEventName[] = [
  "connected",
  "new-message",
  "message-read",
  "typing-start",
  "typing-stop",
  "contact-online",
  "contact-offline",
];

function createEventHandlerMap(): EventHandlerMap {
  return {
    connected: new Set(),
    "new-message": new Set(),
    "message-read": new Set(),
    "typing-start": new Set(),
    "typing-stop": new Set(),
    "contact-online": new Set(),
    "contact-offline": new Set(),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizePayload<K extends ChatSSEEventName>(
  eventName: K,
  raw: unknown
): ChatSSEPayloadMap[K] {
  if (!isObject(raw)) {
    if (eventName === "connected") {
      return { mentoradoId: -1 } as ChatSSEPayloadMap[K];
    }
    return {} as ChatSSEPayloadMap[K];
  }

  return raw as unknown as ChatSSEPayloadMap[K];
}

export function useSSE({
  mentoradoId,
  phone,
  enabled = true,
  reconnectInitialDelayMs = 1_000,
  reconnectMaxDelayMs = 15_000,
  reconnectBackoffMultiplier = 1.8,
}: UseSSEOptions = {}): UseSSEReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const handlersRef = useRef<EventHandlerMap>(createEventHandlerMap());
  const shouldReconnectRef = useRef(true);

  const isEnabled = enabled && Boolean(mentoradoId);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();

    if (phone && phone.trim().length > 0) {
      params.set("phone", phone.trim());
    }

    const query = params.toString();
    return query.length > 0 ? `/api/chat/events?${query}` : "/api/chat/events";
  }, [phone]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const closeConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const emit = useCallback(
    <K extends ChatSSEEventName>(eventName: K, payload: ChatSSEPayloadMap[K]) => {
      const handlers = handlersRef.current[eventName];

      for (const handler of handlers) {
        handler(payload);
      }
    },
    []
  );

  const subscribe = useCallback(
    <K extends ChatSSEEventName>(
      eventName: K,
      callback: (payload: ChatSSEPayloadMap[K]) => void
    ): (() => void) => {
      const eventHandlers = handlersRef.current[eventName] as Set<
        (payload: ChatSSEPayloadMap[K]) => void
      >;
      eventHandlers.add(callback);

      return () => {
        eventHandlers.delete(callback);
      };
    },
    []
  );

  const connect = useCallback(() => {
    if (!isEnabled || !shouldReconnectRef.current) {
      return;
    }

    closeConnection();

    const source = new EventSource(endpoint, { withCredentials: true });
    eventSourceRef.current = source;

    source.onopen = () => {
      setIsConnected(true);
      setReconnectAttempt(0);
      setLastError(null);
    };

    source.onerror = () => {
      setIsConnected(false);
      setLastError("SSE connection error");
      closeConnection();

      if (!shouldReconnectRef.current) {
        return;
      }

      setReconnectAttempt((previous) => {
        const nextAttempt = previous + 1;
        const nextDelay = Math.min(
          reconnectInitialDelayMs * reconnectBackoffMultiplier ** previous,
          reconnectMaxDelayMs
        );

        clearReconnectTimer();
        reconnectTimerRef.current = window.setTimeout(() => {
          connect();
        }, nextDelay);

        return nextAttempt;
      });
    };

    for (const eventName of DEFAULT_EVENTS) {
      source.addEventListener(eventName, (event) => {
        const parsed = (() => {
          try {
            return JSON.parse((event as MessageEvent).data);
          } catch {
            return null;
          }
        })();

        if (parsed === null) {
          return;
        }

        const payload = normalizePayload(eventName, parsed);
        emit(eventName, payload);
      });
    }
  }, [
    clearReconnectTimer,
    closeConnection,
    emit,
    endpoint,
    isEnabled,
    reconnectBackoffMultiplier,
    reconnectInitialDelayMs,
    reconnectMaxDelayMs,
  ]);

  useEffect(() => {
    shouldReconnectRef.current = true;

    if (!isEnabled) {
      closeConnection();
      clearReconnectTimer();
      setIsConnected(false);
      return () => {
        shouldReconnectRef.current = false;
      };
    }

    connect();

    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimer();
      closeConnection();
      setIsConnected(false);
    };
  }, [clearReconnectTimer, closeConnection, connect, isEnabled]);

  return {
    isConnected,
    reconnectAttempt,
    lastError,
    subscribe,
    onConnected: (callback) => subscribe("connected", callback),
    onNewMessage: (callback) => subscribe("new-message", callback),
    onMessageRead: (callback) => subscribe("message-read", callback),
    onTypingStart: (callback) => subscribe("typing-start", callback),
    onTypingStop: (callback) => subscribe("typing-stop", callback),
    onContactOnline: (callback) => subscribe("contact-online", callback),
    onContactOffline: (callback) => subscribe("contact-offline", callback),
  };
}
