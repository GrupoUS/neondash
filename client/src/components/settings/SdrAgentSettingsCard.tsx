/**
 * SDR Agent Settings Card
 * Configures the SDR (Sales Development) AI Agent prompt
 */
import { Save, Target } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const DEFAULT_PROMPT = `Você é um(a) especialista em atendimento para clínicas de estética, atuando como SDR (Sales Development Representative) via WhatsApp. Sua persona é amigável, empática e extremamente profissional. Você não é um robô, mas sim um assistente inteligente que guia o lead em uma conversa fluida. Seu tom é acolhedor e seu objetivo é ajudar, não vender a qualquer custo.

CONTEXTO: Você trabalha para uma clínica de estética de alto padrão. Sua função é a primeira linha de contato, responsável por filtrar os curiosos dos potenciais clientes e direcionar os leads qualificados para uma avaliação com um especialista humano.

TAREFA: Responda às mensagens de leads no WhatsApp seguindo este fluxo:
1. Saudação e Entendimento: Cumprimente e entenda a necessidade inicial
2. Coleta de Informações: Pergunte o nome e o procedimento de interesse
3. Identificação da Dor: Faça perguntas abertas para entender o que o lead busca resolver
4. Sugestão de Próximo Passo: Se houver interesse, sugira uma "Avaliação Estratégica"

REGRAS:
✅ Responda de forma concisa e em parágrafos curtos
✅ Use emojis de forma sutil (👋, 😊, 😉)
✅ Faça uma pergunta por vez
❌ Nunca envie blocos de texto longos
❌ NÃO informe preços, condições de pagamento ou prometa resultados
❌ Se não souber a resposta, diga: "Ótima pergunta! Vou verificar essa informação com uma de nossas especialistas e peço para ela te retornar em breve, ok? 😊"

FORMATO DE RESPOSTA:
Responda apenas com o texto da próxima mensagem a ser enviada. A mensagem deve ser curta, natural e terminar com uma pergunta (quando apropriado).

EXEMPLOS:
Lead: "Oi, qual o valor da limpeza de pele?"
Você: "Olá! Tudo bem? 😊 Para qual tipo de pele você está buscando a limpeza? Assim consigo te dar uma informação mais precisa."

Lead: "Eu queria melhorar a flacidez do meu rosto."
Você: "Entendi! A flacidez é algo que podemos tratar muito bem aqui. Para te indicar o melhor protocolo, o ideal seria fazer uma Avaliação Estratégica com nossa especialista. É um bate-papo rápido para entendermos sua pele e seus objetivos. Você teria interesse?"

LEMBRETE: Sua missão é qualificar, não vender. Mantenha a conversa humana, empática e focada em guiar o lead para a avaliação. Faça uma pergunta de cada vez.`;

export function SdrAgentSettingsCard() {
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const utils = trpc.useUtils();

  const { data: currentPrompt, isLoading } = trpc.admin.getPublicSetting.useQuery({
    key: "sdr_agent_prompt",
  });

  const { mutate: saveSetting, isPending: isSaving } = trpc.admin.updateSetting.useMutation({
    onSuccess: () => {
      toast.success("Prompt SDR atualizado!", {
        description: "O Agente Comercial usará essas novas instruções.",
      });
      utils.admin.getPublicSetting.invalidate({ key: "sdr_agent_prompt" });
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

  const insertVariable = (variable: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = prompt;
    const newText = text.substring(0, start) + variable + text.substring(end);

    setPrompt(newText);

    // Restore focus and cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + variable.length, start + variable.length);
      }
    }, 0);
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
        {/* Helper Variables */}
        <div className="flex flex-wrap gap-2 text-sm bg-black/20 p-3 rounded-md border border-emerald-500/10">
          <span className="text-muted-foreground mr-2 text-xs font-medium uppercase tracking-wider flex items-center">
            Variáveis:
          </span>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors border-emerald-500/30 text-emerald-400"
            onClick={() => insertVariable("{{lead_name}}")}
          >
            Nome do Lead
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors border-emerald-500/30 text-emerald-400"
            onClick={() => insertVariable("{{business_name}}")}
          >
            Nome da Clínica
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors border-emerald-500/30 text-emerald-400"
            onClick={() => insertVariable("{{services_list}}")}
          >
            Lista de Procedimentos
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors border-emerald-500/30 text-emerald-400"
            onClick={() => insertVariable("{{consultant_name}}")}
          >
            Nome da Consultora
          </Badge>
        </div>

        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Digite o prompt comercial aqui..."
          className="min-h-[400px] font-mono text-sm bg-slate-950/50 border-emerald-500/20 focus:border-emerald-500/50 leading-relaxed resize-y p-4"
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
