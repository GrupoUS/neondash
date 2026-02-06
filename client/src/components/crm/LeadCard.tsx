import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarPlus, MessageCircle } from "lucide-react";
import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

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

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  isSelectMode?: boolean;
  onSchedule?: (lead: Lead) => void;
  onWhatsApp?: (lead: Lead) => void;
  isDragging?: boolean;
}

function LeadCardComponent({
  lead,
  onClick,
  isSelected,
  onToggleSelect,
  isSelectMode,
  onSchedule,
  onWhatsApp,
  isDragging: propIsDragging,
}: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: dndIsDragging,
  } = useSortable({
    id: `lead-${lead.id}`,
    data: lead,
    disabled: isSelectMode, // Disable drag when in selection mode
  });

  const isDragging = propIsDragging || dndIsDragging;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formattedValue = lead.valor
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(lead.valor)
    : "R$ 0,00";

  // Initials for avatar
  const initials = lead.nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const hasPhone = Boolean(lead.telefone && lead.telefone.trim().length > 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
        onClick();
      }}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border p-4 transition-all duration-300 ease-out",
        // Default State: Dark transparent card with blur
        "bg-card/40 backdrop-blur-md border-border/40 shadow-sm",
        // Hover State: Neon Glow & Lift
        !isDragging &&
          "hover:-translate-y-1 hover:shadow-[0_8px_30px_-10px_rgba(var(--primary),0.15)] hover:border-primary/30 hover:bg-card/60",
        // Dragging State
        isDragging && "opacity-0", // Hide original when dragging (overlay takes over)
        // Selected State
        isSelected && "border-primary bg-primary/10 ring-1 ring-primary",
        isSelectMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
      )}
    >
      {/* Quick Select Checkbox */}
      {isSelectMode && (
        <div className="absolute top-3 right-3 z-20">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect?.()}
            className="h-5 w-5 rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary/50"
          />
        </div>
      )}

      {/* Header: Avatar, Name, Company */}
      <div className="flex items-start gap-3 relative z-10">
        <div className="relative">
          <Avatar className="h-10 w-10 border border-primary/20 ring-2 ring-background shadow-lg transition-transform group-hover:scale-105">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${lead.nome}&background=random`} />
            <AvatarFallback className="text-xs bg-sidebar-primary text-sidebar-primary-foreground font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Status Dot Indicator */}
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
              lead.status === "novo"
                ? "bg-blue-500"
                : lead.status === "qualificado"
                  ? "bg-emerald-500"
                  : "bg-muted-foreground"
            )}
          />
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <h4 className="text-sm font-bold truncate leading-none mb-1.5 text-foreground group-hover:text-primary transition-colors">
            {lead.nome}
          </h4>
          <div className="flex flex-col gap-0.5">
            {lead.empresa ? (
              <span className="text-xs font-medium text-foreground/80 truncate flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-primary/50" />
                {lead.empresa}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground italic">Sem empresa</span>
            )}
            {lead.cargo && (
              <span className="text-[10px] text-muted-foreground truncate">{lead.cargo}</span>
            )}
          </div>
        </div>
      </div>

      {/* Tags Row - Minimalist Pills */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {lead.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/30 text-secondary-foreground font-medium border border-secondary/20 hover:border-secondary/50 transition-colors"
            >
              {tag}
            </span>
          ))}
          {lead.tags.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md text-muted-foreground bg-muted/30 font-medium">
              +{lead.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent w-full my-1" />

      {/* Footer: Value & Actions */}
      <div className="flex items-center justify-between relative z-10 h-7">
        <span
          className={cn(
            "text-sm font-bold font-mono tracking-tight",
            lead.valor ? "text-emerald-400" : "text-muted-foreground/60"
          )}
        >
          {formattedValue}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          {/* Schedule Appointment Button */}
          {onSchedule && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-lg text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onSchedule(lead);
              }}
              title="Agendar Procedimento"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
            </Button>
          )}
          {/* WhatsApp Button */}
          {hasPhone && onWhatsApp && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onWhatsApp(lead);
              }}
              title="Enviar WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export const LeadCard = memo(LeadCardComponent);
