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
import { Card, CardContent } from "@/components/ui/card";
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

  const isAdminViewing = isAdmin && !!viewMentoradoId;

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
    { staleTime: 30000 }
  );

  // 3. Columns Logic - supports admin viewing other mentorado's columns
  const { data: storedColumns } = trpc.crmColumns.list.useQuery(
    viewMentoradoId ? { mentoradoId: viewMentoradoId } : undefined
  );

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
      <motion.div
        className="flex h-[calc(100vh-4rem)] overflow-hidden relative"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <div
          className={`p-6 flex-1 flex flex-col transition-all duration-300 ${filtersOpen ? "mr-0" : ""}`}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
                <p className="text-muted-foreground">
                  Gerencie seus leads e acompanhe o funil de vendas.
                </p>
              </div>
              {isAdmin && (
                <div className="ml-4 pl-4 border-l border-white/10">
                  <p className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wider">
                    Visualização Admin
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={filtersOpen ? "bg-muted" : ""}
              >
                <FilterIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setColumnEditDialogOpen(true)}
                title="Editar Colunas"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <div className="bg-muted p-1 rounded-lg flex items-center">
                <Button
                  variant={view === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("table")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === "kanban" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("kanban")}
                  className="h-8 w-8 p-0"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {isAdminViewing && (
            <Alert className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
              <ShieldAlert className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-300">
                Modo Administrativo
              </AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                Você está gerenciando o CRM do mentorado selecionado. Todas as ações estão
                habilitadas.
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardContent className="p-4 flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">Total Ativos</span>
                <span className="text-2xl font-bold">{stats?.totalAtivos || 0}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">Valor no Pipeline</span>
                <span className="text-2xl font-bold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    notation: "compact",
                  }).format(stats?.valorPipeline || 0)}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">Conversão</span>
                <span className="text-2xl font-bold">
                  {(stats?.taxaConversao || 0).toFixed(1)}%
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Tempo Médio (Dias)
                </span>
                <span className="text-2xl font-bold">{stats?.tempoMedioFechamento || 0}</span>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 overflow-hidden rounded-lg bg-background border flex flex-col relative">
            {view === "table" ? (
              <div className="p-4 flex-1 overflow-auto">
                <LeadsTable
                  filters={filters}
                  page={page}
                  onPageChange={setPage}
                  onLeadClick={handleLeadClick}
                  mentoradoId={viewMentoradoId}
                  isReadOnly={false}
                />
              </div>
            ) : (
              <div className="p-4 flex-1 overflow-auto bg-muted/10">
                <PipelineKanban
                  mentoradoId={viewMentoradoId}
                  isReadOnly={false}
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

        <CreateLeadDialog
          isOpen={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          mentoradoId={viewMentoradoId}
        />

        <LeadDetailModal
          leadId={selectedLeadId}
          isOpen={!!selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          isReadOnly={false}
          onSchedule={handleScheduleLead}
        />

        <ColumnEditDialog
          isOpen={columnEditDialogOpen}
          onClose={() => setColumnEditDialogOpen(false)}
          defaultColumns={DEFAULT_COLUMNS}
          mentoradoId={viewMentoradoId}
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
    </DashboardLayout>
  );
}
