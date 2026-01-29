import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Phone, Mail, MessageSquare, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadsTableProps {
  filters: any;
  page: number;
  onPageChange: (page: number) => void;
  onLeadClick: (leadId: number) => void;
  mentoradoId?: number;
}

export function LeadsTable({ filters, page, onPageChange, onLeadClick, mentoradoId }: LeadsTableProps) {
  const { data, isLoading } = trpc.leads.list.useQuery({
    ...filters,
    page,
    limit: 10,
    mentoradoId,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "novo": return "bg-yellow-500 hover:bg-yellow-600";
      case "primeiro_contato": return "bg-orange-400 hover:bg-orange-500";
      case "qualificado": return "bg-purple-500 hover:bg-purple-600";
      case "proposta": return "bg-orange-600 hover:bg-orange-700";
      case "negociacao": return "bg-pink-500 hover:bg-pink-600";
      case "fechado": return "bg-green-500 hover:bg-green-600";
      case "perdido": return "bg-red-500 hover:bg-red-600";
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const statusLabels: Record<string, string> = {
    novo: "Novo",
    primeiro_contato: "Primeiro Contato",
    qualificado: "Qualificado",
    proposta: "Proposta",
    negociacao: "Negociação",
    fechado: "Fechado",
    perdido: "Perdido",
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!data?.leads.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center border rounded-lg border-dashed">
        <div className="bg-primary/20 p-4 rounded-full mb-4">
            <MoreHorizontal className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium">Nenhum lead encontrado</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Tente ajustar os filtros ou crie um novo lead para começar a acompanhar seu pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Atualizado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onLeadClick(lead.id)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{lead.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-semibold">{lead.nome}</div>
                        {lead.empresa && <div className="text-xs text-muted-foreground">{lead.empresa}</div>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={lead.email}>
                    {lead.email}
                </TableCell>
                <TableCell>{lead.telefone || "-"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {lead.origem}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(lead.status)} text-white border-0`}>
                    {statusLabels[lead.status] || lead.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lead.valorEstimado
                    ? new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(lead.valorEstimado / 100)
                    : "-"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(lead.updatedAt), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onLeadClick(lead.id)}>
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(lead.email)}>
                        Copiar email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        Deletar lead
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Anterior
        </Button>
        <div className="text-sm text-muted-foreground">
            Página {page} de {data.totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= data.totalPages}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}
