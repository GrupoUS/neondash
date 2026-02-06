import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { EventFormDialog } from "@/components/agenda/EventFormDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Button } from "../ui/button";
import { KanbanColumn } from "./KanbanColumn";
import { LeadCard } from "./LeadCard";
import { LeadDetailModal } from "./LeadDetailModal";

// Definindo as colunas do Kanban com IDs alinhados ao banco (enum status_lead)
// Definindo as colunas do Kanban com IDs alinhados ao banco (enum status_lead)
export const DEFAULT_COLUMNS = [
  {
    id: "novo",
    title: "Novo",
    color: "bg-blue-500",
    border: "border-blue-500/20",
  },
  {
    id: "primeiro_contato",
    title: "Primeiro Contato",
    color: "bg-indigo-500",
    border: "border-indigo-500/20",
  },
  {
    id: "qualificado",
    title: "Qualificado",
    color: "bg-teal-500",
    border: "border-teal-500/20",
  },
  {
    id: "proposta",
    title: "Proposta",
    color: "bg-orange-500",
    border: "border-orange-500/20",
  },
  {
    id: "negociacao",
    title: "Negociação",
    color: "bg-amber-500",
    border: "border-amber-500/20",
  },
  {
    id: "fechado",
    title: "Fechado",
    color: "bg-emerald-500",
    border: "border-emerald-500/20",
  },
];

export interface PipelineKanbanProps {
  mentoradoId?: number;
  isReadOnly?: boolean;
  onCreateLead?: () => void;
  columns?: typeof DEFAULT_COLUMNS;
}

export function PipelineKanban({
  mentoradoId,
  isReadOnly = false,
  onCreateLead,
  columns = DEFAULT_COLUMNS,
}: PipelineKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [, navigate] = useLocation();

  const utils = trpc.useUtils();
  const { data: leadsData, isLoading } = trpc.leads.list.useQuery({
    mentoradoId: mentoradoId,
  });

  const updateStatusMutation = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      toast.success("Status atualizado");
    },
  });

  const bulkUpdateMutation = trpc.leads.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      setSelectedLeads([]);
      setIsSelectMode(false);
      toast.success("Leads atualizados com sucesso");
    },
  });

  const bulkDeleteMutation = trpc.leads.bulkDelete.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      setSelectedLeads([]);
      setIsSelectMode(false);
      toast.success("Leads removidos com sucesso");
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    if (isReadOnly) return;

    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const leadId = parseInt(activeId.toString().replace("lead-", ""), 10);
    // Se soltou sobre uma coluna
    const newStatus = columns.find((col) => col.id === overId)?.id;

    if (newStatus) {
      updateStatusMutation.mutate({
        id: leadId,
        status: newStatus as any,
      });
    }

    setActiveId(null);
  };

  const handleLeadClick = (id: number) => {
    if (isSelectMode) {
      toggleSelectLead(id);
    } else {
      setSelectedLeadId(id);
      setIsDetailOpen(true);
    }
  };

  const toggleSelectLead = (id: number) => {
    setSelectedLeads((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]));
  };

  const handleBulkStatusChange = (status: string) => {
    if (selectedLeads.length === 0) return;
    bulkUpdateMutation.mutate({
      ids: selectedLeads,
      status: status as any,
    });
  };

  const handleBulkDelete = () => {
    if (selectedLeads.length === 0) return;
    if (window.confirm(`Tem certeza que deseja excluir ${selectedLeads.length} leads?`)) {
      bulkDeleteMutation.mutate({ ids: selectedLeads });
    }
  };

  const handleScheduleLead = (_lead: { id: number; nome: string }) => {
    setScheduleDialogOpen(true);
  };

  const handleWhatsAppLead = (lead: { id: number; nome: string; telefone?: string | null }) => {
    if (!lead.telefone) {
      toast.error("Lead não possui número de telefone");
      return;
    }
    // Navigate to chat page with phone parameter
    navigate(`/chat?phone=${encodeURIComponent(lead.telefone)}&leadId=${lead.id}`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 h-[calc(100vh-12rem)]">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-muted/10 rounded-xl h-full animate-pulse border border-border/40"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        autoScroll={!isReadOnly}
      >
        <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-6 min-w-[1200px] h-full px-2">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                leads={leadsData?.leads?.filter((lead) => lead.status === column.id) || []}
                activeId={activeId}
                onLeadClick={handleLeadClick}
                accentColor={column.color}
                isSelectMode={isSelectMode}
                selectedLeads={selectedLeads}
                onToggleSelect={toggleSelectLead}
                showAddButton={column.id === "novo" && !isReadOnly}
                onAddLead={onCreateLead}
                onSchedule={handleScheduleLead}
                onWhatsApp={handleWhatsAppLead}
              />
            ))}
          </div>
        </div>

        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
          }}
        >
          {activeId && !isReadOnly ? (
            <div className="rotate-2 scale-105 cursor-grabbing opacity-90 shadow-[0_0_30px_-5px_rgba(var(--primary),0.6)] rounded-xl">
              <LeadCard
                lead={leadsData?.leads?.find((l) => `lead-${l.id}` === activeId)!}
                onClick={() => {}}
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Floating Bulk Action Bar */}
      {selectedLeads.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-popover/90 border border-border shadow-2xl shadow-primary/10 rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in backdrop-blur-md z-50">
          <span className="text-sm font-medium text-foreground pr-4 border-r border-border">
            {selectedLeads.length} selecionado(s)
          </span>

          <div className="flex items-center gap-2">
            <Select onValueChange={handleBulkStatusChange}>
              <SelectTrigger className="h-8 w-[140px] border-none bg-muted/50 hover:bg-muted focus:ring-0">
                <SelectValue placeholder="Mover para..." />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleBulkDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
          </div>
        </div>
      )}

      {selectedLeadId && (
        <LeadDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          leadId={selectedLeadId}
          onSchedule={() => {
            setScheduleDialogOpen(true);
          }}
        />
      )}

      {/* Schedule Appointment Dialog */}
      <EventFormDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        defaultDate={{
          start: new Date(),
          end: new Date(Date.now() + 60 * 60 * 1000),
        }}
        onSuccess={() => setScheduleDialogOpen(false)}
      />
    </div>
  );
}
