import { Calendar as CalendarIcon, Link, RefreshCw } from "lucide-react";
import moment from "moment";
import React from "react";
import "moment/locale/pt-br";
import { Calendar, type Event, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import withDragAndDrop, {
  type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";
import { NeonWeeklyCalendar } from "@/components/agenda/NeonWeeklyCalendar";
import { NextPatientBanner } from "@/components/agenda/NextPatientBanner";

import { Button } from "@/components/ui/button";
import { NeonCard } from "@/components/ui/neon-card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { toast } from "sonner";
import { EventFormDialog } from "@/components/agenda/EventFormDialog";
import DashboardLayout from "@/components/DashboardLayout";

// Set moment locale
moment.locale("pt-br");
const localizer = momentLocalizer(moment);

interface CalendarEvent extends Event {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  htmlLink?: string;
  isNeonEvent?: boolean; // Flag to differentiate Neon events
}

// Custom styling for dark theme
const calendarStyles = {
  style: { height: "calc(100vh - 200px)", minHeight: 500 },
  className: "neon-calendar",
};

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar);

export function Agenda() {
  const utils = trpc.useUtils();
  const [myEvents, setMyEvents] = React.useState<CalendarEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<
    { start: Date; end: Date; allDay?: boolean } | undefined
  >(undefined);

  const statusQuery = trpc.calendar.getStatus.useQuery();
  const authUrlQuery = trpc.calendar.getAuthUrl.useQuery(undefined, {
    enabled: statusQuery.data?.configured && !statusQuery.data?.connected,
  });
  const eventsQuery = trpc.calendar.getEvents.useQuery(undefined, {
    enabled: statusQuery.data?.connected,
  });
  const neonEventsQuery = trpc.calendar.getNeonCalendarEvents.useQuery();
  const disconnectMutation = trpc.calendar.disconnect.useMutation({
    onSuccess: () => {
      statusQuery.refetch();
    },
  });
  const handleCallbackMutation = trpc.calendar.handleCallback.useMutation({
    onSuccess: () => {
      // Clear URL params and refresh status
      window.history.replaceState({}, "", "/agenda");
      statusQuery.refetch();
    },
    onError: () => {
      window.history.replaceState({}, "", "/agenda?error=callback_failed");
    },
  });

  const updateEventMutation = trpc.calendar.updateEvent.useMutation({
    onSuccess: (updatedEvent) => {
      toast.success(`Evento "${updatedEvent.event.title}" foi movido com sucesso.`);
      utils.calendar.getEvents.invalidate();
    },
    onError: (error) => {
      // Check for scope/permission errors
      const isPermissionError =
        error.message.includes("SCOPE_INSUFFICIENT") ||
        error.message.includes("403") ||
        error.message.includes("Permission");

      if (isPermissionError) {
        toast.error("Permissão insuficiente", {
          description: "Desconecte e reconecte sua conta Google para atualizar as permissões.",
          duration: 8000,
        });
      } else {
        toast.error(`Erro ao atualizar evento: ${error.message}`);
      }
      // Revert changes by refetching
      utils.calendar.getEvents.invalidate();
    },
  });

  // Handle OAuth callback when returning from Google
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (error) {
      window.history.replaceState({}, "", "/agenda");
      return;
    }

    if (code && !handleCallbackMutation.isPending && !handleCallbackMutation.isSuccess) {
      handleCallbackMutation.mutate({ code, state: state || undefined });
    }
  }, [handleCallbackMutation]);

  // Convert events to Calendar format
  // Sync local events with query data
  React.useEffect(() => {
    if (eventsQuery.data?.events) {
      const formattedEvents = eventsQuery.data.events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start: new Date(event.start),
        end: new Date(event.end),
        allDay: event.allDay,
        location: event.location,
        htmlLink: event.htmlLink,
        isNeonEvent: false,
      }));
      setMyEvents(formattedEvents);
    }
  }, [eventsQuery.data]);

  // Merge Neon events with personal events
  const allEvents = React.useMemo(() => {
    const neonEvents: CalendarEvent[] = (neonEventsQuery.data?.events || []).map((event) => ({
      id: `neon-${event.id}`,
      title: `🌟 ${event.title}`,
      description: event.description || undefined,
      start: new Date(event.start),
      end: new Date(event.end),
      allDay: event.allDay,
      location: event.location || undefined,
      htmlLink: event.url || undefined,
      isNeonEvent: true,
    }));
    return [...myEvents, ...neonEvents];
  }, [myEvents, neonEventsQuery.data?.events]);

  // Style getter for differentiating event sources
  const eventPropGetter = React.useCallback((event: CalendarEvent) => {
    if (event.isNeonEvent) {
      return {
        style: {
          backgroundColor: "hsl(39 44% 65%)", // Gold
          borderLeft: "3px solid hsl(39 60% 50%)",
          color: "hsl(211 49% 10%)", // Navy text
          fontWeight: 600,
        },
      };
    }
    return {};
  }, []);

  const onEventResize = (args: EventInteractionArgs<CalendarEvent>) => {
    const { event, start, end } = args;

    // Optimistic update
    setMyEvents((prev) => {
      const existing = prev.find((ev) => ev.id === event.id);
      const filtered = prev.filter((ev) => ev.id !== event.id);
      if (!existing) return prev;
      return [...filtered, { ...existing, start: new Date(start), end: new Date(end) }];
    });

    updateEventMutation.mutate({
      id: event.id,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
    });
  };

  const onEventDrop = (args: EventInteractionArgs<CalendarEvent>) => {
    const { event, start, end, isAllDay } = args;

    // Optimistic update
    setMyEvents((prev) => {
      const existing = prev.find((ev) => ev.id === event.id);
      const filtered = prev.filter((ev) => ev.id !== event.id);
      if (!existing) return prev;
      return [
        ...filtered,
        { ...existing, start: new Date(start), end: new Date(end), allDay: Boolean(isAllDay) },
      ];
    });

    updateEventMutation.mutate({
      id: event.id,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      allDay: Boolean(isAllDay),
    });
  };

  const handleSelectSlot = ({
    start,
    end,
    slots,
  }: {
    start: Date;
    end: Date;
    slots: Date[] | string[];
  }) => {
    // Determine if allDay based on slots length (simplification) or just use the slot info
    const isAllDay = slots.length === 1;
    setSelectedSlot({ start: new Date(start), end: new Date(end), allDay: isAllDay });
    setIsDialogOpen(true);
  };

  // Calculate Next Patient
  const nextPatient = React.useMemo(() => {
    const now = new Date();
    const upcoming = myEvents
      .filter((ev) => ev.start > now && !ev.allDay)
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0];

    if (!upcoming) return null;

    return {
      name: upcoming.title || "Sem título",
      procedure: upcoming.description || "Consulta",
      time: moment(upcoming.start).format("HH:mm"),
      room: upcoming.location || "Consultório",
      status: "Confirmed" as const,
    };
  }, [myEvents]);

  const handleConnect = () => {
    if (authUrlQuery.data?.url) {
      window.location.href = authUrlQuery.data.url;
    }
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  if (statusQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-12 w-96 bg-gray-800" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="h-24 w-full bg-gray-800" />
              <Skeleton className="h-[600px] w-full bg-gray-800" />
            </div>
            <div className="lg:col-span-1 space-y-4">
              <Skeleton className="h-48 w-full bg-gray-800" />
              <Skeleton className="h-48 w-full bg-gray-800" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Not configured/connected states adapted to new theme
  if (!statusQuery.data?.configured || !statusQuery.data?.connected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <NeonCard className="p-10 text-center border-[#C6A665]/30 bg-[#141820] max-w-2xl">
            <CalendarIcon className="w-20 h-20 mx-auto mb-6 text-[#C6A665]" />
            <h2 className="text-3xl font-bold font-mono text-[#C6A665] mb-4">
              {!statusQuery.data?.configured
                ? "Google Calendar Não Configurado"
                : "Conecte seu Google Calendar"}
            </h2>
            <p className="text-lg text-gray-400 font-mono mb-8">
              {!statusQuery.data?.configured
                ? "O administrador precisa configurar as credenciais do Google Cloud para habilitar a integração."
                : "Sincronize sua agenda pessoal do Google Calendar para visualizar seus compromissos aqui."}
            </p>
            {statusQuery.data?.configured && (
              <Button
                onClick={handleConnect}
                disabled={!authUrlQuery.data?.url}
                className="bg-[#C6A665] hover:bg-[#C6A665]/90 text-black font-bold text-lg px-8 py-6 rounded-xl"
              >
                <Link className="w-5 h-5 mr-3" />
                Sincronizar Minha Agenda
              </Button>
            )}
            {!statusQuery.data?.configured && (
              <p className="text-gray-500 text-sm font-mono">
                Configure as variáveis <code className="text-[#C6A665]">GOOGLE_CLIENT_ID</code> e{" "}
                <code className="text-[#C6A665]">GOOGLE_CLIENT_SECRET</code> no arquivo{" "}
                <code className="text-[#C6A665]">.env</code>
              </p>
            )}
          </NeonCard>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#C6A665]/20 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif text-[#C6A665] tracking-tight">
              Agenda NEON
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleDisconnect}
              className="border-[#C6A665] text-[#C6A665] bg-[#C6A665]/10 hover:bg-[#C6A665]/20 font-mono"
            >
              <Link className="w-4 h-4 mr-2" />
              Google Calendar Synced
              <RefreshCw className="w-3 h-3 ml-2 opacity-50" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Neon Weekly Calendar */}
          <NeonWeeklyCalendar />

          {nextPatient && <NextPatientBanner {...nextPatient} />}

          <div className="bg-card border border-border rounded-xl p-4 lg:p-6 shadow-lg">
            {eventsQuery.isLoading ? (
              <Skeleton className="h-[500px] w-full" />
            ) : (
              <DnDCalendar
                localizer={localizer}
                events={allEvents}
                startAccessor="start"
                endAccessor="end"
                onEventDrop={onEventDrop}
                onEventResize={onEventResize}
                onSelectSlot={handleSelectSlot}
                selectable={true}
                draggableAccessor={(event) => !event.isNeonEvent}
                resizable
                eventPropGetter={eventPropGetter}
                {...calendarStyles}
                messages={{
                  today: "Hoje",
                  previous: "Anterior",
                  next: "Próximo",
                  month: "Mês",
                  week: "Semana",
                  day: "Dia",
                  agenda: "Agenda",
                  date: "Data",
                  time: "Hora",
                  event: "Evento",
                  noEventsInRange: "Nenhum evento neste período.",
                  showMore: (total) => `+${total} mais`,
                }}
                onSelectEvent={(event: CalendarEvent) => {
                  setSelectedSlot({ start: event.start, end: event.end, allDay: event.allDay });
                  if (event.htmlLink) {
                    window.open(event.htmlLink, "_blank");
                  }
                }}
              />
            )}
            <EventFormDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              defaultDate={
                selectedSlot
                  ? {
                      start: selectedSlot.start,
                      end: selectedSlot.end,
                      allDay: selectedSlot.allDay,
                    }
                  : undefined
              }
            />
          </div>
        </div>

        {/* Custom styles for Navy/Gold Theme */}
        <style>
          {`
          /* ===== LIGHT MODE (default) ===== */
          .neon-calendar {
            --rbc-bg: hsl(var(--card));
            --rbc-fg: hsl(var(--foreground));
            --rbc-border: hsl(var(--border));
            --rbc-accent: hsl(var(--primary));
            --rbc-accent-fg: hsl(var(--primary-foreground));
            --rbc-today: hsl(var(--primary) / 0.1);
            --rbc-today-border: hsl(var(--primary));
            --rbc-muted: hsl(var(--muted-foreground));
            --rbc-event-bg: hsl(var(--primary));
            --rbc-event-fg: hsl(var(--primary-foreground));
            
            font-family: var(--font-sans, ui-sans-serif, system-ui, sans-serif);
            color: var(--rbc-fg);
          }

          .neon-calendar .rbc-toolbar {
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
            gap: 1rem;
          }

          .neon-calendar .rbc-toolbar-label {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--rbc-accent);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-family: ui-serif, Georgia, serif;
          }

          .neon-calendar .rbc-toolbar button {
            color: var(--rbc-accent);
            border: 1px solid var(--rbc-accent);
            border-radius: 0.5rem;
            background: transparent;
            padding: 0.375rem 0.75rem;
            transition: all 0.2s ease;
            font-weight: 500;
          }

          .neon-calendar .rbc-toolbar button:hover {
            background: hsl(var(--primary) / 0.15);
            transform: translateY(-1px);
          }

          .neon-calendar .rbc-toolbar button.rbc-active {
            background: var(--rbc-accent);
            color: var(--rbc-accent-fg);
            font-weight: 600;
            box-shadow: 0 2px 8px hsl(var(--primary) / 0.3);
          }

          .neon-calendar .rbc-header {
            padding: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 0.75rem;
            color: var(--rbc-muted);
            border-bottom: 1px solid var(--rbc-border);
            background: linear-gradient(180deg, transparent 0%, hsl(var(--muted) / 0.05) 100%);
          }

          .neon-calendar .rbc-month-view,
          .neon-calendar .rbc-time-view,
          .neon-calendar .rbc-agenda-view {
            border: 1px solid var(--rbc-border);
            background: var(--rbc-bg);
            border-radius: 0.75rem;
            overflow: hidden;
            box-shadow: 0 4px 16px hsl(var(--foreground) / 0.05);
          }

          .neon-calendar .rbc-month-row + .rbc-month-row {
            border-top: 1px solid var(--rbc-border);
          }

          .neon-calendar .rbc-day-bg {
            border-left: 1px solid var(--rbc-border);
            transition: background 0.2s ease;
          }

          .neon-calendar .rbc-day-bg:hover {
            background: hsl(var(--primary) / 0.03);
          }

          .neon-calendar .rbc-off-range-bg {
            background: hsl(var(--muted) / 0.15);
          }

          /* TODAY HIGHLIGHT - Gold accent with subtle glow */
          .neon-calendar .rbc-today {
            background: linear-gradient(135deg, 
              hsl(var(--primary) / 0.08) 0%, 
              hsl(var(--primary) / 0.15) 50%,
              hsl(var(--primary) / 0.08) 100%
            ) !important;
            position: relative;
          }

          .neon-calendar .rbc-today::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, 
              transparent 0%, 
              var(--rbc-accent) 20%, 
              var(--rbc-accent) 80%, 
              transparent 100%
            );
          }

          /* Week/Day view: subtle left border for today column */
          .neon-calendar .rbc-time-column.rbc-today {
            border-left: 2px solid var(--rbc-accent) !important;
            box-shadow: inset 4px 0 12px hsl(var(--primary) / 0.1);
          }

          .neon-calendar .rbc-date-cell {
            padding: 0.5rem;
            text-align: right;
          }

          /* Today date number - highlight with gold */
          .neon-calendar .rbc-date-cell.rbc-now {
            font-weight: 700;
          }

          .neon-calendar .rbc-date-cell.rbc-now a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background: var(--rbc-accent);
            color: var(--rbc-accent-fg);
            border-radius: 50%;
            font-weight: 700;
            box-shadow: 0 2px 6px hsl(var(--primary) / 0.4);
          }

          /* Events Styling */
          .neon-calendar .rbc-event {
            background: var(--rbc-event-bg);
            border: none;
            color: var(--rbc-event-fg);
            border-radius: 6px;
            padding: 4px 8px;
            font-size: 0.75rem;
            font-weight: 600;
            box-shadow: 0 2px 4px hsl(var(--foreground) / 0.1);
            transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
            border-left: 3px solid hsl(var(--primary) / 0.6);
          }

          .neon-calendar .rbc-event:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 6px 12px hsl(var(--foreground) / 0.2);
            background: hsl(var(--primary) / 0.9);
          }

          .neon-calendar .rbc-event.rbc-selected {
            box-shadow: 0 0 0 2px var(--rbc-accent), 0 4px 12px hsl(var(--primary) / 0.3);
          }
          
          /* Grid lines - subtle */
          .neon-calendar .rbc-day-slot .rbc-time-slot {
            border-top: 1px solid hsl(var(--border) / 0.5);
          }
          
          .neon-calendar .rbc-timeslot-group {
            border-bottom: 1px solid var(--rbc-border);
          }
           
          .neon-calendar .rbc-time-header-content {
            border-left: 1px solid var(--rbc-border);
          }

          .neon-calendar .rbc-time-content {
            border-top: 2px solid var(--rbc-border);
          }

          .neon-calendar .rbc-time-gutter {
            color: var(--rbc-muted);
            font-size: 0.7rem;
            font-weight: 500;
            font-variant-numeric: tabular-nums;
          }

          /* Week view header - today highlight */
          .neon-calendar .rbc-header.rbc-today {
            background: linear-gradient(180deg, 
              hsl(var(--primary) / 0.1) 0%, 
              hsl(var(--primary) / 0.05) 100%
            );
            color: var(--rbc-accent);
            font-weight: 700;
            border-bottom: 2px solid var(--rbc-accent);
          }

          /* Week view specific */
          .neon-calendar .rbc-allday-cell {
            background: var(--rbc-bg);
          }

          /* Current time indicator - pulsing gold line */
          .neon-calendar .rbc-current-time-indicator {
            background: var(--rbc-accent);
            height: 2px;
            box-shadow: 0 0 8px var(--rbc-accent), 0 0 16px hsl(var(--primary) / 0.5);
          }

          .neon-calendar .rbc-current-time-indicator::before {
            content: '';
            position: absolute;
            left: -4px;
            top: -4px;
            width: 10px;
            height: 10px;
            background: var(--rbc-accent);
            border-radius: 50%;
            box-shadow: 0 0 6px var(--rbc-accent);
          }

          /* Agenda view */
          .neon-calendar .rbc-agenda-table {
            border-collapse: collapse;
          }

          .neon-calendar .rbc-agenda-date-cell,
          .neon-calendar .rbc-agenda-time-cell {
            padding: 0.75rem 1rem;
            white-space: nowrap;
            color: var(--rbc-muted);
            font-size: 0.8rem;
            font-weight: 500;
          }

          .neon-calendar .rbc-agenda-event-cell {
            padding: 0.75rem 1rem;
          }

          .neon-calendar .rbc-agenda-content {
            border-top: 1px solid var(--rbc-border);
          }

          .neon-calendar .rbc-agenda-content tr:hover {
            background: hsl(var(--primary) / 0.05);
          }

          /* ===== DARK MODE ===== */
          .dark .neon-calendar {
            --rbc-bg: hsl(212 48% 10%);
            --rbc-fg: hsl(210 20% 85%);
            --rbc-border: hsl(212 30% 20%);
            --rbc-accent: hsl(39 50% 58%);
            --rbc-accent-fg: hsl(212 50% 8%);
            --rbc-today: hsl(39 50% 58% / 0.12);
            --rbc-today-border: hsl(39 50% 58%);
            --rbc-muted: hsl(210 15% 55%);
            --rbc-event-bg: hsl(39 50% 58%);
            --rbc-event-fg: hsl(212 50% 8%);
          }

          .dark .neon-calendar .rbc-off-range-bg {
            background: hsl(212 50% 6%);
          }

          /* Dark mode today - Navy with Gold accent glow */
          .dark .neon-calendar .rbc-today {
            background: linear-gradient(135deg, 
              hsl(39 50% 58% / 0.08) 0%, 
              hsl(212 40% 15%) 50%,
              hsl(39 50% 58% / 0.05) 100%
            ) !important;
          }

          .dark .neon-calendar .rbc-today::before {
            background: linear-gradient(90deg, 
              transparent 0%, 
              hsl(39 50% 58%) 20%, 
              hsl(39 50% 58%) 80%, 
              transparent 100%
            );
          }

          .dark .neon-calendar .rbc-time-column.rbc-today {
            background: linear-gradient(180deg, 
              hsl(39 50% 58% / 0.06) 0%, 
              hsl(212 45% 12%) 100%
            ) !important;
            border-left: 2px solid hsl(39 50% 58%) !important;
            box-shadow: inset 4px 0 20px hsl(39 50% 58% / 0.08);
          }

          .dark .neon-calendar .rbc-header.rbc-today {
            background: linear-gradient(180deg, 
              hsl(39 50% 58% / 0.15) 0%, 
              hsl(39 50% 58% / 0.05) 100%
            );
            color: hsl(39 50% 58%);
            border-bottom: 2px solid hsl(39 50% 58%);
          }

          .dark .neon-calendar .rbc-event {
            box-shadow: 0 2px 8px hsl(0 0% 0% / 0.3);
          }

          .dark .neon-calendar .rbc-current-time-indicator {
            box-shadow: 0 0 12px hsl(39 50% 58%), 0 0 24px hsl(39 50% 58% / 0.4);
          }
        `}
        </style>
      </div>
    </DashboardLayout>
  );
}
