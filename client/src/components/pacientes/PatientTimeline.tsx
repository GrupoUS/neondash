import { Activity, Calendar, Camera, Clock, FileText, MessageSquare, Sparkles } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

interface TimelineEvent {
  id: number;
  type: "procedimento" | "foto" | "documento" | "chat";
  title: string;
  description: string | null;
  date: Date;
  metadata?: Record<string, unknown>;
}

interface PatientTimelineProps {
  patientId: number;
}

const eventIcons: Record<TimelineEvent["type"], typeof Activity> = {
  procedimento: Activity,
  foto: Camera,
  documento: FileText,
  chat: MessageSquare,
};

const eventColors: Record<TimelineEvent["type"], string> = {
  procedimento: "bg-primary text-primary-foreground",
  foto: "bg-blue-500 text-white",
  documento: "bg-green-500 text-white",
  chat: "bg-purple-500 text-white",
};

export function PatientTimeline({ patientId }: PatientTimelineProps) {
  const [filter, setFilter] = useState<"all" | TimelineEvent["type"]>("all");

  const { data: timeline, isLoading } = trpc.pacientes.getTimeline.useQuery(
    { pacienteId: patientId },
    { staleTime: 30_000 }
  );

  // Backend returns array directly, transform to TimelineEvent format
  const events = (timeline ?? []).map(
    (item): TimelineEvent => ({
      id: item.id,
      type: item.tipo as TimelineEvent["type"],
      title: item.titulo,
      description: item.descricao,
      date: item.data,
    })
  );

  const filteredEvents = filter === "all" ? events : events.filter((e) => e.type === filter);

  const groupedByMonth = filteredEvents.reduce(
    (acc: Record<string, TimelineEvent[]>, event) => {
      const monthKey = new Date(event.date).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(event);
      return acc;
    },
    {} as Record<string, TimelineEvent[]>
  );

  return (
    <Card className="border-primary/10">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Linha do Tempo
          </CardTitle>
          <CardDescription>Histórico cronológico de atividades</CardDescription>
        </div>

        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="procedimento">Procedimentos</SelectItem>
            <SelectItem value="foto">Fotos</SelectItem>
            <SelectItem value="documento">Documentos</SelectItem>
            <SelectItem value="chat">Chat IA</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma atividade registrada</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByMonth).map(([month, events]) => (
              <div key={month}>
                <h3 className="text-sm font-medium text-muted-foreground mb-4 capitalize">
                  {month}
                </h3>

                <div className="relative space-y-6 pl-8 border-l-2 border-muted">
                  {events.map((event) => {
                    const Icon = eventIcons[event.type];
                    return (
                      <div key={`${event.type}-${event.id}`} className="relative">
                        {/* Timeline dot */}
                        <div
                          className={`absolute -left-[calc(1rem+5px)] p-2 rounded-full ${eventColors[event.type]}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{event.title}</p>
                              {event.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              {new Date(event.date).toLocaleDateString("pt-BR", {
                                day: "numeric",
                                month: "short",
                              })}
                            </Badge>
                          </div>

                          {/* Metadata badges */}
                          {event.metadata && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {event.type === "procedimento" &&
                              typeof event.metadata.valor === "number" ? (
                                <Badge variant="secondary" className="text-xs">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(event.metadata.valor / 100)}
                                </Badge>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
