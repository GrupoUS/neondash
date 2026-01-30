"use client";

import * as React from "react";
import { useMotionValue, useSpring, useTransform, motion } from "framer-motion";
import { useRef, useState, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import * as TabsPrimitive from "@radix-ui/react-tabs";

// Context for tab state
const FloatingDockTabsContext = createContext<{
  activeTab: string;
  setActiveTab: (value: string) => void;
}>({
  activeTab: "",
  setActiveTab: () => {},
});

export interface FloatingDockTabItem {
  value: string;
  label: string;
  icon: React.ReactNode;
}

interface FloatingDockTabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface FloatingDockTabsListProps {
  tabs: FloatingDockTabItem[];
  className?: string;
}

// Hook for dock item animation
function useDockItemAnimation(
  mouseX: ReturnType<typeof useMotionValue<number>>
) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const distance = useTransform(mouseX, val => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return 0;
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [48, 72, 48]);
  const heightSync = useTransform(distance, [-150, 0, 150], [48, 72, 48]);
  const iconScale = useTransform(distance, [-150, 0, 150], [1, 1.3, 1]);

  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return {
    ref,
    isHovered,
    setIsHovered,
    width,
    height,
    iconScale,
  };
}

// Individual dock tab item
function DockTabItem({
  tab,
  mouseX,
  isActive,
  onClick,
}: {
  tab: FloatingDockTabItem;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  isActive: boolean;
  onClick: () => void;
}) {
  const { ref, isHovered, setIsHovered, width, height, iconScale } =
    useDockItemAnimation(mouseX);

  return (
    <div className="relative">
      {/* Tooltip */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap z-50"
        >
          <div className="bg-black/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 shadow-xl">
            {tab.label}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/80" />
        </motion.div>
      )}

      <motion.button
        ref={ref}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ width, height }}
        className={cn(
          "relative flex items-center justify-center rounded-2xl transition-colors duration-200",
          "hover:bg-white/10",
          isActive
            ? "bg-white/15 ring-2 ring-neon-purple/50 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
            : "bg-white/5"
        )}
      >
        {/* Active indicator background */}
        {isActive && (
          <motion.div
            layoutId="activeDockTab"
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-transparent"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}

        {/* Icon with scale effect */}
        <motion.div style={{ scale: iconScale }} className="relative z-10">
          {tab.icon}
        </motion.div>

        {/* Active dot */}
        {isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-neon-purple"
          />
        )}
      </motion.button>
    </div>
  );
}

// Main FloatingDockTabs component
const FloatingDockTabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  FloatingDockTabsProps
>(({ defaultValue, value, onValueChange, children, className }, ref) => {
  const [activeTab, setActiveTab] = useState(value || defaultValue || "");

  React.useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value);
    }
  }, [value]);

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setActiveTab(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <FloatingDockTabsContext.Provider
      value={{ activeTab, setActiveTab: handleValueChange }}
    >
      <TabsPrimitive.Root
        ref={ref}
        value={value !== undefined ? value : activeTab}
        onValueChange={handleValueChange}
        defaultValue={defaultValue}
        className={cn("flex flex-col gap-6", className)}
      >
        {children}
      </TabsPrimitive.Root>
    </FloatingDockTabsContext.Provider>
  );
});
FloatingDockTabs.displayName = "FloatingDockTabs";

// FloatingDockTabsList component
const FloatingDockTabsList = React.forwardRef<
  HTMLDivElement,
  FloatingDockTabsListProps
>(({ tabs, className }, ref) => {
  const { activeTab, setActiveTab } = useContext(FloatingDockTabsContext);
  const mouseX = useMotionValue(Infinity);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex items-center justify-center gap-2 px-4 py-3 rounded-2xl backdrop-blur-md",
        "bg-black/40 border border-white/10",
        className
      )}
      onMouseMove={e => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
    >
      {/* Left scroll button */}
      {canScrollLeft && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full bg-black/40 hover:bg-black/60"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Dock items container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {tabs.map(tab => (
          <DockTabItem
            key={tab.value}
            tab={tab}
            mouseX={mouseX}
            isActive={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
          />
        ))}
      </div>

      {/* Right scroll button */}
      {canScrollRight && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full bg-black/40 hover:bg-black/60"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});
FloatingDockTabsList.displayName = "FloatingDockTabsList";

// Export TabsContent from radix for convenience
const FloatingDockTabsContent = TabsPrimitive.Content;

export { FloatingDockTabs, FloatingDockTabsList, FloatingDockTabsContent };
