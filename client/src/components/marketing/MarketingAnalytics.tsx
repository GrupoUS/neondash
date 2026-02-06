/**
 * Marketing Analytics - Campaign performance charts and metrics
 */

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Eye,
  MessageSquare,
  MousePointerClick,
  Send,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  NeonCard,
  NeonCardContent,
  NeonCardHeader,
  NeonCardTitle,
} from "@/components/ui/neon-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Mock data for charts
const messageVolumeData = [
  { date: "01/01", enviadas: 120, entregues: 115, lidas: 98 },
  { date: "02/01", enviadas: 85, entregues: 82, lidas: 70 },
  { date: "03/01", enviadas: 200, entregues: 195, lidas: 180 },
  { date: "04/01", enviadas: 150, entregues: 148, lidas: 130 },
  { date: "05/01", enviadas: 180, entregues: 175, lidas: 160 },
  { date: "06/01", enviadas: 95, entregues: 90, lidas: 78 },
  { date: "07/01", enviadas: 220, entregues: 215, lidas: 200 },
];

const campaignPerformance = [
  { name: "Promo Janeiro", enviadas: 450, taxa: 94 },
  { name: "Black Friday", enviadas: 1200, taxa: 96 },
  { name: "Dia das Mães", enviadas: 800, taxa: 92 },
  { name: "Reativação", enviadas: 350, taxa: 88 },
];

const channelDistribution = [
  { name: "WhatsApp", value: 65, color: "#22c55e" },
  { name: "Instagram", value: 35, color: "#e11d48" },
];

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  trend: "up" | "down";
}) {
  return (
    <NeonCard className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <div
            className={cn(
              "flex items-center gap-1 text-sm mt-1",
              trend === "up" ? "text-green-600" : "text-red-500"
            )}
          >
            {trend === "up" ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            <span>{change}%</span>
            <span className="text-muted-foreground">vs. mês anterior</span>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </NeonCard>
  );
}

// Custom Tooltip
interface TooltipPayload {
  color: string;
  name: string;
  value: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload) return null;

  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// Main Component
export function MarketingAnalytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics de Marketing
          </h2>
          <p className="text-muted-foreground mt-1">Acompanhe o desempenho das suas campanhas</p>
        </div>
        <Select defaultValue="30d">
          <SelectTrigger className="w-[150px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Mensagens Enviadas" value="2,450" change={12} icon={Send} trend="up" />
        <StatCard
          title="Taxa de Entrega"
          value="96.5%"
          change={2.3}
          icon={MessageSquare}
          trend="up"
        />
        <StatCard title="Taxa de Leitura" value="84.2%" change={5.1} icon={Eye} trend="up" />
        <StatCard
          title="Engajamento"
          value="23.8%"
          change={-1.2}
          icon={MousePointerClick}
          trend="down"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volume Chart */}
        <NeonCard className="lg:col-span-2">
          <NeonCardHeader>
            <NeonCardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Volume de Mensagens
            </NeonCardTitle>
          </NeonCardHeader>
          <NeonCardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={messageVolumeData}>
                <defs>
                  <linearGradient id="colorEnviadas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEntregues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="enviadas"
                  name="Enviadas"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorEnviadas)"
                />
                <Area
                  type="monotone"
                  dataKey="entregues"
                  name="Entregues"
                  stroke="#22c55e"
                  fillOpacity={1}
                  fill="url(#colorEntregues)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </NeonCardContent>
        </NeonCard>

        {/* Channel Distribution */}
        <NeonCard>
          <NeonCardHeader>
            <NeonCardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Canais
            </NeonCardTitle>
          </NeonCardHeader>
          <NeonCardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {channelDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </NeonCardContent>
          <div className="flex justify-center gap-4 pb-4">
            {channelDistribution.map((channel) => (
              <div key={channel.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }} />
                <span className="text-sm text-muted-foreground">
                  {channel.name} ({channel.value}%)
                </span>
              </div>
            ))}
          </div>
        </NeonCard>
      </div>

      {/* Campaign Performance */}
      <NeonCard>
        <NeonCardHeader>
          <NeonCardTitle className="text-lg">Performance por Campanha</NeonCardTitle>
        </NeonCardHeader>
        <NeonCardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={campaignPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="name" type="category" className="text-xs" width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="enviadas" name="Mensagens" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </NeonCardContent>
      </NeonCard>
    </div>
  );
}
