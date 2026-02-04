import { motion } from "framer-motion";
import { ClipboardCheck, Edit3, Lightbulb, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DiagnosticoData {
  objetivo6Meses?: string | null;
  incomodaRotina?: string | null;
  visaoUmAno?: string | null;
  rendaMensal?: string | null;
  nivelPrioridade?: string | null;
}

interface DiagnosticoSummaryCardProps {
  diagnostico: DiagnosticoData;
  mentoradoName: string;
  onNavigateToDiagnostico?: () => void;
}

export function DiagnosticoSummaryCard({
  diagnostico,
  mentoradoName,
  onNavigateToDiagnostico,
}: DiagnosticoSummaryCardProps) {
  const firstName = mentoradoName.split(" ")[0];

  // Truncate text for display
  const truncate = (text: string | null | undefined, maxLength = 100) => {
    if (!text) return "Não informado";
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-background to-primary/5 dark:from-slate-900/80 dark:via-slate-950 dark:to-emerald-900/30 border-emerald-500/20 shadow-xl">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <CardHeader className="relative z-10 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-foreground">Diagnóstico Completo ✓</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Ótimo trabalho, {firstName}! Seu diagnóstico foi registrado.
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToDiagnostico}
              className="border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Objetivo 6 meses */}
            <div className="p-4 rounded-xl bg-card/60 dark:bg-slate-900/40 border border-border dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Meta 6 Meses
                </span>
              </div>
              <p className="text-sm text-foreground">{truncate(diagnostico.objetivo6Meses)}</p>
            </div>

            {/* Visão 1 ano */}
            <div className="p-4 rounded-xl bg-card/60 dark:bg-slate-900/40 border border-border dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Visão 1 Ano
                </span>
              </div>
              <p className="text-sm text-foreground">{truncate(diagnostico.visaoUmAno)}</p>
            </div>
          </div>

          {/* Next Step Prompt */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 dark:from-slate-800/60 dark:to-slate-900/40 border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Próximo passo:</span> Registre suas
              métricas mensais na aba <span className="text-primary font-medium">Métricas</span>{" "}
              para visualizar sua evolução nos gráficos.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
