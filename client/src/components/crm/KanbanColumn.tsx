import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LeadCard } from "./LeadCard";

interface Lead {
  id: number;
  nome: string;
  empresa?: string | null;
  cargo?: string | null;
  status: string;
  valor?: number | null;
  tags?: string[] | null;
  created_at?: string | Date | null;
  telefone?: string | null;
}

interface KanbanColumnProps {
  id: string;
  title: string;
  leads: Lead[];
  activeId: string | null;
  onLeadClick: (id: number) => void;
  accentColor: string;
  isSelectMode: boolean;
  selectedLeads: number[];
  onToggleSelect: (id: number) => void;
  showAddButton?: boolean;
  onAddLead?: () => void;
  onSchedule?: (lead: Lead) => void;
  onWhatsApp?: (lead: Lead) => void;
}

export function KanbanColumn({
  id,
  title,
  leads,
  activeId,
  onLeadClick,
  accentColor,
  isSelectMode,
  selectedLeads,
  onToggleSelect,
  showAddButton,
  onAddLead,
  onSchedule,
  onWhatsApp,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  // Safe check for leads
  const safeLeads = leads || [];
  const leadIds = safeLeads.map((l) => `lead-${l.id}`);
  const totalValue = safeLeads.reduce((acc, lead) => acc + (lead.valor || 0), 0);

  // Extract color class for border/bg accent
  // Typically: "bg-blue-500" -> we might want lighter versions or border
  const borderColor = accentColor.replace("bg-", "border-").replace("500", "500/30");
  const _badgeColor = accentColor.replace("bg-", "text-"); // rudimentary, better to pass separate props or map

  return (
  return (
    <div className="flex flex-col h-full min-w-[320px] w-[320px]">
      {/* Header - Glass & Minimal */}
      <div
        className={cn(
          "flex flex-col gap-2 p-4 mb-4 rounded-xl border border-border/40 bg-card/20 backdrop-blur-md shadow-sm transition-all duration-300 group hover:border-border/60 hover:bg-card/30 relative overflow-hidden"
        )}
      >
        {/* Top Accent Line */}
        <div className={cn("absolute top-0 left-0 right-0 h-[2px] opacity-70", accentColor)} />
        
        <div className="flex items-center justify-between w-full relative z-10">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-sm tracking-wide text-foreground uppercase">{title}</h3>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full border bg-background/50 backdrop-blur-sm",
              borderColor.replace("border-", "text-")
            )}>
              {safeLeads.length}
            </span>
          </div>
        </div>

        {showAddButton && (
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/5 h-8 text-xs border border-dashed border-border/30 hover:border-primary/30 mt-1 transition-all"
            onClick={onAddLead}
          >
            <Plus className="w-3 h-3 mr-2" /> Novo Lead
          </Button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 rounded-xl transition-all duration-300 gap-3 flex flex-col p-1",
          activeId && !activeId.includes(id) 
            ? "bg-primary/5 border-2 border-dashed border-primary/20" 
            : "border-2 border-transparent"
        )}
      >
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {safeLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick(lead.id)}
              isSelected={isSelectMode && selectedLeads.includes(lead.id)}
              onToggleSelect={() => onToggleSelect(lead.id)}
              isSelectMode={isSelectMode}
              onSchedule={onSchedule}
              onWhatsApp={onWhatsApp}
            />
          ))}
        </SortableContext>

        {safeLeads.length === 0 && (
          <div className="h-32 flex flex-col items-center justify-center text-xs text-muted-foreground/30 border-2 border-dashed border-border/20 rounded-xl bg-card/5 backdrop-blur-sm gap-2 transition-all hover:border-border/40 hover:text-muted-foreground/50">
            <div className="w-8 h-8 rounded-full bg-background/50 flex items-center justify-center">
              <Plus className="w-4 h-4 opacity-50" />
            </div>
            <span>Arraste leads para cá</span>
          </div>
        )}
      </div>

      {/* Footer Summary */}
      {totalValue > 0 && (
        <div className="mt-3 text-right px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/20 border border-border/30 backdrop-blur-sm">
             <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</span>
             <span className="text-xs font-bold text-foreground font-mono">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                notation: "compact"
              }).format(totalValue)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
