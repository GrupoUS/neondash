import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { Mail, UserCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PrimeiroAcesso() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-neon-blue/10 flex items-center justify-center mx-auto">
            <UserCircle className="w-12 h-12 text-neon-blue" />
          </div>
          <h1 className="text-3xl font-bold text-neon-blue-dark">
            Bem-vindo ao Neon Dashboard!
          </h1>
          <p className="text-muted-foreground">
            Estamos felizes em ter você aqui
          </p>
        </div>

        {/* Status Card */}
        <Card className="border-amber-500/30 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="w-5 h-5" />
              Perfil Pendente de Vinculação
            </CardTitle>
            <CardDescription className="text-amber-800">
              Seu perfil de mentorado ainda não foi vinculado ao seu email de
              login
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-amber-200">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-sm text-amber-900">
                    Seu email de login
                  </div>
                  <div className="text-sm text-amber-700 mt-1">
                    {user?.email || "Email não disponível"}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-sm text-amber-800 space-y-2">
              <p>
                Para acessar seu dashboard personalizado com suas métricas e
                feedbacks, é necessário que o administrador vincule seu email ao
                seu perfil de mentorado.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Próximos Passos */}
        <Card className="border-neon-blue/20">
          <CardHeader>
            <CardTitle className="text-neon-blue-dark">
              Próximos Passos
            </CardTitle>
            <CardDescription>O que fazer agora?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                <div className="w-6 h-6 rounded-full bg-neon-blue text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    Entre em contato com o administrador
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Informe que você fez login com o email:{" "}
                    <strong>{user?.email}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                <div className="w-6 h-6 rounded-full bg-neon-blue text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    Aguarde a vinculação
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    O administrador irá vincular seu email ao seu perfil de
                    mentorado no sistema
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                <div className="w-6 h-6 rounded-full bg-neon-blue text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    Faça login novamente
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Após a vinculação, faça logout e login novamente para
                    acessar seu dashboard
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.reload()}
              >
                Recarregar Página
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* O que você terá acesso */}
        <Card className="border-neon-gold/30 bg-neon-gold/5">
          <CardHeader>
            <CardTitle className="text-neon-blue-dark flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-neon-gold" />O que você terá
              acesso após a vinculação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-gold mt-2" />
                <span className="text-muted-foreground">
                  Dashboard personalizado com suas métricas
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-gold mt-2" />
                <span className="text-muted-foreground">
                  Gráficos de evolução mensal
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-gold mt-2" />
                <span className="text-muted-foreground">
                  Feedbacks personalizados do mentor
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-gold mt-2" />
                <span className="text-muted-foreground">
                  Formulário de envio de métricas mensais
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-gold mt-2" />
                <span className="text-muted-foreground">
                  Comparativo com metas propostas
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-gold mt-2" />
                <span className="text-muted-foreground">
                  Histórico completo de performance
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Contato */}
        <Card className="border-neon-blue/20">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Precisa de ajuda? Entre em contato com o administrador do
                sistema.
              </p>
              <Badge variant="outline" className="mt-3">
                Neon - Mentoria Black
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
