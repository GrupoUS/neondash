import { motion } from "framer-motion";
import { Bell, CalendarPlus, Heart, Target, ThermometerSun, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ProcedimentoSelector } from "../../shared/ProcedimentoSelector";
import { FieldDisplay } from "./FieldDisplay";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] as const },
  },
};

const ProcedureListDisplay = ({ procedureIds }: { procedureIds: number[] }) => {
  const { data: procedures } = trpc.procedimentos.list.useQuery();

  if (!procedureIds || procedureIds.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const procedureNames = procedureIds
    .map((id) => {
      const proc = procedures?.find((p: { id: number; nome: string }) => p.id === id);
      return proc ? proc.nome : undefined;
    })
    .filter(Boolean);

  if (procedureNames.length === 0 && procedures) {
    return <span className="text-sm text-muted-foreground">IDs: {procedureIds.join(", ")}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {procedureNames.map((name, i) => (
        <Badge
          key={i}
          variant="secondary"
          className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary border border-primary/20"
        >
          {name}
        </Badge>
      ))}
    </div>
  );
};

interface LeadInfoModulesProps {
  data: any; // Type should be properly defined in a shared types file
  isEditing: boolean;
  editData: any;
  setEditData: (data: any) => void;
  updateMutation: any;
  isReadOnly?: boolean;
  onSchedule?: (name: string) => void;
}

export function LeadInfoModules({
  data,
  isEditing,
  editData,
  setEditData,
  updateMutation,
  isReadOnly,
  onSchedule,
}: LeadInfoModulesProps) {
  const tempConfig = {
    frio: { color: "text-blue-500", bg: "bg-blue-500/10" },
    morno: { color: "text-amber-500", bg: "bg-amber-500/10" },
    quente: { color: "text-red-500", bg: "bg-red-500/10" },
    default: { color: "text-muted-foreground", bg: "bg-muted/30" },
  };

  const getTemperatureStyle = (temp?: string) => {
    return tempConfig[temp as keyof typeof tempConfig] || tempConfig.default;
  };

  const currentTemp = isEditing ? editData?.temperatura : data.lead.temperatura;
  const tempStyle = getTemperatureStyle(currentTemp);

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.1 } },
      }}
    >
      {/* Section: Dados Pessoais */}
      <motion.div variants={sectionVariants} className="space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-border/40">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <h4 className="text-sm font-bold text-foreground tracking-tight">Dados Pessoais</h4>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <FieldDisplay
            label="Data Nascimento"
            value={
              data.lead.dataNascimento
                ? new Date(data.lead.dataNascimento).toLocaleDateString("pt-BR")
                : "—"
            }
            isEditing={isEditing}
            editComponent={
              <Input
                type="date"
                value={(editData?.dataNascimento as string) || ""}
                onChange={(e) => setEditData({ ...editData, dataNascimento: e.target.value })}
                className="bg-card border-border h-9 text-sm"
              />
            }
          />
          <FieldDisplay
            label="Gênero"
            value={data.lead.genero || "—"}
            isEditing={isEditing}
            editComponent={
              <Select
                value={(editData?.genero as string) || ""}
                onValueChange={(val) => setEditData({ ...editData, genero: val })}
              >
                <SelectTrigger className="h-9 bg-card border-border text-sm">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            }
          />
          <FieldDisplay
            label="Profissão"
            value={data.lead.profissao || "—"}
            isEditing={isEditing}
            editComponent={
              <Input
                value={(editData?.profissao as string) || ""}
                onChange={(e) => setEditData({ ...editData, profissao: e.target.value })}
                className="bg-card border-border h-9 text-sm"
              />
            }
          />
          <FieldDisplay
            label="Telefone"
            value={data.lead.telefone || "—"}
            isEditing={isEditing}
            editComponent={
              <Input
                value={(editData?.telefone as string) || ""}
                onChange={(e) => setEditData({ ...editData, telefone: e.target.value })}
                className="bg-card border-border h-9 text-sm"
              />
            }
          />
        </div>
      </motion.div>

      {/* Section: Anamnese & Interesse */}
      <motion.div variants={sectionVariants} className="space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-border/40">
          <div className="p-1.5 rounded-lg bg-pink-500/10">
            <Heart className="h-4 w-4 text-pink-500" />
          </div>
          <h4 className="text-sm font-bold text-foreground tracking-tight">Anamnese & Interesse</h4>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <FieldDisplay
            label="Queixa Principal"
            value={data.lead.dorPrincipal || "—"}
            isEditing={isEditing}
            editComponent={
              <Input
                value={(editData?.dorPrincipal as string) || ""}
                onChange={(e) => setEditData({ ...editData, dorPrincipal: e.target.value })}
                className="bg-card border-border h-9 text-sm"
              />
            }
          />
          <FieldDisplay
            label="Desejo Principal"
            value={data.lead.desejoPrincipal || "—"}
            isEditing={isEditing}
            editComponent={
              <Input
                value={(editData?.desejoPrincipal as string) || ""}
                onChange={(e) => setEditData({ ...editData, desejoPrincipal: e.target.value })}
                className="bg-card border-border h-9 text-sm"
              />
            }
          />
        </div>

        {/* Procedures of Interest */}
        <div className="space-y-2 pt-2">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
            Interesse em
          </Label>
          {isEditing ? (
            <ProcedimentoSelector
              value={(editData?.procedimentosInteresse as number[]) || []}
              onChange={(val) => setEditData({ ...editData, procedimentosInteresse: val })}
              disabled={updateMutation.isPending}
            />
          ) : (
            <ProcedureListDisplay
              procedureIds={(data.lead.procedimentosInteresse as number[]) || []}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-2">
          <FieldDisplay
            label="Histórico Estético"
            value={data.lead.historicoEstetico || "—"}
            isEditing={isEditing}
            editComponent={
              <Input
                value={(editData?.historicoEstetico as string) || ""}
                onChange={(e) => setEditData({ ...editData, historicoEstetico: e.target.value })}
                className="bg-card border-border h-9 text-sm"
              />
            }
          />
          <FieldDisplay
            label="Alergias"
            value={data.lead.alergias || "—"}
            valueClassName={data.lead.alergias ? "text-destructive font-semibold" : ""}
            isEditing={isEditing}
            editComponent={
              <Input
                value={(editData?.alergias as string) || ""}
                onChange={(e) => setEditData({ ...editData, alergias: e.target.value })}
                className="bg-card border-border h-9 text-sm"
              />
            }
          />
        </div>
      </motion.div>

      {/* Section: Qualificação */}
      <motion.div variants={sectionVariants} className="space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-border/40">
          <div className="p-1.5 rounded-lg bg-indigo-500/10">
            <Target className="h-4 w-4 text-indigo-500" />
          </div>
          <h4 className="text-sm font-bold text-foreground tracking-tight">Qualificação</h4>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
              Temperatura
            </Label>
            {isEditing ? (
              <Select
                value={(editData?.temperatura as string) || ""}
                onValueChange={(val) => setEditData({ ...editData, temperatura: val })}
              >
                <SelectTrigger className="h-9 bg-card border-border text-sm">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frio">❄️ Frio</SelectItem>
                  <SelectItem value="morno">🌤️ Morno</SelectItem>
                  <SelectItem value="quente">🔥 Quente</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold border border-transparent",
                  tempStyle.bg,
                  tempStyle.color
                )}
              >
                <ThermometerSun className="h-4 w-4" />
                <span className="capitalize">{currentTemp || "—"}</span>
              </div>
            )}
          </div>

          <FieldDisplay
            label="Disponibilidade"
            value={data.lead.disponibilidade || "—"}
            isEditing={isEditing}
            editComponent={
              <Input
                value={(editData?.disponibilidade as string) || ""}
                onChange={(e) => setEditData({ ...editData, disponibilidade: e.target.value })}
                placeholder="Ex: Seg a Sex, manhã"
                className="bg-card border-border h-9 text-sm"
              />
            }
          />
          <FieldDisplay
            label="Valor Estimado"
            value={new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format((data.lead.valorEstimado || 0) / 100)}
            valueClassName="text-emerald-500 font-bold font-mono"
            isEditing={isEditing}
            editComponent={
              <Input
                type="number"
                value={editData?.valorEstimado as number}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    valorEstimado: parseFloat(e.target.value) || 0,
                  })
                }
                className="bg-card border-border h-9 text-sm"
              />
            }
          />
          <FieldDisplay
            label="Indicado Por"
            value={data.lead.indicadoPor || "—"}
            isEditing={isEditing}
            editComponent={
              <Input
                value={(editData?.indicadoPor as string) || ""}
                onChange={(e) => setEditData({ ...editData, indicadoPor: e.target.value })}
                className="bg-card border-border h-9 text-sm"
              />
            }
          />
        </div>
      </motion.div>

      {/* Section: Próximo Acompanhamento */}
      <motion.div variants={sectionVariants} className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-border/40">
          <div className="p-1.5 rounded-lg bg-orange-500/10">
            <Bell className="h-4 w-4 text-orange-500" />
          </div>
          <h4 className="text-sm font-bold text-foreground tracking-tight">Acompanhamento</h4>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Próximo contato</span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 hover:bg-primary hover:text-primary-foreground border-primary/20"
              onClick={() => onSchedule?.(data.lead.nome)}
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              Agendar
            </Button>
          </div>
          <Textarea
            placeholder="Adicione uma nota rápida sobre o próximo passo..."
            className="min-h-[80px] bg-background/50 border-input resize-none text-sm placeholder:text-muted-foreground/50"
            disabled={isReadOnly}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
