/**
 * Marketing Page - Hub for Marketing Automation
 * Features: Campaign Dashboard, Instagram Publishing, WhatsApp Campaigns
 */

import { Instagram, LayoutGrid, MessageSquare, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";

import DashboardLayout from "@/components/DashboardLayout";
import { CampaignDashboard } from "@/components/marketing/CampaignDashboard";
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
    { value: "campanhas", label: "Campanhas", icon: LayoutGrid },
    { value: "instagram", label: "Instagram", icon: Instagram },
    { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
    { value: "analytics", label: "Analytics", icon: TrendingUp },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Marketing Automation</h1>
                <p className="text-muted-foreground mt-1">
                  Crie campanhas, publique no Instagram e envie mensagens em massa
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <NeonTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6">
            <NeonTabsList>
              {tabs.map((tab) => (
                <NeonTabsTrigger key={tab.value} value={tab.value} className="gap-2">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </NeonTabsTrigger>
              ))}
            </NeonTabsList>
          </div>

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

          {/* Analytics */}
          <NeonTabsContent value="analytics" className="space-y-6">
            <NeonCard className="p-6 bg-card/50 border-border/50">
              <MarketingAnalytics />
            </NeonCard>
          </NeonTabsContent>
        </NeonTabs>
      </div>
    </DashboardLayout>
  );
}
