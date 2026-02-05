import { Save, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NeonCard } from "@/components/ui/neon-card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

export default function FinancialCoachSettings() {
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
      // Set default prompt if none exists
      setPrompt(
        "Você é um especialista em finanças para clínicas de estética. Analise os dados de faturamento, lucro e despesas. Identifique tendências de queda, gastos excessivos com insumos ou marketing ineficiente. Seja direto, motivador e use emojis. Foque em: 1. Aumentar margem de lucro. 2. Reduzir custos fixos. 3. Otimizar ticket médio."
      );
    }
  }, [currentPrompt, isLoading]);

  const handleSave = () => {
    saveSetting({
      key: "financial_coach_prompt",
      value: prompt,
      description: "Prompt mestre do Neon Coach Financeiro (Análise de Faturamento e Lucro)",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-neon-gold/10 border border-neon-gold/20 shadow-neon-gold/5 shadow-lg">
          <Sparkles className="w-8 h-8 text-neon-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-neon-gold to-amber-200 bg-clip-text text-transparent">
            Neon Coach Financeiro
          </h1>
          <p className="text-muted-foreground">
            Configure a personalidade e as diretrizes da IA para análise financeira.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <NeonCard variant="glow" className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Prompt do Sistema (System Message)
            </CardTitle>
            <CardDescription>
              Defina como a IA deve interpretar os dados financeiros. Inclua diretrizes sobre tom de
              voz, foco (lucro vs crescimento) e métricas chave.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Digite o prompt mestre aqui..."
              className="min-h-[300px] font-mono text-sm bg-background/50 border-primary/20 focus:border-neon-gold"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-neon-gold text-neon-navy hover:bg-neon-gold/90 font-semibold"
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
        </NeonCard>
      </div>
    </div>
  );
}
