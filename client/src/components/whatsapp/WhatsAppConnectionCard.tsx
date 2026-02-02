/**
 * WhatsApp Connection Card Component
 * Displays QR code for Z-API connection and manages connection status
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
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

type WhatsAppConnectionCardProps = {};

export function WhatsAppConnectionCard(_props: WhatsAppConnectionCardProps) {
  const [instanceId, setInstanceId] = useState("");
  const [token, setToken] = useState("");
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

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
  } = trpc.zapi.getQRCode.useQuery(undefined, {
    enabled: status === "connecting",
    refetchInterval: status === "connecting" ? 15000 : false,
  });

  // Mutations
  const configureMutation = trpc.zapi.configure.useMutation({
    onSuccess: () => {
      setStatus("connecting");
      refetchQr();
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
    configureMutation.mutate({ instanceId: instanceId.trim(), token: token.trim() });
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
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

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchQr()}
                  disabled={isLoadingQr}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingQr ? "animate-spin" : ""}`} />
                  Atualizar QR Code
                </Button>
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instanceId">Instance ID</Label>
                  <Input
                    id="instanceId"
                    placeholder="Digite seu Instance ID do Z-API"
                    value={instanceId}
                    onChange={(e) => setInstanceId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token">Token</Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="Digite seu Token do Z-API"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleConnect}
                  disabled={!instanceId.trim() || !token.trim() || configureMutation.isPending}
                  className="w-full"
                >
                  {configureMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <QrCode className="w-4 h-4 mr-2" />
                  Gerar QR Code
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                Você precisa de uma assinatura Z-API para conectar.{" "}
                <a
                  href="https://www.z-api.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Saiba mais
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default WhatsAppConnectionCard;
