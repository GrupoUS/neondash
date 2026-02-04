import { Loader2, Save, Target, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

interface GoalsFormState {
  metaFaturamento: string;
  metaLeads: string;
  metaProcedimentos: string;
  metaPosts: string;
  metaStories: string;
}

const emptyGoals: GoalsFormState = {
  metaFaturamento: "",
  metaLeads: "",
  metaProcedimentos: "",
  metaPosts: "",
  metaStories: "",
};

export function MonthlyGoalsAdmin() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${currentYear}-${now.getMonth() + 1}`
  );
  const [globalGoals, setGlobalGoals] = useState<GoalsFormState>(emptyGoals);
  const [individualGoals, setIndividualGoals] = useState<GoalsFormState>(emptyGoals);
  const [selectedMentoradoId, setSelectedMentoradoId] = useState<string>("");

  const [ano, mes] = selectedMonth.split("-").map(Number);
  const utils = trpc.useContext();

  // Get mentorados list
  const { data: mentorados } = trpc.mentorados.list.useQuery();

  // Mutations
  const updateGlobalMutation = trpc.mentorados.updateGlobalMonthlyGoals.useMutation({
    onSuccess: (data) => {
      toast.success("Metas globais aplicadas", {
        description: `Metas de ${mes}/${ano} atualizadas para ${data.count} mentorados.`,
      });
      utils.mentorados.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao salvar metas globais", {
        description: error.message,
      });
    },
  });

  const updateIndividualMutation = trpc.mentorados.updateMonthlyGoals.useMutation({
    onSuccess: () => {
      toast.success("Meta individual salva", {
        description: `Meta personalizada para ${mes}/${ano} aplicada.`,
      });
      utils.mentorados.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao salvar meta individual", {
        description: error.message,
      });
    },
  });

  // Reset forms when month changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentional - reset forms when month selection changes
  useEffect(() => {
    setGlobalGoals(emptyGoals);
    setIndividualGoals(emptyGoals);
  }, [ano, mes]);

  const handleSaveGlobal = () => {
    updateGlobalMutation.mutate({
      ano,
      mes,
      metaFaturamento: globalGoals.metaFaturamento
        ? Number(globalGoals.metaFaturamento)
        : undefined,
      metaLeads: globalGoals.metaLeads ? Number(globalGoals.metaLeads) : undefined,
      metaProcedimentos: globalGoals.metaProcedimentos
        ? Number(globalGoals.metaProcedimentos)
        : undefined,
      metaPosts: globalGoals.metaPosts ? Number(globalGoals.metaPosts) : undefined,
      metaStories: globalGoals.metaStories ? Number(globalGoals.metaStories) : undefined,
    });
  };

  const handleSaveIndividual = () => {
    if (!selectedMentoradoId) {
      toast.error("Selecione um mentorado");
      return;
    }
    updateIndividualMutation.mutate({
      mentoradoId: Number(selectedMentoradoId),
      ano,
      mes,
      metaFaturamento: individualGoals.metaFaturamento
        ? Number(individualGoals.metaFaturamento)
        : undefined,
      metaLeads: individualGoals.metaLeads ? Number(individualGoals.metaLeads) : undefined,
      metaProcedimentos: individualGoals.metaProcedimentos
        ? Number(individualGoals.metaProcedimentos)
        : undefined,
      metaPosts: individualGoals.metaPosts ? Number(individualGoals.metaPosts) : undefined,
      metaStories: individualGoals.metaStories ? Number(individualGoals.metaStories) : undefined,
    });
  };

  // Generate month options
  const monthOptions = MONTHS.map((m) => ({
    value: `${currentYear}-${m.value}`,
    label: `${m.label} ${currentYear}`,
  }));

  const GoalsForm = ({
    goals,
    setGoals,
  }: {
    goals: GoalsFormState;
    setGoals: React.Dispatch<React.SetStateAction<GoalsFormState>>;
  }) => (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2 col-span-2">
        <Label htmlFor="metaFaturamento">Meta de Faturamento (R$)</Label>
        <Input
          id="metaFaturamento"
          type="number"
          placeholder="Ex: 20000"
          value={goals.metaFaturamento}
          onChange={(e) => setGoals({ ...goals, metaFaturamento: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="metaLeads">Meta de Leads</Label>
        <Input
          id="metaLeads"
          type="number"
          placeholder="Ex: 50"
          value={goals.metaLeads}
          onChange={(e) => setGoals({ ...goals, metaLeads: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="metaProcedimentos">Meta Procedimentos</Label>
        <Input
          id="metaProcedimentos"
          type="number"
          placeholder="Ex: 10"
          value={goals.metaProcedimentos}
          onChange={(e) => setGoals({ ...goals, metaProcedimentos: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="metaPosts">Meta Posts Feed</Label>
        <Input
          id="metaPosts"
          type="number"
          placeholder="Ex: 12"
          value={goals.metaPosts}
          onChange={(e) => setGoals({ ...goals, metaPosts: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="metaStories">Meta Stories</Label>
        <Input
          id="metaStories"
          type="number"
          placeholder="Ex: 60"
          value={goals.metaStories}
          onChange={(e) => setGoals({ ...goals, metaStories: e.target.value })}
        />
      </div>
    </div>
  );

  return (
    <Card className="bg-card dark:bg-slate-900/50 border-border dark:border-slate-700/50 hover:border-primary/30 transition-all shadow-sm mb-6">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Metas Mensais</CardTitle>
              <CardDescription>
                Configure objetivos para todos ou mentorados específicos
              </CardDescription>
            </div>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="global" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Meta Global
            </TabsTrigger>
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Meta Individual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Essas metas serão aplicadas para <strong>todos</strong> os mentorados ativos.
            </p>
            <GoalsForm goals={globalGoals} setGoals={setGlobalGoals} />
            <Button
              className="w-full mt-4"
              onClick={handleSaveGlobal}
              disabled={updateGlobalMutation.isPending}
            >
              {updateGlobalMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aplicando para todos...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Aplicar para Todos ({mentorados?.length ?? 0} mentorados)
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="individual" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Defina metas personalizadas para um mentorado específico (sobrescreve a meta global).
            </p>
            <div className="space-y-2">
              <Label>Mentorado</Label>
              <Select value={selectedMentoradoId} onValueChange={setSelectedMentoradoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um mentorado" />
                </SelectTrigger>
                <SelectContent>
                  {mentorados?.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.nomeCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <GoalsForm goals={individualGoals} setGoals={setIndividualGoals} />
            <Button
              className="w-full mt-4"
              onClick={handleSaveIndividual}
              disabled={updateIndividualMutation.isPending || !selectedMentoradoId}
            >
              {updateIndividualMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Meta Individual
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
