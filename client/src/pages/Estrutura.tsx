import DashboardLayout from "@/components/DashboardLayout";
import MentoradoCard from "@/components/MentoradoCard";
import { analiseData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, CheckCircle, AlertCircle } from "lucide-react";

export default function Estrutura() {
  const benchmarks = analiseData.neon_estrutura.benchmarks;
  const totalFaturamento = Object.values(
    analiseData.neon_estrutura.analise
  ).reduce((acc, curr) => acc + curr.dados.faturamento, 0);

  const mediaFaturamento =
    totalFaturamento / Object.keys(analiseData.neon_estrutura.analise).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Neon Estrutura
          </h1>
          <p className="text-slate-500 mt-2">
            Análise detalhada da turma de estruturação
          </p>
        </div>

        {/* Benchmarks Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-neon-purple/5 border-neon-purple/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neon-purple uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4" /> Meta de Faturamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(benchmarks.meta_faturamento)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Por mentorado / mês</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Média Realizada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(mediaFaturamento)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {(
                  (mediaFaturamento / benchmarks.meta_faturamento) *
                  100
                ).toFixed(1)}
                % da meta
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Ações Esperadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Posts Feed:</span>
                  <span className="font-bold">{benchmarks.posts_feed_min}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stories:</span>
                  <span className="font-bold">{benchmarks.stories_min}</span>
                </div>
                <div className="flex justify-between">
                  <span>Procedimentos:</span>
                  <span className="font-bold">
                    {benchmarks.procedimentos_min}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mentorados Grid */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Ranking de Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analiseData.neon_estrutura.ranking.map(([nome, score], index) => (
              <MentoradoCard
                key={nome}
                nome={nome}
                data={analiseData.neon_estrutura.analise[nome]}
                rank={index + 1}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
