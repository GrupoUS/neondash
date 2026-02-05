/**
 * Marketing Agent Settings Card
 * Configures the Marketing AI Agent prompt for Instagram/content strategy
 */
import { Megaphone, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const DEFAULT_PROMPT = `Você é um especialista em marketing digital para profissionais de estética. Seu foco é Instagram, conteúdo orgânico e estratégias de engajamento. Analise métricas de posts, stories e reels. Sugira horários ideais de postagem, tipos de conteúdo que convertem e estratégias para aumentar alcance. Seja criativo e prático.`;

export function MarketingAgentSettingsCard() {
  const [prompt, setPrompt] = useState("");
  const utils = trpc.useUtils();

  const { data: currentPrompt, isLoading } = trpc.admin.getSetting.useQuery({
    key: "marketing_agent_prompt",
  });

  const { mutate: saveSetting, isPending: isSaving } = trpc.admin.updateSetting.useMutation({
    onSuccess: () => {
      toast.success("Prompt de Marketing atualizado!", {
        description: "O Agente de Marketing usará essas novas instruções.",
      });
      utils.admin.getSetting.invalidate({ key: "marketing_agent_prompt" });
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
      key: "marketing_agent_prompt",
      value: prompt,
      description: "Prompt do Agente IA de Marketing",
    });
  };

  return (
    <Card className="border-violet-500/20 bg-gradient-to-br from-violet-950/20 to-purple-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-violet-500" />
          Agente IA de Marketing
        </CardTitle>
        <CardDescription>
          Configure instruções para a IA auxiliar em estratégias de conteúdo, Instagram e
          engajamento digital.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Digite o prompt de marketing aqui..."
          className="min-h-[200px] font-mono text-sm bg-background/50 border-violet-500/20 focus:border-violet-500"
          disabled={isLoading}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-violet-600 hover:bg-violet-700 text-white"
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
