/**
 * SDR Agent Settings Card
 * Configures the SDR (Sales Development) AI Agent prompt + behavior settings
 */
import {
  Clock,
  HandshakeIcon,
  MessageSquareText,
  RefreshCw,
  Save,
  Target,
  Timer,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SdrBehaviorConfig {
  autoGreeting: { enabled: boolean; message: string };
  responseSpeed: "instant" | "relaxed" | "manual";
  autoFollowup: { enabled: boolean; delayHours: number };
  businessHours: { enabled: boolean; start: string; end: string };
  handoffRules: { enabled: boolean; triggers: string[] };
}

const DEFAULT_BEHAVIOR: SdrBehaviorConfig = {
  autoGreeting: {
    enabled: true,
    message:
      "Olá! 👋 Vi que você se interessou pela nossa clínica. Posso te ajudar com alguma informação?",
  },
  responseSpeed: "relaxed",
  autoFollowup: { enabled: true, delayHours: 4 },
  businessHours: { enabled: true, start: "08:00", end: "20:00" },
  handoffRules: { enabled: true, triggers: ["preço", "valor", "humano", "atendente"] },
};

// ─── Settings Keys ────────────────────────────────────────────────────────────

const SETTINGS_KEYS = {
  prompt: "sdr_agent_prompt",
  behavior: "sdr_behavior_config",
} as const;

// ─── Default Prompt ───────────────────────────────────────────────────────────

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

LEMBRETE: Sua missão é qualificar, não vender. Mantenha a conversa humana, empática e focada em guiar o lead para a avaliação. Faça uma pergunta de cada vez.`;

// ─── Behavior Config Section ──────────────────────────────────────────────────

function BehaviorConfigSection({
  config,
  onChange,
  isSaving,
}: {
  config: SdrBehaviorConfig;
  onChange: (config: SdrBehaviorConfig) => void;
  isSaving: boolean;
}) {
  const update = <K extends keyof SdrBehaviorConfig>(key: K, value: SdrBehaviorConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">Comportamento Proativo</h3>
        <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
          Novo
        </Badge>
      </div>

      {/* Auto-Greeting */}
      <div className="space-y-2 p-3 rounded-lg bg-muted/20 border border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-emerald-500" />
            <Label className="text-sm font-medium">Auto-Saudação</Label>
          </div>
          <Switch
            checked={config.autoGreeting.enabled}
            onCheckedChange={(enabled) =>
              update("autoGreeting", { ...config.autoGreeting, enabled })
            }
            disabled={isSaving}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>
        {config.autoGreeting.enabled && (
          <Input
            value={config.autoGreeting.message}
            onChange={(e) =>
              update("autoGreeting", { ...config.autoGreeting, message: e.target.value })
            }
            placeholder="Mensagem de saudação automática…"
            className="text-xs h-8 bg-background/50 border-border/20"
            disabled={isSaving}
          />
        )}
        <p className="text-[11px] text-muted-foreground/60">
          Envia automaticamente ao receber primeira mensagem de um lead novo
        </p>
      </div>

      {/* Response Speed */}
      <div className="space-y-2 p-3 rounded-lg bg-muted/20 border border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-blue-500" />
            <Label className="text-sm font-medium">Velocidade de Resposta</Label>
          </div>
          <Select
            value={config.responseSpeed}
            onValueChange={(v) => update("responseSpeed", v as SdrBehaviorConfig["responseSpeed"])}
            disabled={isSaving}
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instant">⚡ Instantâneo</SelectItem>
              <SelectItem value="relaxed">🕐 Relaxado (30s)</SelectItem>
              <SelectItem value="manual">✋ Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-[11px] text-muted-foreground/60">
          {config.responseSpeed === "instant" && "Responde imediatamente — pode parecer robótico"}
          {config.responseSpeed === "relaxed" && "Delay de 15–45s para parecer humano"}
          {config.responseSpeed === "manual" && "IA prepara rascunho — você envia manualmente"}
        </p>
      </div>

      {/* Auto Follow-up */}
      <div className="space-y-2 p-3 rounded-lg bg-muted/20 border border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-500" />
            <Label className="text-sm font-medium">Follow-up Automático</Label>
          </div>
          <Switch
            checked={config.autoFollowup.enabled}
            onCheckedChange={(enabled) =>
              update("autoFollowup", { ...config.autoFollowup, enabled })
            }
            disabled={isSaving}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>
        {config.autoFollowup.enabled && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Após</span>
            <Input
              type="number"
              min={1}
              max={72}
              value={config.autoFollowup.delayHours}
              onChange={(e) =>
                update("autoFollowup", {
                  ...config.autoFollowup,
                  delayHours: Number(e.target.value) || 4,
                })
              }
              className="w-16 h-7 text-xs text-center bg-background/50 border-border/20"
              disabled={isSaving}
            />
            <span className="text-xs text-muted-foreground">horas sem resposta</span>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground/60">
          Envia follow-up se o lead não responder após o tempo configurado
        </p>
      </div>

      {/* Business Hours */}
      <div className="space-y-2 p-3 rounded-lg bg-muted/20 border border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" />
            <Label className="text-sm font-medium">Horário Comercial</Label>
          </div>
          <Switch
            checked={config.businessHours.enabled}
            onCheckedChange={(enabled) =>
              update("businessHours", { ...config.businessHours, enabled })
            }
            disabled={isSaving}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>
        {config.businessHours.enabled && (
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={config.businessHours.start}
              onChange={(e) =>
                update("businessHours", { ...config.businessHours, start: e.target.value })
              }
              className="w-24 h-7 text-xs bg-background/50 border-border/20"
              disabled={isSaving}
            />
            <span className="text-xs text-muted-foreground">até</span>
            <Input
              type="time"
              value={config.businessHours.end}
              onChange={(e) =>
                update("businessHours", { ...config.businessHours, end: e.target.value })
              }
              className="w-24 h-7 text-xs bg-background/50 border-border/20"
              disabled={isSaving}
            />
          </div>
        )}
        <p className="text-[11px] text-muted-foreground/60">
          Responde apenas durante o horário configurado
        </p>
      </div>

      {/* Handoff Rules */}
      <div className="space-y-2 p-3 rounded-lg bg-muted/20 border border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HandshakeIcon className="w-4 h-4 text-indigo-500" />
            <Label className="text-sm font-medium">Handoff para Humano</Label>
          </div>
          <Switch
            checked={config.handoffRules.enabled}
            onCheckedChange={(enabled) =>
              update("handoffRules", { ...config.handoffRules, enabled })
            }
            disabled={isSaving}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>
        {config.handoffRules.enabled && (
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground/70">
              Palavras-gatilho (separadas por vírgula)
            </Label>
            <Input
              value={config.handoffRules.triggers.join(", ")}
              onChange={(e) =>
                update("handoffRules", {
                  ...config.handoffRules,
                  triggers: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="preço, valor, humano, atendente"
              className="text-xs h-8 bg-background/50 border-border/20"
              disabled={isSaving}
            />
          </div>
        )}
        <p className="text-[11px] text-muted-foreground/60">
          Pausa a IA e notifica quando o lead menciona palavras-gatilho
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SdrAgentSettingsCard() {
  const [prompt, setPrompt] = useState("");
  const [behavior, setBehavior] = useState<SdrBehaviorConfig>(DEFAULT_BEHAVIOR);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const utils = trpc.useUtils();

  // ─── Queries ────────────────────────────────────────────────────────────────
  const { data: currentPrompt, isLoading: isLoadingPrompt } = trpc.admin.getPublicSetting.useQuery({
    key: SETTINGS_KEYS.prompt,
  });

  const { data: currentBehavior, isLoading: isLoadingBehavior } =
    trpc.admin.getPublicSetting.useQuery({
      key: SETTINGS_KEYS.behavior,
    });

  const isLoading = isLoadingPrompt || isLoadingBehavior;

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const { mutate: saveSetting, isPending: isSaving } = trpc.admin.updateSetting.useMutation({
    onSuccess: (_data, variables) => {
      if (variables.key === SETTINGS_KEYS.prompt) {
        toast.success("Prompt SDR atualizado!", {
          description: "O agente usará as novas instruções.",
        });
        utils.admin.getPublicSetting.invalidate({ key: SETTINGS_KEYS.prompt });
      } else {
        toast.success("Configurações de comportamento salvas!", {
          description: "As regras de automação foram atualizadas.",
        });
        utils.admin.getPublicSetting.invalidate({ key: SETTINGS_KEYS.behavior });
      }
    },
    onError: () => {
      toast.error("Erro ao salvar configuração.");
    },
  });

  // ─── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentPrompt) {
      setPrompt(currentPrompt.value);
    } else if (!isLoadingPrompt) {
      setPrompt(DEFAULT_PROMPT);
    }
  }, [currentPrompt, isLoadingPrompt]);

  useEffect(() => {
    if (currentBehavior?.value) {
      try {
        setBehavior({ ...DEFAULT_BEHAVIOR, ...JSON.parse(currentBehavior.value) });
      } catch {
        setBehavior(DEFAULT_BEHAVIOR);
      }
    }
  }, [currentBehavior]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSavePrompt = () => {
    saveSetting({
      key: SETTINGS_KEYS.prompt,
      value: prompt,
      description: "Prompt do Agente IA Comercial (SDR)",
    });
  };

  const handleSaveBehavior = () => {
    saveSetting({
      key: SETTINGS_KEYS.behavior,
      value: JSON.stringify(behavior),
      description: "Configurações de comportamento do SDR",
    });
  };

  const insertVariable = (variable: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = prompt;
    const newText = text.substring(0, start) + variable + text.substring(end);

    setPrompt(newText);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + variable.length, start + variable.length);
      }
    }, 0);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-green-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-500" />
          Agente IA Comercial (SDR)
        </CardTitle>
        <CardDescription>
          Configure comportamento e instruções do agente de qualificação de leads.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ── Behavior Config ─────────────────────────────────────────────── */}
        <BehaviorConfigSection config={behavior} onChange={setBehavior} isSaving={isSaving} />

        <div className="flex justify-end">
          <Button
            onClick={handleSaveBehavior}
            disabled={isSaving || isLoading}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSaving ? (
              "Salvando..."
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Salvar Comportamento
              </>
            )}
          </Button>
        </div>

        <Separator className="border-emerald-500/10" />

        {/* ── Prompt Editor ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Prompt de Instruções</h3>
          <p className="text-xs text-muted-foreground">
            Define a persona, regras de conversa e fluxo de qualificação do agente.
          </p>

          {/* Variables */}
          <div className="flex flex-wrap gap-1.5 bg-black/20 p-2.5 rounded-lg border border-emerald-500/10">
            <span className="text-muted-foreground mr-1.5 text-[10px] font-semibold uppercase tracking-wider flex items-center">
              Variáveis:
            </span>
            {[
              { label: "Nome do Lead", value: "{{lead_name}}" },
              { label: "Clínica", value: "{{business_name}}" },
              { label: "Procedimentos", value: "{{services_list}}" },
              { label: "Consultora", value: "{{consultant_name}}" },
            ].map((v) => (
              <Badge
                key={v.value}
                variant="outline"
                className="cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors border-emerald-500/30 text-emerald-400 text-[10px]"
                onClick={() => insertVariable(v.value)}
              >
                {v.label}
              </Badge>
            ))}
          </div>

          <Textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Digite o prompt comercial aqui…"
            className="min-h-[350px] font-mono text-xs bg-slate-950/50 border-emerald-500/20 focus:border-emerald-500/50 leading-relaxed resize-y p-3"
            disabled={isLoading}
          />

          <div className="flex justify-end">
            <Button
              onClick={handleSavePrompt}
              disabled={isSaving || isLoading}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSaving ? (
                "Salvando..."
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Salvar Prompt
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
