import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Alert {
  tipo: string;
  metrica?: string;
  level: "vermelho" | "amarelo" | "verde";
  message: string;
  usedFallback?: boolean;
}

interface AlertsSectionProps {
  alerts: Alert[];
  usedFallback?: boolean;
}

const SEVERITY_ORDER: Record<string, number> = {
  vermelho: 0,
  amarelo: 1,
  verde: 2,
};

const SEVERITY_STYLES: Record<
  string,
  { bg: string; border: string; icon: React.ElementType; iconColor: string }
> = {
  vermelho: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-l-4 border-l-red-500",
    icon: XCircle,
    iconColor: "text-red-500",
  },
  amarelo: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-l-4 border-l-amber-500",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
  },
  verde: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-l-4 border-l-green-500",
    icon: CheckCircle2,
    iconColor: "text-green-500",
  },
};

const LEVEL_EMOJI: Record<string, string> = {
  vermelho: "🔴",
  amarelo: "🟡",
  verde: "🟢",
};

export function AlertsSection({ alerts, usedFallback }: AlertsSectionProps) {
  // Sort alerts by severity: vermelho -> amarelo -> verde
  const sortedAlerts = [...alerts].sort(
    (a, b) => SEVERITY_ORDER[a.level] - SEVERITY_ORDER[b.level]
  );

  if (sortedAlerts.length === 0) {
    return (
      <Card className="border-none shadow-sm bg-green-50 dark:bg-green-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="text-green-700 dark:text-green-300 text-sm">
              Nenhum alerta ativo. Mentorado está dentro dos parâmetros esperados.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {usedFallback && (
        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
          ⚠️ Baseado em dados do mês anterior
        </Badge>
      )}

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {sortedAlerts.map((alert, index) => {
          const style = SEVERITY_STYLES[alert.level];
          const Icon = style.icon;

          return (
            <Card
              key={`${alert.tipo}-${alert.metrica}-${index}`}
              className={`border-none shadow-sm ${style.bg} ${style.border}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${style.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{LEVEL_EMOJI[alert.level]}</span>
                      {alert.metrica && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {alert.metrica}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{alert.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
