import { LayoutDashboard, Mail, Pencil, Plus, Target, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { ProfileCard } from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

// Mentorado list item type (matches tRPC output)
interface MentoradoListItem {
  id: number;
  nomeCompleto: string;
  email: string | null;
  fotoUrl: string | null;
  turma: "neon";
  metaFaturamento: number;
  metaLeads: number | null;
  metaProcedimentos: number | null;
  metaPosts: number | null;
  metaStories: number | null;
}

type Turma = "neon";

interface MentoradoForm {
  nomeCompleto: string;
  email: string;
  fotoUrl: string;
  turma: Turma;
  metaFaturamento: number;
  metaLeads: number;
  metaProcedimentos: number;
  metaPosts: number;
  metaStories: number;
}

const defaultForm: MentoradoForm = {
  nomeCompleto: "",
  email: "",
  fotoUrl: "",
  turma: "neon",
  metaFaturamento: 16000,
  metaLeads: 50,
  metaProcedimentos: 10,
  metaPosts: 12,
  metaStories: 60,
};

export function MenteeManagementView() {
  const utils = trpc.useUtils();
  const { data: mentorados, isLoading } = trpc.mentorados.list.useQuery();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMentorado, setSelectedMentorado] = useState<MentoradoListItem | null>(null);
  const [form, setForm] = useState<MentoradoForm>(defaultForm);

  const createMutation = trpc.mentorados.createNew.useMutation({
    onSuccess: () => {
      toast.success("Mentorado criado com sucesso!");
      utils.mentorados.list.invalidate();
      setIsCreateOpen(false);
      setForm(defaultForm);
    },
    onError: (error) => {
      toast.error(`Erro ao criar: ${error.message}`);
    },
  });

  const updateMutation = trpc.mentorados.update.useMutation({
    onSuccess: () => {
      toast.success("Mentorado atualizado com sucesso!");
      utils.mentorados.list.invalidate();
      setIsEditOpen(false);
      setSelectedMentorado(null);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const deleteMutation = trpc.mentorados.delete.useMutation({
    onSuccess: () => {
      toast.success("Mentorado removido com sucesso!");
      utils.mentorados.list.invalidate();
      setIsDeleteOpen(false);
      setSelectedMentorado(null);
    },
    onError: (error) => {
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      nomeCompleto: form.nomeCompleto,
      email: form.email || undefined,
      fotoUrl: form.fotoUrl || undefined,
      turma: form.turma,
      metaFaturamento: form.metaFaturamento,
      metaLeads: form.metaLeads,
      metaProcedimentos: form.metaProcedimentos,
      metaPosts: form.metaPosts,
      metaStories: form.metaStories,
    });
  };

  const handleEdit = () => {
    if (!selectedMentorado) return;
    updateMutation.mutate({
      id: selectedMentorado.id,
      nomeCompleto: form.nomeCompleto,
      email: form.email || null,
      fotoUrl: form.fotoUrl || null,
      turma: form.turma,
      metaFaturamento: form.metaFaturamento,
      metaLeads: form.metaLeads,
      metaProcedimentos: form.metaProcedimentos,
      metaPosts: form.metaPosts,
      metaStories: form.metaStories,
    });
  };

  const handleDelete = () => {
    if (!selectedMentorado) return;
    deleteMutation.mutate({ id: selectedMentorado.id });
  };

  const openEditDialog = (mentorado: MentoradoListItem) => {
    setSelectedMentorado(mentorado);
    setForm({
      nomeCompleto: mentorado.nomeCompleto,
      email: mentorado.email || "",
      fotoUrl: mentorado.fotoUrl || "",
      turma: mentorado.turma,
      metaFaturamento: mentorado.metaFaturamento,
      metaLeads: mentorado.metaLeads || 50,
      metaProcedimentos: mentorado.metaProcedimentos || 10,
      metaPosts: mentorado.metaPosts || 12,
      metaStories: mentorado.metaStories || 60,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (mentorado: MentoradoListItem) => {
    setSelectedMentorado(mentorado);
    setIsDeleteOpen(true);
  };

  const filteredMentorados = mentorados;

  const stats = {
    total: mentorados?.length || 0,
    comEmail: mentorados?.filter((m) => m.email).length || 0,
  };

  const _getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {/* Header text removed as it will be in the parent tab structure mostly, but we can keep actions here */}
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-neon-blue hover:bg-neon-blue-dark">
              <Plus className="w-4 h-4 mr-2" />
              Novo Mentorado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Mentorado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={form.nomeCompleto}
                  onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
                  placeholder="Nome do mentorado"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>URL da Foto</Label>
                <Input
                  value={form.fotoUrl}
                  onChange={(e) => setForm({ ...form, fotoUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-sm text-slate-700 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Metas Personalizadas
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Meta Faturamento (R$)</Label>
                    <Input
                      type="number"
                      value={form.metaFaturamento}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          metaFaturamento: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Meta Leads</Label>
                    <Input
                      type="number"
                      value={form.metaLeads}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          metaLeads: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Meta Procedimentos</Label>
                    <Input
                      type="number"
                      value={form.metaProcedimentos}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          metaProcedimentos: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Meta Posts</Label>
                    <Input
                      type="number"
                      value={form.metaPosts}
                      onChange={(e) => setForm({ ...form, metaPosts: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Meta Stories</Label>
                    <Input
                      type="number"
                      value={form.metaStories}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          metaStories: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button
                onClick={handleCreate}
                disabled={!form.nomeCompleto || createMutation.isPending}
                className="bg-neon-blue hover:bg-neon-blue-dark"
              >
                {createMutation.isPending ? "Criando..." : "Criar Mentorado"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neon-blue/10 rounded-lg">
                <Users className="w-5 h-5 text-neon-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.comEmail}</p>
                <p className="text-xs text-slate-500">Com Email</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mentorados List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Lista de Mentorados</h2>

        {isLoading ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg">
            Carregando...
          </div>
        ) : filteredMentorados?.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg">
            Nenhum mentorado encontrado
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMentorados?.map((mentorado) => (
              <ProfileCard
                key={mentorado.id}
                name={mentorado.nomeCompleto}
                email={mentorado.email || undefined}
                imageUrl={mentorado.fotoUrl || undefined}
                jobTitle="Mentorado"
                turma={mentorado.turma}
                badges={[]} // Could add active/inactive here if needed
                stats={[
                  {
                    label: "Faturamento",
                    value: `R$ ${(mentorado.metaFaturamento || 0).toLocaleString("pt-BR")}`,
                  },
                  { label: "Leads", value: mentorado.metaLeads || 0 },
                  { label: "Posts", value: mentorado.metaPosts || 0 },
                ]}
                footer={
                  <div className="flex gap-2 w-full mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={() => openEditDialog(mentorado)}
                    >
                      <Pencil className="w-3 h-3 mr-1.5" /> Editar
                    </Button>
                    <Link href={`/leads?mentoradoId=${mentorado.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs h-8">
                        <LayoutDashboard className="w-3 h-3 mr-1.5" /> CRM
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => openDeleteDialog(mentorado)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Mentorado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                value={form.nomeCompleto}
                onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>URL da Foto</Label>
              <Input
                value={form.fotoUrl}
                onChange={(e) => setForm({ ...form, fotoUrl: e.target.value })}
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-sm text-slate-700 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Metas Personalizadas
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Meta Faturamento (R$)</Label>
                  <Input
                    type="number"
                    value={form.metaFaturamento}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        metaFaturamento: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Meta Leads</Label>
                  <Input
                    type="number"
                    value={form.metaLeads}
                    onChange={(e) => setForm({ ...form, metaLeads: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Meta Procedimentos</Label>
                  <Input
                    type="number"
                    value={form.metaProcedimentos}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        metaProcedimentos: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Meta Posts</Label>
                  <Input
                    type="number"
                    value={form.metaPosts}
                    onChange={(e) => setForm({ ...form, metaPosts: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Meta Stories</Label>
                  <Input
                    type="number"
                    value={form.metaStories}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        metaStories: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={handleEdit}
              disabled={!form.nomeCompleto || updateMutation.isPending}
              className="bg-neon-blue hover:bg-neon-blue-dark"
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Tem certeza que deseja remover <strong>{selectedMentorado?.nomeCompleto}</strong>? Esta
            ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
