import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

export function useAuth() {
  const { isLoaded, isSignedIn, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: isSignedIn,
    retry: false,
  });

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      loading: !isLoaded || meQuery.isLoading,
      error: meQuery.error ?? null,
      isAuthenticated: Boolean(isSignedIn && meQuery.data),
      clerkUser,
    };
  }, [
    isLoaded,
    isSignedIn,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    clerkUser,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout: () => signOut({ redirectUrl: "/" }),
  };
}
