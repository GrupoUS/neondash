import { Check, FileText, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface RoadmapViewProps {
  mentoradoId?: number;
}

export function RoadmapView({ mentoradoId }: RoadmapViewProps) {
  const { data: roadmap, isLoading } = trpc.playbook.getRoadmap.useQuery({ mentoradoId });

  if (isLoading || !roadmap) {
    return <div className="h-64 w-full bg-slate-800/50 animate-pulse rounded-2xl" />;
  }

  return (
    <div className="w-full bg-gradient-to-b from-slate-900/0 to-slate-950/30 rounded-3xl p-6 md:p-10 relative overflow-hidden">
      {/* Section Title */}
      <div className="relative z-10 mb-12">
        <h2 className="text-xl font-bold text-white mb-2">
          Jornada NEON: Seu Caminho para o Sucesso
        </h2>
        <div className="h-1 w-24 bg-[#D4AF37] rounded-full" />
      </div>

      {/* Snake Layout Container */}
      <div className="relative z-10 flex flex-col items-center gap-16 md:gap-24 max-w-5xl mx-auto">
        {/* Row 1: Module 1 -> Module 2 -> Module 3 */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center w-full justify-between relative">
          {/* Connection Line Background (Desktop) */}
          <div className="absolute top-1/2 left-0 w-full h-[6px] bg-slate-800 -z-10 hidden md:block rounded-full transform -translate-y-1/2" />

          {/* Module 1 */}
          <div className="relative group">
            <RoadmapNode
              module={roadmap.modules[0]}
              isDiagnostic
              active={roadmap.modules[0]?.status === "in_progress"}
              completed={roadmap.modules[0]?.status === "completed"}
              isLeftStart
            />

            {/* Special Branch: Diagnostic */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-8 md:mt-12 flex flex-col items-center z-20">
              {/* Down connector */}
              <div className="w-[2px] h-8 md:h-12 bg-[#D4AF37] mb-0" />

              <div
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-full border transition-all hover:scale-105 cursor-pointer whitespace-nowrap",
                  roadmap.diagnostic.isCompleted
                    ? "bg-slate-800/80 border-[#D4AF37]/50 text-[#D4AF37]"
                    : "bg-slate-900/80 border-slate-700 text-slate-400"
                )}
              >
                <FileText className="w-4 h-4" />
                <span className="font-medium text-sm">Diagnóstico do Negócio</span>
                {roadmap.diagnostic.isCompleted && <Check className="w-4 h-4 ml-2" />}
              </div>
            </div>
          </div>

          {/* Module 2 */}
          <RoadmapNode
            module={roadmap.modules[1]}
            locked={roadmap.modules[1]?.isLocked}
            active={roadmap.modules[1]?.status === "in_progress"}
            completed={roadmap.modules[1]?.status === "completed"}
          />

          {/* Module 3 */}
          <div className="relative">
            <RoadmapNode
              module={roadmap.modules[2]}
              locked={roadmap.modules[2]?.isLocked}
              active={roadmap.modules[2]?.status === "in_progress"}
              completed={roadmap.modules[2]?.status === "completed"}
              isRightTurn
            />
            {/* Curve Connector for Next Row */}
            <div
              className="absolute top-1/2 right-1/2 translate-x-1/2 w-[50vw] h-32 md:w-32 md:h-32 border-r-[6px] border-b-[6px] border-slate-800 rounded-br-[4rem] -z-20 hidden md:block"
              style={{ transform: "translate(50%, 0)" }}
            />
          </div>
        </div>

        {/* Row 2: Module 6 <- Module 5 <- Module 4 (Reverse) */}
        <div className="flex flex-col-reverse md:flex-row-reverse gap-8 md:gap-16 items-center w-full justify-between relative mt-12 md:mt-0">
          {/* Connection Line Background (Desktop) */}
          <div className="absolute top-1/2 left-0 w-full h-[6px] bg-slate-800 -z-10 hidden md:block rounded-full transform -translate-y-1/2" />

          {/* Module 6 */}
          <div className="relative">
            <RoadmapNode
              module={roadmap.modules[5]} // Index 5 if exists
              locked={roadmap.modules[5]?.isLocked}
              completed={roadmap.modules[5]?.status === "completed"}
              isLeftTurn
            />
            {/* Curve Connector from previous Row (Not needed here visually if we use consistent S shape logic, but complex to perfect in CSS only. Simplification: Just rows) */}
          </div>

          {/* Module 5 */}
          <RoadmapNode
            module={roadmap.modules[4]}
            locked={roadmap.modules[4]?.isLocked}
            completed={roadmap.modules[4]?.status === "completed"}
          />

          {/* Module 4 */}
          <RoadmapNode
            module={roadmap.modules[3]}
            locked={roadmap.modules[3]?.isLocked}
            completed={roadmap.modules[3]?.status === "completed"}
          />
        </div>

        {/* Global Progress Bar (Bottom) */}
        <div className="w-full mt-8">
          <div className="flex justify-between text-sm text-slate-400 mb-2 font-medium">
            <span>Progresso Geral</span>
            <span>{calculateTotalProgress(roadmap.modules)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] transition-all duration-1000 ease-out"
              style={{ width: `${calculateTotalProgress(roadmap.modules)}%` }}
            />
          </div>
        </div>
      </div>
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
  isDiagnostic?: boolean;
  locked?: boolean;
  active?: boolean;
  completed?: boolean;
  isLeftStart?: boolean;
  isRightTurn?: boolean;
  isLeftTurn?: boolean;
}

function RoadmapNode({ module, locked, active, completed }: RoadmapNodeProps) {
  if (!module) return <div className="w-64 h-24 opacity-0" />; // Spacer

  return (
    <div
      className={cn(
        "relative w-full md:w-80 p-1 rounded-[2rem] transition-all duration-300",
        active
          ? "bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#D4AF37] shadow-[0_0_40px_-10px_rgba(212,175,55,0.6)] scale-105"
          : locked
            ? "bg-slate-800"
            : "bg-slate-700 hover:bg-slate-600"
      )}
    >
      {/* Inner Card */}
      <div
        className={cn(
          "bg-[#0F172A] rounded-[1.8rem] p-5 h-full flex items-center gap-4 relative overflow-hidden",
          active ? "bg-[#14120a]" : ""
        )}
      >
        {/* Icon Circle */}
        <div
          className={cn(
            "shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shadow-lg",
            active
              ? "bg-gradient-to-br from-[#D4AF37] to-[#AA8C2C] text-slate-900"
              : locked
                ? "bg-slate-800 text-slate-600"
                : "bg-slate-700 text-slate-300"
          )}
        >
          {locked ? <Lock className="w-6 h-6" /> : completed ? <Check className="w-7 h-7" /> : "M"}
          {/* Can replace "M" with specific icons based on module title if mapped */}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-xs font-bold uppercase tracking-wider mb-0.5",
              active ? "text-[#D4AF37]" : "text-slate-500"
            )}
          >
            Módulo {module.order}
          </p>
          <h3
            className={cn(
              "text-sm font-bold leading-tight mb-1 truncate",
              locked ? "text-slate-600" : "text-white"
            )}
          >
            {module.title}
          </h3>

          {/* Sub-status */}
          <p className="text-[10px] font-medium text-slate-400">
            {locked
              ? "Bloqueado"
              : active
                ? `Em Progresso - ${module.progress}%`
                : completed
                  ? "Concluído"
                  : "Disponível"}
          </p>
        </div>
      </div>
    </div>
  );
}
