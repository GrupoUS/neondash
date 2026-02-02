import { ArrowRight, Smartphone, Star, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { SignInButton } from "@/components/auth/SignInButton";
import { Button } from "@/components/ui/button";
import {
  NeonCard,
  NeonCardContent,
  NeonCardHeader,
  NeonCardTitle,
} from "@/components/ui/neon-card";
import {
  fadeIn,
  floatingAnimation,
  slideUp,
  staggerContainer,
  textVariant,
} from "@/lib/animation-variants";

// --- Hero Section ---
export function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 px-4 flex flex-col items-center text-center overflow-hidden z-10">
      {/* Dynamic Background Elements */}
      <motion.div
        variants={floatingAnimation}
        className="absolute top-[15%] right-[10%] w-[300px] h-[300px] bg-neon-gold/10 rounded-full blur-[80px] pointer-events-none"
      />
      <motion.div
        variants={floatingAnimation}
        className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-neon-blue/10 rounded-full blur-[100px] pointer-events-none"
      />

      <motion.div
        className="max-w-5xl space-y-8 relative z-20"
        initial="hidden"
        animate="show"
        variants={staggerContainer}
      >
        <motion.div variants={fadeIn} className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 backdrop-blur-md border border-neon-gold/30 shadow-lg hover:border-neon-gold/60 transition-colors">
            <span className="w-2 h-2 rounded-full bg-neon-gold animate-pulse shadow-[0_0_12px_rgba(172,148,105,0.8)]" />
            <span className="text-xs font-bold text-neon-gold tracking-widest uppercase">
              Mentoria Black • Grupo de Elite
            </span>
          </div>
        </motion.div>

        <motion.h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-neon-blue-dark leading-[1.1]">
          <motion.span variants={textVariant(0.1)} className="block">
            Hello, gente
          </motion.span>
          <motion.span
            variants={textVariant(0.3)}
            className="bg-clip-text text-transparent bg-gradient-to-r from-neon-blue-dark via-neon-blue to-neon-gold pb-4 block"
          >
            que BRILHA!
          </motion.span>
        </motion.h1>

        <motion.p
          variants={textVariant(0.5)}
          className="text-lg md:text-2xl text-muted-foreground/80 max-w-3xl mx-auto leading-relaxed font-light"
        >
          Sua jornada de <span className="font-semibold text-neon-blue-dark">6 meses</span> para
          escalar sua clínica com previsibilidade, gestão e lucro. Este é o seu centro de comando.
        </motion.p>

        <motion.div
          variants={fadeIn}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <SignInButton />
          </motion.div>

          <Button
            variant="ghost"
            className="text-neon-blue-dark hover:text-neon-blue hover:bg-transparent group text-lg"
          >
            Conhecer a Metodologia{" "}
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}

// --- Benefits Grid ---
export function BenefitsSection() {
  const benefits = [
    {
      title: "Calls Individuais",
      desc: "Acompanhamento estratégico personalizado para o seu momento de negócio.",
      icon: <Smartphone className="w-8 h-8 text-neon-gold" />,
      delay: 0.1,
    },
    {
      title: "Gestão 360º",
      desc: "Administrativo, Financeiro, Marketing e Vendas em um só lugar.",
      icon: <TrendingUp className="w-8 h-8 text-neon-blue" />,
      delay: 0.2,
    },
    {
      title: "Viagem Exclusiva",
      desc: "Experiência presencial inesquecível para celebrar suas conquistas.",
      icon: <Star className="w-8 h-8 text-neon-gold" />,
      delay: 0.3,
    },
  ];

  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {benefits.map((benefit, idx) => (
            <motion.div key={benefit.title} variants={slideUp} custom={idx}>
              <NeonCard className="h-full hover:shadow-2xl transition-all duration-300 border-neon-border/40 group bg-white">
                <NeonCardHeader>
                  <div className="w-16 h-16 rounded-2xl bg-neon-gray/10 flex items-center justify-center mb-4 group-hover:bg-neon-blue-dark/5 transition-colors">
                    {benefit.icon}
                  </div>
                  <NeonCardTitle className="text-xl font-bold text-neon-blue-dark">
                    {benefit.title}
                  </NeonCardTitle>
                </NeonCardHeader>
                <NeonCardContent>
                  <p className="text-muted-foreground leading-relaxed">{benefit.desc}</p>
                </NeonCardContent>
              </NeonCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// --- Methodology Section (Protocolo) ---
export function MethodologySection() {
  const steps = [
    { number: "01", title: "Consumo", desc: "Assista às aulas na plataforma de membros." },
    { number: "02", title: "Execução", desc: "Responda às ferramentas aqui no Portal NEON." },
    { number: "03", title: "Análise", desc: "Monitore seus dados no Dashboard mensalmente." },
    {
      number: "04",
      title: "Mentoria",
      desc: "Tire dúvidas e ajuste a rota nos encontros ao vivo.",
    },
  ];

  return (
    <section className="py-24 bg-neon-blue-dark relative overflow-hidden text-white">
      {/* Abstract Shapes */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-neon-gold rounded-full blur-[150px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-neon-blue rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Protocolo da <span className="text-neon-gold">Elite</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-neon-blue-light/80"
          >
            O segredo não é a velocidade, é a direção. Siga o método.
          </motion.p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={slideUp}
              className="relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all group"
            >
              <div className="absolute -top-6 left-8 text-6xl font-black text-white/5 group-hover:text-neon-gold/20 transition-colors">
                {step.number}
              </div>
              <h3 className="text-xl font-bold mb-3 relative z-10">{step.title}</h3>
              <p className="text-sm text-white/60 relative z-10">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// --- Footer ---
export function SimpleFooter() {
  return (
    <footer className="py-12 bg-white border-t border-neon-border/50 text-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 bg-neon-blue-dark rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-neon-gold font-bold text-lg">N</span>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 Neon Mentoria Black. Grupo US.</p>
      </div>
    </footer>
  );
}
