import { Calendar, RefreshCw, Unlink } from "lucide-react";
import moment from "moment";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface CalendarSettingsCardProps {
  lastSync?: Date;
  onDisconnect?: () => void;
}

export function CalendarSettingsCard({ onDisconnect }: CalendarSettingsCardProps) {
  const utils = trpc.useUtils();
  const statusQuery = trpc.calendar.getStatus.useQuery();

  const refreshNeonMutation = trpc.calendar.refreshNeonCalendar.useMutation({
    onSuccess: () => {
      toast.success("Calendário Neon atualizado!");
      utils.calendar.getNeonCalendarEvents.invalidate();
    },
    onError: () => {
      toast.error("Erro ao atualizar calendário Neon");
    },
  });

  const handleRefreshNeon = () => {
    refreshNeonMutation.mutate();
  };

  const handleRefreshGoogle = () => {
    utils.calendar.getEvents.invalidate();
    toast.success("Eventos do Google atualizados!");
  };

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#C6A665]/20 bg-[#141820]/80 backdrop-blur-sm px-4 py-3">
      {/* Status */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-[#C6A665]" />
        <span className="text-sm font-medium text-slate-300">Configurações da Agenda</span>
      </div>

      <div className="h-4 w-px bg-slate-700" />

      {/* Google Calendar Status */}
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${statusQuery.data?.connected ? "bg-emerald-500" : "bg-slate-500"}`}
        />
        <span className="text-xs text-slate-400">
          Google: {statusQuery.data?.connected ? "Conectado" : "Desconectado"}
        </span>
      </div>

      {/* Last Sync Time */}
      {statusQuery.data?.connected && (
        <span className="text-xs text-slate-500">
          Última sincronização: {moment().format("HH:mm")}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Refresh Neon Events */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefreshNeon}
          disabled={refreshNeonMutation.isPending}
          className="h-8 text-xs text-slate-400 hover:text-[#C6A665] hover:bg-[#C6A665]/10"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 mr-1.5 ${refreshNeonMutation.isPending ? "animate-spin" : ""}`}
          />
          Neon
        </Button>

        {/* Refresh Google Events */}
        {statusQuery.data?.connected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshGoogle}
            className="h-8 text-xs text-slate-400 hover:text-[#C6A665] hover:bg-[#C6A665]/10"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Google
          </Button>
        )}

        {/* Disconnect Button */}
        {statusQuery.data?.connected && onDisconnect && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDisconnect}
            className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Unlink className="h-3.5 w-3.5 mr-1.5" />
            Desconectar
          </Button>
        )}
      </div>
    </div>
  );
}
