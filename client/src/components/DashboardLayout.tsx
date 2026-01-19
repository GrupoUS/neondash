import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, TrendingUp, Menu, X, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { SignedIn, UserButton, useClerk } from "@clerk/clerk-react";
import { LogOut, Settings } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signOut, openUserProfile } = useClerk();

  const navItems = [
    { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { href: "/meu-dashboard", label: "Meu Dashboard", icon: Users },
    { href: "/enviar-metricas", label: "Enviar Métricas", icon: TrendingUp },
    { href: "/admin", label: "Administração", icon: Shield },
    { href: "/estrutura", label: "Neon Estrutura", icon: Users },
    { href: "/escala", label: "Neon Escala", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-foreground selection:bg-neon-gold/20">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-sidebar/80 backdrop-blur-md border-b border-sidebar-border sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src="/brand/neon-symbol.svg" alt="Neon" className="w-8 h-8" />
          <span className="font-bold text-xl text-primary tracking-tight font-sans">NEON</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-primary hover:text-neon-gold transition-colors">
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar / Mobile Menu */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 bg-sidebar/80 backdrop-blur-xl border-r border-sidebar-border transform transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] md:translate-x-0 md:static md:h-screen overflow-y-auto",
        isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        <div className="p-8 hidden md:block">
          <div className="flex items-center gap-3 mb-2">
            <img src="/brand/neon-symbol.svg" alt="Neon" className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold text-primary tracking-tighter font-sans">NEON</h1>
              <p className="text-[10px] text-neon-blue-medium uppercase tracking-[0.2em] font-mono font-medium">Mentoria Black</p>
            </div>
          </div>
        </div>

        <nav className="px-6 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 border border-transparent",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary border-sidebar-border shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 hover:border-sidebar-border/50 hover:pl-5"
                )} onClick={() => setIsMobileMenuOpen(false)}>
                  <Icon className={cn("h-4 w-4 transition-colors duration-300", isActive ? "text-neon-gold" : "text-muted-foreground group-hover:text-neon-gold")} />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-2 space-y-1">
             <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 h-10 px-4"
                onClick={() => openUserProfile()}
             >
                <Settings className="mr-3 h-4 w-4" />
                Configurar Perfil
             </Button>
             <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-10 px-4"
                onClick={() => signOut()}
             >
                <LogOut className="mr-3 h-4 w-4" />
                Sair
             </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="bg-gradient-to-br from-sidebar-accent/50 to-white/50 backdrop-blur-sm rounded-lg p-5 border border-sidebar-border">
            <p className="text-[10px] font-mono font-medium text-neon-blue-medium uppercase mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-gold animate-pulse"></span>
              System Status
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary font-sans">Operacional</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 font-mono">v2.5.0 (Stitch)</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10 scrollbar-thin scrollbar-thumb-neon-border scrollbar-track-transparent">
        <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          {children}
        </div>
      </main>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-neon-blue-dark/20 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
