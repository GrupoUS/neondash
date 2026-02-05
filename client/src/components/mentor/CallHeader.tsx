import { Calendar, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface CallHeaderProps {
  mentorado: {
    nomeCompleto: string;
    fotoUrl: string | null;
    turma: string;
    email: string | null;
  };
  lastCallDate?: Date | null;
  nextCallDate?: Date | null;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getTurmaLabel(turma: string): string {
  const labels: Record<string, string> = {
    neon_estrutura: "Neon Estrutura",
    neon_escala: "Neon Escala",
  };
  return labels[turma] || turma;
}

export function CallHeader({ mentorado, lastCallDate, nextCallDate }: CallHeaderProps) {
  return (
    <Card className="bg-white dark:bg-slate-900 shadow-sm border-none">
      <CardContent className="p-6">
        <div className="flex items-center gap-5">
          <Avatar className="h-16 w-16 ring-2 ring-primary/20">
            <AvatarImage src={mentorado.fotoUrl ?? undefined} alt={mentorado.nomeCompleto} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {getInitials(mentorado.nomeCompleto)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
              {mentorado.nomeCompleto}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
              <Badge variant="secondary" className="font-medium">
                {getTurmaLabel(mentorado.turma)}
              </Badge>
              {mentorado.email && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {mentorado.email}
                </span>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                Última Call
              </div>
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(lastCallDate)}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                Próxima Call
              </div>
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(nextCallDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
