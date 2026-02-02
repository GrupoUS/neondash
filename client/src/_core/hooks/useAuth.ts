import { useClerk } from "@clerk/clerk-react";
import { useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";

/**
 * useAuth - Authentication hook with Clerk integration
 *
 * Uses tRPC auth.me query for user data.
 * Uses Clerk's signOut for logout functionality.
 */
export function useAuth() {
  const { signOut } = useClerk();
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading,
      error: meQuery.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
      clerkUser: null, // Deprecated - kept for compatibility
    };
  }, [meQuery.data, meQuery.error, meQuery.isLoading]);

  const logout = useCallback(async () => {
    // Clear tRPC cache
    utils.invalidate();
    // Sign out via Clerk (this clears Clerk's session)
    await signOut({ redirectUrl: "/" });
  }, [signOut, utils]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
