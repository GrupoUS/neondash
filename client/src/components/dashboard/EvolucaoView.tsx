import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EvolutionChart } from "@/components/dashboard/EvolutionChart";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function EvolucaoView() {
  const { data: evolutionData, isLoading } = trpc.mentorados.evolution.useQuery();

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  // Reverse data for table (newest first)
  const tableData = [...(evolutionData || [])].reverse();

  return (
    <div className="space-y-4">
      <EvolutionChart />

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Histórico Detalhado</CardTitle>
          <CardDescription>
            Acompanhamento mensal detalhado das métricas de performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês/Ano</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Posts</TableHead>
                  <TableHead className="text-right">Stories</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      Nenhum dado encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.map((metric) => (
                    <TableRow key={metric.id}>
                      <TableCell className="font-medium">
                        {metric.mes}/{metric.ano}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(metric.faturamento)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(metric.lucro)}
                      </TableCell>
                      <TableCell className="text-right">{metric.leads}</TableCell>
                      <TableCell className="text-right">{metric.postsFeed}</TableCell>
                      <TableCell className="text-right">{metric.stories}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
