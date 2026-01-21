import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      // Clear the cached user data
      utils.auth.me.setData(undefined, null);
      // Clear localStorage
      localStorage.removeItem("manus-runtime-user-info");
      // Force redirect to landing page
      window.location.href = "/";
    },
    onError: (error) => {
      // Even on error, try to redirect to landing page
      console.error("[Auth] Logout error:", error);
      localStorage.removeItem("manus-runtime-user-info");
      window.location.href = "/";
    },
  });

  const logout = useCallback(async () => {
    try {
      // Call the logout mutation - redirect will happen in onSuccess/onError
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      // If mutation throws, still try to redirect
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        // Already logged out
        localStorage.removeItem("manus-runtime-user-info");
        window.location.href = "/";
        return;
      }
      // For other errors, still redirect
      console.error("[Auth] Logout failed:", error);
      localStorage.removeItem("manus-runtime-user-info");
      window.location.href = "/";
    }
  }, [logoutMutation]);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
