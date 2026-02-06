/**
 * WhatsApp Sync Dashboard Component
 * Unified dashboard showing connection status + sync statistics
 */

import {
  Clock,
  Loader2,
  MessageSquare,
  MessagesSquare,
  Phone,
  RefreshCw,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import MetaConnectionCard from "./MetaConnectionCard";

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin mt-1" />
        ) : (
          <>
            <p className="text-lg font-semibold">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date | string | null): string {
  if (!date) return "Nunca";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Agora mesmo";
  if (diffMins < 60) return `Há ${diffMins}min`;
  if (diffHours < 24) return `Há ${diffHours}h`;
  return `Há ${diffDays}d`;
}

export function WhatsAppSyncDashboard() {
  // Connection status
  const {
    data: connectionStatus,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = trpc.metaApi.getStatus.useQuery(undefined, {
    refetchInterval: 30000,
  });

  // Get all conversations for stats
  const {
    data: conversations,
    isLoading: conversationsLoading,
    refetch: refetchConversations,
  } = trpc.metaApi.getAllConversations.useQuery(undefined, {
    enabled: connectionStatus?.connected === true,
  });

  // Calculate stats
  const stats = {
    totalConversations: conversations?.length ?? 0,
    // Find last message time from conversations
    lastMessageAt: conversations?.[0]?.lastMessageAt ?? null,
    // Count unique contacts
    uniqueContacts: conversations?.filter((c) => c.name).length ?? 0,
    // Count unread (simplified - just checking if any exist)
    unreadCount: conversations?.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0) ?? 0,
  };

  const isLoading = statusLoading || conversationsLoading;

  const handleRefresh = () => {
    refetchStatus();
    refetchConversations();
  };

  return (
    <div className="space-y-6">
      {/* Connection Card */}
      <MetaConnectionCard />

      {/* Sync Statistics */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MessagesSquare className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Sincronização de Mensagens</CardTitle>
                <CardDescription>Estatísticas de conversas e mensagens</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Webhook Status Indicator */}
          <div className="flex items-center gap-2 text-sm">
            {connectionStatus?.connected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Webhook ativo</span>
                <Badge variant="outline" className="text-xs border-green-500/30 text-green-600">
                  Tempo real
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Webhook desconectado</span>
              </>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={MessageSquare}
              label="Conversas"
              value={stats.totalConversations}
              loading={isLoading}
            />
            <StatCard
              icon={Users}
              label="Contatos salvos"
              value={stats.uniqueContacts}
              loading={isLoading}
            />
            <StatCard
              icon={Phone}
              label="Não lidas"
              value={stats.unreadCount}
              loading={isLoading}
            />
            <StatCard
              icon={Clock}
              label="Última mensagem"
              value={formatRelativeTime(stats.lastMessageAt)}
              loading={isLoading}
            />
          </div>

          {/* Phone Number Display */}
          {connectionStatus?.phone && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
              <Phone className="w-4 h-4 text-primary" />
              <span className="font-medium">{connectionStatus.phone}</span>
              {connectionStatus.verifiedName && (
                <span className="text-muted-foreground">• {connectionStatus.verifiedName}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default WhatsAppSyncDashboard;
