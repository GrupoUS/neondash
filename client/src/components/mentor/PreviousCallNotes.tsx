import { Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CallNotes {
  id: number;
  dataCall: Date;
  principaisInsights: string;
  acoesAcordadas: string;
  proximosPassos: string;
  duracaoMinutos: number | null;
}

interface PreviousCallNotesProps {
  lastCallNotes: CallNotes | null;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatContent(content: string): React.ReactNode {
  // Parse line breaks and render as list items if multiple lines
  const lines = content.split("\n").filter((line) => line.trim());

  if (lines.length > 1) {
    return (
      <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
        {lines.map((line, ix) => (
          <li key={`line-${ix}-${line.slice(0, 20)}`} className="text-sm">
            {line.trim()}
          </li>
        ))}
      </ul>
    );
  }

  return <p className="text-sm text-slate-700 dark:text-slate-300">{content}</p>;
}

export function PreviousCallNotes({ lastCallNotes }: PreviousCallNotesProps) {
  if (!lastCallNotes) {
    return (
      <Card className="border-none shadow-sm bg-slate-50 dark:bg-slate-900/50">
        <CardContent className="py-8 text-center">
          <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Primeira call com este mentorado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm bg-slate-50 dark:bg-slate-900/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Notas da Call Anterior
          <span className="text-xs font-normal text-slate-400 flex items-center gap-1 ml-auto">
            <Calendar className="h-3 w-3" />
            {formatDate(lastCallNotes.dataCall)}
            {lastCallNotes.duracaoMinutos && (
              <span className="ml-2">• {lastCallNotes.duracaoMinutos} min</span>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Principais Insights
          </h4>
          {formatContent(lastCallNotes.principaisInsights)}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Ações Acordadas
          </h4>
          {formatContent(lastCallNotes.acoesAcordadas)}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Próximos Passos
          </h4>
          {formatContent(lastCallNotes.proximosPassos)}
        </div>
      </CardContent>
    </Card>
  );
}
