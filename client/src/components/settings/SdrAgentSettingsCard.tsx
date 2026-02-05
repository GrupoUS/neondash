/**
 * SDR Agent Settings Card
 * Configures the SDR (Sales Development) AI Agent prompt
 */
import { Save, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const DEFAULT_PROMPT = `Você é um especialista em vendas consultivas para clínicas de estética. Seu foco é qualificação de leads, scripts de abordagem e técnicas de fechamento. Ajude a estruturar o funil de vendas, melhorar conversões e criar relacionamento com potenciais clientes. Seja objetivo e orientado a resultados.`;

export function SdrAgentSettingsCard() {
  const [prompt, setPrompt] = useState("");
  const utils = trpc.useUtils();

  const { data: currentPrompt, isLoading } = trpc.admin.getSetting.useQuery({
    key: "sdr_agent_prompt",
  });

  const { mutate: saveSetting, isPending: isSaving } = trpc.admin.updateSetting.useMutation({
    onSuccess: () => {
      toast.success("Prompt SDR atualizado!", {
        description: "O Agente Comercial usará essas novas instruções.",
      });
      utils.admin.getSetting.invalidate({ key: "sdr_agent_prompt" });
    },
    onError: () => {
      toast.error("Erro ao salvar prompt.");
    },
  });

  useEffect(() => {
    if (currentPrompt) {
      setPrompt(currentPrompt.value);
    } else if (!isLoading) {
      setPrompt(DEFAULT_PROMPT);
    }
  }, [currentPrompt, isLoading]);

  const handleSave = () => {
    saveSetting({
      key: "sdr_agent_prompt",
      value: prompt,
      description: "Prompt do Agente IA Comercial (SDR)",
    });
  };

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-green-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-500" />
          Agente IA Comercial (SDR)
        </CardTitle>
        <CardDescription>
          Configure instruções para a IA auxiliar em qualificação de leads, vendas e atendimento
          comercial.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Digite o prompt comercial aqui..."
          className="min-h-[200px] font-mono text-sm bg-background/50 border-emerald-500/20 focus:border-emerald-500"
          disabled={isLoading}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
