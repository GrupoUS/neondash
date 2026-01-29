import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";
import { Phone, MessageSquare, Plus, MessageCircle } from "lucide-react";

interface PipelineKanbanProps {
  filters: any;
  onLeadClick: (leadId: number) => void;
  onCreateOpen: () => void;
  mentoradoId?: number;
}

// Columns matching the image and updated schema
const COLUMNS = [
  { id: "novo", title: "Novo", color: "bg-yellow-500" },
  { id: "primeiro_contato", title: "Primeiro Contato", color: "bg-orange-400" },
  { id: "qualificado", title: "Qualificado", color: "bg-purple-500" },
  { id: "proposta", title: "Proposta", color: "bg-orange-600" },
  { id: "negociacao", title: "Negociação", color: "bg-pink-500" },
  { id: "fechado", title: "Fechado", color: "bg-green-500" },
];

export function PipelineKanban({ filters, onLeadClick, onCreateOpen, mentoradoId }: PipelineKanbanProps) {
  const { data, isLoading, refetch } = trpc.leads.list.useQuery({
    ...filters,
    status: undefined, // Kanban shows all statuses
    limit: 100,
    mentoradoId,
  });

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const [activeId, setActiveId] = useState<number | null>(null);

  const leadsByStatus = useMemo(() => {
    const groups: Record<string, any[]> = {};
    COLUMNS.forEach(col => groups[col.id] = []);

    // Also handle 'perdido' or others not in columns if needed,
    // but for now we focus on the visible columns.

    if (data?.leads) {
      data.leads.forEach(lead => {
        // Map old statuses if necessary (e.g. em_contato -> primeiro_contato if we didn't migrate data)
        // But assuming schema update is authoritative:
        if (groups[lead.status]) {
          groups[lead.status].push(lead);
        } else if ((lead.status as string) === "em_contato" && groups["primeiro_contato"]) {
          groups["primeiro_contato"].push(lead);
        } else if ((lead.status as string) === "proposta_enviada" && groups["proposta"]) {
          groups["proposta"].push(lead);
        } else if ((lead.status as string) === "fechado_ganho" && groups["fechado"]) {
          groups["fechado"].push(lead);
        }
      });
    }
    return groups;
  }, [data]);

  const activeLead = useMemo(() => {
    return data?.leads.find(l => l.id === activeId);
  }, [data, activeId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const leadId = active.id as number;
    let newStatus = over.id as string;
    const lead = data?.leads.find(l => l.id === leadId);

    // Map back to schema if needed or use new values directly
    // Our schema now has new values, so we use them directly.

    if (lead && lead.status !== newStatus) {
      updateStatus.mutate({
        id: leadId,
        // @ts-expect-error Validated by UI columns
        status: newStatus
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 px-1">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="min-w-[280px] w-[280px]">
            <Skeleton className="h-[600px] w-full rounded-lg bg-card/20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)] items-start px-1">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            leads={leadsByStatus[col.id] || []}
            onLeadClick={onLeadClick}
            onCreateOpen={onCreateOpen}
          />
        ))}
      </div>

      {createPortal(
        <DragOverlay>
          {activeLead && (
            <LeadCard lead={activeLead} onClick={() => {}} isOverlay />
          )}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

function KanbanColumn({ id, title, color, leads, onLeadClick, onCreateOpen }: any) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[280px] w-[280px] flex flex-col h-full transition-colors rounded-xl ${
        isOver ? "bg-accent/20" : ""
      }`}
    >
      {/* Header */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="font-medium text-sm text-foreground/90">{title}</span>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">{leads.length}</span>
        </div>

        {/* Separator line style from image */}
        <div className={`h-[1px] w-full bg-gradient-to-r from-transparent via-${color.replace('bg-', '')} to-transparent opacity-20`} />

        {/* Novo Column Special Button */}
        {id === "novo" && (
           <Button variant="outline" className="w-full border-dashed border-muted-foreground/30 hover:border-primary/50 text-muted-foreground hover:text-primary" onClick={onCreateOpen}>
             <Plus className="h-4 w-4 mr-2" /> Novo Lead
           </Button>
        )}
      </div>

      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="flex flex-col gap-3 pb-2">
          {leads.length === 0 && id !== "novo" ? (
             <div className="h-24 border-2 border-dashed border-muted-foreground/10 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
               Arraste para cá
             </div>
          ) : (
            leads.map((lead: any) => (
              <DraggableLeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onLeadClick(lead.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function DraggableLeadCard({ lead, onClick }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`${isDragging ? "opacity-50 rotate-2 scale-105" : ""} transition-all duration-200`}>
      <LeadCard lead={lead} onClick={onClick} />
    </div>
  );
}

function LeadCard({ lead, onClick, isOverlay }: any) {
  return (
    <Card
      onClick={onClick}
      className={`
        cursor-grab active:cursor-grabbing border-none shadow-sm hover:shadow-md transition-all bg-card/50 hover:bg-card
        ${isOverlay ? "shadow-xl ring-2 ring-primary/20" : ""}
      `}
    >
      <CardContent className="p-3">
        {/* Header: Avatar + Name + Actions */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
             <Avatar className="h-8 w-8 bg-muted border border-border">
               <AvatarFallback className="text-xs font-medium text-muted-foreground">
                 {lead.nome.substring(0, 2).toUpperCase()}
               </AvatarFallback>
             </Avatar>
             <div>
               <h4 className="font-medium text-sm leading-tight text-foreground/90">{lead.nome}</h4>
               {lead.tags && lead.tags.length > 0 && (
                 <div className="flex flex-wrap gap-1 mt-0.5">
                   {lead.tags.slice(0, 2).map((tag: string) => (
                     <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1 rounded-sm">
                       {tag}
                     </span>
                   ))}
                   {lead.tags.length > 2 && <span className="text-[10px] text-muted-foreground">+</span>}
                 </div>
               )}
             </div>
          </div>

          <div className="flex gap-1 text-muted-foreground">
            <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-primary">
              <Phone className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-primary">
               <MessageSquare className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Footer: Whatsapp Button */}
        <Button
          variant="outline"
          className="w-full h-7 text-xs border-green-900/30 text-green-500 hover:text-green-400 hover:bg-green-950/30 hover:border-green-800"
          onClick={(e) => {
            e.stopPropagation();
            // Open whatsapp functionality
          }}
        >
          <MessageCircle className="h-3 w-3 mr-1.5" />
          WhatsApp
        </Button>

      </CardContent>
    </Card>
  );
}
