/**
 * Facebook Ads Connection Card
 * Uses Facebook Login for OAuth flow to connect Facebook Ads accounts.
 * Implements checkLoginState() callback pattern per Meta documentation.
 */

import {
  BadgeDollarSign,
  CheckCircle,
  ChevronDown,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import type { FacebookLoginStatusResponse } from "@/types/facebook-sdk.d";

interface FacebookAdsConnectionCardProps {
  mentoradoId: number;
}

interface AdAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
}

export function FacebookAdsConnectionCard({ mentoradoId }: FacebookAdsConnectionCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [xfbmlFailed, setXfbmlFailed] = useState(false);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AdAccount | null>(null);
  const [currentAccessToken, setCurrentAccessToken] = useState<string | null>(null);
  const loginButtonRef = useRef<HTMLDivElement>(null);

  // tRPC mutations
  const saveToken = trpc.facebookAds.saveToken.useMutation({
    onSuccess: () => {
      toast.success("Facebook Ads conectado com sucesso!");
      connectionStatus.refetch();
      setAdAccounts([]);
      setSelectedAccount(null);
      setCurrentAccessToken(null);
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro ao salvar conexão: ${error.message}`);
    },
  });

  const disconnect = trpc.facebookAds.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Facebook Ads desconectado");
      connectionStatus.refetch();
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro ao desconectar: ${error.message}`);
    },
  });

  const syncMetrics = trpc.facebookAds.syncMetrics.useMutation({
    onSuccess: (data) => {
      toast.success(`Métricas sincronizadas: ${data.campaignsCount} campanhas`);
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro ao sincronizar: ${error.message}`);
    },
  });

  const getAdAccounts = trpc.facebookAds.getAdAccounts.useMutation({
    onSuccess: (data) => {
      setAdAccounts(data.accounts);
      if (data.accounts.length === 1) {
        // Auto-select if only one account
        setSelectedAccount(data.accounts[0]);
      }
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro ao buscar contas: ${error.message}`);
    },
  });

  // Get connection status from backend
  const connectionStatus = trpc.facebookAds.getConnectionStatus.useQuery(
    { mentoradoId },
    { enabled: !!mentoradoId }
  );

  // Initialize FB SDK and checkLoginState callback
  useEffect(() => {
    // Handle login status change
    const handleStatusChange = async (response: FacebookLoginStatusResponse) => {
      if (response.status === "connected" && response.authResponse) {
        setIsProcessing(true);
        setCurrentAccessToken(response.authResponse.accessToken);

        try {
          // Fetch ad accounts for selection
          await getAdAccounts.mutateAsync({ accessToken: response.authResponse.accessToken });
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Erro ao buscar contas de anúncios");
        } finally {
          setIsProcessing(false);
        }
      } else if (response.status === "not_authorized") {
        toast.error("Você precisa autorizar o acesso ao Facebook Ads.");
      }
    };

    const checkSDKLoaded = () => {
      if (window.FB) {
        setSdkLoaded(true);

        // Register global callback for fb:login-button onlogin
        window.checkFacebookAdsLoginState = () => {
          window.FB.getLoginStatus((response) => {
            handleStatusChange(response);
          });
        };

        // Parse XFBML to render the login button
        if (loginButtonRef.current) {
          const isHttp = window.location.protocol === "http:";

          if (isHttp) {
            setXfbmlFailed(true);
          } else {
            window.FB.XFBML.parse(loginButtonRef.current, () => {
              setTimeout(() => {
                const fbIframe = loginButtonRef.current?.querySelector("iframe");
                if (!fbIframe || fbIframe.offsetWidth < 10) {
                  setXfbmlFailed(true);
                }
              }, 1500);
            });
          }
        }

        return true;
      }
      return false;
    };

    if (checkSDKLoaded()) return;

    // Poll for SDK load
    const interval = setInterval(() => {
      if (checkSDKLoaded()) {
        clearInterval(interval);
      }
    }, 100);

    const timeout = setTimeout(() => clearInterval(interval), 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [getAdAccounts]);

  // Re-parse XFBML when SDK becomes available
  useEffect(() => {
    if (sdkLoaded && loginButtonRef.current && window.FB?.XFBML) {
      window.FB.XFBML.parse(loginButtonRef.current);
    }
  }, [sdkLoaded]);

  const handleSelectAccount = async (account: AdAccount) => {
    if (!currentAccessToken) {
      toast.error("Token de acesso não disponível. Faça login novamente.");
      return;
    }

    setIsProcessing(true);

    try {
      await saveToken.mutateAsync({
        mentoradoId,
        accessToken: currentAccessToken,
        adAccountId: account.id,
        adAccountName: account.name,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao conectar");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      // Logout from Facebook SDK
      if (window.FB) {
        window.FB.logout(() => {
          // SDK logout complete
        });
      }

      // Remove from backend
      await disconnect.mutateAsync({ mentoradoId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao desconectar");
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);

    try {
      const now = new Date();
      await syncMetrics.mutateAsync({
        mentoradoId,
        ano: now.getFullYear(),
        mes: now.getMonth() + 1,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual login handler for HTTP environments
  const handleManualLogin = () => {
    if (!window.FB) {
      toast.error("Facebook SDK não carregado. Aguarde ou recarregue a página.");
      return;
    }

    window.FB.login(
      (response) => {
        if (response.authResponse) {
          window.checkFacebookAdsLoginState?.();
        } else {
          toast.error("Login cancelado ou não autorizado.");
        }
      },
      {
        scope: "ads_read,business_management,pages_show_list",
      }
    );
  };

  const isConnected = connectionStatus.data?.isConnected;
  const lastSync = connectionStatus.data?.lastSyncAt;

  // Render account selection UI
  if (adAccounts.length > 0 && !isConnected) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <BadgeDollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Selecione a Conta de Anúncios</CardTitle>
              <CardDescription>Escolha qual conta do Facebook Ads deseja conectar</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedAccount ? (
                  <span>
                    {selectedAccount.name} ({selectedAccount.currency})
                  </span>
                ) : (
                  <span className="text-muted-foreground">Selecione uma conta...</span>
                )}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full min-w-[300px]">
              {adAccounts.map((account) => (
                <DropdownMenuItem
                  key={account.id}
                  onClick={() => setSelectedAccount(account)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{account.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {account.currency} • {account.timezone}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex gap-2">
            <Button
              onClick={() => selectedAccount && handleSelectAccount(selectedAccount)}
              disabled={!selectedAccount || isProcessing}
              className="flex-1"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Conectar Conta
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setAdAccounts([]);
                setSelectedAccount(null);
                setCurrentAccessToken(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <BadgeDollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Facebook Ads</CardTitle>
              <CardDescription>Sincronize métricas de campanhas publicitárias</CardDescription>
            </div>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? (
              <>
                <CheckCircle className="mr-1 h-3 w-3" />
                Conectado
              </>
            ) : (
              <>
                <XCircle className="mr-1 h-3 w-3" />
                Desconectado
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!sdkLoaded && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Carregando Facebook SDK...</AlertDescription>
          </Alert>
        )}

        {isProcessing && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Conectando Facebook Ads...</AlertDescription>
          </Alert>
        )}

        {isConnected && connectionStatus.data && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Conta:</span>
              <span className="font-medium">{connectionStatus.data.adAccountName}</span>
            </div>
            {lastSync && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Última sincronização:</span>
                <span className="text-sm">{new Date(lastSync).toLocaleString("pt-BR")}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {isConnected ? (
            <>
              <Button
                variant="outline"
                onClick={handleSync}
                disabled={isSyncing}
                className="flex-1"
              >
                {isSyncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sincronizar Agora
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={disconnect.isPending}
              >
                {disconnect.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Desconectar
              </Button>
            </>
          ) : (
            <div ref={loginButtonRef} className="w-full flex flex-col items-center gap-3">
              {/* Official Facebook Login Button (XFBML) */}
              {sdkLoaded && !xfbmlFailed && (
                <div
                  className="fb-login-button"
                  data-width="100%"
                  data-size="large"
                  data-button-type="login_with"
                  data-layout="default"
                  data-auto-logout-link="false"
                  data-use-continue-as="true"
                  data-scope="ads_read,business_management,pages_show_list"
                  data-onlogin="checkFacebookAdsLoginState();"
                />
              )}

              {/* Fallback button for HTTP environments */}
              {(xfbmlFailed || !sdkLoaded) && (
                <Button
                  onClick={handleManualLogin}
                  disabled={isProcessing || !sdkLoaded}
                  className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white"
                  size="lg"
                >
                  {isProcessing || !sdkLoaded ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <BadgeDollarSign className="mr-2 h-4 w-4" />
                  )}
                  {!sdkLoaded ? "Carregando..." : "Conectar com Facebook"}
                </Button>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Ao conectar, você autoriza a sincronização de métricas de campanhas. Seus dados são usados
          apenas para análise de desempenho.
          <a href="/account-deletion" className="ml-1 underline hover:text-foreground">
            Solicitar exclusão de dados
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
