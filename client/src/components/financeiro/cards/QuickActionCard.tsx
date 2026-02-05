import { Plus } from "lucide-react";

import { NeonCard } from "@/components/ui/neon-card";

interface QuickActionCardProps {
  onClick: () => void;
}

export function QuickActionCard({ onClick }: QuickActionCardProps) {
  return (
    <NeonCard
      className="p-6 h-full flex flex-col justify-center items-center gap-4 bg-primary/5 hover:bg-primary/10 border-primary/20 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors group-hover:scale-110 duration-300">
        <Plus className="w-8 h-8 text-primary" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
          Nova Transação
        </h3>
        <p className="text-xs text-muted-foreground mt-1">Registre uma entrada ou saída</p>
      </div>
    </NeonCard>
  );
}
