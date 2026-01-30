import { MentoradoAnalise } from "@/lib/data";
import { BentoCard, BentoCardHeader, BentoCardContent, BentoCardFooter } from "./ui/bento-grid";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Award,
  DollarSign,
  Instagram,
  Users,
  Activity,
  Lightbulb,
  Target,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MentoradoCardProps {
  nome: string;
  data: MentoradoAnalise;
  rank: number;
}

export default function MentoradoCard({
  nome,
  data,
  rank,
}: MentoradoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return "bg-emerald-500";
    if (percent >= 70) return "bg-blue-500";
    if (percent >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
      <BentoCard
        className={cn(
          "h-full relative overflow-hidden",
          isExpanded ? "ring-2 ring-neon-purple/20 md:col-span-2 md:row-span-2" : ""
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <BentoCardHeader
          title={nome}
          subtitle={
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5",
                  data.classificacao === "Excelente"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : data.classificacao === "Bom"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                      : data.classificacao === "Regular"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                        : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-800"
                )}
              >
                {data.classificacao}
              </Badge>
            </div>
          }
          icon={
            <div className="font-bold text-sm">
              {rank}º
            </div>
          }
          action={
            <div className="text-right">
              <div
                className={cn("text-2xl font-bold", getScoreColor(data.score))}
              >
                {data.score}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                Score
              </div>
            </div>
          }
        />

        <BentoCardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <DollarSign className="w-3 h-3" /> Faturamento
              </div>
              <div className="font-bold text-slate-900 dark:text-slate-100">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(data.dados.faturamento)}
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    getProgressColor(data.detalhes.faturamento.percentual)
                  )}
                  style={{
                    width: `${Math.min(data.detalhes.faturamento.percentual, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Activity className="w-3 h-3" /> Procedimentos
              </div>
              <div className="font-bold text-slate-900 dark:text-slate-100">
                {data.dados.procedimentos}{" "}
                <span className="text-xs font-normal text-slate-400">
                  realizados
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    getProgressColor(data.detalhes.procedimentos.percentual)
                  )}
                  style={{
                    width: `${Math.min(data.detalhes.procedimentos.percentual, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Instagram className="w-3 h-3" /> Posts Feed
                        </span>
                        <span className="font-medium">
                          {data.dados.posts_feed} /{" "}
                          {data.detalhes.posts_feed.esperado}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(
                          data.detalhes.posts_feed.percentual,
                          100
                        )}
                        className="h-1.5"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Instagram className="w-3 h-3" /> Stories
                        </span>
                        <span className="font-medium">
                          {data.dados.stories} /{" "}
                          {data.detalhes.stories.esperado}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(data.detalhes.stories.percentual, 100)}
                        className="h-1.5"
                      />
                    </div>
                  </div>

                  {data.detalhes.leads && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Users className="w-3 h-3" /> Leads Captados
                        </span>
                        <span className="font-medium">
                          {data.dados.leads} / {data.detalhes.leads.esperado}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(data.detalhes.leads.percentual, 100)}
                        className="h-1.5"
                      />
                    </div>
                  )}

                  <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 dark:bg-slate-900/50 dark:text-slate-400">
                    <div className="flex justify-between mb-1">
                      <span>Lucro do Mês:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(data.dados.lucro)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margem Estimada:</span>
                      <span
                        className={cn(
                          "font-bold",
                          data.dados.faturamento > 0
                            ? "text-slate-900 dark:text-slate-100"
                            : "text-slate-400"
                        )}
                      >
                        {data.dados.faturamento > 0
                          ? `${((data.dados.lucro / data.dados.faturamento) * 100).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </div>
                  </div>

                  {data.feedback && (
                    <div className="space-y-3 mt-4 bg-neon-purple/5 p-4 rounded-xl border border-neon-purple/10">
                      <div className="flex items-center gap-2 text-neon-purple font-bold text-sm">
                        <Target className="w-4 h-4" /> Plano de Ação Janeiro
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                            Análise Dezembro
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {data.feedback.analise_dezembro}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                            Foco Principal
                          </p>
                          <div className="flex items-start gap-2">
                            <ArrowRight className="w-4 h-4 text-neon-purple mt-0.5 flex-shrink-0" />
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {data.feedback.foco_janeiro}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                          <div className="flex items-center gap-2 text-neon-green-dark font-bold text-xs mb-2">
                            <Lightbulb className="w-3 h-3" /> Sugestão do Mentor
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
                            "{data.feedback.sugestao}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </BentoCardContent>

        <BentoCardFooter className="flex justify-center p-0 border-t-0 mt-0">
           <div className="h-1 w-8 bg-slate-200 rounded-full group-hover:bg-neon-purple/50 transition-colors dark:bg-slate-700" />
        </BentoCardFooter>
      </BentoCard>
  );
}
