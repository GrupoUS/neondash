import { motion, AnimatePresence, Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { animations } from "@/lib/animation-variants";

interface AnimatedListProps<T> {
  items: T[];
  className?: string;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  initial?: string | boolean | object;
  animate?: string | boolean | object;
  exit?: string | boolean | object;
  variant?: keyof typeof animations | Variants;
  staggerDelay?: number;
  listClassName?: string;
  itemClassName?: string;
}

export function AnimatedList<T>({
  items,
  className,
  renderItem,
  keyExtractor,
  initial = "initial",
  animate = "animate",
  exit = "exit",
  variant = animations.slideUp,
  staggerDelay = 0.05,
  listClassName,
  itemClassName,
}: AnimatedListProps<T>) {
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariant = typeof variant === 'string' ? animations[variant as keyof typeof animations] : variant;

  return (
    <motion.div
      variants={containerVariants}
      initial={typeof initial === 'string' ? initial : (initial as any)}
      animate={typeof animate === 'string' ? animate : (animate as any)}
      className={cn("w-full", className, listClassName)}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            layout
            variants={itemVariant}
            initial={typeof initial === 'string' ? initial : (initial as any)}
            animate={typeof animate === 'string' ? animate : (animate as any)}
            exit={typeof exit === 'string' ? exit : (exit as any)}
            className={cn(itemClassName)}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
