import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/_core/hooks/useTheme";
import { SignInButton } from "@/components/auth/SignInButton";
import {
  BenefitsSection,
  HeroSection,
  MethodologySection,
  SimpleFooter,
  SocialProofSection,
} from "@/components/landing/LandingComponents";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function LandingPage() {
  const { isAuthenticated, loading, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  // Show loading while:
  // 1. Auth is loading
  // 2. Initial auth check hasn't completed
  // 3. User is authenticated and we're fetching their mentorado data
  // After that, either redirect happens (via useEffect) or we show the landing page
  if (loading || !hasCheckedAuth || (isAuthenticated && loadingMentorado)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-medium tracking-wide">
          Carregando Neon...
        </div>
      </div>
    );
  }

  // If authenticated, the useEffect above will redirect - show loading while that happens
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-medium tracking-wide">
          Redirecionando...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden font-sans text-foreground selection:bg-primary/30 scroll-smooth">
      {/* Header */}
      <header className="fixed top-0 w-full py-4 px-6 md:px-12 flex justify-between items-center z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3">
          <img
            src="/brand/neon-symbol-official.png"
            alt="Neon"
            className="w-8 h-8 object-contain"
          />
          <div>
            <span className="font-bold text-xl tracking-tight text-foreground block leading-none">
              NEON
            </span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-[0.25em] font-mono font-medium">
              Mentoria Black
            </span>
          </div>
        </div>
        <nav className="flex gap-4 text-sm font-medium text-muted-foreground items-center">
          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full"
            aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-primary" />
            ) : (
              <Moon className="w-5 h-5 text-muted-foreground" />
            )}
          </Button>
          <SignInButton />
        </nav>
      </header>

      <main>
        <HeroSection />
        <BenefitsSection />
        <MethodologySection />
        <SocialProofSection />
      </main>

      <SimpleFooter />
    </div>
  );
}
