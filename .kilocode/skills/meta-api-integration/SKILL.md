---
name: meta-api-integration
description: Comprehensive guide for configuring Meta APIs (WhatsApp Business, Instagram Graph, Facebook Marketing) including OAuth flows, Embedded Signup, webhooks, and troubleshooting.
---

# Meta API Integration Skill

> **Purpose:** Configure and maintain connections to Meta's APIs for WhatsApp Business, Instagram, and Facebook Ads with best practices for OAuth, token management, and webhook handling.

---

## When to Use This Skill

Activate this skill when:

- 🔌 **Connecting Meta APIs**: Setting up WhatsApp Business, Instagram, or Facebook Ads integrations
- 🔑 **OAuth Configuration**: Implementing Facebook Login, token exchange, or refresh flows
- 📱 **Embedded Signup**: Onboarding businesses with WhatsApp Business account creation
- 🔔 **Webhook Setup**: Configuring Meta webhook endpoints for real-time events
- 🐛 **Troubleshooting**: Debugging authentication errors, rate limits, or API failures
- 📊 **Ads Metrics**: Syncing Facebook Marketing API data for reporting

---

## Quick Start Checklists

### ✅ WhatsApp Business Platform

1. [ ] Create Meta App at [developers.facebook.com](https://developers.facebook.com)
2. [ ] Add "WhatsApp" product to the app
3. [ ] Configure Embedded Signup (see [embedded-signup-flow.md](references/embedded-signup-flow.md))
4. [ ] Set environment variables (see [env-vars-template.md](references/env-vars-template.md))
5. [ ] Implement OAuth callback handler (see [oauth-flows.md](references/oauth-flows.md))
6. [ ] Configure webhooks (see [webhook-setup.md](references/webhook-setup.md))
7. [ ] Submit for Business Verification (production only)

### ✅ Instagram Graph API

1. [ ] Create Meta App with "Facebook Login" product
2. [ ] Request permissions: `instagram_basic`, `instagram_content_publish`, `pages_show_list`
3. [ ] Link Facebook Page to Instagram Business/Creator account
4. [ ] Implement OAuth flow with token exchange (see [oauth-flows.md](references/oauth-flows.md))
5. [ ] Set `INSTAGRAM_*` environment variables

### ✅ Facebook Marketing API

1. [ ] Create Meta App at developers.facebook.com
2. [ ] Add "Marketing API" product
3. [ ] Request permissions: `ads_read`, `ads_management`, `business_management`
4. [ ] Complete App Review for Standard Access (non-expiring tokens)
5. [ ] Implement OAuth with long-lived token exchange (see [oauth-flows.md](references/oauth-flows.md))
6. [ ] Set `FACEBOOK_ADS_*` environment variables

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| [oauth-flows.md](references/oauth-flows.md) | OAuth 2.0 flows, token exchange, refresh patterns |
| [embedded-signup-flow.md](references/embedded-signup-flow.md) | WhatsApp Embedded Signup implementation |
| [webhook-setup.md](references/webhook-setup.md) | Webhook configuration, signature validation, payloads |
| [env-vars-template.md](references/env-vars-template.md) | Environment variable template with annotations |
| [troubleshooting.md](references/troubleshooting.md) | Common errors, debugging tools, solutions |

---

## Codebase Reference

The following files in this project already implement Meta API integrations:

| File | Purpose |
|------|---------|
| `server/services/facebookAdsService.ts` | OAuth flow, token management, ads insights |
| `server/metaApiRouter.ts` | WhatsApp connection, messaging, Embedded Signup |
| `server/services/instagramService.ts` | Instagram OAuth via Facebook Login |
| `server/services/instagramPublishService.ts` | Content publishing to Instagram |
| `server/webhooks/metaWebhook.ts` | WhatsApp webhook handler |

### Key Patterns in Codebase

```typescript
// OAuth Token Exchange (facebookAdsService.ts)
exchangeForLongLivedToken(shortLivedToken: string): Promise<LongLivedTokenResponse>

// Embedded Signup Callback (metaApiRouter.ts)
configure: protectedProcedure.input(z.object({
  accessToken: z.string(),
  phoneNumberId: z.string(),
  wabaId: z.string(),
})).mutation(...)

// Webhook Signature Validation (metaWebhook.ts)
const signature = req.headers['x-hub-signature-256'];
const expectedSignature = `sha256=${crypto.createHmac('sha256', APP_SECRET).update(JSON.stringify(body)).digest('hex')}`;
```

---

## OAuth Scope Reference

| Product | Required Scopes | Optional Scopes |
|---------|-----------------|-----------------|
| **WhatsApp** | `whatsapp_business_management`, `whatsapp_business_messaging` | `business_management` |
| **Instagram** | `instagram_basic`, `pages_show_list` | `instagram_content_publish`, `instagram_manage_comments` |
| **Ads** | `ads_read`, `business_management` | `ads_management`, `read_insights` |

---

## Token Lifecycle

| Token Type | Validity | Refresh Method |
|------------|----------|----------------|
| Short-lived (Facebook Login) | 1-2 hours | Exchange for long-lived |
| Long-lived User Token | 60 days | Re-exchange before expiry |
| System User Token | Non-expiring | Revoke and regenerate |
| Page Token (from long-lived) | Non-expiring | Tied to user token |

> ⚠️ **Important:** Marketing API Standard Access tokens (after App Review) don't expire but can be invalidated if password changes or permissions are revoked.

---

## Graph API Version

This project uses Graph API **v24.0**. Ensure consistency across all services:

```typescript
const GRAPH_API_VERSION = 'v24.0';
const baseUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
```

---

## Security Best Practices

1. **Store tokens securely**: Use environment variables or encrypted database fields
2. **Validate webhook signatures**: Always verify `X-Hub-Signature-256` before processing
3. **Use server-side token exchange**: Never expose App Secret in frontend code
4. **Implement token refresh**: Schedule refresh 7 days before expiration
5. **Handle errors gracefully**: Implement exponential backoff for rate limits

---

## Troubleshooting Quick Reference

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `OAuthException` 190 | Invalid/expired token | Refresh or re-authenticate |
| `OAuthException` 10 | Permission denied | Check scope, complete App Review |
| HTTP 429 | Rate limit exceeded | Implement exponential backoff |
| HTTP 400 | Invalid request | Check payload structure |

For detailed troubleshooting, see [troubleshooting.md](references/troubleshooting.md).

---

## External Resources

- [Meta for Developers](https://developers.facebook.com/)
- [WhatsApp Business Platform Docs](https://developers.facebook.com/docs/whatsapp)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Facebook Marketing API Docs](https://developers.facebook.com/docs/marketing-api)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
