import { AlertTriangle, ChevronRight, Clock, User, Video } from "lucide-react";
import moment from "moment";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NeonCard } from "@/components/ui/neon-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

/**
 * UpcomingCallsSection
 *
 * Admin-only component that shows upcoming mentoria calls with alerts.
 * Integrates with Google Calendar to identify calls and mentorados.
 * Links to CallPreparation page for each identified mentorado.
 */
export function UpcomingCallsSection() {
  const { user } = useAuth();

  // Only render for admins
  if (!user || user.role !== "admin") {
    return null;
  }

  return <UpcomingCallsContent />;
}

function UpcomingCallsContent() {
  // Fetch upcoming calls (this week by default)
  const now = new Date();
  const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const {
    data: calls,
    isLoading,
    error,
  } = trpc.mentor.getUpcomingCalls.useQuery(
    { startDate: now, endDate: endOfWeek },
    { staleTime: 5 * 60 * 1000 }
  );

  if (isLoading) {
    return (
      <NeonCard className="p-4 border-[#C6A665]/30 bg-[#141820]">
        <div className="flex items-center gap-2 mb-4">
          <Video className="w-5 h-5 text-[#C6A665]" />
          <h3 className="text-lg font-bold font-mono text-[#C6A665] uppercase tracking-wide">
            Calls da Semana
          </h3>
        </div>
        <div className="space-y-2">
          {["skel-1", "skel-2", "skel-3"].map((id) => (
            <Skeleton key={id} className="h-16 w-full bg-gray-800/50" />
          ))}
        </div>
      </NeonCard>
    );
  }

  // Error state - Google not connected
  if (error) {
    const isGoogleNotConnected = error.message.includes("Google Calendar não conectado");
    if (isGoogleNotConnected) {
      return null; // Don't show section if Google not connected
    }
    return null; // Hide on any other error
  }

  // No calls
  if (!calls || calls.length === 0) {
    return (
      <NeonCard className="p-4 border-[#C6A665]/30 bg-[#141820]">
        <div className="flex items-center gap-2 mb-3">
          <Video className="w-5 h-5 text-[#C6A665]" />
          <h3 className="text-lg font-bold font-mono text-[#C6A665] uppercase tracking-wide">
            Calls da Semana
          </h3>
        </div>
        <p className="text-sm text-gray-500 text-center py-4">
          Nenhuma call de mentoria agendada para esta semana.
        </p>
      </NeonCard>
    );
  }

  return (
    <NeonCard className="p-4 border-[#C6A665]/30 bg-[#141820]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-[#C6A665]" />
          <h3 className="text-lg font-bold font-mono text-[#C6A665] uppercase tracking-wide">
            Calls da Semana
          </h3>
          <Badge variant="outline" className="border-[#C6A665]/50 text-[#C6A665] text-xs">
            {calls.length}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        {calls.slice(0, 5).map((call) => (
          <CallCard key={call.eventId} call={call} />
        ))}
      </div>

      {calls.length > 5 && (
        <p className="text-xs text-gray-500 text-center mt-3">
          +{calls.length - 5} mais calls nesta semana
        </p>
      )}
    </NeonCard>
  );
}

interface CallCardProps {
  call: {
    eventId: string;
    title: string;
    start: Date;
    end: Date;
    mentoradoId: number | null;
    mentoradoNome: string | null;
    alerts: Array<{
      tipo: string;
      metrica?: string;
      level: "vermelho" | "amarelo" | "verde";
      message: string;
    }>;
  };
}

function CallCard({ call }: CallCardProps) {
  const startDate = new Date(call.start);
  const criticalAlerts = call.alerts.filter((a) => a.level === "vermelho");
  const warningAlerts = call.alerts.filter((a) => a.level === "amarelo");
  const hasAlerts = criticalAlerts.length > 0 || warningAlerts.length > 0;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 p-3 rounded-lg transition-colors",
        hasAlerts
          ? "bg-orange-500/10 border border-orange-500/30"
          : "bg-gray-900/50 border border-gray-800/50 hover:bg-gray-800/50"
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Time */}
        <div className="flex flex-col items-center text-center min-w-[50px]">
          <span className="text-xs text-gray-500 uppercase">{moment(startDate).format("ddd")}</span>
          <span className="text-sm font-mono text-[#C6A665] font-semibold">
            {moment(startDate).format("HH:mm")}
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-white truncate">
              {call.mentoradoNome || "Mentorado não identificado"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Clock className="w-3 h-3 text-gray-500 flex-shrink-0" />
            <span className="text-xs text-gray-400 truncate">{call.title}</span>
          </div>
        </div>

        {/* Alerts */}
        {hasAlerts && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  {criticalAlerts.length > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      {criticalAlerts.length}
                    </Badge>
                  )}
                  {warningAlerts.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 border-orange-500 text-orange-500"
                    >
                      {warningAlerts.length}
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs bg-[#1a1f2e] border-[#C6A665]/30">
                <div className="space-y-1">
                  <p className="font-semibold text-orange-400 text-xs">Alertas:</p>
                  {call.alerts.slice(0, 3).map((alert, idx) => (
                    <p key={`${call.eventId}-alert-${idx}`} className="text-xs text-gray-300">
                      • {alert.message}
                    </p>
                  ))}
                  {call.alerts.length > 3 && (
                    <p className="text-xs text-gray-500">+{call.alerts.length - 3} mais</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Prepare Button */}
      {call.mentoradoId && (
        <Link href={`/admin/call-preparation/${call.mentoradoId}`}>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#C6A665] hover:bg-[#C6A665]/10 flex-shrink-0"
          >
            Preparar
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      )}
    </div>
  );
}
