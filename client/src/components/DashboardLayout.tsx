"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Shield,
  Link2,
  UserCog,
  BarChart3,
  Trophy,
  Medal,
  Bell,
  Bot,
  Briefcase,
  LogOut,
  Building2,
  Rocket
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation, Redirect } from "wouter";
import { UserButton } from "@clerk/clerk-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  if (!user) {
    return <Redirect to="/" />;
  }

  const navItems = [
    { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { href: "/meu-dashboard", label: "Meu Dashboard", icon: Users },
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

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || user.role === "admin"
  );

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden",
        "h-screen" 
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {filteredNavItems.map((item, idx) => (
                <SidebarLink
                  key={idx}
                  link={{
                    label: item.label,
                    href: item.href,
                    icon: (
                      <item.icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200",
                          location === item.href && "text-neon-gold"
                        )}
                      />
                    ),
                  }}
                  className={cn(
                    location === item.href && "bg-neutral-200/50 dark:bg-neutral-700/50 rounded-md"
                  )}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
             <div className="flex items-center gap-2 p-2 rounded-md hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-colors">
                <div className="h-7 w-7 flex-shrink-0 flex items-center justify-center">
                   <UserButton afterSignOutUrl="/" />
                </div>
                 {open && (
                     <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-neutral-700 dark:text-neutral-200 whitespace-pre overflow-hidden text-ellipsis"
                     >
                        {user.name || "Minha Conta"}
                     </motion.div>
                 )}
             </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="flex-1 overflow-y-auto w-full p-2 md:p-10 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-tl-2xl">
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
       <img
        src="/brand/neon-symbol-official.png"
        alt="Neon"
        className="h-6 w-6 flex-shrink-0"
      />
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
      <img
        src="/brand/neon-symbol-official.png"
        alt="Neon"
        className="h-6 w-6 flex-shrink-0"
      />
    </Link>
  );
};
