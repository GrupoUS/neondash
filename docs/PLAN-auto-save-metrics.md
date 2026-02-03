# PLAN-auto-save-metrics: Enhanced Metrics Form

> **Goal:** Refactor metrics form to use pessimistic auto-save, fetch Instagram data, and show month comparisons.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | `server/mentoradosRouter.ts` handles metrics | 5/5 | User | Backend logic location |
| 2 | `server/services/instagramService.ts` exists | 5/5 | User | Instagram data source |
| 3 | `SubmitMetricsForm.tsx` uses submit-all pattern | 5/5 | User | Target for refactor |
| 4 | `mentorados.ts` needs partial update helper | 5/5 | User | DB abstraction layer |

### Knowledge Gaps & Assumptions
- **Gap:** None (User provided full plan)
- **Assumption:** User provided file paths are correct.
- **Assumption:** `instagram_sync_log` table is populated.

---

## 1. User Review Required

> [!NOTE]
> **Pessimistic Auto-Save:** Fields save on blur. User only sees "Saved" after server confirmation.

---

## 2. Proposed Changes

### Backend
#### [MODIFY] [mentorados.ts](file:///home/mauricio/neondash/server/mentorados.ts)
- Add `upsertMetricaMensalPartial` helper.

#### [MODIFY] [mentoradosRouter.ts](file:///home/mauricio/neondash/server/mentoradosRouter.ts)
- Add `updateMetricaField` and `getPreviousMonthMetrics` procedures.

### Frontend Hooks
#### [NEW] [useAutoSave.ts](file:///home/mauricio/neondash/client/src/hooks/useAutoSave.ts)
- Implement pessimistic auto-save logic.

#### [NEW] [useInstagramMetrics.ts](file:///home/mauricio/neondash/client/src/hooks/useInstagramMetrics.ts)
- Fetch Instagram sync data.

#### [NEW] [usePreviousMonthMetrics.ts](file:///home/mauricio/neondash/client/src/hooks/usePreviousMonthMetrics.ts)
- Fetch comparison data.

#### [NEW] [useInstagramOnboarding.ts](file:///home/mauricio/neondash/client/src/hooks/useInstagramOnboarding.ts)
- Manage connection modal.

### Frontend Components
#### [MODIFY] [SubmitMetricsForm.tsx](file:///home/mauricio/neondash/client/src/components/dashboard/SubmitMetricsForm.tsx)
- Refactor to use new hooks and auto-save.

#### [NEW] [InstagramOnboardingModal.tsx](file:///home/mauricio/neondash/client/src/components/dashboard/InstagramOnboardingModal.tsx)
- OAuth flow wizard.

#### [NEW] [MetricComparison.tsx](file:///home/mauricio/neondash/client/src/components/dashboard/MetricComparison.tsx)
- Visual percentage change indicator.

#### [NEW] [InstagramBadge.tsx](file:///home/mauricio/neondash/client/src/components/dashboard/InstagramBadge.tsx)
- Connected status indicator.

---

## 3. Atomic Implementation Tasks

### AT-001: Backend Prerequisites
**Goal:** Enable partial updates and historical data fetching.

#### Subtasks:
- [ ] ST-001.1: Create `upsertMetricaMensalPartial` helper
  - **File:** `server/mentorados.ts`
  - **Validation:** `bun run check`
- [ ] ST-001.2: Add `updateMetricaField` procedure
  - **File:** `server/mentoradosRouter.ts`
  - **Validation:** Verify tRPC type generation
- [ ] ST-001.3: Add `getPreviousMonthMetrics` procedure
  - **File:** `server/mentoradosRouter.ts`
  - **Validation:** Check logic for month/year rollover

### AT-002: Custom Hooks
**Goal:** Encapsulate logic for auto-save and data fetching.

#### Subtasks:
- [ ] ST-002.1: Create `useAutoSave` hook
  - **File:** `client/src/hooks/useAutoSave.ts`
  - **Validation:** `bun run check`
- [ ] ST-002.2: Create `useInstagramMetrics` hook
  - **File:** `client/src/hooks/useInstagramMetrics.ts`
  - **Validation:** `bun run check`
- [ ] ST-002.3: Create `usePreviousMonthMetrics` hook
  - **File:** `client/src/hooks/usePreviousMonthMetrics.ts`
  - **Validation:** Compare query input/output types
- [ ] ST-002.4: Create `useInstagramOnboarding` hook
  - **File:** `client/src/hooks/useInstagramOnboarding.ts`
  - **Validation:** Verify state management logic

### AT-003: Enhanced Form Components
**Goal:** Create UI components for the new form.

#### Subtasks:
- [ ] ST-003.1: Create `MetricComparison.tsx`
  - **File:** `client/src/components/dashboard/MetricComparison.tsx`
  - **Validation:** Visual check of badges
- [ ] ST-003.2: Create `InstagramBadge.tsx`
  - **File:** `client/src/components/dashboard/InstagramBadge.tsx`
  - **Validation:** Check icon rendering
- [ ] ST-003.3: Create `InstagramOnboardingModal.tsx`
  - **File:** `client/src/components/dashboard/InstagramOnboardingModal.tsx`
  - **Validation:** Verify dialog states
- [ ] ST-003.4: Refactor `SubmitMetricsForm.tsx` (Skeleton)
  - **File:** `client/src/components/dashboard/SubmitMetricsForm.tsx`
  - **Action:** Remove old submit logic, setup state for new hooks.

### AT-004: Integration and Polish
**Goal:** Integrate hooks and components into main form.

#### Subtasks:
- [ ] ST-004.1: Bind `useAutoSave` to fields
  - **File:** `SubmitMetricsForm.tsx`
  - **Validation:** Check onBlur handlers
- [ ] ST-004.2: Integrate `InstagramBadge` and auto-fill
  - **File:** `SubmitMetricsForm.tsx`
  - **Validation:** Logic check for posts/stories fields
- [ ] ST-004.3: Add `MetricComparison` to fields
  - **File:** `SubmitMetricsForm.tsx`
  - **Validation:** Layout check
- [ ] ST-004.4: Add Loading States & Toasts
  - **File:** `SubmitMetricsForm.tsx`
  - **Validation:** UX flow verification

### AT-005: Testing and Validation
**Goal:** Ensure robustness.

#### Subtasks:
- [ ] ST-005.1: Backend Tests
  - **File:** `server/mentorados.test.ts`
  - **Validation:** `bun test`
- [ ] ST-005.2: Frontend Component Tests
  - **File:** `client/src/components/dashboard/SubmitMetricsForm.test.tsx`
  - **Validation:** `bun test`
- [ ] ST-005.3: Manual Verification
  - **Action:** Verify auto-save, Instagram sync, and basic UI.

---

## 4. Verification Plan

### Automated Tests
- `bun run check`
- `bun run lint`
- `bun test`

### Manual Verification
- Auto-save works for all fields
- Instagram OAuth flow completes
- Previous month comparisons appear
- Toast notifications appear

---

## 5. Rollback Plan

- Revert `SubmitMetricsForm.tsx` to commit HEAD^
- Remove newly created files (`hooks/*.ts`, `components/dashboard/*.tsx`)
- Remove new procedures from `mentoradosRouter.ts`
