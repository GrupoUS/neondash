import { Album, BookOpen, CreditCard, FileSpreadsheet, Package, TrendingUp } from "lucide-react";
import { useState } from "react";

import DashboardLayout from "@/components/DashboardLayout";
import { AnaliseTab } from "@/components/financeiro/AnaliseTab";
import { CategoriasTab } from "@/components/financeiro/CategoriasTab";
import { FormasPagamentoTab } from "@/components/financeiro/FormasPagamentoTab";
import { InsumosTab } from "@/components/financeiro/InsumosTab";
import { PrecificacaoTab } from "@/components/financeiro/PrecificacaoTab";
import { TransacoesTab } from "@/components/financeiro/TransacoesTab";
import {
  NeonTabs,
  NeonTabsContent,
  NeonTabsList,
  NeonTabsTrigger,
} from "@/components/ui/neon-tabs";

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState("transacoes");

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              Financeiro
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie transações, categorias e precificação de serviços
            </p>
          </div>
        </div>

        <NeonTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6">
            <NeonTabsList>
              <NeonTabsTrigger value="transacoes" className="gap-1.5">
                <FileSpreadsheet className="h-4 w-4" />
                Transações
              </NeonTabsTrigger>
              <NeonTabsTrigger value="analise" className="gap-1.5">
                <Album className="h-4 w-4" />
                Análise IA
              </NeonTabsTrigger>
              <NeonTabsTrigger value="categorias" className="gap-1.5">
                <BookOpen className="h-4 w-4" />
                Categorias
              </NeonTabsTrigger>
              <NeonTabsTrigger value="pagamento" className="gap-1.5">
                <CreditCard className="h-4 w-4" />
                Formas de Pagamento
              </NeonTabsTrigger>
              <NeonTabsTrigger value="insumos" className="gap-1.5">
                <Package className="h-4 w-4" />
                Insumos
              </NeonTabsTrigger>
              <NeonTabsTrigger value="precificacao" className="gap-1.5">
                <TrendingUp className="h-4 w-4" />
                Precificação
              </NeonTabsTrigger>
            </NeonTabsList>
          </div>

          <NeonTabsContent value="transacoes">
            <TransacoesTab onNavigateToAnalysis={() => setActiveTab("analise")} />
          </NeonTabsContent>

          <NeonTabsContent value="analise">
            <AnaliseTab />
          </NeonTabsContent>

          <NeonTabsContent value="categorias">
            <CategoriasTab />
          </NeonTabsContent>

          <NeonTabsContent value="pagamento">
            <FormasPagamentoTab />
          </NeonTabsContent>

          <NeonTabsContent value="insumos">
            <InsumosTab />
          </NeonTabsContent>

          <NeonTabsContent value="precificacao">
            <PrecificacaoTab />
          </NeonTabsContent>
        </NeonTabs>
      </div>
    </DashboardLayout>
  );
}
