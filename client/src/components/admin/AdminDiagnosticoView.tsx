import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function AdminDiagnosticoView({ mentoradoId }: { mentoradoId: number }) {
  const { data: diagnostico, isLoading } =
    trpc.diagnostico.get.useQuery(
      { mentoradoId },
      { enabled: !!mentoradoId }
    );

  if (!mentoradoId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white/5 rounded-xl border border-white/10">
        <AlertCircle className="w-12 h-12 text-gray-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-300">
          Selecione um mentorado
        </h3>
        <p className="text-gray-500 mt-2">
          Selecione um mentorado acima para visualizar seu diagnóstico.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (!diagnostico) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white/5 rounded-xl border border-white/10">
        <AlertCircle className="w-12 h-12 text-gray-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-300">
          Diagnóstico não preenchido
        </h3>
        <p className="text-gray-500 mt-2">
          O mentorado ainda não preencheu o diagnóstico inicial.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-neon-purple/20 bg-neon-purple/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-neon-purple-light">
            <CheckCircle2 className="w-5 h-5" />
            Sobre o Momento Atual Profissional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-white text-sm">
              Área de Atuação na Saúde
            </h4>
            <p className="text-gray-400">
              {diagnostico.atuacaoSaude || "Não informado"}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">Tempo Livre</h4>
            <p className="text-gray-400">
              {diagnostico.tempoLivre || "Não informado"}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">
              Já atua na Estética?
            </h4>
            <p className="text-gray-400">
              {diagnostico.jaAtuaEstetica || "Não informado"}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">
              Possui Clínica/Consultório?
            </h4>
            <p className="text-gray-400">
              {diagnostico.temClinica || "Não informado"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-blue-400">
            Resultados Atuais (Financeiro)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-white text-sm">
              Renda Mensal Atual
            </h4>
            <p className="text-gray-400">
              {diagnostico.rendaMensal || "Não informado"}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">
              Quanto fatura com Estética?
            </h4>
            <p className="text-gray-400">
              {diagnostico.faturaEstetica || "Não informado"}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">
              Valor das Contas (fixas+variáveis)
            </h4>
            <p className="text-gray-400">
              {diagnostico.contas || "Não informado"}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">
              Custo de Vida Ideal
            </h4>
            <p className="text-gray-400">
              {diagnostico.custoVida || "Não informado"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-red-400">Dores e Desafios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-white text-sm">
              O que mais incomoda na rotina?
            </h4>
            <p className="text-gray-400">
              {diagnostico.incomodaRotina || "Não informado"}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">
              Maior dificuldade para crescer
            </h4>
            <p className="text-gray-400">
              {diagnostico.dificuldadeCrescer || "Não informado"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-neon-gold/20 bg-neon-gold/5">
        <CardHeader>
          <CardTitle className="text-neon-gold">Objetivos e Sonhos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-white text-sm">
              Objetivo para 6 meses
            </h4>
            <p className="text-gray-400">
              {diagnostico.objetivo6Meses || "Não informado"}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">
              Resultado Transformador
            </h4>
            <p className="text-gray-400">
              {diagnostico.resultadoTransformador || "Não informado"}
            </p>
          </div>
        </CardContent>
      </Card>


      <Card className="border-neon-pink/20 bg-neon-pink/5">
        <CardHeader>
          <CardTitle className="text-neon-pink">Primeiros Passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-white text-sm">
              Organização
            </h4>
            <div className="text-gray-400 whitespace-pre-wrap">
              {diagnostico.organizacao || "Não informado"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
