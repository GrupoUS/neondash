import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link2, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function VincularEmails() {
  const [selectedMentorado, setSelectedMentorado] = useState<string>("");
  const [email, setEmail] = useState("");

  const { data: mentorados, isLoading } = trpc.mentorados.list.useQuery();
  const linkEmailMutation = trpc.mentorados.linkEmail.useMutation({
    onSuccess: () => {
      toast.success("Email vinculado com sucesso!");
      setSelectedMentorado("");
      setEmail("");
    },
    onError: error => {
      toast.error(`Erro ao vincular email: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentorado || !email) {
      toast.error("Selecione um mentorado e informe o email");
      return;
    }
    linkEmailMutation.mutate({
      mentoradoId: parseInt(selectedMentorado),
      email,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-neon-blue-dark tracking-tight">
            Vincular Emails
          </h1>
          <p className="text-muted-foreground mt-2">
            Associe o email de login de cada mentorado ao seu perfil no sistema
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Vinculação */}
          <Card className="border-neon-blue/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neon-blue-dark">
                <Link2 className="w-5 h-5" />
                Novo Vínculo
              </CardTitle>
              <CardDescription>
                Selecione um mentorado e informe o email que ele usa para fazer
                login
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mentorado">Mentorado</Label>
                  <Select
                    value={selectedMentorado}
                    onValueChange={setSelectedMentorado}
                  >
                    <SelectTrigger id="mentorado">
                      <SelectValue placeholder="Selecione um mentorado" />
                    </SelectTrigger>
                    <SelectContent>
                      {mentorados?.map(m => (
                        <SelectItem key={m.id} value={m.id.toString()}>
                          {m.nomeCompleto} - Neon
                          {m.email && ` (${m.email})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email de Login</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Este deve ser o email que o mentorado usa para fazer login
                    no sistema
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-neon-blue-dark hover:bg-neon-blue"
                  disabled={linkEmailMutation.isPending}
                >
                  {linkEmailMutation.isPending
                    ? "Vinculando..."
                    : "Vincular Email"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de Mentorados */}
          <Card className="border-neon-blue/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neon-blue-dark">
                <Mail className="w-5 h-5" />
                Status dos Vínculos
              </CardTitle>
              <CardDescription>
                Mentorados e seus emails vinculados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {mentorados?.map(m => (
                  <div
                    key={m.id}
                    className="flex items-start justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground">
                        {m.nomeCompleto}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Neon
                      </div>
                      {m.email && (
                        <div className="text-xs text-neon-blue mt-1 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {m.email}
                        </div>
                      )}
                    </div>
                    <div>
                      {m.email ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instruções */}
        <Card className="border-neon-gold/30 bg-neon-gold/5">
          <CardHeader>
            <CardTitle className="text-neon-blue-dark">
              Como funciona?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>1.</strong> Selecione o mentorado que deseja vincular
            </p>
            <p>
              <strong>2.</strong> Informe o email que ele usa para fazer login
              (Google, Microsoft, etc.)
            </p>
            <p>
              <strong>3.</strong> Após vincular, quando o mentorado fizer login,
              ele verá automaticamente apenas seus dados
            </p>
            <p className="text-xs mt-4 text-amber-700">
              ⚠️ Atenção: O email deve ser exatamente o mesmo usado no login
              OAuth
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
