# PLAN-meta-whatsapp-baileys: Meta WhatsApp + Baileys QR Integration Completion

> **Goal:** Complete and harden the WhatsApp multi-provider integration with Baileys QR connection, preserving existing Meta and Z-API support while aligning backend, frontend, real-time updates, and documentation.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Baileys core integration already exists with session map, QR events, and message upsert handling in [`class BaileysService`](server/services/baileysService.ts:27) | 5/5 | Local codebase | Work should focus on completion and hardening, not greenfield build |
| 2 | Baileys router is already registered in [`appRouter`](server/routers.ts:33), contrary to plan note about [`server/_core/trpc.ts`](server/_core/trpc.ts) | 5/5 | Local codebase | Avoid duplicate router registration edits in wrong file |
| 3 | Settings already exposes three providers and a comparison table via [`SettingsPage`](client/src/pages/Settings.tsx:26) | 5/5 | Local codebase | Replace/refactor for maintainability rather than rebuilding from zero |
| 4 | Chat already supports three providers in [`LeadChatWindow`](client/src/components/chat/LeadChatWindow.tsx:31), but provider precedence differs from requested sequence | 4/5 | Local codebase | Requires deterministic provider-priority adjustment and test coverage |
| 5 | Official Baileys guidance recommends [`useMultiFileAuthState`](https://github.com/whiskeysockets/baileys/blob/master/README.md) + `creds.update` persistence + reconnect unless loggedOut | 5/5 | Context7 `/whiskeysockets/baileys` | Keep current architecture but enforce stronger lifecycle handling |
| 6 | Community reports show long-lived session instability and periodic disconnects around status 428 in production | 3/5 | Tavily GitHub issue aggregation | Add operational safeguards and explicit risk notes |
| 7 | Community reports indicate increased ban risk with unofficial automation patterns | 3/5 | Tavily issue aggregation + article | Add anti-spam guardrails and provider selection guidance |

### Knowledge Gaps & Assumptions
- **Gap:** Current repository state for [`scripts/migrate-whatsapp-provider.ts`](scripts/migrate-whatsapp-provider.ts) and dedicated tests for Baileys flow is unknown.
- **Gap:** Multi-session concurrency limits under real production load are not benchmarked.
- **Gap:** Exact behavior expected when multiple providers are simultaneously connected is not yet codified as a policy.
- **Assumption:** Existing DB fields in [`mentorados`](drizzle/schema.ts) for Baileys remain valid and no migration is required.
- **Assumption:** SSE event names already used by chat clients should remain backward-compatible.
- **Assumption:** This plan follows user-provided file references verbatim and only adjusts structural path mismatches where repository wiring differs.

### Edge Cases
- Session auth folder exists but credentials are stale leading to reconnect loops.
- QR code expires before user scans and UI remains in stale connecting state.
- Incoming phone format mismatch prevents lead linkage even when same contact.
- Provider switching mid-conversation causes message list source swap and perceived data loss.
- Simultaneous connections from multiple mentorados produce cross-session event contamination.
- Logout path deletes local auth while DB still indicates connected.
- SSE disconnect while message arrives, causing delayed UI update until manual refetch.

---

## 1. User Review Required

> [!WARNING]
> Baileys is an unofficial WhatsApp Web protocol integration and carries reliability and policy risk compared to Meta Cloud API. The implementation should include explicit warnings in UX/docs and conservative operational defaults.

> [!IMPORTANT]
> Existing workspace already contains partial Baileys implementation in key files. Execution should complete and normalize behavior, not duplicate abstractions.

---

## 2. Proposed Changes

### Phase 1: Backend Baileys Integration Hardening

#### [MODIFY] [`package.json`](package.json)
- **Action:** Ensure Baileys dependencies are present and aligned.
- **Details:** Verify/add `@whiskeysockets/baileys`, `pino`, and any QR utility dependency used by implementation.

#### [MODIFY] [`server/services/baileysService.ts`](server/services/baileysService.ts)
- **Action:** Harden connection lifecycle and event semantics.
- **Details:**
  - Keep one source of truth for session state transitions.
  - Normalize reconnect logic and avoid recursive storm on transient close events.
  - Ensure emitted payloads include stable fields consumed by router/webhook/UI.
  - Normalize phone/jid conversion for outbound/inbound message flow.

#### [NEW] [`server/services/baileysSessionManager.ts`](server/services/baileysSessionManager.ts)
- **Action:** Introduce singleton session orchestration.
- **Details:**
  - Manage `Map<mentoradoId, session>` ownership.
  - Encapsulate startup restoration and cleanup behavior.
  - Provide methods consumed by router/service for multi-tenant safety.

#### [MODIFY] [`server/baileysRouter.ts`](server/baileysRouter.ts)
- **Action:** Complete router procedures to match requested scope.
- **Details:**
  - Keep/validate `getStatus`, `getQRCode`, `connect`, `disconnect`, `sendMessage`, `getMessages`.
  - Add missing `getAllConversations`.
  - Align DB updates and status mapping with service events.

#### [MODIFY] [`server/webhooks/baileysWebhook.ts`](server/webhooks/baileysWebhook.ts)
- **Action:** Strengthen persistence and SSE propagation.
- **Details:**
  - Ensure disconnect event updates `baileysConnected` state.
  - Normalize phone matching with lead records.
  - Broadcast consistent event types and payloads.

### Phase 2: Frontend Provider Experience Completion

#### [MODIFY] [`client/src/components/whatsapp/BaileysConnectionCard.tsx`](client/src/components/whatsapp/BaileysConnectionCard.tsx)
- **Action:** Stabilize QR/connect/disconnect UX state machine.
- **Details:**
  - Resolve stale connecting/disconnected transitions.
  - Ensure QR refresh behavior and empty-state messaging are deterministic.

#### [NEW] [`client/src/components/whatsapp/ProviderComparisonTable.tsx`](client/src/components/whatsapp/ProviderComparisonTable.tsx)
- **Action:** Extract comparison table to dedicated reusable component.
- **Details:**
  - Preserve current functional comparison in Settings.
  - Keep styling consistent with shadcn table primitives.

#### [MODIFY] [`client/src/pages/Settings.tsx`](client/src/pages/Settings.tsx)
- **Action:** Compose provider cards and comparison component cleanly.
- **Details:**
  - Keep three-provider navigation.
  - Use new comparison component.
  - Preserve explanatory messaging about provider trade-offs.

#### [MODIFY] [`client/src/components/chat/LeadChatWindow.tsx`](client/src/components/chat/LeadChatWindow.tsx)
- **Action:** Align provider selection policy and message invalidation.
- **Details:**
  - Apply requested precedence: Meta > Baileys > Z-API.
  - Keep per-provider query/mutation wiring consistent.
  - Ensure SSE invalidation targets active provider correctly.

### Phase 3: Cross-App Indicators and CRM Embedding

#### [MODIFY] [`client/src/components/DashboardLayout.tsx`](client/src/components/DashboardLayout.tsx)
- **Action:** Add lightweight global WhatsApp provider status indicator.
- **Details:**
  - Show active provider and connection state.
  - Link directly to [`/configuracoes`](client/src/components/DashboardLayout.tsx).

#### [MODIFY] [`client/src/components/crm/LeadDetailModal.tsx`](client/src/components/crm/LeadDetailModal.tsx)
- **Action:** Ensure Chat tab behavior is fully integrated and resilient.
- **Details:**
  - Keep embedded [`LeadChatWindow`](client/src/components/chat/LeadChatWindow.tsx).
  - Confirm no-provider fallback messaging remains clear.

### Phase 4: Environment, Documentation, and Migration Utility

#### [MODIFY] [`.env.example`](.env.example)
- **Action:** Document Baileys session/config variables.
- **Details:** Add `BAILEYS_SESSION_DIR` and optional logging toggles.

#### [NEW] [`.agent/skills/baileys-integration/SKILL.md`](.agent/skills/baileys-integration/SKILL.md)
- **Action:** Add internal operational guide for Baileys.
- **Details:** Setup flow, troubleshooting, limitations, and safe usage practices.

#### [MODIFY] [`README.md`](README.md)
- **Action:** Update WhatsApp integration section with three providers.
- **Details:** Include pros/cons and safety notes.

#### [NEW] [`scripts/migrate-whatsapp-provider.ts`](scripts/migrate-whatsapp-provider.ts)
- **Action:** Add migration helper scaffold.
- **Details:** Support provider transition workflow with conservative data handling.

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Each task includes explicit subtasks, validation, dependencies, and rollback.

### AT-001: Normalize backend Baileys connection architecture
**Goal:** Establish a stable backend contract for sessions, QR state, message persistence, and router procedures.
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Validate and align dependencies in [`package.json`](package.json)
  - **File:** `package.json`
  - **Validation:** Dependency entries present and lockfile updates generated by Bun.
- [ ] ST-001.2: Refactor lifecycle logic in [`BaileysService`](server/services/baileysService.ts:27)
  - **File:** `server/services/baileysService.ts`
  - **Validation:** Reconnect/logout transitions produce deterministic status and no duplicate sessions.
- [ ] ST-001.3: Introduce [`baileysSessionManager`](server/services/baileysSessionManager.ts)
  - **File:** `server/services/baileysSessionManager.ts`
  - **Validation:** Multiple mentorados can hold independent active sessions.
- [ ] ST-001.4: Complete router contract in [`baileysRouter`](server/baileysRouter.ts:8)
  - **File:** `server/baileysRouter.ts`
  - **Validation:** `getAllConversations` exists and router compiles with other procedures.
- [ ] ST-001.5: Improve event handling in [`registerBaileysWebhooks`](server/webhooks/baileysWebhook.ts:9)
  - **File:** `server/webhooks/baileysWebhook.ts`
  - **Validation:** Connection/message events update DB and broadcast SSE consistently.

**Rollback:** Revert modified backend files to previous commit and disable Baileys router exports in [`appRouter`](server/routers.ts:33).

### AT-002: Align frontend provider orchestration and Settings UX
**Goal:** Ensure clear provider selection UX and stable chat behavior across Meta, Baileys, and Z-API.
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Stabilize QR UX in [`BaileysConnectionCard`](client/src/components/whatsapp/BaileysConnectionCard.tsx:32)
  - **File:** `client/src/components/whatsapp/BaileysConnectionCard.tsx`
  - **Validation:** Connect -> QR -> connected/disconnected transitions match backend events.
- [ ] ST-002.2: Add reusable [`ProviderComparisonTable`](client/src/components/whatsapp/ProviderComparisonTable.tsx)
  - **File:** `client/src/components/whatsapp/ProviderComparisonTable.tsx`
  - **Validation:** Component renders all provider rows/columns with existing theme.
- [ ] ST-002.3: Refactor [`SettingsPage`](client/src/pages/Settings.tsx:26) to consume extracted component
  - **File:** `client/src/pages/Settings.tsx`
  - **Validation:** Three provider cards and comparison table render without regression.
- [ ] ST-002.4: Apply provider precedence update in [`LeadChatWindow`](client/src/components/chat/LeadChatWindow.tsx:31)
  - **File:** `client/src/components/chat/LeadChatWindow.tsx`
  - **Validation:** Active provider resolves Meta > Baileys > Z-API and messages load correctly.

**Rollback:** Restore prior UI files and keep previous provider order.

### AT-003: Add global status and CRM chat continuity
**Goal:** Make provider connection status visible globally and preserve CRM chat productivity.
**Dependencies:** AT-002

#### Subtasks:
- [ ] ST-003.1: Add global WhatsApp status badge/link in [`DashboardLayout`](client/src/components/DashboardLayout.tsx:28)
  - **File:** `client/src/components/DashboardLayout.tsx`
  - **Validation:** Indicator reflects active provider and navigates to settings.
- [ ] ST-003.2: Verify and finalize chat tab behavior in [`LeadDetailModal`](client/src/components/crm/LeadDetailModal.tsx:108)
  - **File:** `client/src/components/crm/LeadDetailModal.tsx`
  - **Validation:** Chat tab loads lead chat; no-provider state displays correctly.

**Rollback:** Remove status indicator and restore previous modal tab behavior.

### AT-004: Document operation model and migration pathway ⚡ PARALLEL-SAFE
**Goal:** Provide maintainers and users with clear setup and migration guidance.
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-004.1: Add Baileys env docs in [`.env.example`](.env.example)
  - **File:** `.env.example`
  - **Validation:** New variables documented and described.
- [ ] ST-004.2: Create skill doc at [`.agent/skills/baileys-integration/SKILL.md`](.agent/skills/baileys-integration/SKILL.md)
  - **File:** `.agent/skills/baileys-integration/SKILL.md`
  - **Validation:** Setup + troubleshooting + limits sections present.
- [ ] ST-004.3: Update provider docs in [`README.md`](README.md)
  - **File:** `README.md`
  - **Validation:** Three-provider matrix and usage notes present.
- [ ] ST-004.4: Add migration helper scaffold [`scripts/migrate-whatsapp-provider.ts`](scripts/migrate-whatsapp-provider.ts)
  - **File:** `scripts/migrate-whatsapp-provider.ts`
  - **Validation:** Script compiles and exposes planned migration entry flow.

**Rollback:** Revert docs/scripts files without affecting runtime modules.

### AT-005: End-to-end verification and release readiness
**Goal:** Validate all flows and protect against regressions before merge.
**Dependencies:** AT-003, AT-004

#### Subtasks:
- [ ] ST-005.1: Run static and type checks
  - **File:** project-wide
  - **Validation:** `bun run check` passes.
- [ ] ST-005.2: Run lint and formatting checks
  - **File:** project-wide
  - **Validation:** `bun run lint` passes.
- [ ] ST-005.3: Run automated tests and targeted WhatsApp scenarios
  - **File:** project-wide
  - **Validation:** `bun test` passes and no critical failures in WhatsApp modules.
- [ ] ST-005.4: Execute manual E2E checklist for connect/send/receive/provider-switch
  - **File:** runtime behavior
  - **Validation:** All manual acceptance criteria complete with expected DB + UI updates.

**Rollback:** If critical regressions appear, revert all Baileys-related runtime changes and keep Meta/Z-API behavior intact.

---

## 4. Verification Plan

### Automated Tests
- `bun run check` - TypeScript validation
- `bun run lint` - Lint and formatting validation
- `bun test` - Unit and integration tests

### Manual Verification
1. Open [`/configuracoes`](client/src/pages/Settings.tsx) and confirm all three providers are visible.
2. Start Baileys connection from [`BaileysConnectionCard`](client/src/components/whatsapp/BaileysConnectionCard.tsx) and confirm QR appears.
3. Scan QR and verify DB fields in [`mentorados`](drizzle/schema.ts) reflect connected status.
4. Open chat via [`LeadChatWindow`](client/src/components/chat/LeadChatWindow.tsx) and send/receive messages.
5. Validate SSE live updates from [`sseService`](server/services/sseService.ts:8) for message and status events.
6. Confirm CRM modal chat tab in [`LeadDetailModal`](client/src/components/crm/LeadDetailModal.tsx) works with active provider.
7. Switch active provider and verify provider precedence behavior and fallback state.

---

## 5. Rollback Plan

- Revert backend files:
  - [`server/baileysRouter.ts`](server/baileysRouter.ts)
  - [`server/services/baileysService.ts`](server/services/baileysService.ts)
  - [`server/services/baileysSessionManager.ts`](server/services/baileysSessionManager.ts)
  - [`server/webhooks/baileysWebhook.ts`](server/webhooks/baileysWebhook.ts)
- Revert frontend files:
  - [`client/src/components/whatsapp/BaileysConnectionCard.tsx`](client/src/components/whatsapp/BaileysConnectionCard.tsx)
  - [`client/src/components/whatsapp/ProviderComparisonTable.tsx`](client/src/components/whatsapp/ProviderComparisonTable.tsx)
  - [`client/src/pages/Settings.tsx`](client/src/pages/Settings.tsx)
  - [`client/src/components/chat/LeadChatWindow.tsx`](client/src/components/chat/LeadChatWindow.tsx)
  - [`client/src/components/DashboardLayout.tsx`](client/src/components/DashboardLayout.tsx)
  - [`client/src/components/crm/LeadDetailModal.tsx`](client/src/components/crm/LeadDetailModal.tsx)
- Revert documentation and scripts:
  - [`.env.example`](.env.example)
  - [`.agent/skills/baileys-integration/SKILL.md`](.agent/skills/baileys-integration/SKILL.md)
  - [`README.md`](README.md)
  - [`scripts/migrate-whatsapp-provider.ts`](scripts/migrate-whatsapp-provider.ts)
- Remove local session artifacts at runtime directory if needed:
  - `./.baileys-sessions/*`

---

## Pre-Submission Checklist

```yaml
file_creation:
  - [x] Created docs/PLAN-meta-whatsapp-baileys.md file
  - [x] File follows required template sections
  - [x] File content complete and readable

research:
  - [x] Codebase patterns documented
  - [x] Context7 official docs consulted
  - [x] Tavily used for additional operational risk data
  - [x] Sequential synthesis completed
  - [x] Findings precision target met

context:
  - [x] Findings table with 5+ entries
  - [x] Knowledge gaps listed
  - [x] Assumptions listed
  - [x] Edge cases listed 5+

tasks:
  - [x] Atomic tasks AT-XXX included
  - [x] Subtasks ST-XXX.N included for all tasks
  - [x] Validation steps included per subtask
  - [x] Dependencies and rollback included
  - [x] Parallel-safe task marked

quality:
  - [x] CONSERVATIVE mode respected
  - [x] No code implementation performed in this planning step
```
