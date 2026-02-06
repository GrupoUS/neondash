# WhatsApp Embedded Signup Implementation

> Step-by-step guide for implementing Meta's Embedded Signup flow to onboard businesses with WhatsApp Business accounts.

---

## Overview

Embedded Signup allows businesses to:
- Create or connect a WhatsApp Business Account (WABA)
- Register a phone number
- Authenticate and grant permissions
- All within a single popup flow

---

## Prerequisites

1. Meta App created at [developers.facebook.com](https://developers.facebook.com)
2. WhatsApp product added to the app
3. App configured for "Login with JavaScript SDK"
4. Domain added to "Allowed Domains" in app settings

---

## Step 1: Configure Meta App

### App Settings Checklist

```yaml
Meta App Dashboard:
  Basic Settings:
    - App ID: [your_app_id]
    - App Secret: [store_securely]
    - Privacy Policy URL: https://yourdomain.com/privacy
    - Terms of Service URL: https://yourdomain.com/terms

  Facebook Login for Business:
    - Client OAuth Login: ON
    - Web OAuth Login: ON
    - Enforce HTTPS: ON
    - Embedded Browser OAuth Login: OFF
    - Valid OAuth Redirect URIs: https://yourdomain.com/api/meta/callback
    - Allowed Domains: yourdomain.com

  WhatsApp Settings:
    - Embedded Signup Configuration ID: [config_id]
```

---

## Step 2: Load Facebook SDK

Add to your HTML (before closing `</body>` tag):

```html
<!-- Facebook SDK for JavaScript -->
<script>
  window.fbAsyncInit = function() {
    FB.init({
      appId: 'YOUR_APP_ID',
      cookie: true,
      xfbml: true,
      version: 'v24.0'
    });
  };
</script>
<script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js"></script>
```

For React/TypeScript:

```typescript
// hooks/useFacebookSDK.ts
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export function useFacebookSDK(appId: string) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if already loaded
    if (window.FB) {
      setIsLoaded(true);
      return;
    }

    window.fbAsyncInit = () => {
      window.FB.init({
        appId,
        cookie: true,
        xfbml: true,
        version: 'v24.0',
      });
      setIsLoaded(true);
    };

    // Load SDK script
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [appId]);

  return isLoaded;
}
```

---

## Step 3: Implement Login Flow

```typescript
// components/WhatsAppConnect.tsx
import { useState } from 'react';
import { useFacebookSDK } from '@/hooks/useFacebookSDK';
import { trpc } from '@/lib/trpc';

interface EmbeddedSignupResponse {
  authResponse?: {
    code: string;
    accessToken: string;
  };
  status: 'connected' | 'not_authorized' | 'unknown';
}

export function WhatsAppConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const isSDKLoaded = useFacebookSDK(import.meta.env.VITE_FACEBOOK_APP_ID);
  const configMutation = trpc.meta.configure.useMutation();

  const handleConnect = () => {
    if (!window.FB || !isSDKLoaded) {
      console.error('Facebook SDK not loaded');
      return;
    }

    setIsConnecting(true);

    window.FB.login(
      (response: EmbeddedSignupResponse) => {
        if (response.authResponse) {
          handleEmbeddedSignupResponse(response);
        } else {
          console.log('User cancelled or not authorized');
          setIsConnecting(false);
        }
      },
      {
        config_id: import.meta.env.VITE_EMBEDDED_SIGNUP_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          feature: 'whatsapp_embedded_signup',
          sessionInfoVersion: 3,
        },
      }
    );
  };

  const handleEmbeddedSignupResponse = async (fbResponse: EmbeddedSignupResponse) => {
    try {
      // Exchange code for session info via backend
      const result = await configMutation.mutateAsync({
        code: fbResponse.authResponse!.code,
      });

      if (result.success) {
        // Redirect or update UI
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to configure WhatsApp:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={!isSDKLoaded || isConnecting}
      className="btn btn-primary"
    >
      {isConnecting ? 'Connecting...' : 'Connect WhatsApp Business'}
    </button>
  );
}
```

---

## Step 4: Backend Session Info Lookup

After receiving the code from Embedded Signup, exchange it for session info:

```typescript
// server/metaApiRouter.ts
import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';

const GRAPH_API_VERSION = 'v24.0';

interface SessionInfo {
  data: Array<{
    id: string; // WABA ID
    phone_numbers: Array<{
      phone_number_id: string;
      verified_name: string;
      display_phone_number: string;
    }>;
  }>;
}

export const metaRouter = router({
  configure: protectedProcedure
    .input(z.object({
      code: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Exchange code for access token
      const tokenResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?` +
        new URLSearchParams({
          client_id: process.env.FACEBOOK_APP_ID!,
          client_secret: process.env.FACEBOOK_APP_SECRET!,
          code: input.code,
        })
      );

      const { access_token } = await tokenResponse.json();

      // 2. Get session info (Embedded Signup specific)
      const sessionInfoResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/debug_token?` +
        new URLSearchParams({
          input_token: access_token,
          access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`,
        })
      );

      const debugInfo = await sessionInfoResponse.json();
      const wabaId = debugInfo.data?.granular_scopes?.find(
        (s: any) => s.scope === 'whatsapp_business_management'
      )?.target_ids?.[0];

      // 3. Exchange for long-lived token
      const longLivedResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: 'fb_exchange_token',
          client_id: process.env.FACEBOOK_APP_ID!,
          client_secret: process.env.FACEBOOK_APP_SECRET!,
          fb_exchange_token: access_token,
        })
      );

      const longLivedToken = await longLivedResponse.json();

      // 4. Get phone number details
      const phoneResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/phone_numbers?access_token=${longLivedToken.access_token}`
      );

      const phoneData = await phoneResponse.json();
      const phoneNumber = phoneData.data?.[0];

      // 5. Store in database
      await ctx.db.update(mentorados).set({
        metaWabaId: wabaId,
        metaPhoneNumberId: phoneNumber?.id,
        metaAccessToken: longLivedToken.access_token,
        metaConnected: 'sim',
        updatedAt: new Date(),
      }).where(eq(mentorados.userId, ctx.user.id));

      return {
        success: true,
        wabaId,
        phoneNumberId: phoneNumber?.id,
        displayPhone: phoneNumber?.display_phone_number,
      };
    }),
});
```

---

## Step 5: Verify Connection

After setup, verify the connection works:

```typescript
async function verifyWhatsAppConnection(credentials: {
  phoneNumberId: string;
  accessToken: string;
}): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${credentials.phoneNumberId}?` +
      `fields=verified_name,display_phone_number,quality_rating&access_token=${credentials.accessToken}`
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return !!data.verified_name;
  } catch {
    return false;
  }
}
```

---

## Configuration Checklist

```yaml
Meta Business Manager:
  - [ ] Business verified (for production)
  - [ ] Meta App created and configured
  - [ ] WhatsApp product added
  - [ ] Embedded Signup Configuration created
  - [ ] Config ID noted

App Settings:
  - [ ] Facebook Login for Business configured
  - [ ] Valid OAuth Redirect URIs added
  - [ ] Allowed Domains added
  - [ ] Privacy Policy URL set
  - [ ] Terms of Service URL set

Environment Variables:
  - [ ] FACEBOOK_APP_ID
  - [ ] FACEBOOK_APP_SECRET
  - [ ] VITE_FACEBOOK_APP_ID (for frontend)
  - [ ] VITE_EMBEDDED_SIGNUP_CONFIG_ID
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| "SDK not loaded" | Check domain is in Allowed Domains |
| "config_id invalid" | Create new Embedded Signup Config in Business Manager |
| "Phone already registered" | User must migrate from existing provider |
| "Business not verified" | Complete Business Verification in Business Manager |
| CORS errors | Ensure domain is whitelisted |
