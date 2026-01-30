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
  const { ref, setIsHovered, width, height } = useDockItemAnimation(mouseX);

  return (
    <div className="relative">
      <motion.button
        ref={ref}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ width, height }}
        className={cn(
          "relative flex items-center justify-center rounded-2xl transition-colors duration-200",
          "px-6 py-3 font-medium whitespace-nowrap",
          "ring-0 outline-none focus-visible:ring-0 focus:outline-none focus:ring-0",
          "hover:bg-white/10 dark:hover:bg-white/5"
        )}
      >
        {/* Active indicator background */}
        {isActive && (
          <motion.div
            layoutId="activeDockTab"
            className="absolute inset-0 rounded-2xl bg-neon-petroleo dark:bg-neon-gold-bright shadow-inner"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}

        {/* Label text */}
        <span
          className={cn(
            "relative z-10 text-sm font-medium whitespace-nowrap",
            isActive
              ? "text-white dark:text-black"
              : "text-slate-700 dark:text-slate-200"
          )}
        >
          {tab.label}
        </span>
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
        "relative flex items-center justify-center gap-2 px-4 py-3 rounded-2xl backdrop-blur-md overflow-hidden",
        "bg-white/50 dark:bg-black/40 border border-slate-200/20 dark:border-slate-700/30 shadow-sm",
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
          className="h-8 w-8 shrink-0 rounded-full bg-white/60 dark:bg-black/40 hover:bg-white/80 dark:hover:bg-black/60 ring-0 outline-none focus-visible:ring-0 focus:outline-none focus:ring-0"
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
          className="h-8 w-8 shrink-0 rounded-full bg-white/60 dark:bg-black/40 hover:bg-white/80 dark:hover:bg-black/60 ring-0 outline-none focus-visible:ring-0 focus:outline-none focus:ring-0"
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
