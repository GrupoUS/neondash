/**
 * PacientesPage - Patient Management Dashboard
 * Main page for the Prontuário Estético feature
 */

import {
  ArrowRight,
  Camera,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Sparkles,
  Stethoscope,
  Trash2,
  User,
  UserCircle,
} from "lucide-react";

import { useState } from "react";
import { Link, useLocation, useRoute } from "wouter";

import DashboardLayout from "@/components/DashboardLayout";
import { AIChatWidget } from "@/components/pacientes/AIChatWidget";
import { DocumentManager } from "@/components/pacientes/DocumentManager";
import { PatientFormDialog } from "@/components/pacientes/PatientFormDialog";
import { PatientInfoCard } from "@/components/pacientes/PatientInfoCard";
import { PatientMedicalCard } from "@/components/pacientes/PatientMedicalCard";
import { PatientStatsCard } from "@/components/pacientes/PatientStatsCard";
import { PatientTimeline } from "@/components/pacientes/PatientTimeline";
import { PhotoComparison } from "@/components/pacientes/PhotoComparison";
import { PhotoGallery } from "@/components/pacientes/PhotoGallery";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  NeonTabs,
  NeonTabsContent,
  NeonTabsList,
  NeonTabsTrigger,
} from "@/components/ui/neon-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

// =============================================================================
// PATIENT LIST VIEW
// =============================================================================

function PatientsList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ativo" | "inativo" | undefined>(undefined);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [, navigate] = useLocation();

  const { data, isLoading } = trpc.pacientes.list.useQuery({
    search: search || undefined,
    status,
    limit: 50,
  });

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={status === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => setStatus(undefined)}
          >
            Todos
          </Button>
          <Button
            variant={status === "ativo" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatus("ativo")}
          >
            Ativos
          </Button>
          <Button
            variant={status === "inativo" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatus("inativo")}
          >
            Inativos
          </Button>
        </div>
      </div>

      {/* Patient Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={`skeleton-${i}-${Date.now()}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <Card className="p-12 text-center">
          <UserCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum paciente encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {search
              ? "Tente ajustar sua busca ou adicione um novo paciente."
              : "Comece adicionando seu primeiro paciente."}
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Novo Paciente
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items.map((paciente) => (
            <Card
              key={paciente.id}
              className="group cursor-pointer relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border-2 border-transparent hover:border-primary/30"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <CardContent className="relative p-4">
                {/* Header with avatar and actions */}
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
                    onClick={() => navigate(`/pacientes/${paciente.id}`)}
                    aria-label={`Ver prontuário de ${paciente.nomeCompleto}`}
                  >
                    <Avatar className="h-14 w-14 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                      <AvatarImage src={paciente.fotoUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-lg">
                        {paciente.nomeCompleto
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>

                  <button
                    type="button"
                    className="flex-1 min-w-0 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    onClick={() => navigate(`/pacientes/${paciente.id}`)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                        {paciente.nomeCompleto}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      {paciente.telefone ? (
                        <span className="flex items-center gap-1 truncate">
                          <Phone className="h-3 w-3" />
                          {paciente.telefone}
                        </span>
                      ) : paciente.email ? (
                        <span className="truncate">{paciente.email}</span>
                      ) : (
                        <span className="text-muted-foreground/50">Sem contato</span>
                      )}
                    </div>
                  </button>

                  {/* Quick Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/pacientes/${paciente.id}`)}>
                        <User className="h-4 w-4 mr-2" />
                        Ver Prontuário
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status Badge + Last Update */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                  <Badge
                    variant={paciente.status === "ativo" ? "default" : "secondary"}
                    className={cn(
                      "text-xs",
                      paciente.status === "ativo" &&
                        "bg-emerald-500/15 text-emerald-600 border-emerald-500/20"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-1.5 w-1.5 rounded-full mr-1.5",
                        paciente.status === "ativo" ? "bg-emerald-500" : "bg-muted-foreground"
                      )}
                    />
                    {paciente.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => navigate(`/pacientes/${paciente.id}`)}
                  >
                    Abrir
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Patient Dialog */}
      <PatientFormDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {/* Total Count */}
      {data && data.total > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Mostrando {data.items.length} de {data.total} pacientes
        </p>
      )}
    </div>
  );
}

// =============================================================================
// PATIENT DETAIL VIEW
// =============================================================================

function PatientDetail({ id }: { id: number }) {
  const [activeTab, setActiveTab] = useState("perfil");
  const [_editDialogOpen, setEditDialogOpen] = useState(false);
  const [_deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [, _navigate] = useLocation();
  const [chatPhotoContext, setChatPhotoContext] = useState<{ id?: number; url: string } | null>(
    null
  );

  const { data: paciente, isLoading } = trpc.pacientes.getById.useQuery({ id });
  const utils = trpc.useUtils();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!paciente) {
    return (
      <Card className="p-12 text-center">
        <UserCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Paciente não encontrado</h3>
        <p className="text-muted-foreground mb-4">
          O paciente solicitado não existe ou você não tem acesso.
        </p>
        <Link href="/pacientes">
          <Button variant="outline">Voltar para lista</Button>
        </Link>
      </Card>
    );
  }

  const handleAnalyzeWithAI = (photo: { id?: number; url: string }) => {
    setChatPhotoContext(photo);
    setActiveTab("chat");
  };

  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <Card className="p-6 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={paciente.fotoUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {paciente.nomeCompleto
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{paciente.nomeCompleto}</h1>
              <Badge
                variant={paciente.status === "ativo" ? "default" : "secondary"}
                className={cn(paciente.status === "ativo" && "bg-emerald-500/10 text-emerald-600")}
              >
                {paciente.status === "ativo" ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {paciente.telefone && <span>📞 {paciente.telefone}</span>}
              {paciente.email && <span>✉️ {paciente.email}</span>}
              {paciente.dataNascimento && <span>🎂 {paciente.dataNascimento}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setActiveTab("chat")}>
              <Sparkles className="h-4 w-4 mr-1" /> Chat IA
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{paciente.stats.totalProcedimentos}</p>
            <p className="text-xs text-muted-foreground">Procedimentos</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{paciente.stats.totalFotos}</p>
            <p className="text-xs text-muted-foreground">Fotos</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{paciente.stats.totalDocumentos}</p>
            <p className="text-xs text-muted-foreground">Documentos</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {paciente.stats.valorTotalGasto > 0
                ? `R$ ${(paciente.stats.valorTotalGasto / 100).toLocaleString("pt-BR")}`
                : "R$ 0"}
            </p>
            <p className="text-xs text-muted-foreground">Total Gasto</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <NeonTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center mb-6">
          <NeonTabsList>
            <NeonTabsTrigger value="perfil" className="gap-1.5">
              <User className="h-4 w-4" />
              Perfil
            </NeonTabsTrigger>
            <NeonTabsTrigger value="medico" className="gap-1.5">
              <Stethoscope className="h-4 w-4" />
              Ficha Médica
            </NeonTabsTrigger>
            <NeonTabsTrigger value="fotos" className="gap-1.5">
              <Camera className="h-4 w-4" />
              Galeria
            </NeonTabsTrigger>
            <NeonTabsTrigger value="documentos" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Documentos
            </NeonTabsTrigger>
            <NeonTabsTrigger value="chat" className="gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Chat IA
            </NeonTabsTrigger>
          </NeonTabsList>
        </div>

        <NeonTabsContent value="perfil">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <PatientInfoCard
                patient={{
                  id: paciente.id,
                  nomeCompleto: paciente.nomeCompleto,
                  dataNascimento: paciente.dataNascimento,
                  telefone: paciente.telefone,
                  email: paciente.email,
                  endereco:
                    [
                      paciente.logradouro,
                      paciente.numero,
                      paciente.bairro,
                      paciente.cidade,
                      paciente.estado,
                    ]
                      .filter(Boolean)
                      .join(", ") || null,
                  avatarUrl: paciente.fotoUrl,
                  status: paciente.status,
                  observacoes: paciente.observacoes,
                  updatedAt: paciente.updatedAt,
                }}
                onUpdate={() => utils.pacientes.getById.invalidate({ id: paciente.id })}
              />
              <PatientTimeline patientId={paciente.id} />
            </div>
            <div>
              <PatientStatsCard
                patientId={paciente.id}
                stats={{
                  totalProcedimentos: paciente.stats.totalProcedimentos,
                  totalFotos: paciente.stats.totalFotos,
                  totalDocumentos: paciente.stats.totalDocumentos,
                  ultimoProcedimento: paciente.stats.ultimoProcedimento ?? null,
                }}
                procedureHistory={paciente.procedimentos
                  .filter(
                    (p): p is typeof p & { dataRealizacao: NonNullable<typeof p.dataRealizacao> } =>
                      Boolean(p.dataRealizacao)
                  )
                  .slice(0, 6)
                  .map((p) => ({
                    month: new Date(p.dataRealizacao).toISOString().slice(0, 7),
                    count: 1,
                    valor: p.valorReal ?? 0,
                  }))}
              />
            </div>
          </div>
        </NeonTabsContent>

        <NeonTabsContent value="medico">
          <PatientMedicalCard
            patientId={paciente.id}
            medicalInfo={
              paciente.infoMedica
                ? {
                    id: paciente.infoMedica.id,
                    tipoSanguineo: paciente.infoMedica.tipoSanguineo,
                    alergias: paciente.infoMedica.alergias,
                    medicamentosEmUso: paciente.infoMedica.medicamentosAtuais,
                    historicoMedico: paciente.infoMedica.historicoCircurgico,
                    peso: null,
                    altura: null,
                    antecedentesEsteticos: paciente.infoMedica.condicoesPreexistentes,
                    expectativas: paciente.infoMedica.contraindacacoes,
                  }
                : null
            }
            onUpdate={() => utils.pacientes.getById.invalidate({ id: paciente.id })}
          />
        </NeonTabsContent>

        <NeonTabsContent value="fotos">
          <div className="space-y-6">
            <PhotoGallery patientId={paciente.id} onAnalyzeWithAI={handleAnalyzeWithAI} />
            <PhotoComparison patientId={paciente.id} onAnalyzeWithAI={handleAnalyzeWithAI} />
          </div>
        </NeonTabsContent>

        <NeonTabsContent value="documentos">
          <DocumentManager patientId={paciente.id} />
        </NeonTabsContent>

        <NeonTabsContent value="chat">
          <AIChatWidget
            patientId={paciente.id}
            patientName={paciente.nomeCompleto}
            preloadedPhoto={chatPhotoContext}
          />
        </NeonTabsContent>
      </NeonTabs>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function PacientesPage() {
  const [, params] = useRoute("/pacientes/:id");
  const patientId = params?.id ? Number(params.id) : null;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Stethoscope className="h-8 w-8 text-primary" />
              Prontuário Estético
            </h1>
            <p className="text-muted-foreground mt-1">
              {patientId ? "Detalhes do paciente" : "Gerencie seus pacientes e prontuários"}
            </p>
          </div>
          {!patientId && (
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Novo Paciente
            </Button>
          )}
          {patientId && (
            <Link href="/pacientes">
              <Button variant="outline">← Voltar para lista</Button>
            </Link>
          )}
        </div>

        {patientId ? <PatientDetail id={patientId} /> : <PatientsList />}
      </div>
    </DashboardLayout>
  );
}
