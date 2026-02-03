import { motion } from "framer-motion";
import { ClipboardList, Rocket, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface NewMentoradoWelcomeProps {
  mentoradoName: string;
  onNavigateToDiagnostico?: () => void;
}

export function NewMentoradoWelcome({
  mentoradoName,
  onNavigateToDiagnostico,
}: NewMentoradoWelcomeProps) {
  const firstName = mentoradoName.split(" ")[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl mx-auto py-8"
    >
      {/* Welcome Hero Section */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 dark:from-slate-900/80 dark:via-slate-950 dark:to-slate-900/50 border-primary/20 shadow-2xl">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <CardHeader className="relative z-10 text-center pt-10 pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#AA8C2C] flex items-center justify-center shadow-xl shadow-[#D4AF37]/20"
          >
            <Sparkles className="w-10 h-10 text-slate-900" />
          </motion.div>

          <CardTitle className="text-3xl md:text-4xl font-bold text-foreground">
            Bem-vindo à Mentoria NEON, {firstName}! 🎉
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
            Estamos muito felizes em ter você conosco. Para começar a acompanhar sua evolução,
            precisamos de algumas informações iniciais.
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 pb-10">
          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Card className="relative bg-card/80 dark:bg-slate-900/60 border-border dark:border-slate-700/50 hover:border-primary/30 transition-all h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#AA8C2C] flex items-center justify-center shadow-lg">
                    <ClipboardList className="w-7 h-7 text-slate-900" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">
                    1. Preencha o Diagnóstico
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Conte-nos sobre sua especialidade, metas e situação atual.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Card className="relative bg-card/80 dark:bg-slate-900/60 border-border dark:border-slate-700/50 hover:border-emerald-500/30 transition-all h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">
                    2. Registre suas Métricas
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Informe faturamento, leads e procedimentos do mês.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Card className="relative bg-card/80 dark:bg-slate-900/60 border-border dark:border-slate-700/50 hover:border-blue-500/30 transition-all h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Rocket className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">
                    3. Acompanhe sua Evolução
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Veja gráficos, conquistas e o roadmap de crescimento.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-10 text-center"
          >
            <Button
              size="lg"
              onClick={onNavigateToDiagnostico}
              className="bg-gradient-to-r from-[#D4AF37] to-[#AA8C2C] hover:from-[#E5C048] hover:to-[#BB9D3D] text-slate-900 font-bold px-8 py-6 text-lg rounded-xl shadow-xl shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 transition-all hover:scale-105"
            >
              <ClipboardList className="w-5 h-5 mr-2" />
              Começar pelo Diagnóstico
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Leva menos de 5 minutos para preencher
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
