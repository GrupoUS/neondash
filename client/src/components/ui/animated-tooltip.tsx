import React, { useState } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "motion/react";
import { cn } from "@/lib/utils";

export const AnimatedTooltip = ({
  items,
  className,
}: {
  items: {
    id: number;
    name: string;
    designation: string;
    image: string;
  }[];
  className?: string;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0);
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig
  );
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-50, 50]),
    springConfig
  );

  const handleMouseMove = (event: React.MouseEvent<HTMLImageElement>) => {
    const halfWidth = event.currentTarget.offsetWidth / 2;
    x.set(event.nativeEvent.offsetX - halfWidth);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {items.map((item, idx) => (
        <div
          className="group relative -mr-4"
          key={item.name}
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence mode="popLayout">
            {hoveredIndex === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 10,
                  },
                }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                style={{
                  translateX: translateX,
                  rotate: rotate,
                  whiteSpace: "nowrap",
                }}
                className="absolute -top-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-black px-4 py-2 shadow-xl"
              >
                <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                <div className="absolute -bottom-px z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
                <div className="relative z-30 text-base font-bold text-white">
                  {item.name}
                </div>
                <div className="text-xs text-white/70">{item.designation}</div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="relative">
            <img
              onMouseMove={handleMouseMove}
              src={item.image}
              alt={item.name}
              className="relative !m-0 h-10 w-10 rounded-full border-2 border-white object-cover object-top !p-0 transition duration-500 group-hover:z-30 group-hover:scale-105"
            />
            {hoveredIndex === item.id && (
              <div className="absolute inset-0 z-20 rounded-full ring-2 ring-emerald-500/50" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

interface AnimatedTooltipSelectorProps {
  items: {
    id: string;
    name: string;
    designation: string;
    image: string;
    onClick?: () => void;
    isActive?: boolean;
  }[];
  selectedId?: string;
  className?: string;
}

export function AnimatedTooltipSelector({
  items,
  selectedId,
  className,
}: AnimatedTooltipSelectorProps) {
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0);
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig
  );
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-50, 50]),
    springConfig
  );

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const halfWidth = event.currentTarget.offsetWidth / 2;
    x.set(event.nativeEvent.offsetX - halfWidth);
  };

  const handleItemClick = (item: { onClick?: () => void }) => {
    if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-md",
        className
      )}
    >
      {items.map(item => (
        <div
          className="group relative"
          key={item.id}
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() => handleItemClick(item)}
        >
          <AnimatePresence mode="popLayout">
            {hoveredIndex === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                  },
                }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                style={{
                  translateX: translateX,
                  rotate: rotate,
                  whiteSpace: "nowrap",
                }}
                className="absolute top-full left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-lg bg-slate-900 px-3 py-1.5 shadow-xl ring-1 ring-white/10 mt-2"
              >
                <div className="text-sm font-semibold text-white">
                  {item.name}
                </div>
                <div className="text-xs text-slate-400">{item.designation}</div>
                <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className={cn(
              "relative cursor-pointer rounded-full p-0.5 transition-all duration-300",
              item.isActive
                ? "ring-2 ring-neon-gold-bright"
                : "hover:ring-2 hover:ring-neon-petroleo/50"
            )}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            onMouseMove={handleMouseMove}
          >
            <img
              src={item.image}
              alt={item.name}
              className={cn(
                "h-10 w-10 rounded-full object-cover transition-all duration-300",
                !item.isActive && hoveredIndex !== item.id && "grayscale-[30%]"
              )}
            />
            {item.isActive && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-neon-gold-bright ring-2 ring-black" />
            )}
          </motion.div>
        </div>
      ))}
    </div>
  );
}
