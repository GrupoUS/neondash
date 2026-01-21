import { useAuth } from "@clerk/clerk-react";
import { Redirect } from "wouter";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div>Carregando...</div>;
  }

  if (!isSignedIn) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}
