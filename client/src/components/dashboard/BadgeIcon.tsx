import {
  Activity,
  Award,
  CircleDollarSign,
  Clock,
  Crown,
  Flag,
  GraduationCap,
  Magnet,
  Map as MapIcon,
  Medal,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeIconProps {
  code: string;
  className?: string;
  size?: number;
}

export function BadgeIcon({ code, className, size = 24 }: BadgeIconProps) {
  const map: Record<string, { icon: React.ElementType; color: string }> = {
    // Consistência
    primeiro_registro: { icon: Flag, color: "text-blue-500" },
    consistencia_bronze: { icon: Medal, color: "text-amber-700" }, // Bronze
    consistencia_prata: { icon: Medal, color: "text-gray-400" }, // Silver
    consistencia_ouro: { icon: Medal, color: "text-yellow-500" }, // Gold
    pontualidade: { icon: Clock, color: "text-emerald-500" },

    // Faturamento
    meta_atingida: { icon: Target, color: "text-red-500" },
    crescimento_25: { icon: TrendingUp, color: "text-green-500" },
    crescimento_50: { icon: Rocket, color: "text-purple-500" },
    faturamento_6_digitos: { icon: CircleDollarSign, color: "text-cyan-500" }, // Changed from Diamond to CircleDollar for clarity

    // Ranking
    top_3_turma: { icon: Trophy, color: "text-yellow-600" },
    top_1_turma: { icon: Crown, color: "text-yellow-400" },
    acima_media: { icon: Activity, color: "text-indigo-500" },

    // Operacional
    gerador_leads: { icon: Magnet, color: "text-pink-500" },
    conversao_master: { icon: Sparkles, color: "text-violet-500" },

    // Especial
    evolucao_completa: { icon: GraduationCap, color: "text-blue-600" },
    jornada_completa: { icon: MapIcon, color: "text-fuchsia-500" },
  };

  const def = map[code] || { icon: Award, color: "text-muted-foreground" };
  const Icon = def.icon;

  return <Icon size={size} className={cn(def.color, className)} />;
}
