/**
 * Facebook SDK Type Definitions
 * Shared types for Facebook JavaScript SDK integration.
 */

export interface FacebookAuthResponse {
  accessToken: string;
  expiresIn: number;
  signedRequest: string;
  userID: string;
}

export interface FacebookLoginStatusResponse {
  status: "connected" | "not_authorized" | "unknown";
  authResponse?: FacebookAuthResponse;
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

export interface FacebookPagesResponse {
  data?: FacebookPage[];
  error?: { message: string };
}

export interface InstagramBusinessAccount {
  id: string;
  username: string;
  name?: string;
}

export interface FacebookPageWithInstagram {
  instagram_business_account?: InstagramBusinessAccount;
  error?: { message: string };
}

// Global Window extension for Facebook SDK
declare global {
  interface Window {
    fbAsyncInit: () => void;
    checkLoginState: () => void;
    FB: {
      init: (params: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      getLoginStatus: (callback: (response: FacebookLoginStatusResponse) => void) => void;
      login: (
        callback: (response: FacebookLoginStatusResponse) => void,
        options?: { scope: string; return_scopes?: boolean }
      ) => void;
      logout: (callback: () => void) => void;
      api: <T>(path: string, callback: (response: T) => void) => void;
      XFBML: {
        parse: (element?: HTMLElement, callback?: () => void) => void;
      };
      AppEvents: {
        logPageView: () => void;
      };
    };
  }
}
