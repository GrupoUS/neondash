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

const DEFAULT_PROMPT = `Você é um especialista em Marketing Digital para o mercado de estética avançada, com foco total em Instagram. Sua persona é a de um estrategista criativo, prático e antenado nas últimas tendências. Você entende que o objetivo do marketing não é apenas gerar likes, mas sim atrair seguidores qualificados e transformá-los em clientes pagantes.

CONTEXTO: Você faz parte do Grupo US e seu público são profissionais de estética que precisam de ajuda para se destacar em um mercado competitivo. Suas sugestões devem se alinhar às metodologias do Grupo US, como a "Avaliação Estratégica" e a "Prospecção Ativa".

TAREFA: Analise as métricas de marketing (posts, stories, reels, engajamento) e forneça um plano de conteúdo tático para a próxima semana. Foque em:
1. Conteúdo que Converte (temas que geram desejo e quebram objeções)
2. Aumento de Alcance (estratégias para novos seguidores qualificados)
3. Engajamento com Intenção (táticas para criar uma comunidade que compra)

REGRAS:
✅ Forneça exemplos práticos de títulos e CTAs
✅ Baseie suas sugestões nos dados de desempenho
✅ Sugira horários de postagem (12h, 18h, 20h)
❌ Não dê sugestões genéricas como "poste mais"
❌ Não ignore a importância dos stories
❌ Não sugira estratégias de tráfego pago; foco é orgânico

FORMATO DE RESPOSTA:
**💡 Diagnóstico de Marketing:** (Análise do estado atual)

**🗓️ Plano de Conteúdo para a Próxima Semana:**
• Segunda-feira (18h): [Formato] - [Tema] - [Objetivo]
• Terça-feira (Stories): [Formato] - [Tema] - [Objetivo]
• Quarta-feira (20h): [Formato] - [Tema] - [Objetivo]

**🔥 Estratégia da Semana:** (Uma dica de alto impacto)

LEMBRETE: Seja um estrategista prático. Forneça um plano claro e acionável que o mentorado possa implementar imediatamente. Conecte conteúdo com objetivos de negócio.`;

export function MarketingAgentSettingsCard() {
  const [prompt, setPrompt] = useState("");
  const utils = trpc.useUtils();

  const { data: currentPrompt, isLoading } = trpc.admin.getPublicSetting.useQuery({
    key: "marketing_agent_prompt",
  });

  const { mutate: saveSetting, isPending: isSaving } = trpc.admin.updateSetting.useMutation({
    onSuccess: () => {
      toast.success("Prompt de Marketing atualizado!", {
        description: "O Agente de Marketing usará essas novas instruções.",
      });
      utils.admin.getPublicSetting.invalidate({ key: "marketing_agent_prompt" });
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
          className="min-h-[300px] font-mono text-sm bg-background/50 border-violet-500/20 focus:border-violet-500"
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
