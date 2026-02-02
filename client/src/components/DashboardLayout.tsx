"use client";
import { UserButton } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { Bot, Briefcase, Calendar, LayoutDashboard, Moon, Sun, UserCog, Users } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/_core/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // ONBOARDING GUARD
  // ═══════════════════════════════════════════════════════════════════════════
  // Skip onboarding check for admins and certain routes
  const isOnboardingExemptRoute =
    location.startsWith("/primeiro-acesso") || location.startsWith("/diagnostico");

  // Determine if we should check onboarding (user must exist, not admin, not exempt route)
  const shouldCheckOnboarding = !!user && user.role !== "admin" && !isOnboardingExemptRoute;

  // Always call hook (unconditionally) but enable based on conditions
  const { data: isOnboardingComplete, isLoading: isCheckingOnboarding } =
    trpc.mentorados.isOnboardingComplete.useQuery(undefined, {
      enabled: shouldCheckOnboarding,
    });

  // Early return if no user
  if (!user) {
    return <Redirect to="/" />;
  }

  // Redirect to onboarding if not complete (only for non-admin, non-exempt routes)
  if (shouldCheckOnboarding && !isCheckingOnboarding && isOnboardingComplete === false) {
    return <Redirect to="/primeiro-acesso" />;
  }

  const navItems = [
    { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { href: "/meu-dashboard", label: "Meu Dashboard", icon: Users },
    { href: "/agenda", label: "Agenda", icon: Calendar },
    { href: "/assistente", label: "Assistente IA", icon: Bot },
    { href: "/crm/leads", label: "CRM Leads", icon: Briefcase },
    // Consolidated into /admin/mentorados
    // { href: "/admin", label: "Administração", icon: Shield, adminOnly: true },
    // {
    //   href: "/admin/vincular",
    //   label: "Vincular Emails",
    //   icon: Link2,
    //   adminOnly: true,
    // },
    {
      href: "/admin/mentorados",
      label: "Área Administrativa", // Renamed from Gestão Mentorados
      icon: UserCog,
      adminOnly: true,
    },
    // { href: "/estrutura", label: "Neon Estrutura", icon: Building2 }, // Incorporated into Home
    // { href: "/escala", label: "Neon Escala", icon: Rocket }, // Incorporated into Home
  ];

  const filteredNavItems = navItems.filter((item) => !item.adminOnly || user.role === "admin");

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row bg-background w-full flex-1 mx-auto border-none overflow-hidden",
        "h-screen"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {filteredNavItems.map((item) => (
                <SidebarLink
                  key={item.href}
                  link={{
                    label: item.label,
                    href: item.href,
                    icon: (
                      <item.icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0 text-muted-foreground",
                          location === item.href && "text-primary"
                        )}
                      />
                    ),
                  }}
                  className={cn(location === item.href && "bg-secondary rounded-md")}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary transition-colors">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleTheme}
                className="h-7 w-7 flex-shrink-0"
                aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              {open && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground whitespace-pre cursor-pointer"
                  onClick={toggleTheme}
                >
                  {theme === "light" ? "Modo Escuro" : "Modo Claro"}
                </motion.span>
              )}
            </div>
            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary transition-colors">
              <div className="h-7 w-7 flex-shrink-0 flex items-center justify-center">
                <UserButton afterSignOutUrl="/" />
              </div>
              {open && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground whitespace-pre overflow-hidden text-ellipsis"
                >
                  {user.name || "Minha Conta"}
                </motion.div>
              )}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="flex-1 overflow-y-auto w-full p-2 md:p-10 border-l border-border bg-background rounded-tl-2xl">
        {children}
      </main>
    </div>
  );
}

export const Logo = () => {
  return (
    <Link
      href="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <img src="/brand/neon-symbol-official.png" alt="Neon" className="h-6 w-6 flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        NEON DASHBOARD
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <img src="/brand/neon-symbol-official.png" alt="Neon" className="h-6 w-6 flex-shrink-0" />
    </Link>
  );
};
