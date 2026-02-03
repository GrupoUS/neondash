import { motion, useInView } from "motion/react";
import type React from "react";
import type { CSSProperties, MouseEventHandler, ReactNode, UIEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface AnimatedItemProps {
  children: ReactNode;
  delay?: number;
  index: number;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onClick?: MouseEventHandler<HTMLDivElement>;
  className?: string;
}

export const AnimatedItem: React.FC<AnimatedItemProps> = ({
  children,
  delay = 0,
  index,
  onMouseEnter,
  onClick,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, once: false });

  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className={className || "mb-4 cursor-pointer"}
    >
      {children}
    </motion.div>
  );
};

export interface AnimatedListProps<T> {
  items: T[];
  renderItem?: (item: T, index: number) => ReactNode;
  keyExtractor?: (item: T) => string;
  className?: string;
  staggerDelay?: number;
  // Legacy props from ReactBits implementation
  onItemSelect?: (item: T, index: number) => void;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  itemClassName?: string;
  displayScrollbar?: boolean;
  initialSelectedIndex?: number;
}

export function AnimatedList<T>({
  items,
  renderItem,
  keyExtractor,
  className = "",
  staggerDelay = 0.1,
  onItemSelect,
  showGradients = false,
  enableArrowNavigation = false,
  itemClassName = "",
  displayScrollbar = false,
  initialSelectedIndex = -1,
}: AnimatedListProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(initialSelectedIndex);
  const [topGradientOpacity, setTopGradientOpacity] = useState<number>(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState<number>(1);

  const handleItemMouseEnter = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleItemClick = useCallback(
    (item: T, index: number) => {
      setSelectedIndex(index);
      if (onItemSelect) {
        onItemSelect(item, index);
      }
    },
    [onItemSelect]
  );

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target as HTMLDivElement;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
  };

  useEffect(() => {
    if (!enableArrowNavigation) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          if (onItemSelect) {
            onItemSelect(items[selectedIndex], selectedIndex);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, selectedIndex, onItemSelect, enableArrowNavigation]);

  // If renderItem is provided, use simpler rendering logic (likely what existing consumers expect)
  if (renderItem) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <AnimatedItem
            key={keyExtractor ? keyExtractor(item) : index}
            index={index}
            delay={staggerDelay ? staggerDelay * index : 0.1 * index}
            className={itemClassName} // Pass base class if needed, checking legacy
          >
            {renderItem(item, index)}
          </AnimatedItem>
        ))}
      </div>
    );
  }

  // Legacy rendering for simple strings or default structure
  return (
    <div className={`relative w-full ${className}`}>
      <div
        ref={listRef}
        className={`max-h-[400px] overflow-y-auto p-4 ${
          displayScrollbar
            ? "[&::-webkit-scrollbar]:w-[8px] [&::-webkit-scrollbar-track]:bg-[#060010] [&::-webkit-scrollbar-thumb]:bg-[#222] [&::-webkit-scrollbar-thumb]:rounded-[4px]"
            : "scrollbar-hide"
        }`}
        onScroll={handleScroll}
        style={
          {
            scrollbarWidth: displayScrollbar ? "thin" : "none",
            scrollbarColor: "#222 #060010",
          } as CSSProperties
        }
      >
        {items.map((item, index) => (
          <AnimatedItem
            key={index}
            delay={0.1}
            index={index}
            onMouseEnter={() => handleItemMouseEnter(index)}
            onClick={() => handleItemClick(item, index)}
          >
            <div
              className={`p-4 bg-[#111] rounded-lg ${
                selectedIndex === index ? "bg-[#222]" : ""
              } ${itemClassName}`}
            >
              <p className="text-white m-0">{String(item)}</p>
            </div>
          </AnimatedItem>
        ))}
      </div>
      {showGradients && (
        <>
          <div
            className="absolute top-0 left-0 right-0 h-[50px] bg-gradient-to-b from-[#060010] to-transparent pointer-events-none transition-opacity duration-300 ease"
            style={{ opacity: topGradientOpacity }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-[100px] bg-gradient-to-t from-[#060010] to-transparent pointer-events-none transition-opacity duration-300 ease"
            style={{ opacity: bottomGradientOpacity }}
          />
        </>
      )}
    </div>
  );
}

export default AnimatedList;
