import { useEffect, useState } from "react";

interface UseFacebookSdkProps {
  appId?: string;
  language?: string;
  version?: string;
  autoLogAppEvents?: boolean;
  xfbml?: boolean;
}

interface UseFacebookSdkResult {
  isLoaded: boolean;
  error: Error | null;
  isLoading: boolean;
}

export function useFacebookSdk({
  appId,
  language = "en_US",
  version = "v21.0",
  autoLogAppEvents = true,
  xfbml = true,
}: UseFacebookSdkProps): UseFacebookSdkResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!appId) {
      setError(new Error("Facebook App ID is not configured."));
      setIsLoading(false);
      return;
    }

    // Check if SDK is already loaded
    if (window.FB) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    // Check if script is already present but not loaded yet
    if (document.getElementById("facebook-jssdk")) {
      // It might be loading, we just wait for fbAsyncInit
      setIsLoading(true);
    } else {
      // Inject script
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = `https://connect.facebook.net/${language}/sdk.js`;
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";

      script.onerror = () => {
        setError(new Error("Failed to load Facebook SDK. Check your network or ad blocker."));
        setIsLoading(false);
      };

      document.head.appendChild(script);
    }

    // Setup init callback
    const originalFbAsyncInit = window.fbAsyncInit;
    window.fbAsyncInit = () => {
      if (originalFbAsyncInit) {
        originalFbAsyncInit();
      }

      try {
        window.FB.init({
          appId,
          autoLogAppEvents,
          xfbml,
          version,
        });
        setIsLoaded(true);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to initialize Facebook SDK"));
        setIsLoading(false);
      }
    };

    // Cleanup not really possible for global script, but we can prevent state updates if unmounted
    return () => {
      // connection logic remains
    };
  }, [appId, language, version, autoLogAppEvents, xfbml]);

  return { isLoaded, error, isLoading };
}
