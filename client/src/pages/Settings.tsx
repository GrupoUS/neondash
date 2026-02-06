/**
 * Settings Page - Configurações
 * Manages WhatsApp Z-API connection and AI agent settings
 */

import { Bot, Brain, MessageCircle, Settings2, TrendingUp } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { FinancialCoachSettingsCard } from "@/components/financeiro/FinancialCoachSettingsCard";
import { MarketingAgentSettingsCard } from "@/components/settings/MarketingAgentSettingsCard";
import { SdrAgentSettingsCard } from "@/components/settings/SdrAgentSettingsCard";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIAgentSettingsCard } from "@/components/whatsapp/AIAgentSettingsCard";
import { BaileysConnectionCard } from "@/components/whatsapp/BaileysConnectionCard";
import { MetaConnectionCard } from "@/components/whatsapp/MetaConnectionCard";
import { WhatsAppConnectionCard } from "@/components/whatsapp/WhatsAppConnectionCard";

export function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8 space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Settings2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
              <p className="text-muted-foreground">Gerencie suas integrações e automações</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* WhatsApp Integration Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Integração WhatsApp</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Escolha o provedor de conexão do WhatsApp que melhor se adapta às suas necessidades.
          </p>

          <Tabs defaultValue="baileys" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="zapi">Z-API (Estável)</TabsTrigger>
              <TabsTrigger value="meta">Meta Cloud API (Oficial)</TabsTrigger>
              <TabsTrigger value="baileys">Baileys (Self-Hosted)</TabsTrigger>
            </TabsList>

            <TabsContent value="zapi" className="space-y-4">
              <WhatsAppConnectionCard />
            </TabsContent>

            <TabsContent value="meta" className="space-y-4">
              <MetaConnectionCard />
            </TabsContent>

            <TabsContent value="baileys" className="space-y-4">
              <BaileysConnectionCard />
            </TabsContent>
          </Tabs>

          <div className="mt-8 border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-3 border-b">
              <h3 className="font-medium text-sm">Comparativo de Provedores</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Z-API</TableHead>
                  <TableHead>Meta Cloud API</TableHead>
                  <TableHead className="text-emerald-600 font-semibold">
                    Baileys (Self-Hosted)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Custo</TableCell>
                  <TableCell>Pago (Mensalidade)</TableCell>
                  <TableCell>Pago (Por conversa)</TableCell>
                  <TableCell className="text-emerald-600 font-semibold">
                    Grátis (Open Source)
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Estabilidade</TableCell>
                  <TableCell>Alta</TableCell>
                  <TableCell>Muito Alta</TableCell>
                  <TableCell>Média (Depende da conexão do celular)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Requisito</TableCell>
                  <TableCell>Celular conectado</TableCell>
                  <TableCell>Nenhum (Cloud)</TableCell>
                  <TableCell>Celular conectado e servidor ativo</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Risco de Banimento</TableCell>
                  <TableCell>Baixo</TableCell>
                  <TableCell>Nulo (Oficial)</TableCell>
                  <TableCell>Médio (Se abusar de envios)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Multimídia</TableCell>
                  <TableCell>Sim</TableCell>
                  <TableCell>Sim</TableCell>
                  <TableCell>Sim (Texto, Imagem, Áudio)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        <Separator />

        {/* WhatsApp AI Agent Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-semibold">Agente IA WhatsApp (SDR)</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure respostas automáticas via WhatsApp com inteligência artificial para
            qualificação de leads.
          </p>
          <AIAgentSettingsCard />
        </section>

        <Separator />

        {/* Chat Widget Agents Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Agentes IA do Chat</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure os prompts dos agentes especializados. O chat widget detecta automaticamente a
            intenção da pergunta e aciona o agente apropriado.
          </p>

          <div className="grid gap-6">
            {/* Financial Coach */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-medium text-muted-foreground">Finanças & Análise</h3>
              </div>
              <FinancialCoachSettingsCard />
            </div>

            {/* Marketing Agent */}
            <MarketingAgentSettingsCard />

            {/* SDR Agent */}
            <SdrAgentSettingsCard />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default SettingsPage;
