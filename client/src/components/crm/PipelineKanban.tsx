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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createPortal } from "react-dom";

interface PipelineKanbanProps {
  filters: any;
  onLeadClick: (leadId: number) => void;
}

const COLUMNS = [
  { id: "novo", title: "Novo", color: "bg-blue-500" },
  { id: "em_contato", title: "Em Contato", color: "bg-purple-500" },
  { id: "reuniao_agendada", title: "Reunião", color: "bg-cyan-500" },
  { id: "proposta_enviada", title: "Proposta", color: "bg-amber-500" },
  { id: "negociacao", title: "Negociação", color: "bg-orange-500" },
  { id: "fechado_ganho", title: "Ganho", color: "bg-green-500" },
  { id: "perdido", title: "Perdido", color: "bg-red-500" },
];

export function PipelineKanban({ filters, onLeadClick }: PipelineKanbanProps) {
  // Fetch all leads for kanban (no pagination in MVP, but simplified filters)
  const { data, isLoading, refetch } = trpc.leads.list.useQuery({
    ...filters,
    status: undefined, // Kanban shows all statuses
    limit: 100, // Reasonable limit for MVP
  });

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const [activeId, setActiveId] = useState<number | null>(null);

  const leadsByStatus = useMemo(() => {
    const groups: Record<string, any[]> = {};
    COLUMNS.forEach(col => groups[col.id] = []);
    
    if (data?.leads) {
      data.leads.forEach(lead => {
        if (groups[lead.status]) {
          groups[lead.status].push(lead);
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
    const newStatus = over.id as string;
    const lead = data?.leads.find(l => l.id === leadId);

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
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="min-w-[280px] w-[280px]">
            <Skeleton className="h-[600px] w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)] items-start">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            leads={leadsByStatus[col.id] || []}
            onLeadClick={onLeadClick}
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

function KanbanColumn({ id, title, color, leads, onLeadClick }: any) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const totalValue = leads.reduce((acc: number, curr: any) => acc + (curr.valorEstimado || 0), 0);

  return (
    <div 
      ref={setNodeRef}
      className={`min-w-[280px] w-[280px] flex flex-col rounded-lg bg-muted/30 border border-transparent h-full ${
        isOver ? "bg-muted/60 border-primary/20" : ""
      }`}
    >
      <div className="p-3 border-b bg-background/50 rounded-t-lg backdrop-blur supports-[backdrop-filter]:bg-background/20 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="font-semibold text-sm">{title}</span>
            <Badge variant="secondary" className="h-5 px-1.5 min-w-[20px] justify-center">
              {leads.length}
            </Badge>
          </div>
        </div>
        <div className="text-xs font-medium text-muted-foreground">
          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalValue)}
        </div>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="flex flex-col gap-2 pb-2">
          {leads.map((lead: any) => (
            <DraggableLeadCard 
              key={lead.id} 
              lead={lead} 
              onClick={() => onLeadClick(lead.id)} 
            />
          ))}
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
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={isDragging ? "opacity-50" : ""}>
      <LeadCard lead={lead} onClick={onClick} />
    </div>
  );
}

function LeadCard({ lead, onClick, isOverlay }: any) {
  return (
    <Card 
      onClick={onClick}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
        isOverlay ? "shadow-xl rotate-2" : ""
      }`}
    >
      <CardContent className="p-3 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h4 className="font-medium text-sm line-clamp-1">{lead.nome}</h4>
            {lead.empresa && (
              <p className="text-xs text-muted-foreground line-clamp-1">{lead.empresa}</p>
            )}
          </div>
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">{lead.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-primary">
            {lead.valorEstimado ? 
              new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(lead.valorEstimado) 
              : "-"}
          </div>
          <Badge variant="outline" className="text-[10px] px-1 h-5 capitalize">
            {lead.origem}
          </Badge>
        </div>

        <div className="text-[10px] text-muted-foreground flex justify-end">
          {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true, locale: ptBR })}
        </div>
      </CardContent>
    </Card>
  );
}
