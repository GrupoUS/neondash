import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function AuthSync() {
  const { isSignedIn, isLoaded } = useAuth();
  const hasSynced = useRef(false);
  
  const { mutate: syncUser } = trpc.auth.syncUser.useMutation({
    onSuccess: (data) => {
      if (data.linked) {
        toast.success("Perfil de mentorado vinculado com sucesso!");
      }
    },
    onError: (err) => {
        console.error("Auth sync failed", err);
    }
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && !hasSynced.current) {
      hasSynced.current = true;
      syncUser();
    }
  }, [isLoaded, isSignedIn, syncUser]);

  return null;
}
