import { useClerk } from "@clerk/clerk-react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * SignInButton - Sign-in button using Clerk
 *
 * Redirects to Clerk's hosted sign-in page.
 */
export function SignInButton() {
  const { redirectToSignIn } = useClerk();

  const handleSignIn = () => {
    redirectToSignIn({ redirectUrl: "/dashboard" });
  };

  return (
    <Button size="lg" onClick={handleSignIn}>
      <LogIn className="mr-2 h-4 w-4" />
      Entrar
    </Button>
  );
}
