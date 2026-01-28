import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ChevronDown, ChevronUp, X } from "lucide-react";

interface FiltersState {
  busca: string;
  status: string;
  origem: string;
  periodo: string;
  valorMin: number;
  valorMax: number;
  tags: string[];
}

interface FiltersPanelProps {
  filters: FiltersState;
  onFiltersChange: (newFilters: FiltersState) => void;
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean; // If true, renders as Sheet content, else regular sidebar or popover content
}

export function FiltersPanel({
  filters,
  onFiltersChange,
  isOpen,
  onClose,
  isMobile = false,
}: FiltersPanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const handleChange = (key: keyof FiltersState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      busca: "",
      status: "all",
      origem: "all",
      periodo: "30d",
      valorMin: 0,
      valorMax: 100000,
      tags: [],
    });
  };

  const Content = (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Busca Global</label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nome, email ou telefone..."
            className="pl-8"
            value={filters.busca}
            onChange={(e) => handleChange("busca", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Filtros Básicos
        </h3>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={filters.status}
            onValueChange={(val) => handleChange("status", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="em_contato">Em Contato</SelectItem>
              <SelectItem value="reuniao_agendada">Reunião Agendada</SelectItem>
              <SelectItem value="proposta_enviada">Proposta Enviada</SelectItem>
              <SelectItem value="negociacao">Negociação</SelectItem>
              <SelectItem value="fechado_ganho">Fechado (Ganho)</SelectItem>
              <SelectItem value="perdido">Perdido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Origem</label>
          <Select
            value={filters.origem}
            onValueChange={(val) => handleChange("origem", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as origens" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="indicacao">Indicação</SelectItem>
              <SelectItem value="site">Site</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Período</label>
          <Select
            value={filters.periodo}
            onValueChange={(val) => handleChange("periodo", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="space-y-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between p-0 hover:bg-transparent">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Filtros Avançados
            </span>
            {advancedOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-6 pt-2">
          <div className="space-y-4">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Valor Estimado</label>
              <span className="text-xs text-muted-foreground">
                R$ {filters.valorMin.toLocaleString()} - {filters.valorMax.toLocaleString()}
              </span>
            </div>
            <Slider
              defaultValue={[0, 100000]}
              value={[filters.valorMin, filters.valorMax]}
              max={100000}
              step={1000}
              minStepsBetweenThumbs={1}
              onValueChange={(vals) => {
                onFiltersChange({ ...filters, valorMin: vals[0], valorMax: vals[1] });
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <Input 
              placeholder="Digite tags separadas por vírgula..." 
              onChange={(e) => {
                const tags = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                handleChange("tags", tags);
              }}
            />
            {filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" className="flex-1" onClick={clearFilters}>
          Limpar
        </Button>
        <Button className="flex-1" onClick={onClose}>
          Aplicar
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Filtrar Leads</SheetTitle>
          </SheetHeader>
          {Content}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop sidebar version
  return (
    <div className={`
      fixed inset-y-0 right-0 z-50 w-[300px] bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out p-6 overflow-y-auto
      ${isOpen ? "translate-x-0" : "translate-x-full"}
    `}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Filtros</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      {Content}
    </div>
  );
}
