import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FiltersPanel } from "@/components/crm/FiltersPanel";
import { LeadsTable } from "@/components/crm/LeadsTable";
import { PipelineKanban } from "@/components/crm/PipelineKanban";
import { LeadDetailModal } from "@/components/crm/LeadDetailModal";
import { CreateLeadDialog } from "@/components/crm/CreateLeadDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutGrid, List, Filter as FilterIcon, ShieldAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AdminMentoradoSelector } from "@/components/admin/AdminMentoradoSelector";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSearch } from "wouter";
import { motion } from "motion/react";
import { staggerContainer, fadeIn } from "@/lib/animation-variants";

export function LeadsPage() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const mentoradoIdParam = searchParams.get("mentoradoId");
  
  // Local state for admin selection if not in URL, or sync with URL
  const [adminSelectedMentoradoId, setAdminSelectedMentoradoId] = useState<number | undefined>(
    mentoradoIdParam ? parseInt(mentoradoIdParam) : undefined
  );

  const viewMentoradoId = adminSelectedMentoradoId;

  const [view, setView] = useState<"table" | "kanban">("kanban");
  const [filtersOpen, setFiltersOpen] = useState(true);
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

  const handleLeadClick = (leadId: number) => {
    setSelectedLeadId(leadId);
  };

  const handleAdminSelect = (id: number | undefined) => {
    setAdminSelectedMentoradoId(id);
    // Optional: update URL
  };

  const isReadOnly = !!viewMentoradoId;

  return (
    <DashboardLayout>
      <motion.div 
        className="flex h-[calc(100vh-4rem)] overflow-hidden relative"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
      <div className={`p-6 flex-1 flex flex-col transition-all duration-300 ${filtersOpen ? "mr-0" : ""}`}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
              <p className="text-muted-foreground">
                Gerencie seus leads e acompanhe o funil de vendas.
              </p>
            </div>
             {isAdmin && (
                <div className="ml-4 border-l pl-4">
                    <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Visualização Admin</p>
                    <AdminMentoradoSelector 
                        selectedMentoradoId={viewMentoradoId} 
                        onSelect={handleAdminSelect} 
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
            {!isReadOnly && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Novo Lead
                </Button>
            )}
          </div>
        </div>

        {viewMentoradoId && (
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Modo de Visualização Administrativa</AlertTitle>
              <AlertDescription className="text-amber-700">
                Você está visualizando o CRM de um mentorado (ID: {viewMentoradoId}). Ações de edição estão desabilitadas.
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
                    notation: "compact"
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
              <span className="text-sm font-medium text-muted-foreground">Tempo Médio (Dias)</span>
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
                isReadOnly={isReadOnly}
              />
            </div>
          ) : (
            <div className="p-4 flex-1 overflow-auto bg-muted/10">
              <PipelineKanban />
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
      />

        <LeadDetailModal
            leadId={selectedLeadId}
            isOpen={!!selectedLeadId}
            onClose={() => setSelectedLeadId(null)}
            isReadOnly={isReadOnly}
        />
      </motion.div>
    </DashboardLayout>
  );
}
