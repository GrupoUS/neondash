import { Calendar as CalendarIcon, Link, RefreshCw } from "lucide-react";
import moment from "moment";
import "moment/locale/pt-br";
import { Calendar, type Event, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { NextPatientBanner } from "@/components/agenda/NextPatientBanner";
import { QuickStats } from "@/components/agenda/QuickStats";
import { ScheduleFilters } from "@/components/agenda/ScheduleFilters";

import { Button } from "@/components/ui/button";
import { NeonCard } from "@/components/ui/neon-card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

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
}

// Custom styling for dark theme
const calendarStyles = {
  style: { height: 700 },
  className: "neon-calendar",
};

export function Agenda() {
  const statusQuery = trpc.calendar.getStatus.useQuery();
  const authUrlQuery = trpc.calendar.getAuthUrl.useQuery(undefined, {
    enabled: statusQuery.data?.configured && !statusQuery.data?.connected,
  });
  const eventsQuery = trpc.calendar.getEvents.useQuery(undefined, {
    enabled: statusQuery.data?.connected,
  });
  const disconnectMutation = trpc.calendar.disconnect.useMutation({
    onSuccess: () => {
      statusQuery.refetch();
    },
  });

  // Convert events to Calendar format
  const events: CalendarEvent[] =
    eventsQuery.data?.events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: new Date(event.start),
      end: new Date(event.end),
      allDay: event.allDay,
      location: event.location,
      htmlLink: event.htmlLink,
    })) || [];

  // Mock data for Next Patient (in real app, calculate from events)
  const nextPatient = {
    name: "Ms. E. Rossi",
    procedure: "Preenchimento Labial",
    time: "3:30 PM",
    room: "Room 1",
    status: "Confirmed" as const,
  };

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
      <div className="space-y-4 p-6 bg-[#0B0E14] min-h-screen">
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
    );
  }

  // Not configured/connected states adapted to new theme
  if (!statusQuery.data?.configured || !statusQuery.data?.connected) {
    return (
      <div className="p-10 bg-[#0B0E14] min-h-screen flex items-center justify-center">
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
              : "Visualize seus compromissos diretamente no dashboard integrado. Seus dados permanecem seguros."}
          </p>
          {statusQuery.data?.configured && (
            <Button
              onClick={handleConnect}
              disabled={!authUrlQuery.data?.url}
              className="bg-[#C6A665] hover:bg-[#C6A665]/90 text-black font-bold text-lg px-8 py-6 rounded-xl"
            >
              <Link className="w-5 h-5 mr-3" />
              Sincronizar Google Calendar
            </Button>
          )}
        </NeonCard>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#0B0E14] min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#C6A665]/20 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-[#C6A665] tracking-tight">
            Neon Clinic Integrated Schedule
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content (Left) */}
        <div className="lg:col-span-3 space-y-6">
          <NextPatientBanner {...nextPatient} />

          <div className="bg-[#141820] border border-[#C6A665]/30 rounded-xl p-6 shadow-lg shadow-black/20">
            {eventsQuery.isLoading ? (
              <Skeleton className="h-[600px] w-full bg-gray-800" />
            ) : (
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
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
                onSelectEvent={(event) => {
                  if (event.htmlLink) {
                    window.open(event.htmlLink, "_blank");
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Sidebar Widgets (Right) */}
        <div className="lg:col-span-1 space-y-6">
          <QuickStats totalAppointments={14} expectedRevenue={8500} newPatients={2} />
          <ScheduleFilters />
        </div>
      </div>

      {/* Custom styles for Navy/Gold Theme */}
      <style>
        {`
          .neon-calendar {
            --rbc-today-highlight: rgba(198, 166, 101, 0.1);
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            color: #e2e8f0;
          }

          .neon-calendar .rbc-toolbar {
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
            gap: 1rem;
          }

          .neon-calendar .rbc-toolbar-label {
             font-size: 1.25rem;
             font-weight: 700;
             color: #C6A665;
             text-transform: uppercase;
             letter-spacing: 0.05em;
          }

          .neon-calendar .rbc-toolbar button {
            color: #C6A665;
            border: 1px solid #C6A665;
            border-radius: 0.5rem;
            background: transparent;
            padding: 0.375rem 0.75rem;
            transition: all 0.2s;
          }

          .neon-calendar .rbc-toolbar button:hover {
            background: rgba(198, 166, 101, 0.1);
          }

          .neon-calendar .rbc-toolbar button.rbc-active {
            background: #C6A665;
            color: #000;
            font-weight: 600;
          }

          .neon-calendar .rbc-header {
            padding: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #94a3b8;
            border-bottom: 1px solid rgba(198, 166, 101, 0.2);
          }

          .neon-calendar .rbc-month-view,
          .neon-calendar .rbc-time-view,
          .neon-calendar .rbc-agenda-view {
            border: 1px solid rgba(198, 166, 101, 0.2);
            background: #0B0E14;
            border-radius: 0.75rem;
          }

          .neon-calendar .rbc-day-bg {
            border-left: 1px solid rgba(198, 166, 101, 0.1);
          }

          .neon-calendar .rbc-off-range-bg {
            background: rgba(0, 0, 0, 0.3);
          }

          .neon-calendar .rbc-today {
            background: var(--rbc-today-highlight);
          }

          /* Events Styling */
          .neon-calendar .rbc-event {
            background: #1e293b;
            border: 1px solid #C6A665;
            color: #f1f5f9;
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 0.75rem;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
          }

          .neon-calendar .rbc-event:hover {
             background: #334155;
             transform: translateY(-1px);
          }
          
          /* Grid lines */
          .neon-calendar .rbc-day-slot .rbc-time-slot {
             border-top: 1px solid rgba(198, 166, 101, 0.1);
          }
          
          .neon-calendar .rbc-timeslot-group {
             border-bottom: 1px solid rgba(198, 166, 101, 0.1);
          }
           
          .neon-calendar .rbc-time-header-content {
             border-left: 1px solid rgba(198, 166, 101, 0.2);
          }
        `}
      </style>
    </div>
  );
}
