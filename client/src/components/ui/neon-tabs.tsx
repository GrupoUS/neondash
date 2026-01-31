"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (value: string) => void;
}>({
  activeTab: "",
  setActiveTab: () => {},
});

const NeonTabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, value, onValueChange, defaultValue, ...props }, ref) => {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue || "");

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
    <TabsContext.Provider
      value={{ activeTab, setActiveTab: handleValueChange }}
    >
      <TabsPrimitive.Root
        ref={ref}
        value={value !== undefined ? value : activeTab}
        onValueChange={handleValueChange}
        defaultValue={defaultValue}
        className={cn("flex flex-col gap-6", className)}
        {...props}
      />
    </TabsContext.Provider>
  );
});
NeonTabs.displayName = "NeonTabs";

const NeonTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-12 items-center justify-center rounded-2xl bg-[#0F172A] p-1 text-muted-foreground shadow-lg border border-white/5",
      className
    )}
    {...props}
  />
));
NeonTabsList.displayName = "NeonTabsList";

interface NeonTabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
    icon?: React.ReactNode;
}

const NeonTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  NeonTabsTriggerProps
>(({ className, children, value, icon, ...props }, ref) => {
  const { activeTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-xl px-5 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        "flex-1 md:flex-none gap-2",
        isActive ? "text-black dark:text-black font-bold" : "text-slate-400 hover:text-slate-200",
        className
      )}
      {...props}
    >
      {isActive && (
        <motion.div
          layoutId="active-neon-tab"
          className="absolute inset-0 z-0 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          initial={false}
          transition={{
            type: "spring",
            bounce: 0.2,
            duration: 0.6,
          }}
        />
      )}
      {icon && <span className="relative z-10">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </TabsPrimitive.Trigger>
  );
});
NeonTabsTrigger.displayName = "NeonTabsTrigger";

const NeonTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  >
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
    >
      {children}
    </motion.div>
  </TabsPrimitive.Content>
));
NeonTabsContent.displayName = "NeonTabsContent";

export { NeonTabs, NeonTabsList, NeonTabsTrigger, NeonTabsContent };
