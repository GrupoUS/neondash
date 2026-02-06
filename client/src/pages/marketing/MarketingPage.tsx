/**
 * Marketing Page - Hub for Marketing Automation
 * Features: Campaign Dashboard, Instagram Publishing, WhatsApp Campaigns
 */

import {
  BadgeDollarSign,
  Instagram,
  LayoutGrid,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

import DashboardLayout from "@/components/DashboardLayout";
import { CampaignDashboard } from "@/components/marketing/CampaignDashboard";
import { FacebookAdsTab } from "@/components/marketing/FacebookAdsTab";
import { InstagramPublisher } from "@/components/marketing/InstagramPublisher";
import { MarketingAnalytics } from "@/components/marketing/MarketingAnalytics";
import { WhatsAppCampaigns } from "@/components/marketing/WhatsAppCampaigns";

import { NeonCard } from "@/components/ui/neon-card";
import {
  NeonTabs,
  NeonTabsContent,
  NeonTabsList,
  NeonTabsTrigger,
} from "@/components/ui/neon-tabs";

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState("campanhas");

  const tabs = [
    {
      value: "campanhas",
      label: "Campanhas",
      icon: LayoutGrid,
      description: "Visão geral das campanhas ativas, entregas e ações rápidas.",
    },
    {
      value: "instagram",
      label: "Instagram",
      icon: Instagram,
      description: "Criação de conteúdo assistida por IA com pré-visualização em tempo real.",
    },
    {
      value: "whatsapp",
      label: "WhatsApp",
      icon: MessageSquare,
      description: "Configuração e disparo de campanhas segmentadas para sua base de leads.",
    },
    {
      value: "ads",
      label: "Ads",
      icon: BadgeDollarSign,
      description: "Acompanhamento e gestão de desempenho das campanhas de mídia paga.",
    },
    {
      value: "analytics",
      label: "Analytics",
      icon: TrendingUp,
      description: "Métricas consolidadas de alcance, entrega e engajamento por campanha.",
    },
  ];

  const activeTabDescription =
    tabs.find((tab) => tab.value === activeTab)?.description ??
    "Acompanhe e otimize os resultados de marketing em um único fluxo.";

  return (
    <DashboardLayout>
      <main
        className="space-y-8 animate-in fade-in duration-500"
        aria-labelledby="marketing-page-title"
      >
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/20 to-primary/5 p-2">
                <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h1 id="marketing-page-title" className="text-3xl font-bold text-foreground">
                  Marketing Automation
                </h1>
                <p id="marketing-page-description" className="mt-1 text-muted-foreground">
                  Crie campanhas, publique no Instagram e envie mensagens em massa
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <NeonTabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
          aria-label="Módulos de automação de marketing"
        >
          <div className="mb-2 overflow-x-auto pb-1">
            <NeonTabsList className="min-w-max md:min-w-0">
              {tabs.map((tab) => (
                <NeonTabsTrigger key={tab.value} value={tab.value} className="min-h-11 gap-2 px-4">
                  <tab.icon className="h-4 w-4" aria-hidden="true" />
                  {tab.label}
                </NeonTabsTrigger>
              ))}
            </NeonTabsList>
          </div>

          <p className="px-1 text-sm text-muted-foreground" aria-live="polite">
            {activeTabDescription}
          </p>

          {/* Campanhas Overview */}
          <NeonTabsContent value="campanhas" className="space-y-6">
            <CampaignDashboard />
          </NeonTabsContent>

          {/* Instagram Publisher */}
          <NeonTabsContent value="instagram" className="space-y-6">
            <NeonCard className="p-6 bg-card/50 border-border/50">
              <InstagramPublisher />
            </NeonCard>
          </NeonTabsContent>

          {/* WhatsApp Campaigns */}
          <NeonTabsContent value="whatsapp" className="space-y-6">
            <NeonCard className="p-6 bg-card/50 border-border/50">
              <WhatsAppCampaigns />
            </NeonCard>
          </NeonTabsContent>

          {/* Facebook Ads */}
          <NeonTabsContent value="ads" className="space-y-6">
            <FacebookAdsTab />
          </NeonTabsContent>

          {/* Analytics */}
          <NeonTabsContent value="analytics" className="space-y-6">
            <NeonCard className="p-6 bg-card/50 border-border/50">
              <MarketingAnalytics />
            </NeonCard>
          </NeonTabsContent>
        </NeonTabs>
      </main>
    </DashboardLayout>
  );
}
