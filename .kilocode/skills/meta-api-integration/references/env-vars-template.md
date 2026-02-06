# Environment Variables Template

> Complete template for configuring Meta API integrations with annotated descriptions.

---

## Quick Copy Template

```bash
# ============================================
# META API CONFIGURATION
# ============================================

# --- Core App Settings (Required) ---
FACEBOOK_APP_ID=                    # Meta App ID from developers.facebook.com
FACEBOOK_APP_SECRET=                # Meta App Secret (NEVER expose in frontend)
META_VERIFY_TOKEN=                  # Custom token for webhook verification

# --- WhatsApp Business Platform ---
META_WHATSAPP_PHONE_NUMBER_ID=      # Phone Number ID from WhatsApp settings
META_WHATSAPP_WABA_ID=              # WhatsApp Business Account ID
META_WHATSAPP_ACCESS_TOKEN=         # Long-lived access token

# --- Instagram Graph API ---
INSTAGRAM_APP_ID=                   # Usually same as FACEBOOK_APP_ID
INSTAGRAM_APP_SECRET=               # Usually same as FACEBOOK_APP_SECRET
INSTAGRAM_BUSINESS_ACCOUNT_ID=      # Instagram Business Account ID

# --- Facebook Marketing API ---
FACEBOOK_ADS_APP_ID=                # Usually same as FACEBOOK_APP_ID
FACEBOOK_ADS_APP_SECRET=            # Usually same as FACEBOOK_APP_SECRET
FACEBOOK_ADS_REDIRECT_URI=          # OAuth callback URL

# --- Frontend Variables (VITE_) ---
VITE_FACEBOOK_APP_ID=               # Same as FACEBOOK_APP_ID (safe for frontend)
VITE_EMBEDDED_SIGNUP_CONFIG_ID=     # Embedded Signup Configuration ID
```

---

## Detailed Variable Reference

### Core App Settings

| Variable | Required | Description |
|----------|----------|-------------|
| `FACEBOOK_APP_ID` | ✅ | Your Meta App ID. Found in App Dashboard → Settings → Basic |
| `FACEBOOK_APP_SECRET` | ✅ | Your Meta App Secret. **Store securely, never in frontend** |
| `META_VERIFY_TOKEN` | ✅ | Custom string for webhook verification. Create your own secure token |

### WhatsApp Business Platform

| Variable | Required | Description |
|----------|----------|-------------|
| `META_WHATSAPP_PHONE_NUMBER_ID` | ✅* | Phone Number ID. Found in WhatsApp → API Setup → Phone Number ID |
| `META_WHATSAPP_WABA_ID` | ⚠️ | WhatsApp Business Account ID. For multi-number management |
| `META_WHATSAPP_ACCESS_TOKEN` | ✅* | Long-lived (60 days) or System User token for API calls |

*Can be stored per-user in database instead of env vars for multi-tenant apps.

### Instagram Graph API

| Variable | Required | Description |
|----------|----------|-------------|
| `INSTAGRAM_APP_ID` | ✅ | App ID for Instagram API (usually same as `FACEBOOK_APP_ID`) |
| `INSTAGRAM_APP_SECRET` | ✅ | App Secret (usually same as `FACEBOOK_APP_SECRET`) |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | ⚠️ | Instagram Business Account ID (can be fetched via API) |

### Facebook Marketing API

| Variable | Required | Description |
|----------|----------|-------------|
| `FACEBOOK_ADS_APP_ID` | ✅ | App ID for Marketing API (usually same as `FACEBOOK_APP_ID`) |
| `FACEBOOK_ADS_APP_SECRET` | ✅ | App Secret (usually same as `FACEBOOK_APP_SECRET`) |
| `FACEBOOK_ADS_REDIRECT_URI` | ✅ | OAuth callback URL, e.g., `https://yourdomain.com/api/facebook/callback` |

### Frontend Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FACEBOOK_APP_ID` | ✅ | App ID for Facebook SDK in frontend (safe to expose) |
| `VITE_EMBEDDED_SIGNUP_CONFIG_ID` | ⚠️ | Embedded Signup Configuration ID for WhatsApp onboarding |

---

## Consolidation Strategy

Since most Meta products use the same app, you can simplify:

```bash
# --- Unified Meta App (Recommended) ---
META_APP_ID=1234567890
META_APP_SECRET=abc123...
META_VERIFY_TOKEN=my_secure_verify_token

# --- OAuth Redirect (adjust per environment) ---
META_REDIRECT_URI=https://yourdomain.com/api/meta/callback

# --- Frontend ---
VITE_META_APP_ID=${META_APP_ID}
VITE_EMBEDDED_SIGNUP_CONFIG_ID=config_123...
```

Then in code:

```typescript
// Unified access
const APP_ID = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID;
const APP_SECRET = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;
```

---

## Validation Checklist

Before deploying, verify:

```bash
# Check all required variables are set
env | grep -E "^(FACEBOOK|INSTAGRAM|META|VITE_)" | sort
```

| Check | Command |
|-------|---------|
| App ID format | Should be numeric: `^[0-9]+$` |
| App Secret format | Should be alphanumeric, 32+ chars |
| Verify Token | Should be non-empty, no special chars |
| Redirect URI | Should be HTTPS, valid URL |
| Phone Number ID | Should be numeric |

---

## Security Guidelines

1. **Never commit secrets to git**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for documentation

2. **Use different secrets per environment**
   - Development: Test app with test users
   - Production: Production app with real credentials

3. **Rotate secrets periodically**
   - App Secret: Every 90 days recommended
   - Access Tokens: Before expiration (60 days)

4. **Use secret managers in production**
   - Railway: Environment Variables
   - AWS: Secrets Manager or Parameter Store
   - Vercel: Environment Variables (encrypted)

---

## Environment-Specific Examples

### Development (.env.local)

```bash
FACEBOOK_APP_ID=123456789012345
FACEBOOK_APP_SECRET=abc123def456ghi789
META_VERIFY_TOKEN=dev_verify_token_12345
META_REDIRECT_URI=http://localhost:3000/api/meta/callback
VITE_FACEBOOK_APP_ID=123456789012345
```

### Production (.env.production)

```bash
FACEBOOK_APP_ID=987654321098765
FACEBOOK_APP_SECRET=xyz789abc123def456
META_VERIFY_TOKEN=prod_verify_token_secure_string
META_REDIRECT_URI=https://app.yourdomain.com/api/meta/callback
VITE_FACEBOOK_APP_ID=987654321098765
```

---

## Troubleshooting

| Issue | Likely Cause |
|-------|--------------|
| "Invalid App ID" | `FACEBOOK_APP_ID` not set or incorrect |
| "App secret is invalid" | `FACEBOOK_APP_SECRET` mismatch |
| "Invalid redirect_uri" | URI not in Meta App's allowed list |
| "Webhook verification failed" | `META_VERIFY_TOKEN` mismatch |
| SDK not loading | `VITE_FACEBOOK_APP_ID` not set in frontend |
