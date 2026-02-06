/**
 * Advanced Search Dialog for Patients
 * Provides filtering by multiple criteria with Brazilian validators
 */

import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Filter, Search, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { maskCPF, maskPhone, validateCPF, validatePhone } from "@/lib/patient-validators";

interface SearchFilters {
  query: string;
  cpf: string;
  telefone: string;
  email: string;
  status: string[];
  tipoPele: string;
  genero: string;
  dataInicio: string;
  dataFim: string;
}

interface PatientAdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  activeFilterCount?: number;
}

const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo", color: "bg-emerald-500" },
  { value: "inativo", label: "Inativo", color: "bg-slate-500" },
  { value: "pendente", label: "Pendente", color: "bg-amber-500" },
];

const TIPO_PELE_OPTIONS = [
  { value: "I", label: "Tipo I - Muito clara" },
  { value: "II", label: "Tipo II - Clara" },
  { value: "III", label: "Tipo III - Morena clara" },
  { value: "IV", label: "Tipo IV - Morena" },
  { value: "V", label: "Tipo V - Morena escura" },
  { value: "VI", label: "Tipo VI - Negra" },
];

const GENERO_OPTIONS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
  { value: "nao_informado", label: "Não informado" },
];

const initialFilters: SearchFilters = {
  query: "",
  cpf: "",
  telefone: "",
  email: "",
  status: [],
  tipoPele: "",
  genero: "",
  dataInicio: "",
  dataFim: "",
};

export function PatientAdvancedSearch({
  onSearch,
  onClear,
  activeFilterCount = 0,
}: PatientAdvancedSearchProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handleCPFChange = useCallback((value: string) => {
    const masked = maskCPF(value);
    setFilters((prev) => ({ ...prev, cpf: masked }));

    if (masked.length === 14) {
      if (!validateCPF(masked)) {
        setCpfError("CPF inválido");
      } else {
        setCpfError(null);
      }
    } else {
      setCpfError(null);
    }
  }, []);

  const handlePhoneChange = useCallback((value: string) => {
    const masked = maskPhone(value);
    setFilters((prev) => ({ ...prev, telefone: masked }));

    if (masked.length >= 14) {
      if (!validatePhone(masked)) {
        setPhoneError("Telefone inválido");
      } else {
        setPhoneError(null);
      }
    } else {
      setPhoneError(null);
    }
  }, []);

  const toggleStatus = useCallback((status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }));
  }, []);

  const handleSearch = useCallback(() => {
    onSearch(filters);
    setOpen(false);
  }, [filters, onSearch]);

  const handleClear = useCallback(() => {
    setFilters(initialFilters);
    setCpfError(null);
    setPhoneError(null);
    onClear();
  }, [onClear]);

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.cpf) count++;
    if (filters.telefone) count++;
    if (filters.email) count++;
    if (filters.status.length > 0) count++;
    if (filters.tipoPele) count++;
    if (filters.genero) count++;
    if (filters.dataInicio || filters.dataFim) count++;
    return count;
  }, [filters]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Busca Avançada
          {(activeFilterCount > 0 || getActiveFilterCount() > 0) && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
              {activeFilterCount || getActiveFilterCount()}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Busca Avançada de Pacientes
          </DialogTitle>
          <DialogDescription>
            Use os filtros abaixo para encontrar pacientes específicos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Text Search */}
          <div className="space-y-2">
            <Label htmlFor="query">Busca geral</Label>
            <Input
              id="query"
              placeholder="Nome, email ou observações..."
              value={filters.query}
              onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
            />
          </div>

          <Separator />

          {/* Document Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={filters.cpf}
                onChange={(e) => handleCPFChange(e.target.value)}
                className={cpfError ? "border-red-500" : ""}
              />
              <AnimatePresence>
                {cpfError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-red-500"
                  >
                    {cpfError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                value={filters.telefone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={phoneError ? "border-red-500" : ""}
              />
              <AnimatePresence>
                {phoneError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-red-500"
                  >
                    {phoneError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              value={filters.email}
              onChange={(e) => setFilters((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <Separator />

          {/* Status Checkboxes */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <Button
                  key={status.value}
                  type="button"
                  variant={filters.status.includes(status.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleStatus(status.value)}
                  className="gap-2"
                >
                  <span className={`h-2 w-2 rounded-full ${status.color}`} />
                  {status.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Selects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Pele (Fitzpatrick)</Label>
              <Select
                value={filters.tipoPele}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, tipoPele: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_PELE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Gênero</Label>
              <Select
                value={filters.genero}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, genero: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {GENERO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período de Cadastro
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">De</Label>
                <Input
                  type="date"
                  value={filters.dataInicio}
                  onChange={(e) => setFilters((prev) => ({ ...prev, dataInicio: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Até</Label>
                <Input
                  type="date"
                  value={filters.dataFim}
                  onChange={(e) => setFilters((prev) => ({ ...prev, dataFim: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button type="button" variant="ghost" onClick={handleClear} className="gap-2">
            <X className="h-4 w-4" />
            Limpar filtros
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSearch} className="gap-2">
              <Search className="h-4 w-4" />
              Buscar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
