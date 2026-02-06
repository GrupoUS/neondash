import { trpc } from "@/lib/trpc";

export function useProcedimentos() {
  const utils = trpc.useUtils();

  // Procedimentos
  const list = trpc.procedimentos.procedimentos.list.useQuery();
  const create = trpc.procedimentos.procedimentos.create.useMutation({
    onSuccess: () => {
      utils.procedimentos.procedimentos.list.invalidate();
    },
  });
  const update = trpc.procedimentos.procedimentos.update.useMutation({
    onSuccess: () => {
      utils.procedimentos.procedimentos.list.invalidate();
    },
  });
  const remove = trpc.procedimentos.procedimentos.delete.useMutation({
    onSuccess: () => {
      utils.procedimentos.procedimentos.list.invalidate();
    },
  });

  // Calculations - Removed as not implemented in router
  // const calcularCusto = trpc.procedimentos.procedimentos.calcularCusto.useUtils();

  return {
    procedures: list.data || [],
    isLoading: list.isLoading,
    create,
    update,
    remove,
    // calcularCusto,
    refetch: list.refetch,
  };
}

export function useInsumos() {
  const utils = trpc.useUtils();

  const list = trpc.procedimentos.insumos.list.useQuery();
  const create = trpc.procedimentos.insumos.create.useMutation({
    onSuccess: () => {
      utils.procedimentos.insumos.list.invalidate();
    },
  });
  const update = trpc.procedimentos.insumos.update.useMutation({
    onSuccess: () => {
      utils.procedimentos.insumos.list.invalidate();
    },
  });
  const remove = trpc.procedimentos.insumos.delete.useMutation({
    onSuccess: () => {
      utils.procedimentos.insumos.list.invalidate();
    },
  });

  return {
    supplies: list.data || [],
    isLoading: list.isLoading,
    create,
    update,
    remove,
    refetch: list.refetch,
  };
}
