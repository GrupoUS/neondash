"use client";
import { motion } from "framer-motion";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarRange,
  CheckCircle2,
  HeartPulse,
  Loader2,
  MessageCircle,
  Moon,
  Settings2,
  Sun,
  TrendingUp,
  UsersRound,
  WifiOff,
} from "lucide-react";

import type React from "react";
import { useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/_core/hooks/useTheme";
import { GlobalAIChat } from "@/components/ai-chat";
import { UserButton } from "@/components/auth/UserButton";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const { data: zapiStatus, isLoading: isLoadingZapiStatus } = trpc.zapi.getStatus.useQuery(
    undefined,
    { enabled: !!user }
  );
  const { data: metaStatus, isLoading: isLoadingMetaStatus } = trpc.metaApi.getStatus.useQuery(
    undefined,
    { enabled: !!user }
  );
  const { data: baileysStatus, isLoading: isLoadingBaileysStatus } =
    trpc.baileys.getStatus.useQuery(undefined, { enabled: !!user });

  const activeWhatsAppProvider = metaStatus?.connected
    ? "meta"
    : baileysStatus?.connected
      ? "baileys"
      : zapiStatus?.connected
        ? "zapi"
        : null;

  const whatsappStatus = activeWhatsAppProvider ? "connected" : "disconnected";
  const isLoadingWhatsAppStatus =
    isLoadingZapiStatus || isLoadingMetaStatus || isLoadingBaileysStatus;

  const providerLabel =
    activeWhatsAppProvider === "meta"
      ? "Meta"
      : activeWhatsAppProvider === "baileys"
        ? "Baileys"
        : activeWhatsAppProvider === "zapi"
          ? "Z-API"
          : "Sem conexão";

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
    { href: "/meu-dashboard", label: "Meu Dashboard", icon: BarChart3 },
    { href: "/agenda", label: "Agenda", icon: CalendarRange },
    { href: "/crm/leads", label: "CRM", icon: BriefcaseBusiness },
    { href: "/pacientes", label: "Pacientes", icon: HeartPulse },

    { href: "/procedimentos", label: "Procedimentos", icon: TrendingUp },
    { href: "/chat", label: "Chat WhatsApp", icon: MessageCircle },
    { href: "/marketing", label: "Marketing", icon: TrendingUp },
    { href: "/configuracoes", label: "Configurações", icon: Settings2 },
    {
      href: "/admin/mentorados",
      label: "Painel Administrativo",
      icon: UsersRound,
      adminOnly: true,
    },
  ];

  // Logic to prevent non-admins from accessing admin routes
  const currentPath = location;
  const restrictedRoutes = ["/admin"];
  const isRestricted = restrictedRoutes.some((route) => currentPath.startsWith(route));

  if (user && user.role !== "admin" && isRestricted) {
    return <Redirect to="/meu-dashboard" />;
  }

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
            <Link href="/configuracoes" className="block mt-4">
              <div className="flex items-center gap-2 rounded-md border border-sidebar-border/70 bg-sidebar-accent/40 px-2 py-2 hover:bg-sidebar-accent/60 transition-colors">
                {isLoadingWhatsAppStatus ? (
                  <Loader2 className="h-4 w-4 text-sidebar-foreground/80 animate-spin" />
                ) : whatsappStatus === "connected" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-amber-400" />
                )}

                {open && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
                    <p className="text-xs text-sidebar-foreground font-medium leading-tight">
                      WhatsApp
                    </p>
                    <p className="text-[11px] text-sidebar-foreground/70 truncate leading-tight">
                      {isLoadingWhatsAppStatus
                        ? "Verificando…"
                        : whatsappStatus === "connected"
                          ? `Ativo via ${providerLabel}`
                          : "Configurar conexão"}
                    </p>
                  </motion.div>
                )}
              </div>
            </Link>
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
                <UserButton />
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
      <GlobalAIChat />
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
