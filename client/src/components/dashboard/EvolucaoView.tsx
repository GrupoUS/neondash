import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { EvolutionChart } from "@/components/dashboard/EvolutionChart";
import { MonthComparison } from "@/components/dashboard/MonthComparison";
import { SubmitMetricsForm } from "@/components/dashboard/SubmitMetricsForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { cn, formatCurrency } from "@/lib/utils";

interface EvolucaoViewProps {
  mentoradoId?: number;
}

function calculateVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function VariationCell({ current, previous }: { current: number; previous: number }) {
  const variation = calculateVariation(current, previous);
  const isPositive = variation > 0;
  const isNeutral = variation === 0;

  if (isNeutral) return null;

  return (
    <span
      className={cn(
        "ml-1 text-xs font-medium",
        isPositive && "text-emerald-400",
        !isPositive && "text-rose-400"
      )}
    >
      {isPositive ? (
        <ArrowUpRight className="inline h-3 w-3" />
      ) : (
        <ArrowDownRight className="inline h-3 w-3" />
      )}
      {Math.abs(variation).toFixed(0)}%
    </span>
  );
}

export function EvolucaoView({ mentoradoId }: EvolucaoViewProps) {
  const { data: evolutionData, isLoading } = trpc.mentorados.evolution.useQuery({ mentoradoId });

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  // Reverse data for table (newest first)
  const tableData = [...(evolutionData || [])].reverse();

  // Get last two months for comparison
  const sortedData = [...(evolutionData || [])].sort((a, b) => {
    if (a.ano !== b.ano) return b.ano - a.ano;
    return b.mes - a.mes;
  });
  const currentMonth = sortedData[0] || null;
  const previousMonth = sortedData[1] || null;

  // Check if mentorado has December 2025 data (to show message in form)
  const hasDecemberData = evolutionData?.some((m) => m.ano === 2025 && m.mes === 12);

  return (
    <div className="space-y-4">
      {/* Month Comparison Card */}
      {currentMonth && previousMonth && (
        <MonthComparison currentMonth={currentMonth} previousMonth={previousMonth} />
      )}

      <EvolutionChart mentoradoId={mentoradoId} />

      <Card className="col-span-4 bg-black/40 border-white/5">
        <CardHeader>
          <CardTitle>Lançar Métricas Mensais</CardTitle>
          <CardDescription>
            Preencha os dados do mês para alimentar seu dashboard e comparativos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubmitMetricsForm className="bg-transparent" suggestNextMonth={hasDecemberData} />
        </CardContent>
      </Card>

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
                  tableData.map((metric, index) => {
                    const prevMetric = tableData[index + 1];
                    return (
                      <TableRow key={metric.id}>
                        <TableCell className="font-medium">
                          {String(metric.mes).padStart(2, "0")}/{metric.ano}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(metric.faturamento)}
                          {prevMetric && (
                            <VariationCell
                              current={metric.faturamento}
                              previous={prevMetric.faturamento}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(metric.lucro)}
                          {prevMetric && (
                            <VariationCell current={metric.lucro} previous={prevMetric.lucro} />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {metric.leads}
                          {prevMetric && (
                            <VariationCell current={metric.leads} previous={prevMetric.leads} />
                          )}
                        </TableCell>
                        <TableCell className="text-right">{metric.postsFeed}</TableCell>
                        <TableCell className="text-right">{metric.stories}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
