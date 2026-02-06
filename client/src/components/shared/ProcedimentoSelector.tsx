import { Check, ChevronsUpDown, X } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useProcedimentos } from "@/hooks/use-procedimentos";
import { cn } from "@/lib/utils";

interface ProcedimentoSelectorProps {
  value?: number[];
  onChange: (value: number[]) => void;
  disabled?: boolean;
  className?: string;
}

export function ProcedimentoSelector({
  value = [],
  onChange,
  disabled = false,
  className,
}: ProcedimentoSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const { procedures, isLoading } = useProcedimentos();

  // Map IDs to names for display
  const selectedProcedures = procedures.filter((p) => value.includes(p.id));

  const toggleProcedure = (id: number) => {
    const newValue = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    onChange(newValue);
  };

  const removeProcedure = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== id));
  };

  // Group procedures by category
  const groupedProcedures = React.useMemo(() => {
    const groups: Record<string, typeof procedures> = {};
    procedures.forEach((p) => {
      const category = (p as { categoria?: string }).categoria || "Outros";
      if (!groups[category]) groups[category] = [];
      groups[category].push(p);
    });
    return groups;
  }, [procedures]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || isLoading}
            className="w-full justify-between h-auto min-h-[2.5rem] py-2 px-3 bg-background border-input hover:bg-accent hover:text-accent-foreground text-left font-normal"
          >
            <span className="truncate">
              {value.length === 0
                ? "Selecione os procedimentos..."
                : `${value.length} selecionado${value.length > 1 ? "s" : ""}`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar procedimento..." />
            <CommandList>
              <CommandEmpty>Nenhum procedimento encontrado.</CommandEmpty>
              {Object.entries(groupedProcedures).map(([category, procs]) => (
                <CommandGroup key={category} heading={category}>
                  {procs.map((procedure) => (
                    <CommandItem
                      key={procedure.id}
                      value={`${procedure.nome}-${procedure.id}`}
                      onSelect={() => toggleProcedure(procedure.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(procedure.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{procedure.nome}</span>
                        <span className="text-xs text-muted-foreground">
                          {(procedure.precoVenda / 100).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Tags Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {selectedProcedures.map((proc) => (
            <Badge
              key={proc.id}
              variant="secondary"
              className="pl-2 pr-1 py-1 flex items-center gap-1"
            >
              {proc.nome}
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-4 w-4 ml-1 rounded-full hover:bg-muted-foreground/20 p-0"
                onClick={(e) => removeProcedure(proc.id, e)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remover {proc.nome}</span>
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
