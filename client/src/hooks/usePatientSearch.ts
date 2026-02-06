/**
 * Hook for advanced patient search with debouncing and filters
 */

import { useCallback, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useDebouncedValue } from "./useDebouncedValue";

export interface PatientSearchFilters {
  query?: string;
  status?: "ativo" | "inativo";
  limit?: number;
}

export function usePatientSearch(debounceMs = 300) {
  const [filters, setFilters] = useState<PatientSearchFilters>({});
  const debouncedQuery = useDebouncedValue(filters.query ?? "", debounceMs);

  const searchParams = useMemo(
    () => ({
      search: debouncedQuery || undefined,
      status: filters.status,
      limit: filters.limit ?? 50,
    }),
    [debouncedQuery, filters.status, filters.limit]
  );

  const hasActiveFilters = useMemo(() => {
    return !!filters.query || !!filters.status;
  }, [filters]);

  // Use existing list endpoint with search and status filters
  const { data, isLoading, refetch } = trpc.pacientes.list.useQuery(searchParams, {
    staleTime: 30_000,
  });

  const updateFilter = useCallback(
    <K extends keyof PatientSearchFilters>(key: K, value: PatientSearchFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const setQuery = useCallback(
    (query: string) => {
      updateFilter("query", query);
    },
    [updateFilter]
  );

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    setQuery,
    results: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    hasActiveFilters,
    refetch,
  };
}
