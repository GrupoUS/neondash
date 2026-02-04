import { Lightbulb, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

interface TopicSuggestionsProps {
  mentoradoId: number;
}

export function TopicSuggestions({ mentoradoId }: TopicSuggestionsProps) {
  const { data, isLoading, error } = trpc.mentor.generateTopicSuggestions.useQuery(
    { mentoradoId },
    {
      staleTime: 60 * 60 * 1000, // 1 hour cache as per tech spec
    }
  );

  if (isLoading) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Sugestões de Tópicos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["skel-1", "skel-2", "skel-3", "skel-4"].map((id) => (
            <Skeleton key={id} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-none shadow-sm bg-red-50 dark:bg-red-950/20">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">Não foi possível gerar sugestões</p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.suggestions || data.suggestions.length === 0) {
    return (
      <Card className="border-none shadow-sm bg-slate-50 dark:bg-slate-900/50">
        <CardContent className="py-6 text-center">
          <Lightbulb className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nenhuma sugestão disponível no momento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {data.source === "ai" ? (
            <Sparkles className="h-4 w-4 text-primary" />
          ) : (
            <Lightbulb className="h-4 w-4" />
          )}
          Sugestões de Tópicos
          {data.source === "fallback" && (
            <Badge variant="outline" className="ml-auto text-xs font-normal">
              Baseado em regras
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {data.suggestions.map((suggestion) => (
            <li
              key={suggestion.slice(0, 50)}
              className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-l-3 border-l-primary"
            >
              <span className="text-lg">💡</span>
              <span className="text-sm text-slate-700 dark:text-slate-300">{suggestion}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
