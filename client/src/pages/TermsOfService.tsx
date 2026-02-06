/**
 * Terms of Service Page
 * Termos de Serviço do NeonDash - exigida pela Meta para apps usando WhatsApp/Instagram APIs.
 *
 * URL: https://neondash.gpus.com.br/termos
 */

import { AlertTriangle, FileText, Gavel, Scale, ScrollText, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <ScrollText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Termos de Serviço</h1>
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Aceitação dos Termos
            </CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              Ao acessar e utilizar o <strong>NeonDash</strong> ("Plataforma"), você concorda em
              cumprir e estar vinculado a estes Termos de Serviço. Se você não concordar com
              qualquer parte destes termos, não poderá acessar ou utilizar a Plataforma.
            </p>
            <p>
              O NeonDash é um produto do <strong>Grupo US Consultoria e Treinamentos LTDA</strong>,
              destinado a profissionais de saúde e estética participantes de programas de mentoria.
            </p>
          </CardContent>
        </Card>

        {/* Service Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Descrição do Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>O NeonDash oferece as seguintes funcionalidades:</p>
            <ul>
              <li>Dashboard de acompanhamento de métricas de mentoria</li>
              <li>Gestão de pacientes e agendamentos</li>
              <li>Integração com WhatsApp Business para comunicação</li>
              <li>Sincronização de métricas do Instagram</li>
              <li>Visualização de métricas de Facebook Ads</li>
              <li>Relatórios financeiros e de desempenho</li>
              <li>Assistente de IA para suporte</li>
            </ul>
          </CardContent>
        </Card>

        {/* User Responsibilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Responsabilidades do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose dark:prose-invert max-w-none">
              <p>Ao utilizar a Plataforma, você concorda em:</p>
              <ul>
                <li>Fornecer informações verdadeiras e atualizadas</li>
                <li>Manter a confidencialidade de suas credenciais de acesso</li>
                <li>Não compartilhar sua conta com terceiros</li>
                <li>Utilizar a Plataforma apenas para fins legítimos e legais</li>
                <li>
                  Respeitar a privacidade dos seus pacientes ao usar integrações de comunicação
                </li>
                <li>Cumprir as políticas da Meta ao utilizar WhatsApp, Instagram e Facebook</li>
              </ul>
            </div>
            <Separator />
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                O uso indevido das integrações com WhatsApp ou Instagram pode resultar na suspensão
                da sua conta e das funcionalidades associadas.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Meta Integrations */}
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader>
            <CardTitle>Integrações com APIs da Meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Ao conectar suas contas do WhatsApp Business, Instagram ou Facebook Ads, você concorda
              com os seguintes termos adicionais:
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-background border">
                <h4 className="font-semibold mb-2">WhatsApp Business</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Você é responsável por obter consentimento dos destinatários</li>
                  <li>Mensagens devem seguir as políticas do WhatsApp Business</li>
                  <li>Spam ou mensagens não solicitadas são estritamente proibidos</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-background border">
                <h4 className="font-semibold mb-2">Instagram e Facebook</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>O acesso pode ser revogado a qualquer momento pela Meta</li>
                  <li>Dados sincronizados são de sua propriedade e responsabilidade</li>
                  <li>A Plataforma não se responsabiliza por mudanças nas APIs da Meta</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="w-5 h-5" />
              Limitações de Responsabilidade
            </CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>O Grupo US não se responsabiliza por:</p>
            <ul>
              <li>Interrupções de serviço causadas por terceiros (ex: Meta, Neon, Clerk)</li>
              <li>Perda de dados decorrente de uso inadequado da Plataforma</li>
              <li>Decisões comerciais tomadas com base em dados exibidos na Plataforma</li>
              <li>Violações de políticas da Meta pelo usuário</li>
              <li>Danos indiretos, incidentais ou consequentes</li>
            </ul>
            <p>
              A Plataforma é fornecida "como está" (<em>as is</em>), sem garantias de qualquer tipo,
              expressas ou implícitas.
            </p>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card>
          <CardHeader>
            <CardTitle>Rescisão</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              O Grupo US reserva-se o direito de suspender ou encerrar sua conta, sem aviso prévio,
              em caso de:
            </p>
            <ul>
              <li>Violação destes Termos de Serviço</li>
              <li>Uso indevido das integrações de comunicação</li>
              <li>Atividades fraudulentas ou ilegais</li>
              <li>Solicitação de exclusão de dados pelo usuário</li>
            </ul>
            <p>
              Você pode encerrar sua conta a qualquer momento através das configurações da
              Plataforma ou entrando em contato com nosso suporte.
            </p>
          </CardContent>
        </Card>

        {/* Modifications */}
        <Card>
          <CardHeader>
            <CardTitle>Modificações</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              O Grupo US pode modificar estes Termos de Serviço a qualquer momento. Alterações
              significativas serão comunicadas através de:
            </p>
            <ul>
              <li>Notificação na Plataforma</li>
              <li>E-mail para o endereço cadastrado</li>
            </ul>
            <p>
              O uso continuado da Plataforma após as modificações constitui aceitação dos novos
              termos.
            </p>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card>
          <CardHeader>
            <CardTitle>Lei Aplicável</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              Estes Termos de Serviço são regidos pelas leis da República Federativa do Brasil.
              Eventuais disputas serão submetidas ao foro da comarca de São Paulo/SP, com renúncia a
              qualquer outro, por mais privilegiado que seja.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>Para dúvidas sobre estes termos, entre em contato:</p>
            <ul>
              <li>
                <strong>E-mail:</strong>{" "}
                <a href="mailto:suporte@grupous.com.br" className="text-primary hover:underline">
                  suporte@grupous.com.br
                </a>
              </li>
              <li>
                <strong>Empresa:</strong> Grupo US Consultoria e Treinamentos LTDA
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8">
          <p>© {new Date().getFullYear()} Grupo US. Todos os direitos reservados.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="/privacidade" className="hover:text-foreground">
              Política de Privacidade
            </a>
            <span>•</span>
            <a href="/account-deletion" className="hover:text-foreground">
              Exclusão de Dados
            </a>
            <span>•</span>
            <a href="/" className="hover:text-foreground">
              Voltar ao Início
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;
