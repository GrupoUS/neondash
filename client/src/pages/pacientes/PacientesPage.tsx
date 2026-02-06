/**
 * PacientesPage - Patient Management Dashboard
 * Main page for the Prontuário Estético feature
 */

import {
  Camera,
  FileText,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Stethoscope,
  User,
  UserCircle,
} from "lucide-react";
import { useState } from "react";
import { Link, useRoute } from "wouter";

import DashboardLayout from "@/components/DashboardLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Novo Paciente
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items.map((paciente) => (
            <Link key={paciente.id} href={`/pacientes/${paciente.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={paciente.fotoUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {paciente.nomeCompleto
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{paciente.nomeCompleto}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {paciente.telefone || paciente.email || "Sem contato"}
                      </p>
                    </div>
                    <Badge
                      variant={paciente.status === "ativo" ? "default" : "secondary"}
                      className={cn(
                        paciente.status === "ativo" && "bg-emerald-500/10 text-emerald-600"
                      )}
                    >
                      {paciente.status === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

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

  const { data: paciente, isLoading } = trpc.pacientes.getById.useQuery({ id });

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
            <Button variant="outline" size="sm">
              Editar
            </Button>
            <Button size="sm">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPF</span>
                  <span>{paciente.cpf || "Não informado"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gênero</span>
                  <span className="capitalize">
                    {paciente.genero?.replace("_", " ") || "Não informado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Endereço</span>
                  <span className="text-right">{paciente.endereco || "Não informado"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Procedures */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Procedimentos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {paciente.procedimentos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum procedimento registrado
                  </p>
                ) : (
                  <div className="space-y-3">
                    {paciente.procedimentos.slice(0, 5).map((proc) => (
                      <div
                        key={proc.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{proc.nomeProcedimento}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(proc.dataRealizacao).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        {proc.valorReal && (
                          <Badge variant="outline">R$ {(proc.valorReal / 100).toFixed(2)}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Observações */}
          {paciente.observacoes && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{paciente.observacoes}</p>
              </CardContent>
            </Card>
          )}
        </NeonTabsContent>

        <NeonTabsContent value="medico">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ficha Médica</CardTitle>
            </CardHeader>
            <CardContent>
              {paciente.infoMedica ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Tipo Sanguíneo</h4>
                    <p className="text-muted-foreground">
                      {paciente.infoMedica.tipoSanguineo || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Alergias</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {paciente.infoMedica.alergias || "Nenhuma registrada"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Medicamentos Atuais</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {paciente.infoMedica.medicamentosAtuais || "Nenhum registrado"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Condições Preexistentes</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {paciente.infoMedica.condicoesPreexistentes || "Nenhuma registrada"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="font-medium mb-2">Histórico Cirúrgico</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {paciente.infoMedica.historicoCircurgico || "Nenhum registrado"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="font-medium mb-2">Contraindicações</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {paciente.infoMedica.contraindacacoes || "Nenhuma registrada"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">Ficha médica não preenchida</p>
                  <Button variant="outline">Preencher Ficha Médica</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </NeonTabsContent>

        <NeonTabsContent value="fotos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Galeria de Fotos</CardTitle>
              <Button size="sm">
                <Camera className="h-4 w-4 mr-1" /> Nova Foto
              </Button>
            </CardHeader>
            <CardContent>
              {paciente.fotosRecentes.length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhuma foto registrada</p>
                  <Button variant="outline">Adicionar Primeira Foto</Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {paciente.fotosRecentes.map((foto) => (
                    <div
                      key={foto.id}
                      className="aspect-square rounded-lg bg-muted overflow-hidden relative group cursor-pointer"
                    >
                      <img
                        src={foto.thumbnailUrl || foto.url}
                        alt={foto.descricao || "Foto do paciente"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Badge className="bg-primary">{foto.tipo}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </NeonTabsContent>

        <NeonTabsContent value="documentos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Documentos</CardTitle>
              <Button size="sm">
                <FileText className="h-4 w-4 mr-1" /> Novo Documento
              </Button>
            </CardHeader>
            <CardContent>
              {paciente.documentos.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhum documento registrado</p>
                  <Button variant="outline">Adicionar Primeiro Documento</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {paciente.documentos.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {doc.tipo}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </NeonTabsContent>

        <NeonTabsContent value="chat">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Assistente IA - Prontuário
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">Converse com a IA sobre este paciente</p>
                <Button>
                  <Sparkles className="h-4 w-4 mr-1" /> Iniciar Conversa
                </Button>
              </div>
            </CardContent>
          </Card>
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
