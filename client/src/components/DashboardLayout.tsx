import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, TrendingUp, Menu, X, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Visão Geral", icon: LayoutDashboard },
    { href: "/meu-dashboard", label: "Meu Dashboard", icon: Users },
    { href: "/enviar-metricas", label: "Enviar Métricas", icon: TrendingUp },
    { href: "/admin", label: "Administração", icon: Shield },
    { href: "/estrutura", label: "Neon Estrutura", icon: Users },
    { href: "/escala", label: "Neon Escala", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="font-bold text-xl text-neon-purple tracking-tight">NEON<span className="text-slate-900">DASH</span></div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar / Mobile Menu */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen overflow-y-auto",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden md:block">
          <div className="font-bold text-2xl text-neon-purple tracking-tight">NEON<span className="text-slate-900">DASH</span></div>
          <p className="text-xs text-slate-500 mt-1">Performance Dezembro 2025</p>
        </div>

        <nav className="px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-neon-purple/10 text-neon-purple shadow-sm" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )} onClick={() => setIsMobileMenuOpen(false)}>
                  <Icon className={cn("h-5 w-5", isActive ? "text-neon-purple" : "text-slate-400")} />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-medium text-slate-500 uppercase mb-2">Status do Sistema</p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neon-green"></span>
              </span>
              <span className="text-xs font-semibold text-slate-700">Dados Atualizados</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Última verificação: 13/01/2026</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
