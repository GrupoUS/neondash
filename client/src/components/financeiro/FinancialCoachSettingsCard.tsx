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
        "Você é um especialista em finanças para clínicas de estética. Analise os dados de faturamento, lucro e despesas. Identifique tendências de queda, gastos excessivos com insumos ou marketing ineficiente. Seja direto, motivador e use emojis. Foque em: 1. Aumentar margem de lucro. 2. Reduzir custos fixos. 3. Otimizar ticket médio."
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
          className="min-h-[200px] font-mono text-sm bg-background/50 border-amber-500/20 focus:border-amber-500"
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
