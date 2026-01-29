import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { Link } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, Users, PlayCircle, BookOpen, Coffee, Award } from "lucide-react";

export function MentorshipContent() {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero / Intro Title for this page */}
      <section className="pt-12 md:pt-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-neon-blue-dark mb-6">
          Mentoria na Prática
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Seu guia oficial para navegar pela Mentoria Black e extrair o máximo de resultados.
        </p>
      </section>

      {/* PHASE 5: Onboarding Guide - Primeiros Passos */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-neon-blue-dark mb-8 text-center">Primeiros Passos no Sistema</h2>
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow-lg border border-neon-blue/10">
            <div className="grid gap-8 md:grid-cols-3 relative">
                <div className="absolute top-8 left-0 w-full h-0.5 bg-gray-100 hidden md:block -z-10" />

                {/* Step 1 */}
                <div className="flex flex-col items-center text-center bg-white">
                    <div className="w-16 h-16 rounded-full bg-neon-blue text-white flex items-center justify-center font-bold text-xl mb-4 shadow-md">1</div>
                    <h3 className="font-bold text-lg mb-2">Login no Portal</h3>
                    <p className="text-sm text-muted-foreground">Clique em "Entrar" abaixo. Use o e-mail cadastrado na compra.</p>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center bg-white">
                    <div className="w-16 h-16 rounded-full bg-neon-blue text-white flex items-center justify-center font-bold text-xl mb-4 shadow-md">2</div>
                    <h3 className="font-bold text-lg mb-2">Perfil & Dados</h3>
                    <p className="text-sm text-muted-foreground">Acesse seu dashboard e verifique se suas informações estão corretas.</p>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center bg-white">
                    <div className="w-16 h-16 rounded-full bg-neon-gold text-white flex items-center justify-center font-bold text-xl mb-4 shadow-md animate-pulse">3</div>
                    <h3 className="font-bold text-lg mb-2">Lançar Métricas</h3>
                    <p className="text-sm text-muted-foreground">Vá em "Lançar Métricas" e preencha seus dados atuais do negócio.</p>
                </div>
            </div>

            <div className="mt-12 text-center">
                <SignedOut>
                    <SignInButton mode="modal">
                        <Button size="lg" className="bg-neon-blue-dark hover:bg-neon-blue text-white px-8">
                            Fazer Login Agora
                        </Button>
                    </SignInButton>
                </SignedOut>
                <SignedIn>
                    <Link href="/dashboard">
                        <Button size="lg" className="bg-neon-gold hover:bg-neon-gold/90 text-neon-blue-dark font-bold px-8">
                            Área do Aluno (Dashboard)
                        </Button>
                    </Link>
                </SignedIn>
            </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-neon-blue-dark mb-12 text-center">Como Funciona a Mentoria?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-neon-blue/20 hover:border-neon-blue/50 transition-colors">
                <CardHeader>
                    <PlayCircle className="w-10 h-10 text-neon-blue mb-2" />
                    <CardTitle>Aulas Gravadas</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Acesse o conteúdo base na área de membros. Assista no seu ritmo, mas mantenha a constância.</p>
                </CardContent>
            </Card>
            <Card className="border-neon-blue/20 hover:border-neon-blue/50 transition-colors">
                <CardHeader>
                    <BookOpen className="w-10 h-10 text-neon-blue mb-2" />
                    <CardTitle>Ferramentas</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Planilhas, templates e scripts validados disponíveis para download e aplicação imediata.</p>
                </CardContent>
            </Card>
            <Card className="border-neon-blue/20 hover:border-neon-blue/50 transition-colors">
                <CardHeader>
                    <Users className="w-10 h-10 text-neon-blue mb-2" />
                    <CardTitle>Encontros ao Vivo</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Tire dúvidas, faça networking e receba direcionamento estratégico nos calls semanais.</p>
                </CardContent>
            </Card>
            <Card className="border-neon-blue/20 hover:border-neon-blue/50 transition-colors">
                <CardHeader>
                    <Award className="w-10 h-10 text-neon-blue mb-2" />
                    <CardTitle>Caderno Digital</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Use este sistema para registrar seu progresso, insights e tarefas. Sua evolução documentada.</p>
                </CardContent>
            </Card>
        </div>
      </section>

      {/* O Que Espero de Você */}
      <section className="bg-neon-gray/10 py-16">
        <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-neon-blue-dark mb-12 text-center">O Que Espero de Você</h2>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="mb-4 text-neon-gold"><CheckCircle2 className="w-8 h-8" /></div>
                    <h3 className="font-bold text-xl mb-3">Execução Radical</h3>
                    <p className="text-muted-foreground">O conhecimento só tem poder quando aplicado. Não acumule teoria. Executed.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="mb-4 text-neon-gold"><Clock className="w-8 h-8" /></div>
                    <h3 className="font-bold text-xl mb-3">Não Maratone</h3>
                    <p className="text-muted-foreground">Respeite o processo. Implemente uma aula antes de passar para a próxima.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="mb-4 text-neon-gold"><Coffee className="w-8 h-8" /></div>
                    <h3 className="font-bold text-xl mb-3">Constância</h3>
                    <p className="text-muted-foreground">O resultado vem do trabalho diário e consistente. Apareça todos os dias.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Apresente-se & Gerencie */}
      <section className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div>
            <h2 className="text-3xl font-bold text-neon-blue-dark mb-4">Gerencie Seu Tempo</h2>
            <p className="text-lg text-muted-foreground mb-6">
                Use este portal como seu HUB central. Organize sua agenda, defina blocos de tempo para estudo e execução. A organização precede o crescimento.
            </p>
            <Button variant="outline" className="border-neon-blue text-neon-blue">
                Ver Dicas de Produtividade
            </Button>
        </div>
        <div className="bg-neon-blue-dark text-white p-10 rounded-3xl text-center">
            <h3 className="text-2xl font-bold mb-4">Apresente-se</h3>
            <p className="mb-8 text-neon-blue-light/80">
                Queremos conhecer você e seu negócio a fundo. Preencha seu perfil completo para que possamos personalizar sua experiência.
            </p>
            <Button className="bg-neon-gold hover:bg-neon-gold/90 text-neon-blue-dark font-bold w-full py-6 text-lg">
                Preencher Perfil Agora
            </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-neon-blue-dark mb-8 text-center">Perguntas Frequentes</h2>
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>Para que serve este Portal?</AccordionTrigger>
                <AccordionContent>
                    É seu centro de comando. Aqui você encontra ferramentas, registra métricas, acompanha seu progresso e acessa materiais de apoio complementar às aulas.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
                <AccordionTrigger>Como usar este sistema?</AccordionTrigger>
                <AccordionContent>
                    Acesse diariamente. Mantenha suas métricas atualizadas na aba de Dashboard. Use o Caderno Digital para suas anotações de aula.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
                <AccordionTrigger>Onde estão as aulas gravadas?</AccordionTrigger>
                <AccordionContent>
                    As aulas estão hospedadas na nossa área de membros oficial. Este portal é focado na GESTÃO e EXECUÇÃO do aprendizado.
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </section>

      {/* Team */}
      <section className="bg-white py-16 border-t border-neon-border/30">
        <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-neon-blue-dark mb-12 text-center">Conheça o Time</h2>
            <div className="grid md:grid-cols-4 gap-8">
                {/* Sacha - Placeholder */}
                <div className="text-center group">
                    <div className="w-32 h-32 mx-auto rounded-full bg-gray-200 mb-4 overflow-hidden border-4 border-transparent group-hover:border-neon-gold transition-all">
                        {/* Img placeholder */}
                        <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-500 font-bold text-2xl">S</div>
                    </div>
                    <h3 className="font-bold text-lg">Sacha Gualberto</h3>
                    <p className="text-sm text-neon-blue-medium">Mentor Principal</p>
                </div>
                 {/* Mauricio - Placeholder */}
                 <div className="text-center group">
                    <div className="w-32 h-32 mx-auto rounded-full bg-gray-200 mb-4 overflow-hidden border-4 border-transparent group-hover:border-neon-gold transition-all">
                         <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-500 font-bold text-2xl">M</div>
                    </div>
                    <h3 className="font-bold text-lg">Maurício Magalhães</h3>
                    <p className="text-sm text-neon-blue-medium">Financeiro & Tech</p>
                </div>
                 {/* Support - Placeholder */}
                 <div className="text-center group">
                    <div className="w-32 h-32 mx-auto rounded-full bg-gray-200 mb-4 overflow-hidden border-4 border-transparent group-hover:border-neon-gold transition-all">
                         <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-500 font-bold text-2xl">S</div>
                    </div>
                    <h3 className="font-bold text-lg">Suporte Neon</h3>
                    <p className="text-sm text-neon-blue-medium">Customer Success</p>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
}
