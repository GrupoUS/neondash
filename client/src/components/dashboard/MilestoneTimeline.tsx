import { Building, MonitorPlay, Trophy, Users } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Mock Data matching the image
const MILESTONES = [
  {
    icon: Users,
    title: "Início da Mentoria",
    date: "Fev 2023",
    status: "completed",
  },
  {
    icon: Building,
    title: "Primeira Clínica Inaugurada",
    date: "Mai 2023",
    status: "completed",
  },
  {
    icon: Trophy, // Money icon in image, using Trophy for achievement
    title: "Primeiros 100k de Receita",
    date: "Set 2023",
    status: "completed",
  },
  {
    icon: Users,
    title: "Contratação de Primeira Secretária",
    date: "Dez 2023",
    status: "completed",
  },
  {
    icon: MonitorPlay,
    title: "Lançamento de Curso Online",
    date: "Mar 2024",
    status: "completed",
  },
];

export function MilestoneTimeline() {
  return (
    <div className="w-full">
      <ScrollArea className="w-full whitespace-nowrap rounded-md">
        <div className="flex w-max space-x-8 p-4">
          {MILESTONES.map((milestone, index) => (
            <div key={index} className="flex flex-col items-center relative gap-4 w-[160px]">
              {/* Connecting Line (Horizontal) - Conceptual */}
              {index < MILESTONES.length - 1 && (
                <div className="absolute top-5 left-1/2 w-full h-[2px] bg-slate-700 -z-10"></div>
              )}

              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 bg-slate-900 z-10",
                  milestone.status === "completed"
                    ? "border-[#D4AF37] text-[#D4AF37]"
                    : "border-slate-700 text-slate-500"
                )}
              >
                <milestone.icon className="w-5 h-5" />
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-slate-200 whitespace-normal h-10 flex items-center justify-center">
                  {milestone.title}
                </p>
                <p className="text-xs text-slate-500 font-medium">{milestone.date}</p>
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="bg-slate-800" />
      </ScrollArea>
    </div>
  );
}
