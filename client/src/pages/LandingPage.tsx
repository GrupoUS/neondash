import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { SignInButton } from "@/components/auth/SignInButton";
import {
  BenefitsSection,
  HeroSection,
  MethodologySection,
  SimpleFooter,
} from "@/components/landing/LandingComponents";
import { trpc } from "@/lib/trpc";

export default function LandingPage() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Check if user is a mentorado - only if authenticated
  const { data: mentorado, isLoading: loadingMentorado } = trpc.mentorados.me.useQuery(undefined, {
    enabled: isAuthenticated && hasCheckedAuth,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Wait for initial auth check to complete before deciding to redirect
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setHasCheckedAuth(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Redirect authenticated users to appropriate dashboard
  useEffect(() => {
    if (!hasCheckedAuth) return;
    if (loading) return;
    if (!isAuthenticated) return;
    if (loadingMentorado) return;

    if (mentorado) {
      setLocation("/meu-dashboard");
    } else if (user?.role === "admin") {
      setLocation("/dashboard");
    } else {
      setLocation("/primeiro-acesso");
    }
  }, [hasCheckedAuth, isAuthenticated, loading, loadingMentorado, mentorado, user, setLocation]);

  if (loading || !hasCheckedAuth || (isAuthenticated && loadingMentorado) || isAuthenticated) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="animate-pulse text-neon-blue-medium font-medium tracking-wide">
          Carregando Neon...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col relative overflow-hidden font-sans text-foreground selection:bg-neon-gold/30 scroll-smooth">
      {/* Header */}
      <header className="fixed top-0 w-full py-4 px-6 md:px-12 flex justify-between items-center z-50 bg-paper/80 backdrop-blur-md border-b border-neon-border/50">
        <div className="flex items-center gap-3">
          <img
            src="/brand/neon-symbol-official.png"
            alt="Neon"
            className="w-8 h-8 object-contain"
          />
          <div>
            <span className="font-bold text-xl tracking-tight text-neon-blue-dark block leading-none">
              NEON
            </span>
            <span className="text-[9px] text-neon-blue-medium uppercase tracking-[0.25em] font-mono font-medium">
              Mentoria Black
            </span>
          </div>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground items-center">
          <SignInButton />
        </nav>
      </header>

      <main>
        <HeroSection />
        <BenefitsSection />
        <MethodologySection />
      </main>

      <SimpleFooter />
    </div>
  );
}
