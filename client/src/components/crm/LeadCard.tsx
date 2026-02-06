import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarPlus, Phone } from "lucide-react";
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
}

export function LeadCard({
  lead,
  onClick,
  isSelected,
  onToggleSelect,
  isSelectMode,
  onSchedule,
  onWhatsApp,
}: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `lead-${lead.id}`,
    data: lead,
    disabled: isSelectMode, // Disable drag when in selection mode
  });

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
        // Prevent click when checking checkbox
        if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
        onClick();
      }}
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border p-4 bg-card transition-all duration-200",
        // Hover state (premium lift)
        "hover:shadow-md hover:border-primary/20",
        // Dragging state
        isDragging &&
          "opacity-50 rotate-2 scale-105 shadow-xl cursor-grabbing z-50 ring-2 ring-primary",
        // Selected state
        isSelected && "border-primary bg-primary/5 ring-1 ring-primary",
        !isDragging && !isSelectMode && "cursor-grab",
        isSelectMode && "cursor-pointer"
      )}
    >
      {/* Quick Select Checkbox */}
      {isSelectMode && (
        <div className="absolute top-3 right-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect?.()}
            className="h-5 w-5 rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
        </div>
      )}

      {/* Header: Avatar, Name, Company */}
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 border border-border/50">
          <AvatarImage src={`https://ui-avatars.com/api/?name=${lead.nome}&background=random`} />
          <AvatarFallback className="text-xs bg-muted text-muted-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold truncate leading-none mb-1 text-foreground/90 group-hover:text-primary transition-colors">
            {lead.nome}
          </h4>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
            {lead.cargo && <span className="font-medium">{lead.cargo}</span>}
            {lead.cargo && lead.empresa && <span className="text-border">•</span>}
            {lead.empresa && <span>{lead.empresa}</span>}
          </div>
        </div>
      </div>

      {/* Tags Row */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {lead.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium border border-secondary-foreground/10"
            >
              {tag}
            </span>
          ))}
          {lead.tags.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md text-muted-foreground bg-muted font-medium">
              +{lead.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="h-px bg-border/40 w-full" />

      {/* Footer: Value & Actions */}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-sm font-semibold text-foreground/80 font-mono tracking-tight">
          {formattedValue}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Schedule Appointment Button */}
          {onSchedule && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-primary hover:text-primary/80 hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation();
                onSchedule(lead);
              }}
              title="Agendar Procedimento"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
            </Button>
          )}
          {/* WhatsApp Button - only shown if lead has phone */}
          {hasPhone && onWhatsApp && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
              onClick={(e) => {
                e.stopPropagation();
                onWhatsApp(lead);
              }}
              title="Enviar WhatsApp"
            >
              <Phone className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <Phone className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
