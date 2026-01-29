import * as React from "react";
import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AnimatedAvatarGroupProps {
  avatars: {
    src?: string;
    fallback: string;
    alt?: string;
  }[];
  max?: number;
  className?: string;
}

export function AnimatedAvatarGroup({
  avatars,
  max = 4,
  className,
}: AnimatedAvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn("flex items-center -space-x-4", className)}>
      {visibleAvatars.map((avatar, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            delay: index * 0.1,
          }}
          whileHover={{
            scale: 1.1,
            zIndex: 10,
            transition: { duration: 0.2 },
          }}
          className="relative z-0 ring-2 ring-background rounded-full transition-all"
          style={{ zIndex: visibleAvatars.length - index }}
        >
          <Avatar>
            <AvatarImage src={avatar.src} alt={avatar.alt} />
            <AvatarFallback>{avatar.fallback}</AvatarFallback>
          </Avatar>
        </motion.div>
      ))}
      {remaining > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: visibleAvatars.length * 0.1 }}
          className="relative z-0"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground text-xs font-medium ring-2 ring-background hover:bg-muted/80 transition-colors">
            +{remaining}
          </div>
        </motion.div>
      )}
    </div>
  );
}
