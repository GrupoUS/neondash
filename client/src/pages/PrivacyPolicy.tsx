/**
 * Privacy Policy Page
 * Política de Privacidade do NeonDash - exigida pela Meta para apps usando WhatsApp/Instagram APIs.
 *
 * URL: https://neondash.gpus.com.br/privacidade
 */

import { FileText, Lock, Mail, Shield, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Política de Privacidade</h1>
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Introdução
            </CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              O <strong>NeonDash</strong> (doravante "Plataforma", "nós" ou "nosso") é um sistema de
              gestão de mentorias para profissionais de saúde e estética, desenvolvido pelo{" "}
              <strong>Grupo US</strong>. Esta Política de Privacidade descreve como coletamos,
              usamos, armazenamos e protegemos suas informações pessoais.
            </p>
            <p>
              Ao utilizar nossa Plataforma, você concorda com as práticas descritas nesta política.
              Se você não concordar com algum termo, por favor, não utilize nossos serviços.
            </p>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Dados Coletados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Dados de Cadastro</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>Foto de perfil (opcional)</li>
                <li>Informações de autenticação via Clerk</li>
              </ul>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Dados de Uso</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Métricas de desempenho da mentoria</li>
                <li>Faturamento e lucro (informado pelo usuário)</li>
                <li>Histórico de interações com a plataforma</li>
                <li>Transações financeiras registradas</li>
              </ul>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Dados de Integrações (APIs da Meta)</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>
                  <strong>WhatsApp Business:</strong> Mensagens enviadas e recebidas, número de
                  telefone comercial, histórico de conversas
                </li>
                <li>
                  <strong>Instagram:</strong> Métricas de posts e stories, dados de engajamento,
                  token de acesso
                </li>
                <li>
                  <strong>Facebook Ads:</strong> Métricas de campanhas publicitárias, gastos com
                  anúncios, desempenho de ads
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Como Usamos Seus Dados</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>Utilizamos seus dados exclusivamente para:</p>
            <ul>
              <li>Fornecer os serviços de gestão de mentoria contratados</li>
              <li>Exibir métricas e relatórios de desempenho</li>
              <li>Facilitar a comunicação com seus pacientes/mentorados via WhatsApp</li>
              <li>Sincronizar métricas de redes sociais para análise de marketing</li>
              <li>Melhorar a experiência do usuário na plataforma</li>
              <li>Enviar notificações importantes sobre sua conta</li>
            </ul>
            <p>
              <strong>
                Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros
              </strong>{" "}
              para fins de marketing ou publicidade.
            </p>
          </CardContent>
        </Card>

        {/* Meta APIs Section */}
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-labelledby="meta-icon-title"
              >
                <title id="meta-icon-title">Meta</title>
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Uso de APIs da Meta (Facebook/WhatsApp/Instagram)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Nossa plataforma utiliza APIs oficiais da Meta para fornecer funcionalidades de
              comunicação e marketing. Abaixo detalhamos como cada API é utilizada:
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-background border">
                <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                  WhatsApp Business API
                </h4>
                <p className="text-sm text-muted-foreground">
                  Utilizada para enviar e receber mensagens de pacientes, lembretes de consultas e
                  atualizações de tratamento. As mensagens são armazenadas para manter o histórico
                  de conversas.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-background border">
                <h4 className="font-semibold text-pink-600 dark:text-pink-400 mb-2">
                  Instagram Graph API
                </h4>
                <p className="text-sm text-muted-foreground">
                  Utilizada para sincronizar métricas de posts, stories e engajamento. Também
                  permite publicar conteúdo diretamente da plataforma.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-background border">
                <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Facebook Marketing API
                </h4>
                <p className="text-sm text-muted-foreground">
                  Utilizada apenas para leitura de métricas de campanhas publicitárias. Não criamos,
                  modificamos ou gerenciamos anúncios através da plataforma.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Storage */}
        <Card>
          <CardHeader>
            <CardTitle>Armazenamento e Segurança</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>Seus dados são armazenados de forma segura utilizando:</p>
            <ul>
              <li>
                <strong>Neon PostgreSQL:</strong> Banco de dados serverless com criptografia em
                repouso e em trânsito
              </li>
              <li>
                <strong>Clerk:</strong> Autenticação segura com proteção contra ataques de força
                bruta
              </li>
              <li>
                <strong>HTTPS:</strong> Toda comunicação é criptografada via TLS 1.3
              </li>
            </ul>
            <p>
              Os dados são armazenados em servidores localizados nos Estados Unidos, em conformidade
              com padrões internacionais de segurança.
            </p>
          </CardContent>
        </Card>

        {/* Data Deletion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Exclusão de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>Você tem o direito de solicitar a exclusão dos seus dados a qualquer momento:</p>
            <ul>
              <li>
                <strong>Dados do Instagram:</strong>{" "}
                <a href="/account-deletion" className="text-primary hover:underline">
                  Solicitar exclusão aqui
                </a>
              </li>
              <li>
                <strong>Conta completa:</strong> Entre em contato pelo e-mail abaixo
              </li>
              <li>
                <strong>Dados de APIs da Meta:</strong> Serão removidos automaticamente ao
                desconectar as integrações
              </li>
            </ul>
            <p>
              Após a solicitação, seus dados serão permanentemente removidos em até 30 dias, exceto
              quando a retenção for exigida por lei.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              Para dúvidas sobre esta política ou solicitações relacionadas aos seus dados, entre em
              contato:
            </p>
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
            <a href="/termos" className="hover:text-foreground">
              Termos de Serviço
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

export default PrivacyPolicy;
