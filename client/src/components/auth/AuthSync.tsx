import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

/**
 * AuthSync - Syncs user data with backend on authentication
 *
 * Uses ensureMentorado with exponential retry for robust profile creation.
 */
export function AuthSync() {
  const { isAuthenticated } = useAuth();
  const hasSynced = useRef(false);
  const [isCreating, setIsCreating] = useState(false);
  const utils = trpc.useUtils();

  const { mutate: ensureMentorado, isPending } = trpc.auth.ensureMentorado.useMutation({
    // AT-004: Exponential retry (1s, 2s, 4s)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onMutate: () => {
      setIsCreating(true);
      // AT-009: Show progress toast
      toast.loading("Preparando seu perfil...", {
        id: "ensure-mentorado",
        duration: Infinity,
      });
    },
    onSuccess: (data) => {
      setIsCreating(false);
      if (data.created) {
        toast.success("Perfil criado com sucesso!", {
          id: "ensure-mentorado",
          duration: 3000,
        });
      } else {
        toast.dismiss("ensure-mentorado");
      }
      // AT-005: Invalidate queries to force refetch
      utils.mentorados.me.invalidate();
      utils.auth.me.invalidate();
    },
    onError: (_error) => {
      setIsCreating(false);
      // AT-009: Show error toast (retry is handled automatically by TanStack Query)
      toast.error("Erro ao preparar seu perfil. Tentando novamente...", {
        id: "ensure-mentorado",
        duration: 3000,
      });
    },
  });

  useEffect(() => {
    if (isAuthenticated && !hasSynced.current) {
      hasSynced.current = true;
      ensureMentorado();
    }
  }, [isAuthenticated, ensureMentorado]);

  // AT-009: Optional loading indicator (returns null to not block UI)
  // The toast provides sufficient feedback
  void isPending;
  void isCreating;

  return null;
}
