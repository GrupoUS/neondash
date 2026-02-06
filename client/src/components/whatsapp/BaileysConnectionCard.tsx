import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
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
import { trpc } from "@/lib/trpc";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

export function BaileysConnectionCard() {
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  // Get current connection status
  const { data: connectionStatus, refetch: refetchStatus } = trpc.baileys.getStatus.useQuery(
    undefined,
    { refetchInterval: 3000 }
  );

  // Get QR code (enabled only when connecting)
  const {
    data: qrData,
    refetch: refetchQr,
    isLoading: isLoadingQr,
    error: _qrError,
  } = trpc.baileys.getQRCode.useQuery(undefined, {
    enabled: status === "connecting",
    refetchInterval: 5000,
    retry: false,
  });

  const connectMutation = trpc.baileys.connect.useMutation({
    onSuccess: () => {
      setStatus("connecting");
      refetchQr();
    },
  });

  const disconnectMutation = trpc.baileys.disconnect.useMutation({
    onSuccess: () => {
      setStatus("disconnected");
      setShowDisconnectDialog(false);
      refetchStatus();
    },
  });

  // Sync state with backend
  useEffect(() => {
    if (connectionStatus) {
      if (connectionStatus.connected) {
        setStatus("connected");
      } else if (status === "connecting" && !connectionStatus.connected) {
        // Keep connecting state if we are waiting for QR scan
        // requires backend to report "connecting" or "QR ready"
        // Our backend getStatus returns { connected, qr, status }
        if (connectionStatus.status === "connected") setStatus("connected");
        else if (connectionStatus.status === "connecting") setStatus("connecting");
        else if (status !== "connecting") setStatus("disconnected");
      } else {
        setStatus("disconnected");
      }
    }
  }, [connectionStatus, status]);

  const handleConnect = () => {
    connectMutation.mutate();
    setStatus("connecting");
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
            className="border-gray-500 text-gray-600 bg-gray-50 dark:bg-gray-950/30"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Desconectado
          </Badge>
        );
    }
  };

  return (
    <Card className="border-emerald-500/20 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">WhatsApp Web (Baileys)</CardTitle>
              <CardDescription>Conexão via QR Code (Self-Hosted)</CardDescription>
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
                    WhatsApp Conectado
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    Sessão ativa e sincronizada
                  </p>
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
                    Desconectar Sessão
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Desconectar WhatsApp?</DialogTitle>
                    <DialogDescription>
                      Você precisará escanear o QR code novamente para reconectar.
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

          {/* Connecting State - QR Code */}
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
                  Abra o WhatsApp no seu celular, vá em Aparelhos Conectados {">"} Conectar Aparelho
                  e escaneie o código abaixo.
                </p>

                <div className="relative p-4 bg-white rounded-xl shadow-inner border min-h-[200px] flex items-center justify-center">
                  {isLoadingQr ? (
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  ) : qrData?.qr || connectionStatus?.qr ? (
                    <img
                      src={
                        (qrData?.qr || connectionStatus?.qr)?.startsWith("data:")
                          ? qrData?.qr || connectionStatus?.qr
                          : `data:image/png;base64,${qrData?.qr || connectionStatus?.qr}`
                      }
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Aguardando QR Code...</p>
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
                  Atualizar Código
                </Button>
              </div>
            </motion.div>
          )}

          {/* Disconnected State */}
          {status === "disconnected" && (
            <motion.div
              key="disconnected"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-emerald-500/20">
                <div className="p-3 rounded-full bg-emerald-500/10">
                  <QrCode className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Conectar via QR Code</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Conexão direta e simples usando o WhatsApp Web. Ideal para uso pessoal e testes.
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={handleConnect}
                  disabled={connectMutation.isPending}
                  className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  {connectMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Smartphone className="w-4 h-4 mr-2" />
                  )}
                  Gerar QR Code
                </Button>
              </div>

              <Alert className="border-emerald-500/20 bg-emerald-500/5">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Como funciona (Baileys)</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  Esta integração usa o protocolo WhatsApp Web. Seu celular precisa estar com
                  internet para que a conexão funcione.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default BaileysConnectionCard;
