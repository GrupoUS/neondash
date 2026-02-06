import { Filter as FilterIcon, LayoutGrid, List, Settings, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useSearch } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { EventFormDialog } from "@/components/agenda/EventFormDialog";
import { ColumnEditDialog } from "@/components/crm/ColumnEditDialog";
import { CreateLeadDialog } from "@/components/crm/CreateLeadDialog";
import { FiltersPanel } from "@/components/crm/FiltersPanel";
import { LeadDetailModal } from "@/components/crm/LeadDetailModal";
import { LeadsTable } from "@/components/crm/LeadsTable";
import { DEFAULT_COLUMNS, PipelineKanban } from "@/components/crm/PipelineKanban";
import DashboardLayout from "@/components/DashboardLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatedTooltipSelector } from "@/components/ui/animated-tooltip";
import { Button } from "@/components/ui/button";

import { staggerContainer } from "@/lib/animation-variants";
import { trpc } from "@/lib/trpc";

export function LeadsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const mentoradoIdParam = searchParams.get("mentoradoId");

  // 1. Fetch all mentorados if admin
  const { data: allMentorados } = trpc.mentorados.list.useQuery(undefined, {
    enabled: isAdmin,
  });

  // 2. Local state or URL param logic
  const [adminSelectedMentoradoId, setAdminSelectedMentoradoId] = useState<string | undefined>(
    mentoradoIdParam || undefined
  );

  const viewMentoradoId = adminSelectedMentoradoId
    ? parseInt(adminSelectedMentoradoId, 10)
    : undefined;

  const isReadOnly = !!viewMentoradoId;

  const handleAdminSelect = (id: string) => {
    setAdminSelectedMentoradoId(id);
    // Optional: update URL sync logic here if needed
  };

  const [view, setView] = useState<"table" | "kanban">("kanban");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  const [filters, setFilters] = useState({
    busca: "",
    status: "all",
    origem: "all",
    periodo: "30d",
    valorMin: 0,
    valorMax: 100000,
    tags: [] as string[],
  });

  const [page, setPage] = useState(1);
  const { data: stats } = trpc.leads.stats.useQuery(
    {
      periodo: filters.periodo === "all" ? undefined : (filters.periodo as "7d" | "30d" | "90d"),
      mentoradoId: viewMentoradoId,
    },
    {
      staleTime: 30000,
      enabled: !isAdmin || !!viewMentoradoId,
    }
  );

  // 3. Columns Logic
  const { data: storedColumns } = trpc.crmColumns.list.useQuery(undefined, {
    enabled: !isReadOnly, // Only load user's custom columns when not in readonly mode (for now)
  });

  const activeColumns = useMemo(() => {
    if (!storedColumns || storedColumns.length === 0) return DEFAULT_COLUMNS;

    // storedColumns are sorted by order from backend
    return storedColumns
      .filter((c) => c.visible === "sim")
      .map((c) => {
        const def = DEFAULT_COLUMNS.find((d) => d.id === c.originalId);
        return {
          id: c.originalId,
          title: c.label,
          color: c.color,
          border: def?.border || "border-border/20",
        };
      });
  }, [storedColumns]);

  const [columnEditDialogOpen, setColumnEditDialogOpen] = useState(false);

  // Schedule appointment state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const handleLeadClick = (leadId: number) => {
    setSelectedLeadId(leadId);
  };

  const handleScheduleLead = (_leadName: string) => {
    setScheduleDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="relative h-[calc(100vh-4rem)] overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-background to-background">
        {/* Decorative ambient light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/5 blur-3xl opacity-50 pointer-events-none rounded-full" />

        <motion.div
          className="flex h-full relative z-10"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <div
            className={`flex-1 flex flex-col transition-all duration-300 ${filtersOpen ? "mr-0" : ""}`}
          >
            {/* Header Section */}
            <div className="px-8 pt-6 pb-2 shrink-0">
              <div className="flex justify-between items-end mb-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground/90 flex items-center gap-2">
                      LEADS CRM
                      <span className="text-xs font-normal text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full border border-border/50">
                        2.0
                      </span>
                    </h1>
                    <p className="text-muted-foreground/80 text-sm mt-1">
                      Gerencie seu funil com inteligência.
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="ml-6 pl-6 border-l border-border/20">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5 opacity-70">
                        Visualizando
                      </p>
                      <AnimatedTooltipSelector
                        items={
                          allMentorados?.map((m) => ({
                            id: m.id.toString(),
                            name: m.nomeCompleto,
                            designation: m.turma,
                            image:
                              m.fotoUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(m.nomeCompleto)}&background=ec1380&color=fff`,
                            onClick: () => handleAdminSelect(m.id.toString()),
                            isActive: adminSelectedMentoradoId === m.id.toString(),
                          })) || []
                        }
                        selectedId={adminSelectedMentoradoId}
                        className="border-none bg-transparent p-0"
                      />
                    </div>
                  )}
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-2 bg-card/50 backdrop-blur-md border border-border/40 p-1.5 rounded-xl shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFiltersOpen(!filtersOpen)}
                    className={
                      filtersOpen
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }
                  >
                    <FilterIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setColumnEditDialogOpen(true)}
                    disabled={isReadOnly}
                    title="Editar Colunas"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-4 bg-border/50 mx-1" />
                  <div className="flex bg-muted/30 p-0.5 rounded-lg border border-border/20">
                    <Button
                      variant={view === "table" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setView("table")}
                      className={`h-7 w-7 p-0 rounded-md transition-all ${view === "table" ? "shadow-sm" : "hover:bg-transparent"}`}
                    >
                      <List className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant={view === "kanban" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setView("kanban")}
                      className={`h-7 w-7 p-0 rounded-md transition-all ${view === "kanban" ? "shadow-sm" : "hover:bg-transparent"}`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {viewMentoradoId && (
                <Alert className="mb-4 bg-amber-500/10 border-amber-500/20 text-amber-500 py-2">
                  <ShieldAlert className="h-4 w-4 stroke-amber-500" />
                  <AlertTitle className="text-sm font-semibold text-amber-500 ml-2">
                    Modo Admin
                  </AlertTitle>
                  <AlertDescription className="text-xs text-amber-500/80 ml-2">
                    Visualizando {viewMentoradoId}. Edição restrita.
                  </AlertDescription>
                </Alert>
              )}

              {/* Minimal Stats Bar */}
              <div className="grid grid-cols-4 gap-4 mb-2">
                {[
                  { label: "Total Ativos", value: stats?.totalAtivos || 0 },
                  {
                    label: "Pipeline",
                    value: new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      notation: "compact",
                    }).format(stats?.valorPipeline || 0),
                  },
                  { label: "Conversão", value: `${(stats?.taxaConversao || 0).toFixed(1)}%` },
                  { label: "Ciclo Médio", value: `${stats?.tempoMedioFechamento || 0} dias` },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-card/30 border border-border/30 rounded-lg px-4 py-2 backdrop-blur-sm hover:bg-card/50 transition-colors"
                  >
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {stat.label}
                    </span>
                    <div className="text-lg font-bold text-foreground font-mono">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden px-4 pb-4">
              {view === "table" ? (
                <div className="h-full rounded-xl border border-border/40 bg-card/20 backdrop-blur-sm overflow-hidden">
                  <div className="h-full overflow-auto p-4 custom-scrollbar">
                    <LeadsTable
                      filters={filters}
                      page={page}
                      onPageChange={setPage}
                      onLeadClick={handleLeadClick}
                      mentoradoId={viewMentoradoId}
                      isReadOnly={isReadOnly}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <PipelineKanban
                    mentoradoId={viewMentoradoId}
                    isReadOnly={isReadOnly}
                    onCreateLead={() => setCreateDialogOpen(true)}
                    columns={activeColumns}
                  />
                </div>
              )}
            </div>
          </div>

          <FiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            isOpen={filtersOpen}
            onClose={() => setFiltersOpen(false)}
          />

          <CreateLeadDialog isOpen={createDialogOpen} onClose={() => setCreateDialogOpen(false)} />

          <LeadDetailModal
            leadId={selectedLeadId}
            isOpen={!!selectedLeadId}
            onClose={() => setSelectedLeadId(null)}
            isReadOnly={isReadOnly}
            onSchedule={handleScheduleLead}
          />

          <ColumnEditDialog
            isOpen={columnEditDialogOpen}
            onClose={() => setColumnEditDialogOpen(false)}
            defaultColumns={DEFAULT_COLUMNS}
          />

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
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
