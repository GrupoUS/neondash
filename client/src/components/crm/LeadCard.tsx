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
    disabled: isSelectMode,
  });

  const isDragging = propIsDragging || dndIsDragging;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
  };

  const hasValue = lead.valor != null && lead.valor > 0;
  const hasTags = lead.tags != null && lead.tags.length > 0;
  const hasFooterContent = hasValue;

  const formattedValue = hasValue
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(lead.valor!)
    : null;

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
        "group relative flex flex-col rounded-xl border transition-all duration-200 ease-out",
        // Adaptive padding: compact base
        "p-3 gap-2",
        // Default State
        "bg-card/40 backdrop-blur-md border-border/40 shadow-sm",
        // Hover State
        !isDragging &&
          "hover:-translate-y-0.5 hover:shadow-[0_6px_24px_-8px_rgba(var(--primary),0.15)] hover:border-primary/30 hover:bg-card/60",
        // Dragging State — ghost placeholder instead of hiding
        isDragging && "opacity-40 scale-[0.97] ring-2 ring-primary/30 shadow-none",
        // Selected State
        isSelected && "border-primary bg-primary/10 ring-1 ring-primary",
        isSelectMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
      )}
    >
      {/* Quick Select Checkbox */}
      {isSelectMode && (
        <div className="absolute top-2.5 right-2.5 z-20">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect?.()}
            className="h-5 w-5 rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary/50"
          />
        </div>
      )}

      {/* Header: Avatar, Name, Company */}
      <div className="flex items-start gap-2.5 relative z-10">
        <div className="relative shrink-0">
          <Avatar className="h-9 w-9 border border-primary/20 ring-2 ring-background shadow-lg transition-transform group-hover:scale-105">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${lead.nome}&background=random`} />
            <AvatarFallback className="text-[11px] bg-sidebar-primary text-sidebar-primary-foreground font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Status Dot */}
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background",
              lead.status === "novo"
                ? "bg-blue-500"
                : lead.status === "qualificado"
                  ? "bg-emerald-500"
                  : "bg-muted-foreground"
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold truncate leading-tight text-foreground group-hover:text-primary transition-colors">
            {lead.nome}
          </h4>
          {lead.empresa ? (
            <span className="text-xs text-foreground/70 truncate block leading-tight mt-0.5">
              {lead.empresa}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/50 italic block leading-tight mt-0.5">
              Sem empresa
            </span>
          )}
          {lead.cargo && (
            <span className="text-[10px] text-muted-foreground truncate block leading-tight">
              {lead.cargo}
            </span>
          )}
        </div>
      </div>

      {/* Tags — only rendered when present */}
      {hasTags && (
        <div className="flex flex-wrap gap-1">
          {lead.tags!.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-px rounded-md bg-secondary/30 text-secondary-foreground font-medium border border-secondary/20"
            >
              {tag}
            </span>
          ))}
          {lead.tags!.length > 3 && (
            <span className="text-[10px] px-1.5 py-px rounded-md text-muted-foreground bg-muted/30 font-medium">
              +{lead.tags!.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer — only rendered when there's a value or actions */}
      {hasFooterContent && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent w-full" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-sm font-bold font-mono tracking-tight text-emerald-400">
              {formattedValue}
            </span>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
              {onSchedule && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 rounded-lg text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSchedule(lead);
                  }}
                  title="Agendar Procedimento"
                >
                  <CalendarPlus className="h-3 w-3" />
                </Button>
              )}
              {hasPhone && onWhatsApp && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onWhatsApp(lead);
                  }}
                  title="Enviar WhatsApp"
                >
                  <MessageCircle className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export const LeadCard = memo(LeadCardComponent);
