import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type MetricField = "faturamento" | "lucro" | "leads" | "procedimentos" | "postsFeed" | "stories";

interface UseAutoSaveOptions {
  fieldName: MetricField;
  ano: number;
  mes: number;
  /** Last known server value (from hydration) - skip save if unchanged */
  lastServerValue?: number;
  /** Whether the form has been hydrated from server data */
  isHydrated?: boolean;
  onSuccess?: () => void;
}

/**
 * Pessimistic auto-save hook for metric fields
 * Saves on blur, shows "Saved" only after server confirmation
 *
 * Bail-out conditions:
 * - Value is NaN/undefined (empty field)
 * - Value matches last known server value
 * - Form not yet hydrated from server data
 */
export function useAutoSave({
  fieldName,
  ano,
  mes,
  lastServerValue,
  isHydrated = true,
  onSuccess,
}: UseAutoSaveOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const lastSavedValueRef = useRef<number | undefined>(lastServerValue);

  const mutation = trpc.mentorados.updateMetricaField.useMutation({
    onMutate: () => {
      setIsLoading(true);
      setIsSaved(false);
    },
    onSuccess: (_data, variables) => {
      setIsLoading(false);
      setIsSaved(true);
      lastSavedValueRef.current = variables.value;
      toast.success("Salvo ✓", { duration: 1500 });
      onSuccess?.();
      // Reset saved indicator after 3 seconds
      setTimeout(() => setIsSaved(false), 3000);
    },
    onError: (error) => {
      setIsLoading(false);
      toast.error("Erro ao salvar", {
        description: error.message,
        action: {
          label: "Tentar novamente",
          onClick: () => {
            // Will be called with last value from closure
          },
        },
      });
    },
  });

  /**
   * Handle blur event - saves to server if value is valid and changed
   * @param value - The parsed numeric value (may be NaN if field was empty)
   * @param isEmpty - Whether the input field is empty/undefined
   */
  const handleBlur = useCallback(
    (value: number, isEmpty = false) => {
      // Bail out: Don't save if form not hydrated yet
      if (!isHydrated) return;

      // Bail out: Don't save if field is empty/undefined (prevents overwriting with 0)
      if (isEmpty || Number.isNaN(value)) return;

      // Bail out: Don't save negative values
      if (value < 0) return;

      // Bail out: Skip if value matches last known server value
      if (lastSavedValueRef.current !== undefined && value === lastSavedValueRef.current) return;

      mutation.mutate({ ano, mes, field: fieldName, value });
    },
    [mutation, ano, mes, fieldName, isHydrated]
  );

  /**
   * Update last known server value (call when hydrating from server)
   */
  const setLastServerValue = useCallback((value: number | undefined) => {
    lastSavedValueRef.current = value;
  }, []);

  return { handleBlur, isLoading, isSaved, setLastServerValue };
}
