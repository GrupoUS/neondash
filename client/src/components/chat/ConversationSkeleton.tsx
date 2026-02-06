import { Skeleton } from "@/components/ui/skeleton";

interface ConversationSkeletonProps {
  count?: number;
}

/**
 * Skeleton loading placeholder for conversation list items
 */
export function ConversationSkeleton({ count = 5 }: ConversationSkeletonProps) {
  return (
    <div className="py-2 space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`conv-skeleton-${String(i)}`}
          className="px-4 py-3 flex items-center gap-3"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {/* Avatar */}
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-3 w-full max-w-[180px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ConversationSkeleton;
