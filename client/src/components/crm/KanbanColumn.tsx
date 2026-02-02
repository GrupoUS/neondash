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
    <div className="flex flex-col h-full min-w-[320px] w-[320px]">
      {/* Header */}
      <div
        className={cn(
          "flex flex-col gap-2 p-3 mb-3 rounded-lg border bg-card/50 backdrop-blur-sm",
          borderColor
        )}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", accentColor)} />
            <h3 className="font-semibold text-sm text-foreground">{title}</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {safeLeads.length}
            </span>
          </div>
        </div>

        {showAddButton && (
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 text-xs border border-dashed border-border/50"
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
          "flex-1 rounded-xl p-2 transition-colors duration-200 gap-3 flex flex-col",
          "bg-muted/30 border border-transparent",
          activeId && !activeId.includes(id) && "border-dashed border-border bg-muted/50"
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
            />
          ))}
        </SortableContext>

        {safeLeads.length === 0 && (
          <div className="h-24 flex items-center justify-center text-xs text-muted-foreground/50 border-2 border-dashed border-border/50 rounded-lg">
            Arraste leads para cá
          </div>
        )}
      </div>

      {/* Footer Summary - Optional */}
      {totalValue > 0 && (
        <div className="mt-2 text-right px-2">
          <span className="text-xs font-medium text-muted-foreground">
            Total:{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(totalValue)}
          </span>
        </div>
      )}
    </div>
  );
}
