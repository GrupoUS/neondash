import { useState } from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AdminMentoradoSelectorProps {
  selectedMentoradoId?: number;
  onSelect: (id: number | undefined) => void;
}

export function AdminMentoradoSelector({
  selectedMentoradoId,
  onSelect,
}: AdminMentoradoSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: mentorados, isLoading } = trpc.mentorados.list.useQuery();

  const selectedMentorado = mentorados?.find((m) => m.id === selectedMentoradoId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          {selectedMentorado ? (
             <div className="flex items-center gap-2 overflow-hidden">
                <Avatar className="h-5 w-5">
                    <AvatarImage src={selectedMentorado.fotoUrl || undefined} />
                    <AvatarFallback className="text-[10px]">
                        {selectedMentorado.nomeCompleto.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedMentorado.nomeCompleto}</span>
             </div>
          ) : (
            <span className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Filtrar por Mentorado...
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Buscar mentorado..." />
          <CommandEmpty>Nenhum mentorado encontrado.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            <CommandItem
                value="todos"
                onSelect={() => {
                    onSelect(undefined);
                    setOpen(false);
                }}
            >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !selectedMentoradoId ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="font-medium text-muted-foreground">Remover Filtro (Ver Leads Próprios)</span>
            </CommandItem>
            {mentorados?.map((mentorado) => (
              <CommandItem
                key={mentorado.id}
                value={mentorado.nomeCompleto}
                onSelect={() => {
                  onSelect(mentorado.id === selectedMentoradoId ? undefined : mentorado.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedMentoradoId === mentorado.id ? "opacity-100" : "opacity-0"
                  )}
                />
                 <Avatar className="h-5 w-5 mr-2">
                    <AvatarImage src={mentorado.fotoUrl || undefined} />
                    <AvatarFallback className="text-[10px]">
                        {mentorado.nomeCompleto.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                {mentorado.nomeCompleto}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
