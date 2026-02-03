/**
 * WhatsApp Connection Card Component
 * Supports both Integrator mode (one-click) and manual credential mode (legacy)
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Loader2,
  MessageCircle,
  QrCode,
  RefreshCw,
  Smartphone,
  Unlink,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

type WhatsAppConnectionCardProps = Record<string, never>;

export function WhatsAppConnectionCard(_props: WhatsAppConnectionCardProps) {
  const [instanceId, setInstanceId] = useState("");
  const [token, setToken] = useState("");
  const [clientToken, setClientToken] = useState("");
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [qrError, setQrError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [showManualMode, setShowManualMode] = useState(false);

  // Check if integrator mode is available
  const { data: integratorInfo } = trpc.zapi.isIntegratorAvailable.useQuery();
  const isIntegratorAvailable = integratorInfo?.available ?? false;

  // Get lifecycle info for integrator-managed instances
  const { data: lifecycle, refetch: refetchLifecycle } = trpc.zapi.getInstanceLifecycle.useQuery();

  // Get current connection status
  const { data: connectionStatus, refetch: refetchStatus } = trpc.zapi.getStatus.useQuery(
    undefined,
    { refetchInterval: status === "connecting" ? 5000 : 30000 }
  );

  // Get QR code when connecting
  const {
    data: qrData,
    refetch: refetchQr,
    isLoading: isLoadingQr,
    error: qrQueryError,
  } = trpc.zapi.getQRCode.useQuery(undefined, {
    enabled: status === "connecting",
    refetchInterval: status === "connecting" && !qrError ? 15000 : false,
    retry: false,
  });

  // Track QR code errors
  useEffect(() => {
    if (qrQueryError) {
      const errorMessage = qrQueryError.message || "Erro desconhecido";
      if (errorMessage.includes("Instance not found")) {
        setQrError("Instância Z-API não encontrada. Verifique o Instance ID.");
      } else if (errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
        setQrError("Token Z-API inválido. Verifique suas credenciais.");
      } else {
        setQrError(`Falha ao obter QR Code: ${errorMessage}`);
      }
    }
  }, [qrQueryError]);

  // Manual configuration mutation (legacy mode)
  const configureMutation = trpc.zapi.configure.useMutation({
    onSuccess: () => {
      setConfigError(null);
      setStatus("connecting");
      refetchQr();
    },
    onError: (error) => {
      setConfigError(error.message || "Erro ao salvar credenciais");
    },
  });

  // One-click instance creation (integrator mode)
  const createInstanceMutation = trpc.zapi.createAndConnectInstance.useMutation({
    onSuccess: () => {
      setConfigError(null);
      setStatus("connecting");
      refetchLifecycle();
      refetchQr();
    },
    onError: (error) => {
      setConfigError(error.message || "Erro ao criar instância");
    },
  });

  const disconnectMutation = trpc.zapi.disconnect.useMutation({
    onSuccess: () => {
      setStatus("disconnected");
      setShowDisconnectDialog(false);
      refetchStatus();
    },
  });

  // Update status from server response
  useEffect(() => {
    if (connectionStatus) {
      if (connectionStatus.connected) {
        setStatus("connected");
      } else if (connectionStatus.configured) {
        setStatus("connecting");
      } else {
        setStatus("disconnected");
      }
    }
  }, [connectionStatus]);

  const handleConnect = () => {
    if (!instanceId.trim() || !token.trim()) return;
    setQrError(null);
    setConfigError(null);
    configureMutation.mutate({
      instanceId: instanceId.trim(),
      token: token.trim(),
      clientToken: clientToken.trim() || undefined,
    });
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  const handleReconfigure = () => {
    setQrError(null);
    setConfigError(null);
    setStatus("disconnected");
  };

  // One-click instance creation handler (integrator mode)
  const handleOneClickConnect = () => {
    setQrError(null);
    setConfigError(null);
    createInstanceMutation.mutate();
  };

  const getStatusBadge = () => {
    switch (status) {
      case "connected":
        return (
          <Badge
            variant="outline"
            className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Conectado
          </Badge>
        );
      case "connecting":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30"
          >
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Conectando
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Desconectado
          </Badge>
        );
    }
  };

  // Get instance lifecycle status badge
  const getLifecycleBadge = () => {
    if (!lifecycle?.hasInstance || !lifecycle?.managedByIntegrator) return null;

    const statusConfig = {
      trial: {
        label: "Trial",
        icon: Clock,
        className: "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/30",
      },
      active: {
        label: "Ativo",
        icon: CheckCircle2,
        className: "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30",
      },
      suspended: {
        label: "Suspenso",
        icon: AlertCircle,
        className: "border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/30",
      },
      canceled: {
        label: "Cancelado",
        icon: XCircle,
        className: "border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30",
      },
    } as const;

    const status = lifecycle.status ?? "trial";
    const config = statusConfig[status] ?? statusConfig.trial;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
        {lifecycle.dueDate && (
          <span className="ml-1 text-xs opacity-75">
            (até {new Date(lifecycle.dueDate).toLocaleDateString("pt-BR")})
          </span>
        )}
      </Badge>
    );
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-600">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">WhatsApp</CardTitle>
              <CardDescription>Integração via Z-API</CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          {/* Connected State */}
          {status === "connected" && (
            <motion.div
              key="connected"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                <Wifi className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-700 dark:text-green-400">
                    WhatsApp conectado
                  </p>
                  {connectionStatus?.phone && (
                    <p className="text-sm text-green-600 dark:text-green-500">
                      {connectionStatus.phone}
                    </p>
                  )}
                </div>
                <Smartphone className="w-6 h-6 text-green-500" />
              </div>

              <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Unlink className="w-4 h-4 mr-2" />
                    Desconectar WhatsApp
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Desconectar WhatsApp?</DialogTitle>
                    <DialogDescription>
                      Você precisará escanear o QR code novamente para reconectar. Mensagens não
                      serão recebidas enquanto desconectado.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDisconnect}
                      disabled={disconnectMutation.isPending}
                    >
                      {disconnectMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Desconectar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </motion.div>
          )}

          {/* Connecting State - Show QR Code */}
          {status === "connecting" && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center gap-4 p-4">
                {/* Error State */}
                {qrError ? (
                  <>
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 w-full">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-red-700 dark:text-red-400">
                          Erro de Conexão
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-500">{qrError}</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleReconfigure} className="w-full">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reconfigurar Credenciais
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground text-center">
                      Escaneie o QR code com o WhatsApp do seu celular
                    </p>

                    <div className="relative p-4 bg-white rounded-xl shadow-inner border">
                      {isLoadingQr ? (
                        <div className="w-48 h-48 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : qrData?.qrCode ? (
                        <img
                          src={`data:image/png;base64,${qrData.qrCode}`}
                          alt="QR Code"
                          className="w-48 h-48"
                          data-testid="qr-code-image"
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center">
                          <QrCode className="w-16 h-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refetchQr()}
                        disabled={isLoadingQr}
                      >
                        <RefreshCw
                          className={`w-4 h-4 mr-2 ${isLoadingQr ? "animate-spin" : ""}`}
                        />
                        Atualizar QR Code
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleReconfigure}>
                        Alterar Credenciais
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Disconnected State - Show Connection Options */}
          {status === "disconnected" && (
            <motion.div
              key="disconnected"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Error Alert */}
              {configError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{configError}</AlertDescription>
                </Alert>
              )}

              {/* Integrator Mode - One-Click Flow */}
              {isIntegratorAvailable && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-lg">Conexão Rápida</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Conecte seu WhatsApp em poucos segundos.
                        <br />
                        <span className="text-primary font-medium">Grátis por 2 dias</span>, depois
                        incluído na sua mentoria.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleOneClickConnect}
                      disabled={createInstanceMutation.isPending}
                      className="w-full max-w-xs"
                    >
                      {createInstanceMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      <Smartphone className="w-4 h-4 mr-2" />
                      Conectar meu WhatsApp
                    </Button>
                  </div>

                  {/* Lifecycle Badge (show if instance exists) */}
                  {getLifecycleBadge() && (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      {getLifecycleBadge()}
                    </div>
                  )}
                </div>
              )}

              {/* Manual Mode - Collapsible for Legacy Users */}
              <Collapsible open={showManualMode} onOpenChange={setShowManualMode}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground"
                  >
                    <span className="text-sm">
                      {isIntegratorAvailable
                        ? "Já possui uma conta Z-API? Configurar manualmente"
                        : "Configurar credenciais Z-API"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${showManualMode ? "rotate-180" : ""}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  {/* Setup Instructions */}
                  <Alert className="border-primary/20 bg-primary/5">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Como configurar o Z-API</AlertTitle>
                    <AlertDescription className="mt-2 space-y-3">
                      <ol className="list-decimal list-inside text-sm space-y-2">
                        <li>
                          <strong>Crie sua conta:</strong> Acesse{" "}
                          <a
                            href="https://www.z-api.io/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline inline-flex items-center gap-1"
                          >
                            www.z-api.io <ExternalLink className="w-3 h-3" />
                          </a>{" "}
                          e clique em "Criar conta grátis"
                        </li>
                        <li>
                          <strong>Faça login:</strong> Após cadastrar, acesse o painel Z-API
                        </li>
                        <li>
                          <strong>Crie uma instância:</strong> No menu lateral, clique em "Minhas
                          Instâncias" → "Nova Instância"
                        </li>
                        <li>
                          <strong>Copie as credenciais:</strong> Na tela da instância, copie o{" "}
                          <strong>Instance ID</strong> e o <strong>Token</strong>
                        </li>
                      </ol>
                    </AlertDescription>
                  </Alert>

                  {/* Credentials Form */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="instanceId">Instance ID</Label>
                      <Input
                        id="instanceId"
                        placeholder="Ex: 3EE2B8773C6FD20BCB499A5378BD59DA"
                        value={instanceId}
                        onChange={(e) => setInstanceId(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="token">Token da Instância</Label>
                      <Input
                        id="token"
                        type="password"
                        placeholder="Ex: B1BE74099777CBBAB6DEA8E3"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientToken">
                        Token de Segurança{" "}
                        <span className="text-muted-foreground text-xs">
                          (obrigatório se ativado no Z-API)
                        </span>
                      </Label>
                      <Input
                        id="clientToken"
                        type="password"
                        placeholder="Ex: Ff61b3cb067054f178dea7749d4910c31S"
                        value={clientToken}
                        onChange={(e) => setClientToken(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>

                    <Button
                      onClick={handleConnect}
                      disabled={!instanceId.trim() || !token.trim() || configureMutation.isPending}
                      className="w-full"
                    >
                      {configureMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      <QrCode className="w-4 h-4 mr-2" />
                      Conectar WhatsApp
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default WhatsAppConnectionCard;
