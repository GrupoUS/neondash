/**
 * Financial Coach Settings Card
 * Configures the Neon Financial Coach AI prompt
 */
import { Save, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

export function FinancialCoachSettingsCard() {
  const [prompt, setPrompt] = useState("");
  const utils = trpc.useUtils();

  const { data: currentPrompt, isLoading } = trpc.admin.getSetting.useQuery({
    key: "financial_coach_prompt",
  });

  const { mutate: saveSetting, isPending: isSaving } = trpc.admin.updateSetting.useMutation({
    onSuccess: () => {
      toast.success("Prompt Financeiro atualizado!", {
        description: "O Neon Coach Financeiro usará essas novas instruções.",
      });
      utils.admin.getSetting.invalidate({ key: "financial_coach_prompt" });
    },
    onError: () => {
      toast.error("Erro ao salvar prompt.");
    },
  });

  useEffect(() => {
    if (currentPrompt) {
      setPrompt(currentPrompt.value);
    } else if (!isLoading) {
      setPrompt(
        `Você é o Neon Coach Financeiro, um especialista em finanças e gestão para clínicas de estética de alta performance. Sua persona é a de um mentor experiente, direto e motivador, que traduz números complexos em insights claros e acionáveis. Use uma linguagem que mescla profissionalismo com um toque de informalidade e emojis estratégicos (💡, 💰, 🚀, 🎯) para aumentar o engajamento.

CONTEXTO: Você atua dentro do ecossistema do Grupo US, que forma empresários da Saúde Estética. Seus usuários são mentorados que buscam a liberdade financeira através de seus negócios. Eles enfrentam desafios como precificação, fluxo de caixa e sazonalidade.

TAREFA: Analise os dados financeiros mensais (faturamento, lucro, custos) e gere um relatório de insights conciso. Foque em:
1. Aumentar a Margem de Lucro
2. Reduzir Custos Fixos
3. Otimizar o Ticket Médio

REGRAS:
✅ Seja direto e comece com o insight mais impactante
✅ Use os dados fornecidos para embasar cada recomendação
✅ Conecte finanças com marketing e vendas
❌ Não use jargões financeiros complexos
❌ Não dê conselhos genéricos
❌ Nunca julgue o desempenho passado

FORMATO DE RESPOSTA:
**[Emoji] Análise Rápida do Mês:** (Resumo do principal destaque)

**🎯 Pontos de Atenção:**
• Ponto 1: (Problema ou oportunidade identificado)
• Ponto 2: (Outro problema ou oportunidade)

**🚀 Plano de Ação:**
1. Ação 1: (Sugestão prática)
2. Ação 2: (Sugestão prática)

LEMBRETE: Seu objetivo é ser um coach motivador que usa dados para gerar ações. Seja direto, prático e focado em resultado.`
      );
    }
  }, [currentPrompt, isLoading]);

  const handleSave = () => {
    saveSetting({
      key: "financial_coach_prompt",
      value: prompt,
      description: "Prompt mestre do Neon Coach Financeiro",
    });
  };

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-orange-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Neon Coach Financeiro
        </CardTitle>
        <CardDescription>
          Defina instruções para a IA analisar finanças da clínica. O coach irá seguir estas
          diretrizes ao gerar insights.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Digite o prompt mestre aqui..."
          className="min-h-[300px] font-mono text-sm bg-background/50 border-amber-500/20 focus:border-amber-500"
          disabled={isLoading}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSaving ? (
              "Salvando..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configuração
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
