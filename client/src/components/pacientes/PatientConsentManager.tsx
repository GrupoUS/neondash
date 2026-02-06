/**
 * Patient Consent Manager Component
 * Manages LGPD consent status, history, and actions
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDateBR } from "@/lib/patient-validators";
import { trpc } from "@/lib/trpc";

interface ConsentItem {
  id: number;
  tipo: string;
  consentido: boolean;
  dataConsentimento: Date | string | null;
  dataRevogacao?: Date | string | null;
  ipAddress?: string | null;
  documentoUrl?: string | null;
}

interface PatientConsentManagerProps {
  pacienteId: number;
  consents: ConsentItem[];
  lgpdConsentimento?: boolean;
  lgpdDataConsentimento?: Date | string | null;
  lgpdConsentimentoMarketing?: boolean;
  lgpdConsentimentoFotos?: boolean;
  onUpdate?: () => void;
}

const CONSENT_TYPES = [
  {
    tipo: "dados_pessoais",
    label: "Uso de Dados Pessoais",
    description: "Autorização para coleta e processamento de dados pessoais conforme LGPD",
    required: true,
    icon: Shield,
  },
  {
    tipo: "marketing",
    label: "Comunicações de Marketing",
    description: "Recebimento de promoções, novidades e comunicações por email/WhatsApp",
    required: false,
    icon: FileText,
  },
  {
    tipo: "fotos",
    label: "Uso de Fotos (Antes/Depois)",
    description: "Autorização para uso de fotos em portfólio e redes sociais",
    required: false,
    icon: ShieldCheck,
  },
  {
    tipo: "procedimento",
    label: "Consentimento de Procedimento",
    description: "Autorização para realização de procedimentos estéticos",
    required: true,
    icon: ShieldAlert,
  },
];

export function PatientConsentManager({
  pacienteId: _pacienteId,
  consents,
  lgpdConsentimento,
  lgpdDataConsentimento,
  lgpdConsentimentoMarketing,
  lgpdConsentimentoFotos,
  onUpdate,
}: PatientConsentManagerProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    tipo: string;
    action: "request" | "revoke";
  }>({
    open: false,
    tipo: "",
    action: "request",
  });

  // Use existing update mutation for now - consent management would need dedicated endpoints
  const updateConsentMutation = trpc.pacientes.update.useMutation({
    onSuccess: () => {
      toast.success(
        confirmDialog.action === "request"
          ? "Consentimento solicitado com sucesso"
          : "Consentimento revogado com sucesso"
      );
      onUpdate?.();
      setConfirmDialog({ open: false, tipo: "", action: "request" });
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro ao atualizar consentimento: ${error.message}`);
    },
  });

  const getConsentStatus = (
    tipo: string
  ): { status: "granted" | "pending" | "revoked"; consent?: ConsentItem } => {
    // Check from consents array first
    const consent = consents.find((c) => c.tipo === tipo);
    if (consent) {
      if (consent.dataRevogacao) return { status: "revoked", consent };
      if (consent.consentido) return { status: "granted", consent };
      return { status: "pending", consent };
    }

    // Fallback to legacy fields
    if (tipo === "dados_pessoais" && lgpdConsentimento) {
      return { status: "granted" };
    }
    if (tipo === "marketing" && lgpdConsentimentoMarketing) {
      return { status: "granted" };
    }
    if (tipo === "fotos" && lgpdConsentimentoFotos) {
      return { status: "granted" };
    }

    return { status: "pending" };
  };

  const getStatusBadge = (tipo: string) => {
    const { status } = getConsentStatus(tipo);

    switch (status) {
      case "granted":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Concedido
          </Badge>
        );
      case "revoked":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1">
            <XCircle className="h-3 w-3" />
            Revogado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
            <AlertTriangle className="h-3 w-3" />
            Pendente
          </Badge>
        );
    }
  };

  const handleAction = (tipo: string, action: "request" | "revoke") => {
    setConfirmDialog({ open: true, tipo, action });
  };

  const confirmAction = () => {
    // Note: Full consent management would need dedicated backend endpoints
    // For now, show a user-friendly message
    toast.info(
      "Funcionalidade de consentimento requer endpoints dedicados. Use a edição do paciente para atualizar campos LGPD.",
      { duration: 5000 }
    );
    setConfirmDialog({ open: false, tipo: "", action: "request" });
  };

  const consentTypeInfo = CONSENT_TYPES.find((ct) => ct.tipo === confirmDialog.tipo);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Consentimentos LGPD
        </CardTitle>
        <CardDescription>
          Gerencie os consentimentos do paciente conforme a Lei Geral de Proteção de Dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main consent status */}
        {lgpdConsentimento && lgpdDataConsentimento && (
          <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-400">Consentimento principal ativo</p>
              <p className="text-xs text-muted-foreground">
                Concedido em {formatDateBR(lgpdDataConsentimento)}
              </p>
            </div>
          </div>
        )}

        <Separator />

        {/* Consent types */}
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {CONSENT_TYPES.map((consentType, index) => {
                const { status, consent } = getConsentStatus(consentType.tipo);
                const Icon = consentType.icon;

                return (
                  <motion.div
                    key={consentType.tipo}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-lg bg-card border hover:border-primary/30 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{consentType.label}</h4>
                        {consentType.required && (
                          <Badge variant="outline" className="text-xs">
                            Obrigatório
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{consentType.description}</p>

                      {consent && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <Clock className="h-3 w-3" />
                          {status === "granted" && consent.dataConsentimento && (
                            <span>Concedido em {formatDateBR(consent.dataConsentimento)}</span>
                          )}
                          {status === "revoked" && consent.dataRevogacao && (
                            <span>Revogado em {formatDateBR(consent.dataRevogacao)}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(consentType.tipo)}

                      <div className="flex gap-1">
                        {status !== "granted" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(consentType.tipo, "request")}
                            disabled={updateConsentMutation.isPending}
                            className="gap-1 text-xs"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Solicitar
                          </Button>
                        )}
                        {status === "granted" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAction(consentType.tipo, "revoke")}
                            disabled={updateConsentMutation.isPending}
                            className="gap-1 text-xs text-red-400 hover:text-red-300"
                          >
                            <ShieldX className="h-3 w-3" />
                            Revogar
                          </Button>
                        )}
                        {consent?.documentoUrl && (
                          <Button size="sm" variant="ghost" className="gap-1 text-xs" asChild>
                            <a
                              href={consent.documentoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* LGPD Warning */}
        <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 mt-4">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-amber-400 mb-1">Aviso LGPD</p>
            <p>
              Os dados pessoais coletados são tratados conforme a Lei nº 13.709/2018 (LGPD). O
              titular dos dados tem direito a solicitar acesso, correção, exclusão ou portabilidade
              de seus dados a qualquer momento.
            </p>
          </div>
        </div>
      </CardContent>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmDialog.action === "request" ? (
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              ) : (
                <ShieldX className="h-5 w-5 text-red-400" />
              )}
              {confirmDialog.action === "request"
                ? "Solicitar Consentimento"
                : "Revogar Consentimento"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "request" ? (
                <>
                  Deseja solicitar o consentimento de <strong>{consentTypeInfo?.label}</strong> para
                  este paciente?
                </>
              ) : (
                <>
                  Deseja revogar o consentimento de <strong>{consentTypeInfo?.label}</strong>? Esta
                  ação pode afetar o tratamento do paciente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={confirmDialog.action === "revoke" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {updateConsentMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {confirmDialog.action === "request" ? "Solicitar" : "Revogar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
