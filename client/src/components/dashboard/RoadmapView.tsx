import { motion } from "framer-motion";
import { Check, FileText, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { getModuleIcon } from "./RoadmapIcons";

interface RoadmapViewProps {
  mentoradoId?: number;
}

export function RoadmapView({ mentoradoId }: RoadmapViewProps) {
  const { data: roadmap, isLoading } = trpc.playbook.getRoadmap.useQuery({ mentoradoId });

  if (isLoading || !roadmap) {
    return (
      <div className="w-full h-96 bg-slate-950/50 animate-pulse rounded-3xl border border-slate-800/50" />
    );
  }

  const modules = roadmap.modules;
  const modulesPerRow = 3;

  // Calculate rows
  const rows = [];
  for (let i = 0; i < modules.length; i += modulesPerRow) {
    rows.push(modules.slice(i, i + modulesPerRow));
  }

  const totalProgress = calculateTotalProgress(modules);

  return (
    <div className="w-full bg-[#0B1221] rounded-3xl p-6 md:p-10 relative overflow-hidden border border-[#D4AF37]/10 shadow-2xl">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#0F4C75]/10 rounded-full blur-[100px] -z-10" />

      {/* Header */}
      <div className="relative z-10 mb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
          Jornada NEON: Seu Caminho para o Sucesso
        </h2>
        <div className="h-1.5 w-32 bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
      </div>

      {/* Snake Layout Container */}
      <div className="relative z-10 max-w-6xl mx-auto pb-12">
        {rows.map((rowModules, rowIndex) => {
          const isReverse = rowIndex % 2 !== 0; // Even rows (0, 2) left-to-right, Odd rows (1, 3) right-to-left
          const isLastRow = rowIndex === rows.length - 1;

          return (
            <div key={rowIndex} className="relative mb-32 last:mb-0 md:mb-40">
              {/* Connector Lines */}
              {!isLastRow && (
                <div
                  className={cn(
                    "absolute top-1/2 w-32 h-52 border-[6px] border-slate-800 -z-10 hidden md:block",
                    isReverse
                      ? "left-0 rounded-l-[4rem] border-r-0 translate-x-[-50%]" // Curve on left for reverse rows end
                      : "right-0 rounded-r-[4rem] border-l-0 translate-x-[50%]" // Curve on right for normal rows end
                  )}
                  style={{ top: "35%" }} // Adjust vertical alignment of the curve
                />
              )}

              {/* Horizontal Line Background for the row */}
              <div className="absolute top-12 left-0 w-full h-[6px] bg-slate-800 -z-20 hidden md:block rounded-full" />

              <div
                className={cn(
                  "flex flex-col md:flex-row gap-12 md:gap-0 justify-between items-center w-full relative",
                  isReverse ? "md:flex-row-reverse" : ""
                )}
              >
                {rowModules.map((module, index) => {
                  // Calculate absolute index to determine first/last in global list or row
                  const globalIndex = rowIndex * modulesPerRow + index;

                  return (
                    <div
                      key={module.id}
                      className="relative group w-full md:w-auto flex justify-center"
                    >
                      {/* Special Case: Diagnostic Button below Module 1 */}
                      {globalIndex === 0 && (
                        <DiagnosticButton isCompleted={roadmap.diagnostic.isCompleted} />
                      )}

                      <RoadmapNode
                        module={module}
                        locked={module.isLocked}
                        active={module.status === "in_progress"}
                        completed={module.status === "completed"}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Progress Bar */}
      <div className="w-full mt-12 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div className="flex justify-between text-sm font-semibold mb-3">
          <span className="text-slate-300 uppercase tracking-wider">
            Progresso Geral: {roadmap.modules.filter((m) => m.status === "completed").length}/
            {roadmap.modules.length} Módulos ({totalProgress}%)
          </span>
          <span className="text-[#D4AF37]">{totalProgress}%</span>
        </div>
        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${totalProgress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#D4AF37] relative"
          >
            {/* Shimmer Effect */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] animate-shimmer" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function DiagnosticButton({ isCompleted }: { isCompleted: boolean }) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-10 md:mt-14 z-20 flex flex-col items-center group/diag">
      {/* Down Connector */}
      <div className="w-[3px] h-10 md:h-14 bg-gradient-to-b from-[#D4AF37] to-slate-700 mb-0 group-hover/diag:to-[#D4AF37] transition-colors duration-500" />

      <motion.div
        whileHover={{ scale: 1.05 }}
        className={cn(
          "flex items-center gap-3 px-6 py-3.5 rounded-xl border-2 transition-all shadow-xl backdrop-blur-md cursor-pointer whitespace-nowrap",
          isCompleted
            ? "bg-[#0B1221]/90 border-[#D4AF37]/50 text-[#D4AF37] shadow-[#D4AF37]/20"
            : "bg-slate-900/90 border-slate-700 text-slate-400 hover:border-slate-500"
        )}
      >
        <div className={cn("p-1.5 rounded-lg", isCompleted ? "bg-[#D4AF37]/10" : "bg-slate-800")}>
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <span className="block text-xs font-bold uppercase tracking-wider opacity-80 mb-0.5">
            Extra
          </span>
          <span className="font-bold text-sm">Diagnóstico do Negócio</span>
        </div>
        {isCompleted && <Check className="w-4 h-4 ml-2 text-emerald-400" />}
      </motion.div>
    </div>
  );
}

function calculateTotalProgress(modules: any[]) {
  if (!modules?.length) return 0;
  const totalProg = modules.reduce((acc, m) => acc + (m.progress || 0), 0);
  return Math.round(totalProg / modules.length);
}

// Node Component
interface RoadmapNodeProps {
  module: any;
  locked?: boolean;
  active?: boolean;
  completed?: boolean;
}

function RoadmapNode({ module, locked, active, completed }: RoadmapNodeProps) {
  if (!module) return <div className="w-72 h-32 opacity-0" />;

  const Icon = getModuleIcon(module.order, module.title);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: module.order * 0.1 }}
      className={cn(
        "relative w-full md:w-[22rem] p-1.5 rounded-[2.5rem] transition-all duration-500 group",
        active
          ? "bg-gradient-to-b from-[#D4AF37] via-[#F2D06B] to-[#AA8C2C] shadow-[0_0_50px_-10px_rgba(212,175,55,0.4)] scale-105 z-10"
          : locked
            ? "bg-slate-800/50"
            : "bg-slate-700 hover:bg-slate-600 border border-slate-600/50 hover:border-slate-500"
      )}
    >
      {/* Inner Card */}
      <div
        className={cn(
          "bg-[#0F172A] rounded-[2.2rem] p-5 h-28 flex items-center gap-5 relative overflow-hidden transition-colors",
          active ? "bg-gradient-to-br from-[#1e293b] to-[#0f172a]" : ""
        )}
      >
        {/* Glow behind icon */}
        {active && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2 w-16 h-16 bg-[#D4AF37]/20 rounded-full blur-xl animate-pulse" />
        )}

        {/* Icon Circle */}
        <div
          className={cn(
            "shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-xl border relative z-10",
            active
              ? "bg-gradient-to-br from-[#D4AF37] to-[#AA8C2C] text-[#0F172A] border-[#F2D06B]"
              : locked
                ? "bg-slate-800/80 text-slate-600 border-slate-700"
                : "bg-slate-700/80 text-slate-300 border-slate-600 group-hover:bg-slate-600 transition-colors"
          )}
        >
          {locked ? <Lock className="w-6 h-6 opacity-50" /> : <Icon className="w-7 h-7" />}

          {/* Milestone Star for specific modules (e.g., every 3rd or similar) - Optional logic */}
          {completed && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#0F172A] shadow-md">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 z-10">
          <div className="flex justify-between items-center mb-1">
            <p
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                active ? "text-[#D4AF37]" : "text-slate-500"
              )}
            >
              Módulo {module.order}
            </p>
            {active && (
              <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/20">
                {module.progress}%
              </span>
            )}
          </div>

          <h3
            className={cn(
              "text-base font-bold leading-tight mb-1 line-clamp-2",
              locked ? "text-slate-600 font-medium" : "text-white"
            )}
            title={module.title}
          >
            {module.title}
          </h3>

          {/* Sub-status */}
          <p className="text-[11px] font-medium text-slate-400">
            {locked
              ? "Bloqueado"
              : active
                ? "Em andamento"
                : completed
                  ? "Concluído"
                  : "Disponível"}
          </p>
        </div>

        {/* Progress Bar Background for Active Modules (Bottom Line) */}
        {active && (
          <div
            className="absolute bottom-0 left-0 h-1 bg-[#D4AF37]"
            style={{ width: `${module.progress}%` }}
          />
        )}
      </div>
    </motion.div>
  );
}
