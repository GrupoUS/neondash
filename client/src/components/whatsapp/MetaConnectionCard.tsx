/**
 * Meta WhatsApp Cloud API Connection Card Component
 * Uses Facebook Embedded Signup for one-click WhatsApp Business connection
 *
 * @see https://developers.facebook.com/docs/whatsapp/embedded-signup/
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageCircle,
  RefreshCw,
  Smartphone,
  Unlink,
  Wifi,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import { useFacebookSdk } from "@/hooks/use-facebook-sdk";
import { trpc } from "@/lib/trpc";
import type { EmbeddedSignupResponse } from "@/types/facebook-sdk";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

export function MetaConnectionCard() {
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  // Get current Meta connection status
  const { data: connectionStatus, refetch: refetchStatus } = trpc.metaApi.getStatus.useQuery(
    undefined,
    { refetchInterval: status === "connecting" ? 5000 : 30000 }
  );

  // Exchange code mutation (exchanges FB code for permanent credentials)

  const exchangeCodeMutation = trpc.metaApi.exchangeCode.useMutation({
    onSuccess: () => {
      setError(null);
      setStatus("connected");
      refetchStatus();
    },
    onError: (err) => {
      setError(err.message || "Erro ao trocar código de autorização");
      setStatus("disconnected");
    },
  });

  // Disconnect mutation
  const disconnectMutation = trpc.metaApi.disconnect.useMutation({
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

  // Load Facebook SDK via hook
  const {
    isLoaded: fbSdkLoaded,
    error: sdkError,
    isLoading: sdkLoading,
  } = useFacebookSdk({
    appId: import.meta.env.VITE_META_APP_ID,
  });

  // Handle Embedded Signup launch
  const handleEmbeddedSignup = useCallback(() => {
    const META_CONFIG_ID = import.meta.env.VITE_META_CONFIG_ID;

    if (sdkError) {
      setError(sdkError.message);
      return;
    }

    if (!window.FB || !fbSdkLoaded) {
      setError("Facebook SDK não carregado. Recarregue a página.");
      return;
    }

    if (!META_CONFIG_ID) {
      setError("Configuração do Meta não encontrada. Contate o suporte.");
      return;
    }

    setError(null);
    setStatus("connecting");

    window.FB.login(
      (response: EmbeddedSignupResponse) => {
        if (response.authResponse) {
          // User completed signup - exchange code for permanent credentials
          const { code } = response.authResponse;

          if (code) {
            // Send code to backend for token exchange
            exchangeCodeMutation.mutate({ code });
          } else {
            setError("Código de autorização não recebido. Tente novamente.");
            setStatus("disconnected");
          }
        } else {
          setError("Signup cancelado ou falhou. Tente novamente.");
          setStatus("disconnected");
        }
      },
      {
        config_id: META_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: 2,
        },
      }
    );
  }, [fbSdkLoaded, exchangeCodeMutation, sdkError]);

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
    <Card className="border-blue-500/20 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">WhatsApp Business</CardTitle>
              <CardDescription>Integração via Meta Cloud API</CardDescription>
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
                    WhatsApp Business conectado
                  </p>
                  {connectionStatus?.phone && (
                    <p className="text-sm text-green-600 dark:text-green-500">
                      {connectionStatus.phone}
                    </p>
                  )}
                  {connectionStatus?.verifiedName && (
                    <p className="text-xs text-green-600/70 dark:text-green-500/70">
                      {connectionStatus.verifiedName}
                    </p>
                  )}
                </div>
                <Smartphone className="w-6 h-6 text-green-500" />
              </div>

              {/* Quality Rating Badge */}
              {connectionStatus?.qualityRating && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Qualidade:</span>
                  <Badge
                    variant="outline"
                    className={
                      connectionStatus.qualityRating === "GREEN"
                        ? "border-green-500 text-green-600"
                        : connectionStatus.qualityRating === "YELLOW"
                          ? "border-yellow-500 text-yellow-600"
                          : "border-red-500 text-red-600"
                    }
                  >
                    {connectionStatus.qualityRating === "GREEN"
                      ? "Alta"
                      : connectionStatus.qualityRating === "YELLOW"
                        ? "Média"
                        : "Baixa"}
                  </Badge>
                </div>
              )}

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
                    <DialogTitle>Desconectar WhatsApp Business?</DialogTitle>
                    <DialogDescription>
                      Você precisará reconectar sua conta pelo Facebook. Mensagens não serão
                      recebidas enquanto desconectado.
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

          {/* Connecting State */}
          {status === "connecting" && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center gap-4 p-6">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                <div className="text-center">
                  <p className="font-medium">Configurando conexão...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Aguarde enquanto configuramos seu WhatsApp Business
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => refetchStatus()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Verificar status
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
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Connection Error from Server */}
              {connectionStatus?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro de conexão</AlertTitle>
                  <AlertDescription>{connectionStatus.error}</AlertDescription>
                </Alert>
              )}

              {/* Embedded Signup CTA */}
              <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <MessageCircle className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Conectar WhatsApp Business</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Conecte sua conta do WhatsApp Business em poucos cliques.
                    <br />
                    <span className="text-blue-600 font-medium">API Oficial do Meta</span> -
                    Confiável e segura.
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={handleEmbeddedSignup}
                  disabled={!fbSdkLoaded || exchangeCodeMutation.isPending || !!sdkError}
                  className="w-full max-w-xs bg-blue-600 hover:bg-blue-700"
                >
                  {exchangeCodeMutation.isPending || sdkLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Smartphone className="w-4 h-4 mr-2" />
                  )}
                  Conectar com Facebook
                </Button>

                {sdkLoading && (
                  <p className="text-xs text-muted-foreground">Carregando SDK do Facebook...</p>
                )}

                {sdkError && (
                  <p className="text-xs text-red-500 font-medium">
                    Erro no SDK: {sdkError.message}
                  </p>
                )}
              </div>

              {/* Info Section */}
              <Alert className="border-blue-500/20 bg-blue-500/5">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Sobre a integração Meta Cloud API</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>
                      <strong>API Oficial:</strong> Integração direta com servidores do WhatsApp
                    </li>
                    <li>
                      <strong>Sem QR Code:</strong> Conexão via login Facebook Business
                    </li>
                    <li>
                      <strong>Templates:</strong> Envie mensagens modelo aprovados pelo Meta
                    </li>
                    <li>
                      <strong>Escalável:</strong> Suporte a alto volume de mensagens
                    </li>
                  </ul>
                  <a
                    href="https://business.facebook.com/settings/whatsapp-business-accounts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline inline-flex items-center gap-1 text-sm mt-2"
                  >
                    Gerenciar contas no Facebook Business <ExternalLink className="w-3 h-3" />
                  </a>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default MetaConnectionCard;
