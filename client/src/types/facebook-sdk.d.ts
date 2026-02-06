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

// Meta Embedded Signup response for WhatsApp integration
export interface EmbeddedSignupAuthResponse {
  accessToken: string;
  code: string;
  data_access_expiration_time: number;
  expiresIn: number;
  userID: string;
}

export interface EmbeddedSignupResponse {
  authResponse?: EmbeddedSignupAuthResponse;
  status: string;
}

// Embedded Signup login options
export interface EmbeddedSignupLoginOptions {
  config_id: string;
  response_type: string;
  override_default_response_type: boolean;
  extras: Record<string, unknown>;
}

// Standard login options
export interface StandardLoginOptions {
  scope: string;
  return_scopes?: boolean;
}

// Global Window extension for Facebook SDK
declare global {
  interface Window {
    fbAsyncInit: () => void;
    checkLoginState: () => void;
    checkFacebookAdsLoginState?: () => void;
    FB: {
      init: (params: {
        appId: string;
        cookie?: boolean;
        xfbml: boolean;
        version: string;
        autoLogAppEvents?: boolean;
      }) => void;
      getLoginStatus: (callback: (response: FacebookLoginStatusResponse) => void) => void;
      login: {
        // Standard login overload
        (
          callback: (response: FacebookLoginStatusResponse) => void,
          options?: StandardLoginOptions
        ): void;
        // Embedded Signup overload
        (
          callback: (response: EmbeddedSignupResponse) => void,
          options: EmbeddedSignupLoginOptions
        ): void;
      };
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
