# PLAN-whatsapp-zapi: WhatsApp Integration via Z-API

> **Goal:** Enable mentorados to connect their individual WhatsApp accounts, chat with leads inside the CRM, and configure an AI agent as SDR for automated lead qualification.

---

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Z-API is a RESTful service that provides WhatsApp Web session via API. Each connection requires one "Instance" with unique ID + Token | 5/5 | [Z-API Docs](https://developer.z-api.io) | Core architecture |
| 2 | QR code authentication via `GET /qr-code/image` returns base64 image. QR expires every 20 seconds | 5/5 | [Z-API QR Code](https://developer.z-api.io/en/instance/qrcode) | Connection UX |
| 3 | Messages sent via `POST /send-message-text` to `https://api.z-api.io/instances/{id}/token/{token}/send-message-text` | 5/5 | [Z-API Send Text](https://developer.z-api.io/message/send-message-text) | Messaging API |
| 4 | Webhooks: `on-message-received`, `delivery`, `message-status`, `disconnected` - All use POST to configured URL | 5/5 | Z-API Docs | Real-time events |
| 5 | Cost: R$99.99/month per instance (or R$54.99-89.99 for partners with volume) | 5/5 | [Z-API Pricing](https://www.z-api.io) | Cost per mentorado |
| 6 | Z-API uses `Client-Token` header for webhook authentication | 4/5 | Z-API Docs | Security |
| 7 | Current schema has `leads` table with `telefone` field and `interacoes` with `tipo: whatsapp` enum | 5/5 | `drizzle/schema.ts` | Extend existing |
| 8 | AI SDR agents with WhatsApp achieve 5x lead generation and 45-60% higher conversion | 4/5 | Industry research | Business value |
| 9 | Gemini LLM already integrated via `openclawRouter.ts` - can reuse for AI SDR responses | 5/5 | `server/openclawRouter.ts` | Code reuse |
| 10 | Best practice: 2-5 second delay before AI response to appear natural | 4/5 | AI SDR patterns | UX quality |

### Knowledge Gaps & Assumptions

- **Gap:** Z-API webhook exact payload structure for each event type
  - *Action:* Test with real instance or mock during implementation
  
- **Gap:** Z-API rate limits (if any) for message sending
  - *Action:* Implement queue with conservative delays, monitor in production

- **Assumption:** Each mentorado will subscribe to their own Z-API instance
  - *Rationale:* Multi-tenant model, each mentorado owns their WhatsApp number

- **Assumption:** Mentorados must acquire Z-API subscription separately
  - *Rationale:* R$99.99/month cost should be borne by each mentorado

### Edge Cases (10 Identified)

1. **Unknown phone contact** → Store message with phone only, link to lead later
2. **WhatsApp disconnection** → Update status, notify mentorado, show QR code
3. **Duplicate messages** → Dedupe by Z-API message ID
4. **AI response spam prevention** → Rate limit responses, respect working hours
5. **Token security** → Encrypt at rest, never expose to frontend
6. **Conversation context overflow** → Keep last N messages, summarize older
7. **Lead qualification handoff** → Mark as "quente", notify human
8. **Multiple leads with same phone** → Use first match or most recent
9. **Media messages (images, audio)** → Phase 2 enhancement, text-only initially
10. **LGPD compliance** → Message retention policy, encryption, delete capability

---

## 1. User Review Required

> [!IMPORTANT]
> **Cost Model:** Each mentorado must subscribe to Z-API separately (R$99.99/month).
> This plan assumes the CRM provides the integration, not the subscription.

> [!WARNING]
> **Multi-tenant Security:** All Z-API tokens will be stored encrypted.
> Webhook endpoint routes messages to correct mentorado by instance ID lookup.

> [!CAUTION]
> **WhatsApp Policy Compliance:** Mentorados must follow WhatsApp Terms of Service.
> AI agent should have clear opt-out mechanism and respect working hours.

**Questions for User:**
1. Should we auto-create a lead when receiving a message from an unknown phone?
2. What message retention period is required for LGPD compliance? (30/60/90 days?)
3. Should the AI agent be enabled by default or opt-in for each mentorado?

---

## 2. Proposed Changes

### Phase 1: Database Schema Extension

#### [MODIFY] [schema.ts](file:///home/mauricio/neondash/drizzle/schema.ts)
- **Action:** Add Z-API connection fields to `mentorados` table
- **Fields:** `zapiInstanceId`, `zapiToken`, `zapiConnected`, `zapiConnectedAt`, `zapiPhone`

#### [NEW] [0002_whatsapp_messages.sql](file:///home/mauricio/neondash/drizzle/0002_whatsapp_messages.sql)
- **Action:** Create `whatsapp_messages` table for message history
- **Fields:** `id`, `mentoradoId`, `leadId`, `phone`, `direction`, `content`, `messageId`, `status`, `isFromAi`, `createdAt`

#### [NEW] [0003_ai_agent_config.sql](file:///home/mauricio/neondash/drizzle/0003_ai_agent_config.sql)
- **Action:** Create `ai_agent_config` table for SDR configuration
- **Fields:** `id`, `mentoradoId`, `enabled`, `systemPrompt`, `greetingMessage`, `qualificationQuestions`, `workingHours`

---

### Phase 2: Backend Services

#### [NEW] [zapiService.ts](file:///home/mauricio/neondash/server/services/zapiService.ts)
- **Action:** Create Z-API client service
- **Methods:** `getQRCode()`, `sendTextMessage()`, `checkConnection()`, `disconnect()`

#### [NEW] [zapiWebhook.ts](file:///home/mauricio/neondash/server/webhooks/zapiWebhook.ts)
- **Action:** Create webhook handler for Z-API events
- **Handlers:** `onMessageReceived`, `onMessageStatus`, `onDisconnected`

#### [NEW] [aiSdrService.ts](file:///home/mauricio/neondash/server/services/aiSdrService.ts)
- **Action:** Create AI SDR service for automated responses
- **Methods:** `processIncomingMessage()`, `generateResponse()`, `qualifyLead()`

---

### Phase 3: tRPC Routers

#### [NEW] [zapiRouter.ts](file:///home/mauricio/neondash/server/zapiRouter.ts)
- **Action:** Create tRPC router for Z-API operations
- **Procedures:** `getQRCode`, `connect`, `disconnect`, `getStatus`, `sendMessage`, `getMessages`

#### [NEW] [aiAgentRouter.ts](file:///home/mauricio/neondash/server/aiAgentRouter.ts)
- **Action:** Create tRPC router for AI agent configuration
- **Procedures:** `getConfig`, `updateConfig`, `toggleAgent`, `getConversationHistory`

#### [MODIFY] [routers.ts](file:///home/mauricio/neondash/server/routers.ts)
- **Action:** Register new routers
- **Changes:** Add `zapiRouter`, `aiAgentRouter` to main router

---

### Phase 4: Frontend Components

#### [NEW] [WhatsAppConnectionCard.tsx](file:///home/mauricio/neondash/client/src/components/whatsapp/WhatsAppConnectionCard.tsx)
- **Action:** Create connection card with QR code display and status indicator

#### [NEW] [LeadChatWindow.tsx](file:///home/mauricio/neondash/client/src/components/chat/LeadChatWindow.tsx)
- **Action:** Create chat interface for lead conversations

#### [NEW] [ChatMessageBubble.tsx](file:///home/mauricio/neondash/client/src/components/chat/ChatMessageBubble.tsx)
- **Action:** Create message bubble component with direction styling

#### [NEW] [AIAgentSettingsCard.tsx](file:///home/mauricio/neondash/client/src/components/whatsapp/AIAgentSettingsCard.tsx)
- **Action:** Create AI SDR configuration interface

#### [MODIFY] [LeadDetailModal.tsx](file:///home/mauricio/neondash/client/src/components/crm/LeadDetailModal.tsx)
- **Action:** Add chat tab to lead detail modal

#### [MODIFY] [Settings page](file:///home/mauricio/neondash/client/src/pages/Settings.tsx)
- **Action:** Add WhatsApp settings section with connection card

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Each task MUST have subtasks. No single-line tasks allowed.

### AT-001: Extend Mentorados Schema with Z-API Fields ⚡
**Goal:** Add Z-API connection tracking fields to mentorados table
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Add new columns to `mentorados` table in `schema.ts`
  - **File:** `drizzle/schema.ts`
  - **Fields:** `zapiInstanceId`, `zapiToken`, `zapiConnected`, `zapiConnectedAt`, `zapiPhone`
  - **Validation:** TypeScript compiles without errors
- [ ] ST-001.2: Generate and apply migration
  - **Command:** `bun run db:push`
  - **Validation:** Migration runs successfully, columns visible in DB

**Rollback:** `ALTER TABLE mentorados DROP COLUMN zapiInstanceId, zapiToken, zapiConnected, zapiConnectedAt, zapiPhone;`

---

### AT-002: Create WhatsApp Messages Table ⚡
**Goal:** Create table for storing WhatsApp message history
**Dependencies:** None

#### Subtasks:
- [ ] ST-002.1: Define `whatsappMessages` table in `schema.ts`
  - **File:** `drizzle/schema.ts`
  - **Fields:** See Phase 1 specification
  - **Validation:** TypeScript compiles
- [ ] ST-002.2: Create `messageDirectionEnum` and `messageStatusEnum`
  - **File:** `drizzle/schema.ts`
  - **Validation:** Enums defined
- [ ] ST-002.3: Add relations to leads table
  - **File:** `drizzle/relations.ts`
  - **Validation:** Relations compile
- [ ] ST-002.4: Generate and apply migration
  - **Command:** `bun run db:push`
  - **Validation:** Table created in DB

**Rollback:** `DROP TABLE whatsapp_messages;`

---

### AT-003: Create AI Agent Config Table
**Goal:** Create table for AI SDR configuration per mentorado
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-003.1: Define `aiAgentConfig` table in `schema.ts`
  - **File:** `drizzle/schema.ts`
  - **Fields:** See Phase 1 specification
  - **Validation:** TypeScript compiles
- [ ] ST-003.2: Add unique constraint on `mentoradoId`
  - **Validation:** Index created
- [ ] ST-003.3: Generate and apply migration
  - **Command:** `bun run db:push`
  - **Validation:** Table created in DB

**Rollback:** `DROP TABLE ai_agent_config;`

---

### AT-004: Create Z-API Client Service
**Goal:** Implement service layer for Z-API HTTP calls
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-004.1: Create `zapiService.ts` with base configuration
  - **File:** `server/services/zapiService.ts`
  - **Content:** Base URL, HTTP client setup with axios/fetch
  - **Validation:** File compiles
- [ ] ST-004.2: Implement `getQRCode()` method
  - **Method:** GET `/qr-code/image`
  - **Returns:** Base64 image
  - **Validation:** Manual test with real Z-API instance
- [ ] ST-004.3: Implement `sendTextMessage()` method
  - **Method:** POST `/send-message-text`
  - **Validation:** Manual test
- [ ] ST-004.4: Implement `checkConnection()` method
  - **Method:** GET `/status`
  - **Validation:** Returns connection status
- [ ] ST-004.5: Implement `disconnect()` method
  - **Method:** DELETE `/disconnect`
  - **Validation:** Disconnects instance

**Rollback:** Delete `server/services/zapiService.ts`

---

### AT-005: Create Z-API Webhook Handler
**Goal:** Implement webhook endpoint for Z-API events
**Dependencies:** AT-002, AT-004

#### Subtasks:
- [ ] ST-005.1: Create `zapiWebhook.ts` with Express handler
  - **File:** `server/webhooks/zapiWebhook.ts`
  - **Validation:** File compiles
- [ ] ST-005.2: Implement `onMessageReceived` handler
  - **Action:** Parse payload, find mentorado by instance ID, store message
  - **Validation:** Message stored in DB
- [ ] ST-005.3: Implement `onMessageStatus` handler
  - **Action:** Update message status (delivered/read)
  - **Validation:** Status updated in DB
- [ ] ST-005.4: Implement `onDisconnected` handler
  - **Action:** Update mentorado `zapiConnected` to false
  - **Validation:** Connection status updated
- [ ] ST-005.5: Register webhook route in Express app
  - **File:** `server/_core/index.ts`
  - **Route:** `POST /webhooks/zapi`
  - **Validation:** Route responds to requests

**Rollback:** Remove webhook route, delete `server/webhooks/zapiWebhook.ts`

---

### AT-006: Create Z-API tRPC Router
**Goal:** Implement tRPC router for Z-API operations
**Dependencies:** AT-004

#### Subtasks:
- [ ] ST-006.1: Create `zapiRouter.ts` with basic structure
  - **File:** `server/zapiRouter.ts`
  - **Validation:** File compiles
- [ ] ST-006.2: Implement `getQRCode` procedure
  - **Type:** Query
  - **Access:** `mentoradoProcedure`
  - **Validation:** Returns base64 QR code
- [ ] ST-006.3: Implement `connect` procedure
  - **Type:** Mutation
  - **Input:** `{ instanceId, token }`
  - **Action:** Save credentials, verify connection
  - **Validation:** Credentials stored
- [ ] ST-006.4: Implement `disconnect` procedure
  - **Type:** Mutation
  - **Action:** Clear credentials, call Z-API disconnect
  - **Validation:** Connection cleared
- [ ] ST-006.5: Implement `sendMessage` procedure
  - **Type:** Mutation
  - **Input:** `{ leadId, message }`
  - **Validation:** Message sent and stored
- [ ] ST-006.6: Implement `getMessages` procedure
  - **Type:** Query
  - **Input:** `{ leadId }`
  - **Returns:** Message history
  - **Validation:** Returns messages
- [ ] ST-006.7: Register router in `routers.ts`
  - **File:** `server/routers.ts`
  - **Validation:** Router accessible via tRPC

**Rollback:** Remove from `routers.ts`, delete `server/zapiRouter.ts`

---

### AT-007: Create AI SDR Service
**Goal:** Implement AI agent service for automated responses
**Dependencies:** AT-002, AT-003

#### Subtasks:
- [ ] ST-007.1: Create `aiSdrService.ts` with base structure
  - **File:** `server/services/aiSdrService.ts`
  - **Validation:** File compiles
- [ ] ST-007.2: Implement `processIncomingMessage()` method
  - **Logic:** Check if AI enabled, check working hours, route to AI or pass-through
  - **Validation:** Correct routing
- [ ] ST-007.3: Implement `generateResponse()` method using Gemini
  - **Reuse:** Pattern from `openclawRouter.ts`
  - **Context:** Lead info + conversation history + system prompt
  - **Validation:** Returns AI response
- [ ] ST-007.4: Implement `qualifyLead()` method
  - **Logic:** Extract qualification data from conversation
  - **Action:** Update lead temperature, add tags
  - **Validation:** Lead updated
- [ ] ST-007.5: Add response delay mechanism
  - **Config:** 2-5 second configurable delay
  - **Validation:** Delayed response

**Rollback:** Delete `server/services/aiSdrService.ts`

---

### AT-008: Create AI Agent tRPC Router
**Goal:** Implement tRPC router for AI agent configuration
**Dependencies:** AT-003, AT-007

#### Subtasks:
- [ ] ST-008.1: Create `aiAgentRouter.ts` with basic structure
  - **File:** `server/aiAgentRouter.ts`
  - **Validation:** File compiles
- [ ] ST-008.2: Implement `getConfig` procedure
  - **Type:** Query
  - **Returns:** AI agent configuration
  - **Validation:** Returns config
- [ ] ST-008.3: Implement `updateConfig` procedure
  - **Type:** Mutation
  - **Input:** Config fields
  - **Validation:** Config updated
- [ ] ST-008.4: Implement `toggleAgent` procedure
  - **Type:** Mutation
  - **Input:** `{ enabled: boolean }`
  - **Validation:** Agent enabled/disabled
- [ ] ST-008.5: Register router in `routers.ts`
  - **File:** `server/routers.ts`
  - **Validation:** Router accessible

**Rollback:** Remove from `routers.ts`, delete `server/aiAgentRouter.ts`

---

### AT-009: Create WhatsApp Connection Card Component
**Goal:** Create frontend component for WhatsApp connection with QR code
**Dependencies:** AT-006

#### Subtasks:
- [ ] ST-009.1: Create component file with basic structure
  - **File:** `client/src/components/whatsapp/WhatsAppConnectionCard.tsx`
  - **Validation:** Component renders
- [ ] ST-009.2: Implement QR code display with auto-refresh
  - **Interval:** 15 seconds (before 20s expiry)
  - **Validation:** QR updates
- [ ] ST-009.3: Add connection status indicator
  - **States:** Disconnected (red), Connecting (yellow), Connected (green)
  - **Validation:** Correct status shown
- [ ] ST-009.4: Implement credential input form
  - **Fields:** Instance ID, Token
  - **Validation:** Form submits
- [ ] ST-009.5: Add disconnect button with confirmation
  - **Validation:** Disconnects on confirm

**Rollback:** Delete component file

---

### AT-010: Create Chat Message Bubble Component
**Goal:** Create reusable message bubble for chat interface
**Dependencies:** None

#### Subtasks:
- [ ] ST-010.1: Create component file
  - **File:** `client/src/components/chat/ChatMessageBubble.tsx`
  - **Validation:** Component renders
- [ ] ST-010.2: Style inbound messages (left-aligned, gray)
  - **Validation:** Correct styling
- [ ] ST-010.3: Style outbound messages (right-aligned, primary color)
  - **Validation:** Correct styling
- [ ] ST-010.4: Add AI badge for AI-sent messages
  - **Icon:** Sparkles or Robot
  - **Validation:** Badge shown
- [ ] ST-010.5: Add timestamp and status indicator
  - **Icons:** Check (sent), DoubleCheck (delivered), BlueDblCheck (read)
  - **Validation:** Status shown

**Rollback:** Delete component file

---

### AT-011: Create Lead Chat Window Component
**Goal:** Create chat interface for lead conversations
**Dependencies:** AT-006, AT-010

#### Subtasks:
- [ ] ST-011.1: Create component file with basic structure
  - **File:** `client/src/components/chat/LeadChatWindow.tsx`
  - **Validation:** Component renders
- [ ] ST-011.2: Implement message list with scroll
  - **Behavior:** Auto-scroll to bottom on new message
  - **Validation:** Scrolls correctly
- [ ] ST-011.3: Create chat input with send button
  - **Features:** Enter to send, multiline support
  - **Validation:** Sends message
- [ ] ST-011.4: Add real-time update polling
  - **Interval:** 5 seconds
  - **Validation:** New messages appear
- [ ] ST-011.5: Handle "not connected" state
  - **UI:** Show message and link to settings
  - **Validation:** Prompts connection

**Rollback:** Delete component file

---

### AT-012: Create AI Agent Settings Card Component
**Goal:** Create frontend component for AI SDR configuration
**Dependencies:** AT-008

#### Subtasks:
- [ ] ST-012.1: Create component file
  - **File:** `client/src/components/whatsapp/AIAgentSettingsCard.tsx`
  - **Validation:** Component renders
- [ ] ST-012.2: Add enable/disable toggle with confirmation
  - **Validation:** Toggle works
- [ ] ST-012.3: Create system prompt editor (textarea)
  - **Default:** Pre-built SDR prompt
  - **Validation:** Saves prompt
- [ ] ST-012.4: Create greeting message editor
  - **Validation:** Saves greeting
- [ ] ST-012.5: Create working hours selector
  - **UI:** Day checkboxes + start/end time
  - **Validation:** Saves hours

**Rollback:** Delete component file

---

### AT-013: Integrate Chat Tab in Lead Detail Modal
**Goal:** Add WhatsApp chat capability to lead detail view
**Dependencies:** AT-011

#### Subtasks:
- [ ] ST-013.1: Add "Chat" tab to LeadDetailModal tabs
  - **File:** `client/src/components/crm/LeadDetailModal.tsx`
  - **Validation:** Tab appears
- [ ] ST-013.2: Mount LeadChatWindow in chat tab
  - **Props:** `leadId`
  - **Validation:** Chat window shows
- [ ] ST-013.3: Show "No WhatsApp" state if lead has no phone
  - **Validation:** Appropriate message shown

**Rollback:** Remove tab from modal

---

### AT-014: Add WhatsApp Settings Section to Settings Page ⚡
**Goal:** Create settings section for WhatsApp integration
**Dependencies:** AT-009, AT-012

#### Subtasks:
- [ ] ST-014.1: Create WhatsApp settings section in Settings page
  - **File:** `client/src/pages/Settings.tsx`
  - **Validation:** Section renders
- [ ] ST-014.2: Mount WhatsAppConnectionCard
  - **Validation:** QR code displays
- [ ] ST-014.3: Mount AIAgentSettingsCard
  - **Validation:** AI config editable
- [ ] ST-014.4: Add "Conectar WhatsApp" link in sidebar
  - **Validation:** Navigation works

**Rollback:** Remove settings section

---

### AT-015: Add Environment Variables for Security
**Goal:** Configure encryption key and webhook URL in environment
**Dependencies:** None

#### Subtasks:
- [ ] ST-015.1: Add `ZAPI_WEBHOOK_URL` to `.env.example`
  - **Purpose:** Public URL for Z-API webhooks
  - **Validation:** Variable documented
- [ ] ST-015.2: Add `ENCRYPTION_KEY` to `.env.example`
  - **Purpose:** AES key for encrypting Z-API tokens
  - **Validation:** Variable documented
- [ ] ST-015.3: Update `server/_core/index.ts` to load env vars
  - **Validation:** Variables accessible

**Rollback:** Remove env vars

---

### AT-016: Create Token Encryption Utility
**Goal:** Encrypt/decrypt Z-API tokens for secure storage
**Dependencies:** AT-015

#### Subtasks:
- [ ] ST-016.1: Create `encryption.ts` utility
  - **File:** `server/utils/encryption.ts`
  - **Methods:** `encrypt(text)`, `decrypt(ciphertext)`
  - **Validation:** Round-trip works
- [ ] ST-016.2: Use AES-256-GCM encryption
  - **Validation:** Secure algorithm
- [ ] ST-016.3: Add unit tests for encryption
  - **File:** `server/utils/encryption.test.ts`
  - **Validation:** Tests pass

**Rollback:** Delete utility and tests

---

### AT-017: Implement Phone Number Matching for Leads
**Goal:** Match incoming messages to existing leads by phone number
**Dependencies:** AT-005

#### Subtasks:
- [ ] ST-017.1: Create `findLeadByPhone()` function
  - **File:** `server/services/zapiService.ts`
  - **Logic:** Normalize phone, search leads table
  - **Validation:** Finds lead
- [ ] ST-017.2: Handle multiple leads with same phone
  - **Strategy:** Return most recently active lead
  - **Validation:** Correct lead returned
- [ ] ST-017.3: Handle unknown phone (no lead match)
  - **Strategy:** Store message with phone only, `leadId = null`
  - **Validation:** Message stored correctly

**Rollback:** Remove function

---

### AT-018: Create Quick Reply UI in CRM Kanban
**Goal:** Add quick chat action from lead card in Kanban view
**Dependencies:** AT-011

#### Subtasks:
- [ ] ST-018.1: Add "Chat" icon button to LeadCard
  - **File:** `client/src/components/crm/LeadCard.tsx`
  - **Icon:** MessageCircle
  - **Validation:** Button visible
- [ ] ST-018.2: Open chat modal/drawer on click
  - **Behavior:** Opens LeadChatWindow in drawer
  - **Validation:** Chat opens
- [ ] ST-018.3: Show unread message count badge
  - **Logic:** Count messages with `status != 'read'` where direction = 'inbound'
  - **Validation:** Badge shows count

**Rollback:** Remove button and drawer

---

## 4. Verification Plan

### Automated Tests

```bash
# TypeScript type checking
bun run check

# Linting and formatting
bun run lint

# Unit tests (including encryption tests)
bun test

# Database migration check
bun run db:push --dry-run
```

### Manual Verification

#### Phase 1: Connection Flow
1. Navigate to Settings > WhatsApp
2. Enter Z-API Instance ID and Token
3. Verify QR code displays
4. Scan QR code with WhatsApp mobile
5. Verify status changes to "Connected" (green)
6. Verify phone number shows on connection card

#### Phase 2: Messaging Flow
1. Send test message from WhatsApp to the connected number
2. Verify message appears in Lead Chat Window (if lead exists)
3. Send reply message from CRM
4. Verify message shows "sent" status
5. When recipient reads, verify "read" status

#### Phase 3: AI Agent Flow
1. Enable AI agent in Settings > WhatsApp > AI Agent
2. Configure system prompt and greeting
3. Send new message from unknown number
4. Verify AI responds within configured delay
5. Verify response is contextually appropriate
6. Verify lead qualification data captured

### Browser Testing (using `agent-browser`)
```bash
# Verify WhatsApp settings page renders
agent-browser open http://localhost:3000/configuracoes
agent-browser snapshot -i --json

# Verify QR code component exists
agent-browser get text "[data-testid=qr-code-image]"
```

---

## 5. Rollback Plan

### Database Rollback
```sql
-- Rollback AT-001
ALTER TABLE mentorados 
DROP COLUMN IF EXISTS zapi_instance_id,
DROP COLUMN IF EXISTS zapi_token,
DROP COLUMN IF EXISTS zapi_connected,
DROP COLUMN IF EXISTS zapi_connected_at,
DROP COLUMN IF EXISTS zapi_phone;

-- Rollback AT-002
DROP TABLE IF EXISTS whatsapp_messages;

-- Rollback AT-003
DROP TABLE IF EXISTS ai_agent_config;
```

### Code Rollback
```bash
# Revert to previous commit
git revert HEAD~N  # where N = number of commits to revert

# Or restore specific files
git checkout HEAD~1 -- server/zapiRouter.ts
git checkout HEAD~1 -- server/services/zapiService.ts
```

### Feature Flag (Recommended)
```typescript
// In environment.ts
export const FEATURES = {
  WHATSAPP_INTEGRATION: process.env.WHATSAPP_ENABLED === 'true',
};

// Usage in router
if (!FEATURES.WHATSAPP_INTEGRATION) {
  throw new TRPCError({ code: 'NOT_FOUND' });
}
```

---

## 6. Cost & Timeline Summary

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1: Database | 2-3 days | AT-001, AT-002, AT-003, AT-015, AT-016 |
| Phase 2: Backend Services | 3-4 days | AT-004, AT-005, AT-006, AT-017 |
| Phase 3: AI Agent | 2-3 days | AT-007, AT-008 |
| Phase 4: Frontend | 4-5 days | AT-009 to AT-014, AT-018 |

**Total Estimated Duration:** 2-3 weeks

**Cost per Mentorado:**
- Z-API subscription: R$99.99/month (paid by mentorado)
- Gemini API: Usage-based (existing integration)

---

## Pre-Submission Checklist

- [x] Created implementation plan file
- [x] File follows template structure
- [x] Research findings table with 10+ entries
- [x] Knowledge gaps explicitly listed (2)
- [x] Assumptions listed (2)
- [x] Edge cases documented (10)
- [x] All tasks have AT-XXX IDs (18 tasks)
- [x] All tasks have subtasks (ST-XXX.N)
- [x] Each subtask has validation criteria
- [x] Dependencies mapped between tasks
- [x] Rollback steps defined (DB + Code)
- [x] Parallel-safe tasks marked with ⚡ (AT-001, AT-002, AT-010, AT-014)
- [x] Verification plan with automated + manual tests
