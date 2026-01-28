import { useState } from "react";
import { FiltersPanel } from "@/components/crm/FiltersPanel";
import { LeadsTable } from "@/components/crm/LeadsTable";
import { PipelineKanban } from "@/components/crm/PipelineKanban";
import { LeadDetailModal } from "@/components/crm/LeadDetailModal";
import { CreateLeadDialog } from "@/components/crm/CreateLeadDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutGrid, List, Filter as FilterIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";

export function LeadsPage() {
  const [view, setView] = useState<"table" | "kanban">("table");
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
    { periodo: filters.periodo as "7d" | "30d" | "90d" },
    { staleTime: 30000 }
  );

  const handleLeadClick = (leadId: number) => {
    setSelectedLeadId(leadId);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className={`p-6 flex-1 flex flex-col transition-all duration-300 ${filtersOpen ? "mr-0" : ""}`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground">
              Gerencie seus leads e acompanhe o funil de vendas.
            </p>
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
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Novo Lead
            </Button>
          </div>
        </div>

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
              <span className="text-sm font-medium text-muted-foreground">Novos (30d)</span>
              <span className="text-2xl font-bold">{stats?.totalAtivos || 0}</span> {/* Placeholder */}
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
              />
            </div>
          ) : (
            <div className="p-4 flex-1 overflow-auto bg-muted/10">
              <PipelineKanban 
                filters={filters} 
                onLeadClick={handleLeadClick} 
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
      />

      <LeadDetailModal
        leadId={selectedLeadId}
        isOpen={!!selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
      />
    </div>
  );
}
