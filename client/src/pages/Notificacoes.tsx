import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  Bell,
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

export default function Notificacoes() {
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
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Notificações
            </h1>
            <p className="text-slate-500 mt-2">
              {naoLidas > 0
                ? `${naoLidas} notificação(ões) não lida(s)`
                : "Todas as notificações lidas"}
            </p>
          </div>

          {naoLidas > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllRead}
              disabled={markReadMutation.isPending}
            >
              <Check className="w-4 h-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neon-green" />
          </div>
        ) : !notificacoes || notificacoes.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardContent className="py-12 text-center">
              <BellOff className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Nenhuma notificação
              </h3>
              <p className="text-slate-500">
                Você não tem notificações no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
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
                    isUnread ? "bg-white" : "bg-slate-50 opacity-75"
                  )}
                  onClick={() => isUnread && handleMarkRead(notif.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "p-2 rounded-full flex-shrink-0",
                          config.color
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4
                            className={cn(
                              "font-semibold",
                              isUnread ? "text-slate-900" : "text-slate-600"
                            )}
                          >
                            {notif.titulo}
                          </h4>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-neon-green flex-shrink-0" />
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-sm mb-2",
                            isUnread ? "text-slate-600" : "text-slate-500"
                          )}
                        >
                          {notif.mensagem}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {formatDistanceToNow(new Date(notif.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>

                      {isUnread && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0"
                          onClick={e => {
                            e.stopPropagation();
                            handleMarkRead(notif.id);
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
