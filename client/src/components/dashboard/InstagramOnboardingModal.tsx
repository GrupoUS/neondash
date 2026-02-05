import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Instagram, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import type {
  FacebookLoginStatusResponse,
  FacebookPagesResponse,
  FacebookPageWithInstagram,
  InstagramBusinessAccount,
} from "@/types/facebook-sdk.d";

interface InstagramOnboardingModalProps {
  mentoradoId: number | undefined;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  {
    title: "Conecte seu Instagram",
    description:
      "Conecte sua conta do Instagram para sincronizar automaticamente seus posts e stories com o dashboard.",
    benefits: [
      "Métricas automáticas de posts e stories",
      "Comparação com meses anteriores",
      "Economia de tempo no preenchimento",
    ],
  },
  {
    title: "Requisitos",
    description: "Para conectar o Instagram, sua conta precisa atender aos seguintes requisitos:",
    requirements: [
      "Conta Business ou Creator (não pessoal)",
      "Conectada a uma página do Facebook",
      "Acesso de administrador à página",
    ],
  },
  {
    title: "Autorizar Acesso",
    description: "Clique no botão abaixo para autorizar o Portal NEON a acessar suas métricas.",
  },
];

export function InstagramOnboardingModal({
  mentoradoId,
  isOpen,
  onOpenChange,
}: InstagramOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // tRPC mutation for saving token (same as InstagramConnectionCard)
  const saveToken = trpc.instagram.saveToken.useMutation({
    onSuccess: () => {
      toast.success("Instagram conectado com sucesso!");
      onOpenChange(false);
    },
    onError: (err) => {
      setError(err.message);
      setIsConnecting(false);
    },
  });

  // Helper to get Instagram Business Account from Facebook Pages
  const getInstagramAccount = (): Promise<InstagramBusinessAccount | null> => {
    return new Promise((resolve) => {
      if (!window.FB) {
        resolve(null);
        return;
      }

      window.FB.api<FacebookPagesResponse>("/me/accounts", (pagesResponse) => {
        if (pagesResponse.error || !pagesResponse.data?.length) {
          resolve(null);
          return;
        }

        const pageId = pagesResponse.data[0].id;
        window.FB.api<FacebookPageWithInstagram>(
          `/${pageId}?fields=instagram_business_account{id,username,name}`,
          (igResponse) => {
            if (igResponse.error || !igResponse.instagram_business_account) {
              resolve(null);
              return;
            }
            resolve(igResponse.instagram_business_account);
          }
        );
      });
    });
  };

  // Handle Facebook SDK login (same flow as InstagramConnectionCard)
  const handleConnect = () => {
    if (!mentoradoId) return;

    if (!window.FB) {
      setError("Facebook SDK não carregado. Aguarde ou recarregue a página.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    // Separated async logic to satisfy FB.login sync callback requirement
    const processLoginResponse = async (response: FacebookLoginStatusResponse) => {
      if (response.authResponse) {
        try {
          // Get Instagram Business Account
          const igAccount = await getInstagramAccount();

          if (!igAccount) {
            setError(
              "Conta Instagram Business não encontrada. Vincule sua conta Instagram a uma Página do Facebook."
            );
            setIsConnecting(false);
            return;
          }

          // Save token to backend
          await saveToken.mutateAsync({
            mentoradoId,
            accessToken: response.authResponse.accessToken,
            instagramAccountId: igAccount.id,
            instagramUsername: igAccount.username,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Erro ao conectar Instagram");
          setIsConnecting(false);
        }
      } else {
        setError("Login cancelado ou não autorizado.");
        setIsConnecting(false);
      }
    };

    window.FB.login(
      (response: FacebookLoginStatusResponse) => {
        // Wrapper must be synchronous
        void processLoginResponse(response);
      },
      {
        scope: "instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement",
      }
    );
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            {step.title}
          </DialogTitle>
          <DialogDescription>{step.description}</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="py-4"
          >
            {/* Step 0: Benefits */}
            {currentStep === 0 && step.benefits && (
              <ul className="space-y-3">
                {step.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {benefit}
                  </li>
                ))}
              </ul>
            )}

            {/* Step 1: Requirements */}
            {currentStep === 1 && step.requirements && (
              <ul className="space-y-3">
                {step.requirements.map((req, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    {req}
                  </li>
                ))}
              </ul>
            )}

            {/* Step 2: Connect */}
            {currentStep === 2 && (
              <div className="flex flex-col items-center gap-4">
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting || !mentoradoId}
                  className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Instagram className="mr-2 h-4 w-4" />
                      Conectar Instagram
                    </>
                  )}
                </Button>

                {error && <p className="text-sm text-destructive text-center">{error}</p>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0}>
            Voltar
          </Button>

          {currentStep < steps.length - 1 ? <Button onClick={handleNext}>Próximo</Button> : null}
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-1 pt-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                i === currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
