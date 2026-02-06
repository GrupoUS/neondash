import { Skeleton } from "@/components/ui/skeleton";

interface MessageSkeletonProps {
  count?: number;
}

/**
 * Skeleton loading placeholder for message bubbles
 */
export function MessageSkeleton({ count = 4 }: MessageSkeletonProps) {
  return (
    <div className="space-y-4 max-w-3xl mx-auto py-4">
      {Array.from({ length: count }).map((_, i) => {
        // Alternate between left (received) and right (sent) alignment
        const isOutbound = i % 2 === 1;

        return (
          <div
            key={`msg-skeleton-${String(i)}`}
            className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <div className={`space-y-2 ${isOutbound ? "items-end" : "items-start"} flex flex-col`}>
              <Skeleton
                className={`h-12 rounded-xl ${
                  isOutbound ? "w-48 bg-emerald-500/20" : "w-56 bg-slate-600/30"
                }`}
              />
              <Skeleton className="h-2 w-12" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MessageSkeleton;
