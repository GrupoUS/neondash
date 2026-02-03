# PLAN-instagram-login-button: Instagram Login Implementation

> **Goal:** Fix the missing Instagram login button (XFBML rendering), ensure robust token exchange (Long-Lived), and verify Admin View functionality for managing mentorado connections.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Facebook SDK XFBML button requires `<div id="fb-root"></div>` to render. | 5/5 | Meta Docs / Codebase | Button is currently invisible. |
| 2 | `InstagramConnectionCard` uses Client-Side flow (FB JS SDK) + `instagramRouter`. | 5/5 | `InstagramConnectionCard.tsx` | Current logic uses popup flow. |
| 3 | `instagramRouter.saveToken` Naively saves short-lived token without exchange. | 5/5 | `instagramRouter.ts` | Tokens expire in ~1-2 hours instead of 60 days. |
| 4 | Admin View in `MyDashboard` correctly passes `targetMentoradoId`. | 4/5 | `MyDashboard.tsx` | Admin integration logic exists but needs verification. |
| 5 | `mentoradosRouter` contains unused Server-Side OAuth endpoints. | 5/5 | `mentoradosRouter.ts` | Duplicate/Dead code potential. |

### Knowledge Gaps & Assumptions
- **Assumption:** The Facebook App ID `751534357596165` is active and configured for the current domain (localhost/production) to allow the Button to render.
- **Assumption:** Admin intends to use the button to link *their* account (or guide mentorado) or just verify presence.

---

## 1. User Review Required (If Any)

> [!CAUTION]
> **Token Extension Logic**: The current `saveToken` endpoint does NOT exchange the token for a Long-Lived one. I will modify `instagramRouter.saveToken` to perform this exchange server-side for robust connectivity.

---

## 2. Proposed Changes

### Phase 1: Frontend Fixes

#### [MODIFY] [index.html](file:///home/mauricio/neondash/client/index.html)
- **Action:** Add `<div id="fb-root"></div>` (Already anticipated, but formalized here).
- **Details:** Required for FB SDK XFBML rendering.

#### [MODIFY] [InstagramConnectionCard.tsx](file:///home/mauricio/neondash/client/src/components/instagram/InstagramConnectionCard.tsx)
- **Action:** Ensure `mentoradoId` is correctly used in `saveToken`.
- **Details:** Verify parsing logic.

### Phase 2: Backend Hardening

#### [MODIFY] [instagramRouter.ts](file:///home/mauricio/neondash/server/instagramRouter.ts)
- **Action:** Update `saveToken` procedure.
- **Details:**
  1. Receive `shortLivedAccessToken`.
  2. Call `instagramService.exchangeForLongLivedToken`.
  3. Save the *Long-Lived* token and expiration date.

### Phase 3: Cleanup

#### [MODIFY] [mentoradosRouter.ts](file:///home/mauricio/neondash/server/mentoradosRouter.ts)
- **Action:** Keep `connectInstagram` endpoints as backup or remove if purely relying on JS SDK. (Will keep for now to avoid breaking changes, but prioritize `instagramRouter`).

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Each task MUST have subtasks. No single-line tasks allowed.

### AT-001: Fix Facebook Button Rendering & Admin View
**Goal:** Ensure the login button is visible and functional for Admins.
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Verify `fb-root` in `index.html`.
  - **File:** `client/index.html`
  - **Validation:** Visual check of DOM.
- [ ] ST-001.2: Validate Admin View passing `mentoradoId`.
  - **File:** `client/src/pages/MyDashboard.tsx`
  - **Validation:** Verify `InstagramAnalyticsView` receives correct ID when Admin switches mentorados.

### AT-002: Implement Server-Side Token Exchange
**Goal:** Ensure stored tokens are long-lived (60 days) instead of short-lived.
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Update `instagramRouter.saveToken` to usage `exchangeForLongLivedToken`.
  - **File:** `server/instagramRouter.ts`
  - **Validation:** `bun test server/instagram.test.ts` (Update tests if needed).
- [ ] ST-002.2: Mock `exchangeForLongLivedToken` in router tests if necessary.
  - **File:** `server/instagramRouter.ts`
  - **Validation:** Ensure tests pass.

---

## 4. Verification Plan

### Automated Tests
- `bun run check`
- `bun test`

### Manual Verification
1. Login as Admin.
2. Select a Mentorado (e.g., ID 1).
3. Navigate to "Instagram" tab.
4. **Verify**: "Login with Facebook" button is visible.
5. (Optional) Click Login -> Approve -> Verify "Connected" status.

---

## 5. Rollback Plan

- Revert `server/instagramRouter.ts` changes.
- Remove `fb-root` from `index.html`.
