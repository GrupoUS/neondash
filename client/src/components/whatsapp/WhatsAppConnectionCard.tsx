/**
 * WhatsApp Connection Card Component
 * Simplified setup: user configures Z-API externally, then pastes credentials here
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageCircle,
  QrCode,
  RefreshCw,
  Smartphone,
  Unlink,
  Wifi,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [qrError, setQrError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

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

  // Mutations
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
    configureMutation.mutate({ instanceId: instanceId.trim(), token: token.trim() });
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  const handleReconfigure = () => {
    setQrError(null);
    setConfigError(null);
    setStatus("disconnected");
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

          {/* Disconnected State - Show Connection Form */}
          {status === "disconnected" && (
            <motion.div
              key="disconnected"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
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
                      Instâncias" → "Nova Instância" → Escolha um nome e clique em "Criar"
                    </li>
                    <li>
                      <strong>Copie as credenciais:</strong> Na tela da instância, copie o{" "}
                      <strong>Instance ID</strong> e o <strong>Token</strong>
                    </li>
                    <li>
                      <strong>Cole abaixo:</strong> Preencha os campos e clique em "Conectar
                      WhatsApp"
                    </li>
                  </ol>
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                    💡 Dica: O Z-API oferece período de teste gratuito para novos usuários.
                  </p>
                </AlertDescription>
              </Alert>

              {/* Error Alert */}
              {configError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{configError}</AlertDescription>
                </Alert>
              )}

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
                  <Label htmlFor="token">Token</Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="Ex: E8DAEF8FA386CB5C53AA42A6"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>

                <Button
                  onClick={handleConnect}
                  disabled={!instanceId.trim() || !token.trim() || configureMutation.isPending}
                  className="w-full"
                >
                  {configureMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <QrCode className="w-4 h-4 mr-2" />
                  Conectar WhatsApp
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Você precisa de uma assinatura Z-API para conectar.{" "}
                <a
                  href="https://www.z-api.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Saiba mais
                </a>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default WhatsAppConnectionCard;
