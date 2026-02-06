# PLAN-meta-api-skill: Unified Meta API Integration Skill

> **Goal:** Create a comprehensive skill for configuring and maintaining Meta API connections (WhatsApp Business, Instagram Graph API, Facebook Marketing API) with best practices, OAuth flows, and troubleshooting guides.

---

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | **Embedded Signup** is the recommended onboarding flow for WhatsApp, combining WABA creation, phone registration, and token generation in single flow | 5/5 | Meta Official Docs, Tavily Research | CRITICAL - Simplifies multi-user onboarding |
| 2 | Long-lived tokens last 60 days; Marketing API Standard access tokens don't expire (but can be invalidated) | 5/5 | [Facebook Login Docs](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/) | HIGH - Token lifecycle management |
| 3 | Required OAuth scopes per product: WhatsApp (`whatsapp_business_management`, `whatsapp_business_messaging`), Ads (`ads_read`, `business_management`), Instagram (`instagram_basic`, `instagram_content_publish`, `pages_show_list`) | 5/5 | Meta Developers Documentation | CRITICAL - Permission configuration |
| 4 | Codebase already has: `facebookAdsService.ts` (742 lines), `metaApiRouter.ts` (547 lines), `instagramService.ts`, `instagramPublishService.ts`, `metaWebhook.ts` | 5/5 | Local Codebase Search | HIGH - Existing implementations to reference |
| 5 | Facebook SDK for JavaScript required for Embedded Signup; must configure "Login with JavaScript SDK" and "Allowed Domains" in app settings | 5/5 | Tavily Research | CRITICAL - Frontend SDK setup |
| 6 | Webhooks require challenge verification (`hub.mode=subscribe`, `hub.verify_token`, `hub.challenge`); payloads up to 3MB with 7-day retry policy | 4/5 | [WhatsApp Webhooks Docs](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/) | MEDIUM - Already implemented |
| 7 | Graph API version should be consistent across all services (currently v24.0 in facebookAdsService.ts, needs audit) | 4/5 | Codebase Analysis | MEDIUM - Versioning consistency |
| 8 | Business verification required for production access; development mode allows testing with app admin accounts only | 4/5 | Tavily Research | MEDIUM - Deployment requirements |

### Knowledge Gaps

- **Gap:** Exact error handling patterns for Meta API rate limits (429 responses) vs authentication errors (401/403)
- **Gap:** Best practices for multi-tenant WABA management (one WABA per tenant vs shared WABA)
- **Gap:** Automatic token refresh scheduling mechanism (cron vs on-demand)

### Assumptions to Validate

- **Assumption:** Current Graph API version v24.0 is latest stable for all products
- **Assumption:** Embedded Signup v3 with `featureType: 'whatsapp_business_app_onboarding'` is production-ready
- **Assumption:** Token refresh can be triggered automatically 7 days before expiration

### Edge Cases (5+)

1. **Token Expiration During Request**: Handle 401 mid-request, refresh token, retry
2. **Webhook Signature Validation Failure**: Verify `X-Hub-Signature-256` header before processing
3. **Phone Number Already Linked**: Handle case where WhatsApp number is already used in another WABA
4. **Rate Limit Exceeded**: Implement exponential backoff (1s → 2s → 4s → 8s → 16s max)
5. **Business Verification Rejected**: Surface clear error messages to user for resubmission
6. **WABA Suspension**: Detect suspended status and prevent API calls
7. **Media Upload Timeout**: Instagram content publishing may timeout for large videos (>100MB)

---

## 1. User Review Required

> [!IMPORTANT]
> **Decision Required: Skill Scope**
> 
> This skill will consolidate configuration patterns for:
> - ✅ WhatsApp Business Platform (Cloud API + Embedded Signup)
> - ✅ Instagram Graph API (Content Publishing + Analytics)
> - ✅ Facebook Marketing API (Ads Insights + OAuth)
> 
> Should the skill also include:
> - ❓ Messenger Platform API
> - ❓ Facebook Pages API
> - ❓ Pixel/CAPI integration patterns

> [!WARNING]
> **Environment Variables Audit Needed**
> 
> The skill will document required env vars. Current codebase uses:
> - `FACEBOOK_ADS_APP_ID`, `FACEBOOK_ADS_APP_SECRET`, `FACEBOOK_ADS_REDIRECT_URI`
> - `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` (from `instagramService.ts`)
> - `META_VERIFY_TOKEN`, `META_APP_SECRET` (for webhooks)
> 
> Should we consolidate to single Meta App configuration or keep separate apps per product?

---

## 2. Proposed Changes

### Phase 1: Skill Structure Creation ⚡ PARALLEL-SAFE

#### [NEW] `.agent/skills/meta-api-integration/SKILL.md`
- **Action:** Create main skill file with YAML frontmatter and comprehensive instructions
- **Details:** Cover OAuth flows, token lifecycle, Embedded Signup, webhook setup, troubleshooting

#### [NEW] `.agent/skills/meta-api-integration/references/oauth-flows.md`
- **Action:** Document detailed OAuth 2.0 flows for each Meta product
- **Details:** Include code examples, scope requirements, token exchange patterns

#### [NEW] `.agent/skills/meta-api-integration/references/webhook-setup.md`
- **Action:** Document webhook configuration and payload handling
- **Details:** Challenge verification, signature validation, retry handling

#### [NEW] `.agent/skills/meta-api-integration/references/troubleshooting.md`
- **Action:** Common errors and solutions reference
- **Details:** Error codes, rate limits, permission issues

---

### Phase 2: Reference Documentation

#### [NEW] `.agent/skills/meta-api-integration/references/env-vars-template.md`
- **Action:** Create environment variable template with all required Meta API config
- **Details:** Annotated .env template with descriptions and examples

#### [NEW] `.agent/skills/meta-api-integration/references/embedded-signup-flow.md`
- **Action:** Step-by-step Embedded Signup implementation guide
- **Details:** Facebook SDK setup, config_id, callback handling, token exchange

#### [NEW] `.agent/skills/meta-api-integration/references/rate-limits.md`
- **Action:** Document rate limits and throttling strategies per API
- **Details:** Limits per endpoint, backoff strategies, monitoring

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Each task has subtasks with validation. No single-line tasks allowed.

### AT-001: Initialize Skill Structure ⚡ PARALLEL-SAFE
**Goal:** Create the skill folder structure using skill-creator init script
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Run `python3 .agent/skills/skill-creator/scripts/init_skill.py meta-api-integration --path .agent/skills`
  - **File:** `.agent/skills/meta-api-integration/`
  - **Validation:** Directory exists with SKILL.md, scripts/, references/, assets/
- [ ] ST-001.2: Delete example files not needed (example.py, example.md, example.png)
  - **File:** `.agent/skills/meta-api-integration/`
  - **Validation:** Only required files remain

**Rollback:** `rm -rf .agent/skills/meta-api-integration`

---

### AT-002: Write Main SKILL.md
**Goal:** Create comprehensive skill instructions for Meta API configuration
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Write YAML frontmatter with name and description
  - **File:** `.agent/skills/meta-api-integration/SKILL.md`
  - **Validation:** `grep -q "^name: meta-api-integration" .agent/skills/meta-api-integration/SKILL.md`
- [ ] ST-002.2: Write skill overview section explaining when/how to use
  - **File:** `.agent/skills/meta-api-integration/SKILL.md`
  - **Validation:** Section "## When to Use" exists
- [ ] ST-002.3: Write quick start checklist for each API product
  - **File:** `.agent/skills/meta-api-integration/SKILL.md`
  - **Validation:** Sections for WhatsApp, Instagram, Facebook Ads exist
- [ ] ST-002.4: Reference all files in references/ folder with grep patterns for large docs
  - **File:** `.agent/skills/meta-api-integration/SKILL.md`
  - **Validation:** All reference files mentioned

**Rollback:** Restore from git: `git checkout -- .agent/skills/meta-api-integration/SKILL.md`

---

### AT-003: Create OAuth Flows Reference
**Goal:** Document OAuth 2.0 patterns for all Meta products with code examples
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-003.1: Document Facebook Login OAuth flow (short-lived → long-lived token)
  - **File:** `.agent/skills/meta-api-integration/references/oauth-flows.md`
  - **Validation:** Code example for token exchange exists
- [ ] ST-003.2: Document scope requirements table per product
  - **File:** `.agent/skills/meta-api-integration/references/oauth-flows.md`
  - **Validation:** Table with WhatsApp, Instagram, Ads scopes exists
- [ ] ST-003.3: Document token refresh patterns and scheduling recommendations
  - **File:** `.agent/skills/meta-api-integration/references/oauth-flows.md`
  - **Validation:** Section on token lifecycle management exists

**Rollback:** Delete file: `rm .agent/skills/meta-api-integration/references/oauth-flows.md`

---

### AT-004: Create Embedded Signup Reference
**Goal:** Step-by-step guide for implementing WhatsApp Embedded Signup
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-004.1: Document Facebook SDK for JavaScript setup (including CDN load)
  - **File:** `.agent/skills/meta-api-integration/references/embedded-signup-flow.md`
  - **Validation:** Script tag example exists
- [ ] ST-004.2: Document FB.login() configuration with config_id
  - **File:** `.agent/skills/meta-api-integration/references/embedded-signup-flow.md`
  - **Validation:** `FB.login` code example exists
- [ ] ST-004.3: Document callback handling and token exchange on backend
  - **File:** `.agent/skills/meta-api-integration/references/embedded-signup-flow.md`
  - **Validation:** Backend API endpoint pattern documented
- [ ] ST-004.4: Add Meta Business Manager configuration steps (Allowed Domains, OAuth settings)
  - **File:** `.agent/skills/meta-api-integration/references/embedded-signup-flow.md`
  - **Validation:** Checklist for app configuration exists

**Rollback:** Delete file: `rm .agent/skills/meta-api-integration/references/embedded-signup-flow.md`

---

### AT-005: Create Webhook Setup Reference
**Goal:** Document webhook configuration for WhatsApp and Instagram
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-005.1: Document challenge verification flow (GET endpoint)
  - **File:** `.agent/skills/meta-api-integration/references/webhook-setup.md`
  - **Validation:** Code example for challenge handling exists
- [ ] ST-005.2: Document signature validation with `X-Hub-Signature-256`
  - **File:** `.agent/skills/meta-api-integration/references/webhook-setup.md`
  - **Validation:** HMAC-SHA256 validation code exists
- [ ] ST-005.3: Document payload structure for messages and status webhooks
  - **File:** `.agent/skills/meta-api-integration/references/webhook-setup.md`
  - **Validation:** JSON payload examples for WhatsApp and Instagram
- [ ] ST-005.4: Document retry policy and error handling recommendations
  - **File:** `.agent/skills/meta-api-integration/references/webhook-setup.md`
  - **Validation:** Section on 200 OK responses and retry logic

**Rollback:** Delete file: `rm .agent/skills/meta-api-integration/references/webhook-setup.md`

---

### AT-006: Create Environment Variables Template
**Goal:** Comprehensive .env template with all Meta API configuration
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-006.1: Document WhatsApp Cloud API variables
  - **File:** `.agent/skills/meta-api-integration/references/env-vars-template.md`
  - **Validation:** `META_WHATSAPP_*` variables documented
- [ ] ST-006.2: Document Instagram Graph API variables
  - **File:** `.agent/skills/meta-api-integration/references/env-vars-template.md`
  - **Validation:** `INSTAGRAM_*` variables documented
- [ ] ST-006.3: Document Facebook Marketing API variables
  - **File:** `.agent/skills/meta-api-integration/references/env-vars-template.md`
  - **Validation:** `FACEBOOK_ADS_*` variables documented
- [ ] ST-006.4: Add validation checklist for each variable
  - **File:** `.agent/skills/meta-api-integration/references/env-vars-template.md`
  - **Validation:** Each variable has "Required" or "Optional" annotation

**Rollback:** Delete file: `rm .agent/skills/meta-api-integration/references/env-vars-template.md`

---

### AT-007: Create Troubleshooting Reference
**Goal:** Common errors, solutions, and debugging patterns
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-007.1: Document common OAuth errors (invalid_client, invalid_scope, expired_token)
  - **File:** `.agent/skills/meta-api-integration/references/troubleshooting.md`
  - **Validation:** Error code table with solutions exists
- [ ] ST-007.2: Document rate limit errors and backoff strategies
  - **File:** `.agent/skills/meta-api-integration/references/troubleshooting.md`
  - **Validation:** Rate limit section with retry logic
- [ ] ST-007.3: Document webhook verification failures
  - **File:** `.agent/skills/meta-api-integration/references/troubleshooting.md`
  - **Validation:** Section on common webhook issues
- [ ] ST-007.4: Add debugging tools section (Graph API Explorer, Access Token Debugger)
  - **File:** `.agent/skills/meta-api-integration/references/troubleshooting.md`
  - **Validation:** Links to Meta debugging tools

**Rollback:** Delete file: `rm .agent/skills/meta-api-integration/references/troubleshooting.md`

---

### AT-008: Package and Validate Skill
**Goal:** Validate skill structure and optionally package for distribution
**Dependencies:** AT-002, AT-003, AT-004, AT-005, AT-006, AT-007

#### Subtasks:
- [ ] ST-008.1: Run quick validation script
  - **Command:** `python3 .agent/skills/skill-creator/scripts/quick_validate.py .agent/skills/meta-api-integration`
  - **Validation:** Script exits with code 0
- [ ] ST-008.2: Verify SKILL.md references all created reference files
  - **File:** `.agent/skills/meta-api-integration/SKILL.md`
  - **Validation:** All 5 reference files mentioned
- [ ] ST-008.3: Test skill activation trigger (read SKILL.md manually)
  - **File:** `.agent/skills/meta-api-integration/SKILL.md`
  - **Validation:** Instructions are clear and actionable

**Rollback:** Fix validation errors and re-run

---

## 4. Verification Plan

### Automated Tests

```bash
# Validate skill structure
python3 .agent/skills/skill-creator/scripts/quick_validate.py .agent/skills/meta-api-integration

# Check all expected files exist
ls -la .agent/skills/meta-api-integration/
ls -la .agent/skills/meta-api-integration/references/

# Verify YAML frontmatter
head -10 .agent/skills/meta-api-integration/SKILL.md
```

### Manual Verification

1. **Read SKILL.md**: Verify instructions are clear and complete
2. **Check cross-references**: Ensure all reference files are mentioned in SKILL.md
3. **Validate code examples**: Ensure OAuth and webhook examples are syntactically correct
4. **Test skill trigger**: Ask AI agent "How do I configure WhatsApp Business API?" and verify skill activates

---

## 5. Rollback Plan

```bash
# Remove the entire skill if needed
rm -rf .agent/skills/meta-api-integration

# Or restore from git if already committed
git checkout -- .agent/skills/meta-api-integration/
```

---

## Summary

| Deliverable | Location | Status |
|-------------|----------|--------|
| Research Digest | This document | ✅ Complete |
| Findings Table | Section 0 | ✅ Complete |
| Knowledge Gaps | Section 0 | ✅ Complete |
| Edge Cases | Section 0 (7 items) | ✅ Complete |
| Atomic Tasks | 8 tasks, 25 subtasks | ✅ Complete |
| Parallel-safe marked | AT-001, AT-003-AT-007 | ✅ Complete |
| **Plan File** | `docs/PLAN-meta-api-skill.md` | ✅ Complete |
