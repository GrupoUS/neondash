import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  BellOff,
  Trophy,
  AlertTriangle,
  Calendar,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const tipoConfig: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    label: string;
  }
> = {
  conquista: {
    icon: Trophy,
    color: "text-yellow-500 bg-yellow-50",
    label: "Conquista",
  },
  alerta_meta: {
    icon: AlertTriangle,
    color: "text-orange-500 bg-orange-50",
    label: "Alerta",
  },
  lembrete_metricas: {
    icon: Calendar,
    color: "text-blue-500 bg-blue-50",
    label: "Lembrete",
  },
  ranking: {
    icon: Trophy,
    color: "text-purple-500 bg-purple-50",
    label: "Ranking",
  },
};

export function NotificationsView() {
  const utils = trpc.useUtils();
  const { data: notificacoes, isLoading } =
    trpc.gamificacao.myNotificacoes.useQuery({ apenasNaoLidas: false });

  const markReadMutation = trpc.gamificacao.markRead.useMutation({
    onSuccess: () => {
      utils.gamificacao.myNotificacoes.invalidate();
    },
  });

  const naoLidas = notificacoes?.filter(n => n.lida === "nao").length || 0;

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate({ notificacaoId: id });
  };

  const handleMarkAllRead = () => {
    notificacoes
      ?.filter(n => n.lida === "nao")
      .forEach(n => {
        markReadMutation.mutate({ notificacaoId: n.id });
      });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Notificações</h3>
          <p className="text-sm text-muted-foreground">
            {naoLidas > 0
              ? `${naoLidas} não lida(s)`
              : "Tudo atualizado"}
          </p>
        </div>

        {naoLidas > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markReadMutation.isPending}
            className="text-xs h-8"
          >
            <Check className="w-3 h-3 mr-1" />
            Ler todas
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-neon-green" />
        </div>
      ) : !notificacoes || notificacoes.length === 0 ? (
        <Card className="border-none shadow-sm bg-card">
          <CardContent className="py-8 text-center">
            <BellOff className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma notificação nova.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {notificacoes.map(notif => {
            const config =
              tipoConfig[notif.tipo] || tipoConfig.lembrete_metricas;
            const Icon = config.icon;
            const isUnread = notif.lida === "nao";

            return (
              <Card
                key={notif.id}
                className={cn(
                  "border-none shadow-sm transition-all cursor-pointer hover:shadow-md",
                  isUnread ? "bg-card border-l-4 border-l-neon-green" : "bg-muted/30 opacity-75"
                )}
                onClick={() => isUnread && handleMarkRead(notif.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "p-1.5 rounded-full flex-shrink-0 mt-0.5",
                        config.color
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4
                          className={cn(
                            "font-semibold text-sm",
                            isUnread ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {notif.titulo}
                        </h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {formatDistanceToNow(new Date(notif.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-xs leading-relaxed",
                          isUnread ? "text-foreground/90" : "text-muted-foreground"
                        )}
                      >
                        {notif.mensagem}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
