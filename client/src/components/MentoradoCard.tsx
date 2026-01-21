import { MentoradoAnalise } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
    if (score >= 80) return "text-neon-green";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-yellow-500";
    return "text-neon-pink";
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return "bg-neon-green";
    if (percent >= 70) return "bg-blue-500";
    if (percent >= 40) return "bg-yellow-500";
    return "bg-neon-pink";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group",
          isExpanded ? "ring-2 ring-neon-purple/20" : ""
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardHeader className="pb-2 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                  rank <= 3
                    ? "bg-neon-purple text-white"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {rank}
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-neon-purple transition-colors">
                  {nome}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] font-medium px-2 py-0.5",
                      data.classificacao === "Excelente"
                        ? "bg-neon-green/10 text-neon-green-dark"
                        : data.classificacao === "Bom"
                          ? "bg-blue-50 text-blue-600"
                          : data.classificacao === "Regular"
                            ? "bg-yellow-50 text-yellow-600"
                            : "bg-red-50 text-red-600"
                    )}
                  >
                    {data.classificacao}
                  </Badge>
                </div>
              </div>
            </div>
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
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <DollarSign className="w-3 h-3" /> Faturamento
              </div>
              <div className="font-bold text-slate-900">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(data.dados.faturamento)}
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
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

            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Activity className="w-3 h-3" /> Procedimentos
              </div>
              <div className="font-bold text-slate-900">
                {data.dados.procedimentos}{" "}
                <span className="text-xs font-normal text-slate-400">
                  realizados
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
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
                <div className="pt-2 border-t border-slate-100 space-y-4">
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

                  <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600">
                    <div className="flex justify-between mb-1">
                      <span>Lucro do Mês:</span>
                      <span className="font-bold text-slate-900">
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
                            ? "text-slate-900"
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
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {data.feedback.analise_dezembro}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                            Foco Principal
                          </p>
                          <div className="flex items-start gap-2">
                            <ArrowRight className="w-4 h-4 text-neon-purple mt-0.5 flex-shrink-0" />
                            <p className="text-sm font-medium text-slate-900">
                              {data.feedback.foco_janeiro}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-2 text-neon-green-dark font-bold text-xs mb-2">
                            <Lightbulb className="w-3 h-3" /> Sugestão do Mentor
                          </div>
                          <p className="text-sm text-slate-600 italic leading-relaxed">
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

          <div className="mt-2 flex justify-center">
            <div className="h-1 w-8 bg-slate-200 rounded-full group-hover:bg-neon-purple/50 transition-colors" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
