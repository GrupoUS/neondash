import { CalendarDays, ExternalLink, Phone, RefreshCw, Video } from "lucide-react";
import moment from "moment";
import React from "react";
import { Link } from "wouter";

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { NeonCard } from "@/components/ui/neon-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface NeonEvent {
  id: string;
  title: string;
  description: string | null;
  start: Date;
  end: Date;
  allDay: boolean;
  location: string | null;
  url: string | null;
}

interface NeonWeeklyCalendarProps {
  className?: string;
}

export function NeonWeeklyCalendar({ className }: NeonWeeklyCalendarProps) {
  const utils = trpc.useUtils();
  const neonEventsQuery = trpc.calendar.getNeonCalendarEvents.useQuery();

  // Get current week dates (Monday to Sunday)
  const weekDates = React.useMemo(() => {
    const today = moment();
    const startOfWeek = today.clone().startOf("isoWeek"); // Monday
    const dates: moment.Moment[] = [];
    for (let i = 0; i < 7; i++) {
      dates.push(startOfWeek.clone().add(i, "days"));
    }
    return dates;
  }, []);

  // Group events by day of week
  const eventsByDay = React.useMemo(() => {
    const byDay: Record<string, NeonEvent[]> = {};
    for (const date of weekDates) {
      byDay[date.format("YYYY-MM-DD")] = [];
    }

    if (neonEventsQuery.data?.events) {
      for (const event of neonEventsQuery.data.events) {
        const eventDate = moment(event.start).format("YYYY-MM-DD");
        if (byDay[eventDate]) {
          byDay[eventDate].push({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
          });
        }
      }
    }

    return byDay;
  }, [neonEventsQuery.data?.events, weekDates]);

  const handleRefresh = () => {
    utils.calendar.getNeonCalendarEvents.invalidate();
  };

  const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <NeonCard className={cn("p-4 border-[#C6A665]/30 bg-[#141820]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#C6A665]" />
          <h3 className="text-lg font-bold font-mono text-[#C6A665] uppercase tracking-wide">
            Agenda Neon Semanal
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={neonEventsQuery.isRefetching}
          className="text-[#C6A665] hover:bg-[#C6A665]/10"
        >
          <RefreshCw className={cn("w-4 h-4", neonEventsQuery.isRefetching && "animate-spin")} />
        </Button>
      </div>

      {/* Week Grid */}
      {neonEventsQuery.isLoading ? (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={`skeleton-${weekDates[i]?.format("YYYY-MM-DD") || i}`}
              className="h-24 bg-gray-800/50"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {weekDates.map((date, index) => {
            const dateKey = date.format("YYYY-MM-DD");
            const events = eventsByDay[dateKey] || [];
            const isToday = date.isSame(moment(), "day");

            return (
              <DayColumn
                key={dateKey}
                dayName={dayNames[index]}
                date={date}
                events={events}
                isToday={isToday}
              />
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground font-mono">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#C6A665]" />
          <span>Eventos Neon</span>
        </div>
        <div className="flex items-center gap-1">
          <Video className="w-3 h-3 text-blue-400" />
          <span>Link disponível</span>
        </div>
      </div>
    </NeonCard>
  );
}

interface DayColumnProps {
  dayName: string;
  date: moment.Moment;
  events: NeonEvent[];
  isToday: boolean;
}

function DayColumn({ dayName, date, events, isToday }: DayColumnProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg p-2 min-h-[100px] transition-colors",
        isToday
          ? "bg-[#C6A665]/15 border border-[#C6A665]/40"
          : "bg-gray-900/50 border border-gray-800/50"
      )}
    >
      {/* Day Header */}
      <div className="text-center mb-2">
        <div
          className={cn(
            "text-xs font-bold uppercase tracking-wider",
            isToday ? "text-[#C6A665]" : "text-gray-500"
          )}
        >
          {dayName}
        </div>
        <div
          className={cn(
            "text-sm font-mono",
            isToday ? "text-[#C6A665] font-bold" : "text-gray-400"
          )}
        >
          {date.format("DD")}
        </div>
      </div>

      {/* Events */}
      <div className="flex-1 space-y-1 overflow-hidden">
        {events.length === 0 ? (
          <div className="text-[10px] text-gray-600 text-center italic">—</div>
        ) : (
          events.slice(0, 3).map((event) => <EventItem key={event.id} event={event} />)
        )}
        {events.length > 3 && (
          <div className="text-[10px] text-[#C6A665] text-center">+{events.length - 3} mais</div>
        )}
      </div>
    </div>
  );
}

interface EventItemProps {
  event: NeonEvent;
}

/**
 * Check if event is a mentoring call based on title
 */
function isCallEvent(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return (
    lowerTitle.includes("call") || lowerTitle.includes("mentoria") || lowerTitle.includes("1:1")
  );
}

/**
 * Extract mentorado name from event title
 * Patterns: "CALL NEON - Name", "Call - Name", "Mentoria Name"
 */
function extractMentoradoName(title: string): string | null {
  const patterns = [
    /(?:call|mentoria|1:1)\s*(?:neon)?\s*[-:]\s*(.+)/i,
    /^(.+?)\s*[-:]\s*(?:call|mentoria)/i,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function EventItem({ event }: EventItemProps) {
  const { user } = useAuth();
  const time = moment(event.start).format("HH:mm");
  const hasLink = Boolean(event.url);
  const isCall = isCallEvent(event.title);
  const mentoradoName = isCall ? extractMentoradoName(event.title) : null;
  const isAdmin = user?.role === "admin";

  // Query mentorados to find matching ID (only for admins viewing calls)
  const mentoradosQuery = trpc.mentorados.list.useQuery(undefined, {
    enabled: isAdmin && isCall && Boolean(mentoradoName),
    staleTime: 10 * 60 * 1000, // 10 min cache
  });

  // Find matching mentorado by name
  const matchedMentorado = React.useMemo(() => {
    if (!mentoradoName || !mentoradosQuery.data) return null;
    const lowerName = mentoradoName.toLowerCase();
    return mentoradosQuery.data.find((m: { nomeCompleto: string; id: number }) =>
      m.nomeCompleto.toLowerCase().includes(lowerName)
    );
  }, [mentoradoName, mentoradosQuery.data]);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "group w-full text-left cursor-pointer rounded px-1.5 py-1 transition-colors",
              isCall
                ? "bg-teal-500/20 hover:bg-teal-500/30 border-l-2 border-teal-400"
                : "bg-[#C6A665]/20 hover:bg-[#C6A665]/30 border-l-2 border-[#C6A665]"
            )}
            onClick={() => {
              if (event.url) {
                window.open(event.url, "_blank", "noopener,noreferrer");
              }
            }}
          >
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-[10px] font-mono font-semibold",
                  isCall ? "text-teal-400" : "text-[#C6A665]"
                )}
              >
                {time}
              </span>
              {isCall && <Phone className="w-2.5 h-2.5 text-teal-400" />}
              {hasLink && !isCall && <Video className="w-2.5 h-2.5 text-blue-400" />}
            </div>
            <div className="text-[10px] text-white/90 truncate leading-tight">{event.title}</div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-[#1a1f2e] border-[#C6A665]/30 max-w-xs">
          <div className="space-y-2">
            <div>
              <div className={cn("font-bold", isCall ? "text-teal-400" : "text-[#C6A665]")}>
                {event.title}
              </div>
              <div className="text-xs text-gray-400">
                {moment(event.start).format("ddd, DD MMM • HH:mm")} -{" "}
                {moment(event.end).format("HH:mm")}
              </div>
            </div>
            {event.description && (
              <p className="text-xs text-gray-300 line-clamp-3">{event.description}</p>
            )}
            {event.location && <div className="text-xs text-gray-400">📍 {event.location}</div>}
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Abrir link
              </a>
            )}
            {/* Call Preparation Link for Admins */}
            {isAdmin && isCall && matchedMentorado && (
              <Link href={`/admin/call-preparation/${matchedMentorado.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-1 text-teal-400 border-teal-400/50 hover:bg-teal-400/10"
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Preparar Call
                </Button>
              </Link>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
