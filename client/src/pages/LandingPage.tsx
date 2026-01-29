import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, TrendingUp, Users, Shield, Star, BookOpen, Smartphone, Zap, Calendar } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { SignInButton as ClerkSignInButton } from "@clerk/clerk-react";
import { NeonCard, NeonCardContent, NeonCardHeader, NeonCardTitle } from "@/components/ui/neon-card";

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
      setLocation("/meu-dashboard");
    } else if (user?.role === "admin") {
      setLocation("/dashboard");
    } else {
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
      {/* Ambient Background Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-neon-gold/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-neon-blue/5 rounded-full blur-[100px] pointer-events-none" />

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
        <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground items-center">
          <a href="#purpose" className="hover:text-neon-blue-dark transition-colors">
            O que é
          </a>
          <a href="#methodology" className="hover:text-neon-blue-dark transition-colors">
            Como usar
          </a>
          <Link href="/comece-aqui" className="hover:text-neon-blue-dark transition-colors">
            Comece Aqui
          </Link>
          <ClerkSignInButton mode="modal">
            <Button variant="ghost" className="text-neon-blue-dark hover:bg-neon-blue/5 hover:text-neon-blue">
              Login
            </Button>
          </ClerkSignInButton>
          <ClerkSignInButton mode="modal">
            <Button size="sm" className="bg-neon-blue-dark hover:bg-neon-blue text-white shadow-md hover:shadow-lg transition-all">
              Começar Agora
            </Button>
          </ClerkSignInButton>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-24 px-4 relative z-10 flex flex-col items-center text-center">
        <div className="max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-neon-gold/30 shadow-sm mb-4 hover:border-neon-gold/60 transition-colors cursor-default">
            <span className="w-2 h-2 rounded-full bg-neon-gold animate-pulse shadow-[0_0_8px_rgba(172,148,105,0.5)]" />
            <span className="text-xs font-bold text-neon-blue-medium tracking-wide uppercase">
              Bem-vindo ao Grupo de Elite
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-neon-blue-dark leading-[1.1]">
            Hello, NEON! <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-blue-dark via-neon-blue to-neon-gold pb-2">
              Comece sua Jornada Aqui.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Você agora faz parte do meu grupo de elite. Esta plataforma é o seu centro de comando para escalar sua clínica com previsibilidade e lucro.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <ClerkSignInButton mode="modal">
              <Button
                size="lg"
                className="h-14 px-8 text-base bg-neon-blue-dark hover:bg-neon-blue text-white shadow-xl hover:shadow-neon-blue/20 hover:-translate-y-0.5 transition-all duration-300 group rounded-full"
              >
                Acessar Portal do Mentor
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </ClerkSignInButton>
          </div>
        </div>
      </section>

      {/* Purpose Section: "Para que serve este Notion/Portal?" */}
      <section id="purpose" className="py-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-border to-transparent" />

        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-neon-blue-dark mb-4">
              O Seu Novo Centro de Comando
            </h2>
            <p className="text-muted-foreground text-lg">
              Mais do que um dashboard, este é o seu ambiente de trabalho oficial da Mentoria Black.
              Projetado para eliminar distrações e focar no que importa: resultados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <NeonCard variant="default" className="group h-full">
              <NeonCardHeader>
                <div className="w-14 h-14 rounded-2xl bg-neon-blue/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-7 h-7 text-neon-blue" />
                </div>
                <NeonCardTitle className="text-xl">Caderno de Atividades Digital</NeonCardTitle>
              </NeonCardHeader>
              <NeonCardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Seu espaço dedicado para anotações e atividades ao longo da jornada.
                  Com ferramentas integradas para você <strong>responder e executar</strong> tudo que for ensinado,
                  sem perder nada em cadernos físicos ou notas soltas.
                </p>
              </NeonCardContent>
            </NeonCard>

            <NeonCard variant="default" className="group h-full">
              <NeonCardHeader>
                <div className="w-14 h-14 rounded-2xl bg-neon-gold/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-7 h-7 text-neon-gold" />
                </div>
                <NeonCardTitle className="text-xl">Gestão Completa (360º)</NeonCardTitle>
              </NeonCardHeader>
              <NeonCardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Gerencie sua clínica de ponta a ponta:
                  <strong> Administrativo, Conteúdo, CRM, Análise de Dados e Planejamento. </strong>
                  Tenha controle total sobre os números que realmente movem o ponteiro do seu negócio.
                </p>
              </NeonCardContent>
            </NeonCard>
          </div>
        </div>
      </section>

      {/* Methodology Section: "Como usar este Notion?" */}
      <section id="methodology" className="py-24 bg-neon-gray/30 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-neon-blue-dark mb-6">
              Como Usar a Plataforma
            </h2>
            <p className="text-muted-foreground">
              Para extrair o máximo da Mentoria Black, siga este protocolo de uso.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-neon-border/50 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-6 text-neon-blue-dark">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-neon-blue-dark mb-3">Onipresença</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Use no computador ou celular. Tenha a plataforma sempre aberta ao assistir às aulas gravadas e durante os encontros ao vivo. Ela é sua extensão.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-neon-border/50 hover:shadow-md transition-shadow relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neon-gold text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Essencial
              </div>
              <div className="w-16 h-16 rounded-full bg-neon-gold/10 flex items-center justify-center mb-6 text-neon-gold">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-neon-blue-dark mb-3">Execução &gt; Consumo</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Não maratone as aulas sem aplicar. À medida que assistir, <strong>responda às ferramentas e perguntas</strong>. A execução gera resultados, não apenas o estudo.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-neon-border/50 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-6 text-neon-blue-dark">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-neon-blue-dark mb-3">Hábito Diário</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Crie o hábito de abrir a plataforma diariamente. Use-a para gerenciar tarefas, produção de conteúdo, hábitos e rotina. Transforme disciplina em dados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-neon-border text-center text-sm text-muted-foreground z-10">
        <div className="container mx-auto px-4 flex flex-col items-center">
           <div className="w-12 h-12 bg-neon-blue-dark rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
              <span className="text-neon-gold font-bold text-xl">N</span>
           </div>
           <p className="mb-4">© 2026 Neon - Mentoria Black. Todos os direitos reservados.</p>
           <p className="max-w-md mx-auto text-xs text-slate-400">
             Plataforma exclusiva para membros da Mentoria Black. O acesso é restrito e monitorado. Grupo US.
           </p>
        </div>
      </footer>
    </div>
  );
}
