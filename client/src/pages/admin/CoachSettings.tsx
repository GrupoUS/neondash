import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

export default function CoachSettings() {
  const [prompt, setPrompt] = useState("");
  const utils = trpc.useUtils();

  const { data: currentPrompt, isLoading } = trpc.admin.getSetting.useQuery({
    key: "neon_coach_prompt",
  });

  const { mutate: saveSetting, isPending: isSaving } = trpc.admin.updateSetting.useMutation({
    onSuccess: () => {
      toast.success("Prompt atualizado com sucesso!", {
        description: "O Neon Coach usará essas novas instruções na próxima geração.",
      });
      utils.admin.getSetting.invalidate({ key: "neon_coach_prompt" });
    },
    onError: () => {
      toast.error("Erro ao salvar prompt.");
    },
  });

  useEffect(() => {
    if (currentPrompt) {
      setPrompt(currentPrompt.value);
    }
  }, [currentPrompt]);

  const handleSave = () => {
    saveSetting({
      key: "neon_coach_prompt",
      value: prompt,
      description: "Prompt mestre do Neon Coach (Business Intelligence)",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neon-gold" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Configurações do Neon Coach
        </h1>
        <p className="text-gray-400">
          Gerencie a inteligência e comportamento do assistente de IA.
        </p>
      </div>

      <Card className="border-neon-gold/20 bg-black/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🧠 Master Prompt</CardTitle>
          <CardDescription>
            Estas instruções definem a personalidade, regras e formato de resposta do Coach.
            Alterações aqui afetam todas as novas gerações de tarefas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[400px] font-mono text-sm leading-relaxed bg-black/60 border-white/10"
            placeholder="Digite o prompt do sistema aqui..."
          />

          <div className="flex justify-end gap-4">
            <Button
              onClick={() => {
                if (currentPrompt?.value) setPrompt(currentPrompt.value);
              }}
              variant="outline"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-neon-gold text-black hover:bg-neon-gold/80"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-blue-900/20 p-4 border border-blue-500/30">
        <h4 className="font-semibold text-blue-400 mb-2">Dica de Engenharia de Prompt</h4>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>
            Defina claramente a <strong>Persona</strong> (Ex: "Você é um especialista em...")
          </li>
          <li>
            Especifique o <strong>Formato de Saída</strong> JSON explicitamente.
          </li>
          <li>Use exemplos ("Few-Shot Prompting") para guiar o modelo.</li>
          <li>Mantenha as regras numeradas para o modelo seguir passo-a-passo.</li>
        </ul>
      </div>
    </div>
  );
}
