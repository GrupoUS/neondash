import { Bookmark, CheckCircle2, Circle, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Conteúdo estático da aba "Atividades" - copiado do Notion "PLAY NEON"
 * Para atualizar, edite diretamente este arquivo.
 */
export function AtividadesContent() {
  return (
    <div className="space-y-6">
      {/* Header com ícone */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-500/20 rounded-lg">
          <Play className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">PLAY NEON</h2>
          <p className="text-zinc-400 text-sm">
            Sua jornada de crescimento começa aqui
          </p>
        </div>
      </div>

      {/* Callout principal */}
      <Card className="bg-zinc-800/50 border-yellow-500/30">
        <CardContent className="p-4 flex items-start gap-3">
          <Bookmark className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-white font-semibold">
              Aqui nossa jornada DE FATO começará a acontecer.
            </p>
            <p className="text-zinc-300 mt-1">
              Nessa página você encontrará todas as ferramentas e etapas para
              implementar na sua jornada.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Seções de Atividades */}
      <div className="grid gap-4 md:grid-cols-2">
        <ActivitySection
          title="📌 Etapa 1 - Fundamentos"
          tasks={[
            { label: "Assistir aula de boas-vindas", done: true },
            { label: "Preencher formulário inicial", done: true },
            { label: "Entrar no grupo de suporte", done: false },
          ]}
        />

        <ActivitySection
          title="📌 Etapa 2 - Estruturação"
          tasks={[
            { label: "Definir metas do mês", done: false },
            { label: "Configurar métricas de acompanhamento", done: false },
            { label: "Agendar primeira mentoria", done: false },
          ]}
        />

        <ActivitySection
          title="📌 Etapa 3 - Implementação"
          tasks={[
            { label: "Implementar estratégia de captação", done: false },
            { label: "Registrar primeiros leads", done: false },
            { label: "Fazer primeira venda", done: false },
          ]}
        />

        <ActivitySection
          title="📌 Etapa 4 - Escala"
          tasks={[
            { label: "Analisar dados do mês anterior", done: false },
            { label: "Otimizar processos", done: false },
            { label: "Definir próximas metas", done: false },
          ]}
        />
      </div>

      {/* Nota de rodapé */}
      <p className="text-zinc-500 text-sm text-center pt-4 border-t border-zinc-700">
        Conteúdo atualizado manualmente. Última atualização: Janeiro/2026
      </p>
    </div>
  );
}

interface Task {
  label: string;
  done: boolean;
}

function ActivitySection({
  title,
  tasks,
}: {
  title: string;
  tasks: Task[];
}) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-center gap-2">
            {task.done ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Circle className="w-4 h-4 text-zinc-500" />
            )}
            <span
              className={
                task.done ? "text-zinc-400 line-through" : "text-zinc-200"
              }
            >
              {task.label}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
