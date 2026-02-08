"use client";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { createContext, useContext, useState } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<"div">) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
};

export const DesktopSidebar = ({ className, children, ...props }: React.ComponentProps<"div">) => {
  const { open, setOpen, animate } = useSidebar();
  const isOpen = animate ? open : true;
  return (
    <div
      className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border overflow-hidden",
        "fixed top-0 left-0 z-40",
        "transition-[width] duration-300 ease-in-out",
        isOpen ? "w-[300px]" : "w-[60px]",
        className
      )}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </div>
  );
};

export const MobileSidebar = ({ className, children, ...props }: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <div
      className={cn(
        "h-10 px-4 py-4 flex flex-row md:hidden  items-center justify-between bg-sidebar border-b border-sidebar-border w-full"
      )}
      {...props}
    >
      <div className="flex justify-end z-20 w-full">
        <IconMenu2 className="text-sidebar-foreground" onClick={() => setOpen(!open)} />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={cn(
              "fixed h-full w-full inset-0 bg-sidebar p-10 z-[100] flex flex-col justify-between",
              className
            )}
          >
            <div
              className="absolute right-10 top-10 z-50 text-sidebar-foreground"
              onClick={() => setOpen(!open)}
            >
              <IconX />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarLink = ({ link, className, ...props }: { link: Links; className?: string }) => {
  const { open, animate } = useSidebar();
  const isExternal = link.href.startsWith("http") || link.href.startsWith("mailto");

  const shouldShow = animate ? open : true;

  const content = (
    <>
      {link.icon}
      <span
        className={cn(
          "text-sidebar-foreground text-base group-hover/sidebar:translate-x-1 whitespace-pre !p-0 !m-0",
          "transition-opacity duration-200 ease-in-out",
          shouldShow ? "opacity-100 inline-block" : "opacity-0 invisible"
        )}
      >
        {link.label}
      </span>
    </>
  );

  const commonClasses = cn("flex items-center justify-start gap-2  group/sidebar py-2", className);

  if (isExternal) {
    return (
      <a
        href={link.href}
        className={commonClasses}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={link.href} className={commonClasses} {...props}>
      {content}
    </Link>
  );
};
