import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { SignInButton as ClerkSignInButton } from "@clerk/clerk-react";

export default function LandingPage() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Check if user is a mentorado - only if authenticated
  const { data: mentorado, isLoading: loadingMentorado } =
    trpc.mentorados.me.useQuery(undefined, {
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
      // User is a mentorado, go to personal dashboard
      setLocation("/meu-dashboard");
    } else if (user?.role === "admin") {
      // User is admin, go to main dashboard
      setLocation("/dashboard");
    } else {
      // User has no profile, go to first access page
      setLocation("/primeiro-acesso");
    }
  }, [
    hasCheckedAuth,
    isAuthenticated,
    loading,
    loadingMentorado,
    mentorado,
    user,
    setLocation,
  ]);

  // Show loading while checking auth
  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Show loading while checking mentorado status for authenticated users
  if (isAuthenticated && loadingMentorado) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Redirecionando...
        </div>
      </div>
    );
  }

  // If authenticated, we're about to redirect
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Redirecionando...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col relative overflow-hidden font-sans text-foreground selection:bg-neon-gold/30">
      {/* Ambient Background Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-neon-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon-blue/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="w-full py-6 px-8 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <img
            src="/brand/neon-symbol-official.png"
            alt="Neon"
            className="w-8 h-8 object-contain"
          />
          <div>
            <span className="font-bold text-xl tracking-tight text-neon-blue-dark block">
              NEON
            </span>
            <span className="text-[8px] text-neon-blue-medium uppercase tracking-[0.2em] font-mono font-medium">
              Mentoria Black
            </span>
          </div>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
          <a
            href="#features"
            className="hover:text-neon-blue-dark transition-colors"
          >
            Recursos
          </a>
          <a
            href="#about"
            className="hover:text-neon-blue-dark transition-colors"
          >
            Sobre
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10">
        <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-neon-gold/30 shadow-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-neon-gold animate-pulse" />
            <span className="text-xs font-semibold text-neon-blue-medium tracking-wide uppercase">
              Dashboard Premium
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-neon-blue-dark leading-[1.1]">
            Eleve Sua Performance em <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue-dark via-neon-blue to-neon-gold">
              Mentoria de Saúde Estética
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Acompanhe métricas de faturamento, leads, procedimentos e evolução
            mensal com análises detalhadas e sugestões personalizadas para
            crescimento.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <ClerkSignInButton mode="modal">
              <Button
                size="lg"
                className="h-14 px-8 text-base bg-neon-blue-dark hover:bg-neon-blue text-white shadow-lg hover:shadow-neon-blue/20 transition-all duration-300 group"
              >
                Acessar Dashboard
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </ClerkSignInButton>

            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 text-base border-neon-blue/20 hover:bg-neon-blue/5 text-neon-blue-dark"
            >
              Saiba Mais
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground z-10">
        <p>© 2026 Neon - Mentoria Black. Grupo US.</p>
      </footer>
    </div>
  );
}
