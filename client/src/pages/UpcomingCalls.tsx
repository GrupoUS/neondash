import { addMonths, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, Calendar, Phone, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

import DashboardLayout from "@/components/DashboardLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type FilterOption = "week" | "month" | "all";

interface CallCardProps {
  eventId: string;
  title: string;
  start: Date;
  end: Date;
  mentoradoId: number | null;
  mentoradoNome: string | null;
  alerts: Array<{
    tipo: string;
    level: string;
    message: string;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getDateRange(filter: FilterOption): { startDate: Date; endDate: Date } {
  const now = new Date();

  switch (filter) {
    case "week":
      return {
        startDate: startOfWeek(now, { locale: ptBR }),
        endDate: endOfWeek(now, { locale: ptBR }),
      };
    case "month":
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };
    case "all":
      return {
        startDate: now,
        endDate: addMonths(now, 3),
      };
  }
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function UpcomingCallsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[250px]" />
      </div>

      {/* Filter toolbar skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[80px]" />
        </div>
        <Skeleton className="h-10 w-[200px]" />
      </div>

      {/* Cards grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-[180px] w-full" />
        <Skeleton className="h-[180px] w-full" />
        <Skeleton className="h-[180px] w-full" />
        <Skeleton className="h-[180px] w-full" />
        <Skeleton className="h-[180px] w-full" />
        <Skeleton className="h-[180px] w-full" />
      </div>
    </div>
  );
}

function CallCard({ start, mentoradoId, mentoradoNome, alerts }: CallCardProps) {
  const [, navigate] = useLocation();

  // Count alerts by severity
  const criticalCount = alerts.filter((a) => a.level === "vermelho").length;
  const warningCount = alerts.filter((a) => a.level === "amarelo").length;
  const hasNoMetrics = alerts.some((a) => a.tipo === "sem_registro");

  const formattedDate = format(new Date(start), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  const handlePrepareCall = () => {
    if (mentoradoId) {
      navigate(`/admin/call-preparation/${mentoradoId}`);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={undefined} alt={mentoradoNome ?? "Mentorado"} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {getInitials(mentoradoNome)}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                {mentoradoNome ?? "Mentorado não identificado"}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formattedDate}
              </p>
            </div>

            {/* Alert badges */}
            <div className="flex flex-wrap gap-1.5">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  🔴 {criticalCount} crítico{criticalCount > 1 ? "s" : ""}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="warning" className="text-xs">
                  🟡 {warningCount} alerta{warningCount > 1 ? "s" : ""}
                </Badge>
              )}
              {hasNoMetrics && (
                <Badge variant="outline" className="text-xs">
                  Sem registro
                </Badge>
              )}
              {alerts.length === 0 && (
                <Badge variant="secondary" className="text-xs">
                  ✅ Sem alertas
                </Badge>
              )}
            </div>

            {/* Action button */}
            <Button
              size="sm"
              onClick={handlePrepareCall}
              disabled={!mentoradoId}
              className="w-full mt-2"
              title={!mentoradoId ? "Mentorado não identificado no calendário" : undefined}
            >
              <Phone className="h-4 w-4 mr-2" />
              Preparar Call
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function UpcomingCalls() {
  const [filter, setFilter] = useState<FilterOption>("week");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const dateRange = useMemo(() => getDateRange(filter), [filter]);

  const { data, isLoading, error, refetch } = trpc.mentor.getUpcomingCalls.useQuery(
    {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
    {
      refetchInterval: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Filter by search term (client-side)
  const filteredCalls = useMemo(() => {
    if (!data) return [];
    if (!debouncedSearch.trim()) return data;

    const term = debouncedSearch.toLowerCase();
    return data.filter((call) => call.mentoradoNome?.toLowerCase().includes(term));
  }, [data, debouncedSearch]);

  // Check for Google Calendar not connected error
  const isCalendarNotConnected =
    error?.data?.code === "PRECONDITION_FAILED" ||
    error?.message?.includes("Google Calendar não conectado");

  if (isLoading) {
    return (
      <DashboardLayout>
        <UpcomingCallsSkeleton />
      </DashboardLayout>
    );
  }

  if (isCalendarNotConnected) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Google Calendar não conectado</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>
                Para visualizar suas próximas calls, você precisa conectar sua conta Google
                Calendar.
              </p>
              <Link href="/configuracoes">
                <Button variant="outline" size="sm">
                  Ir para Configurações
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar calls</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>{error.message || "Não foi possível carregar as próximas calls."}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const filterOptions: { value: FilterOption; label: string }[] = [
    { value: "week", label: "Esta Semana" },
    { value: "month", label: "Este Mês" },
    { value: "all", label: "Todas" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Próximas Calls</h1>
            <p className="text-muted-foreground">
              {filteredCalls.length} call{filteredCalls.length !== 1 ? "s" : ""} encontrada
              {filteredCalls.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          {/* Filter Buttons */}
          <fieldset className="flex gap-2 border-0 p-0 m-0" aria-label="Filtrar por período">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={filter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(option.value)}
                aria-pressed={filter === option.value}
                aria-label={`Filtrar por ${option.label.toLowerCase()}`}
              >
                {option.label}
              </Button>
            ))}
          </fieldset>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar mentorado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              aria-label="Buscar por nome do mentorado"
            />
          </div>
        </div>

        {/* Content */}
        {filteredCalls.length === 0 ? (
          <Empty className="border">
            <EmptyMedia variant="icon">
              <Calendar className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>
              {debouncedSearch
                ? `Nenhuma call encontrada para "${debouncedSearch}"`
                : "Nenhuma call agendada"}
            </EmptyTitle>
            <EmptyDescription>
              {debouncedSearch
                ? "Tente buscar por outro nome ou limpe o filtro."
                : "Não há calls de mentoria agendadas para o período selecionado."}
            </EmptyDescription>
          </Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCalls.map((call) => (
              <CallCard
                key={call.eventId}
                eventId={call.eventId}
                title={call.title}
                start={call.start}
                end={call.end}
                mentoradoId={call.mentoradoId}
                mentoradoNome={call.mentoradoNome}
                alerts={call.alerts}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
