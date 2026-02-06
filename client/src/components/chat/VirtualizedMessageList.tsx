import React from "react";
import type { VirtuosoHandle } from "react-virtuoso";
import { Virtuoso } from "react-virtuoso";
import { DateSeparator } from "@/components/chat/DateSeparator";
import { MessageBubble, type MessageBubbleData } from "@/components/chat/MessageBubble";
import { cn } from "@/lib/utils";

export interface RenderMessageItem {
  type: "message";
  key: string;
  message: MessageBubbleData;
}

export interface RenderDateItem {
  type: "date";
  key: string;
  date: Date | string;
}

export type RenderItem = RenderMessageItem | RenderDateItem;

export interface VirtualizedMessageListHandle {
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

export interface VirtualizedMessageListProps {
  /** Array of message and date separator items to render */
  items: RenderItem[];
  /** Optional ref for imperative access to the virtuoso instance */
  virtuosoRef?: React.RefObject<VirtuosoHandle>;
  /** Callback when user scrolls near the top (for loading older messages) */
  onLoadMore?: () => void | Promise<void>;
  /** Whether currently loading older messages */
  isLoadingMore?: boolean;
  /** Whether the list is initially loading */
  isLoading?: boolean;
  /** Optional custom class name for the container */
  className?: string;
  /** Optional custom class name for the scroll area */
  scrollClassName?: string;
  /** Optional callback when scroll position changes */
  onScroll?: (event: { scrollTop: number; scrollHeight: number; clientHeight: number }) => void;
  /** Whether to auto-scroll to bottom when new messages arrive */
  autoScrollToBottom?: boolean;
  /** Optional custom footer element (e.g., typing indicator) */
  footer?: React.ReactNode;
  /** Optional custom header element (e.g., loading indicator) */
  header?: React.ReactNode;
  /** Optional custom empty state */
  emptyState?: React.ReactNode;
  /** Optional message bubble action handlers */
  onReply?: (messageId: number) => void;
  onReact?: (messageId: number) => void;
  onCopy?: (messageId: number) => void;
  onDelete?: (messageId: number) => void;
}

export function VirtualizedMessageList({
  items,
  virtuosoRef,
  onLoadMore,
  isLoadingMore = false,
  isLoading = false,
  className,
  scrollClassName,
  onScroll,
  autoScrollToBottom = true,
  footer,
  header,
  emptyState,
  onReply,
  onReact,
  onCopy,
  onDelete,
}: VirtualizedMessageListProps) {
  const internalRef = React.useRef<VirtuosoHandle>(null);

  // Use the external ref if provided, otherwise use internal ref
  const virtuoso = virtuosoRef ?? internalRef;

  // Scroll to bottom when items change and autoScroll is enabled
  React.useEffect(() => {
    if (autoScrollToBottom && items.length > 0 && !isLoadingMore) {
      virtuoso.current?.scrollToIndex({ index: items.length - 1, behavior: "smooth" });
    }
  }, [items.length, autoScrollToBottom, isLoadingMore, virtuoso]);

  // Handle scroll events - converts React UIEvent to custom event type for our onScroll prop
  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      onScroll?.({
        scrollTop: target.scrollTop,
        scrollHeight: target.scrollHeight,
        clientHeight: target.clientHeight,
      });
    },
    [onScroll]
  );

  // Handle loading more messages when scrolling near top
  const handleStartReached = React.useCallback(() => {
    if (onLoadMore && !isLoadingMore && !isLoading) {
      onLoadMore();
    }
  }, [onLoadMore, isLoadingMore, isLoading]);

  // Render individual item
  const renderItem = React.useCallback(
    (_index: number, item: RenderItem) => {
      if (item.type === "date") {
        return <DateSeparator key={item.key} date={item.date} />;
      }

      return (
        <MessageBubble
          key={item.key}
          message={item.message}
          onReply={onReply ? () => onReply(item.message.id) : undefined}
          onReact={onReact ? () => onReact(item.message.id) : undefined}
          onCopy={onCopy ? () => onCopy(item.message.id) : undefined}
          onDelete={onDelete ? () => onDelete(item.message.id) : undefined}
        />
      );
    },
    [onReply, onReact, onCopy, onDelete]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex-1 flex items-center justify-center", className)}>
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          <span className="text-sm">Carregando mensagens...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={cn("flex-1 flex items-center justify-center", className)}>
        {emptyState || (
          <div className="text-center text-muted-foreground">
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm">Envie uma mensagem para começar</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <Virtuoso
      ref={virtuoso}
      data={items}
      itemContent={renderItem}
      startReached={onLoadMore ? handleStartReached : undefined}
      endReached={undefined}
      overscan={200}
      increaseViewportBy={{ top: 200, bottom: 200 }}
      onScroll={handleScroll}
      className={cn("h-full", scrollClassName)}
      components={{
        Header: header ? () => <div className="py-2">{header}</div> : undefined,
        Footer: footer ? () => <div className="py-2">{footer}</div> : undefined,
        ScrollSeekPlaceholder: () => <div className="h-16 bg-muted/20 rounded-lg animate-pulse" />,
      }}
      scrollSeekConfiguration={{
        enter: (velocity: number) => Math.abs(velocity) > 200,
        exit: (velocity: number) => Math.abs(velocity) < 50,
      }}
    />
  );
}

// Export types for external use
export type { VirtuosoHandle };
export default VirtualizedMessageList;
