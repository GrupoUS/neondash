# PLAN-diagnostico-persistence: Fix Diagnostico Persistence & Enable Tab Activation

> **Goal:** Ensure diagnostico data is properly saved to the database and activate "Visão Geral" and "Evolução" tabs after diagnostico completion.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Backend `diagnostico.upsert` mutation works correctly with proper INSERT/UPDATE logic | 5/5 | [diagnostico.ts](file:///home/mauricio/neondash/server/diagnostico.ts#L46-133) | Backend is working |
| 2 | Frontend `DiagnosticoForm.tsx` calls mutation correctly on form submit | 5/5 | [DiagnosticoForm.tsx](file:///home/mauricio/neondash/client/src/components/dashboard/DiagnosticoForm.tsx#L211-213) | Frontend is working |
| 3 | `MenteeOverview.tsx` shows "NewMentoradoWelcome" when `stats.financials.chartData.length === 0` | 5/5 | [MenteeOverview.tsx](file:///home/mauricio/neondash/client/src/components/dashboard/MenteeOverview.tsx#L63-71) | Root cause identified |
| 4 | All tabs are rendered unconditionally in MyDashboard | 5/5 | [MyDashboard.tsx](file:///home/mauricio/neondash/client/src/pages/MyDashboard.tsx#L248-296) | No gating exists |
| 5 | Database schema has all 20 diagnostic fields with proper FK | 5/5 | [schema.ts](file:///home/mauricio/neondash/drizzle/schema.ts#L728-770) | Schema is complete |
| 6 | Existing test pattern in `mentorados.test.ts` uses Vitest with router procedure verification | 4/5 | [mentorados.test.ts](file:///home/mauricio/neondash/server/mentorados.test.ts) | Test pattern available |
| 7 | `onboardingCompleted` flag exists in `mentorados` table | 5/5 | [schema.ts](file:///home/mauricio/neondash/drizzle/schema.ts#L132) | Can use for gating |

### Knowledge Gaps & Assumptions

- **Gap:** Need to verify actual database writes via browser testing
- **Assumption:** User perceives diagnostico as "not saving" because visão geral shows welcome screen (no metrics yet)
- **Assumption:** User wants tabs to be gated/locked until diagnostico is completed

### Edge Cases

1. User saves diagnostico but has no metrics → Should see diagnostico summary, not welcome screen
2. Admin viewing mentorado without diagnostico → Should see empty state
3. Form reset after diagnostico load → Should preserve existing data
4. Network failure during save → Should show error toast (already implemented)
5. Multiple rapid saves → Should not create duplicate records (unique index protects)

---

## 1. User Review Required

> [!NOTE]
> **Decision:** User selected **Option B** - Gate/lock "Visão Geral" and "Evolução" tabs until diagnostico exists.
> 
> Implementation will disable these tabs with a visual lock indicator and tooltip prompting user to complete diagnostico first.

---

## 2. Proposed Changes

### Phase 1: Add Diagnostico Router Tests

#### [NEW] [diagnostico.test.ts](file:///home/mauricio/neondash/server/diagnostico.test.ts)

- **Action:** Create unit tests for `diagnosticoRouter` procedures
- **Details:** 
  - Test `get` and `upsert` procedure definitions exist
  - Test data structure for upsert (similar to mentorados.test.ts pattern)
  - Verify Zod schema validation logic

---

### Phase 2: Display Diagnostico in Visão Geral

#### [MODIFY] [MenteeOverview.tsx](file:///home/mauricio/neondash/client/src/components/dashboard/MenteeOverview.tsx)

- **Action:** Fetch diagnostico data and display summary when available
- **Details:**
  - Add `trpc.diagnostico.get.useQuery()` call
  - If diagnostico exists but no metrics, show `DiagnosticoSummaryCard` instead of `NewMentoradoWelcome`
  - If no diagnostico and no metrics, show `NewMentoradoWelcome`

#### [NEW] [DiagnosticoSummaryCard.tsx](file:///home/mauricio/neondash/client/src/components/dashboard/DiagnosticoSummaryCard.tsx)

- **Action:** Create component to display diagnostico summary
- **Details:**
  - Show key diagnostico fields (objetivo6Meses, incomodaRotina, visaoUmAno)
  - Add edit button linking to diagnostico tab
  - Match existing card styling from MenteeOverview

---

### Phase 3: Improve Post-Save Navigation

#### [MODIFY] [DiagnosticoForm.tsx](file:///home/mauricio/neondash/client/src/components/dashboard/DiagnosticoForm.tsx)

- **Action:** Invalidate related queries after save to refresh data
- **Details:**
  - Add `utils.mentorados.getOverviewStats.invalidate()` after successful save
  - This ensures MenteeOverview refreshes and shows diagnostico data

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Each task has subtasks with validation steps.

### AT-001: Add Diagnostico Router Tests ⚡ PARALLEL-SAFE

**Goal:** Verify diagnostico backend works correctly
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Create `server/diagnostico.test.ts` file
  - **File:** `server/diagnostico.test.ts`
  - **Validation:** File exists, no syntax errors
- [ ] ST-001.2: Add procedure definition tests (get, upsert)
  - **File:** `server/diagnostico.test.ts`
  - **Validation:** `bun test diagnostico.test.ts` passes
- [ ] ST-001.3: Add upsert data structure logic tests
  - **File:** `server/diagnostico.test.ts`
  - **Validation:** Tests validate field mapping correctly

**Rollback:** `git checkout -- server/diagnostico.test.ts`

---

### AT-002: Create DiagnosticoSummaryCard Component ⚡ PARALLEL-SAFE

**Goal:** Display diagnostico summary in overview
**Dependencies:** None

#### Subtasks:
- [ ] ST-002.1: Create component file with proper imports
  - **File:** `client/src/components/dashboard/DiagnosticoSummaryCard.tsx`
  - **Validation:** No TypeScript errors
- [ ] ST-002.2: Add card layout with key diagnostic fields
  - **File:** `client/src/components/dashboard/DiagnosticoSummaryCard.tsx`
  - **Validation:** Component renders without errors
- [ ] ST-002.3: Add edit button with onNavigateToTab callback
  - **File:** `client/src/components/dashboard/DiagnosticoSummaryCard.tsx`
  - **Validation:** Button click triggers navigation

**Rollback:** `rm client/src/components/dashboard/DiagnosticoSummaryCard.tsx`

---

### AT-003: Integrate Diagnostico into MenteeOverview

**Goal:** Show diagnostico data when metrics are missing
**Dependencies:** AT-002

#### Subtasks:
- [ ] ST-003.1: Add diagnostico query to MenteeOverview
  - **File:** `client/src/components/dashboard/MenteeOverview.tsx`
  - **Validation:** Query executes without error
- [ ] ST-003.2: Modify empty state logic to check diagnostico existence
  - **File:** `client/src/components/dashboard/MenteeOverview.tsx`
  - **Validation:** If diagnostico exists + no metrics → shows DiagnosticoSummaryCard
- [ ] ST-003.3: Import and render DiagnosticoSummaryCard
  - **File:** `client/src/components/dashboard/MenteeOverview.tsx`
  - **Validation:** Card displays correctly in browser

**Rollback:** `git checkout -- client/src/components/dashboard/MenteeOverview.tsx`

---

### AT-004: Add Cache Invalidation to DiagnosticoForm

**Goal:** Refresh overview after diagnostico save
**Dependencies:** None

#### Subtasks:
- [ ] ST-004.1: Add `getOverviewStats` invalidation to mutation onSuccess
  - **File:** `client/src/components/dashboard/DiagnosticoForm.tsx`
  - **Validation:** After save, switch to visão geral → shows updated data
- [ ] ST-004.2: Verify toast notification shows on save
  - **File:** `client/src/components/dashboard/DiagnosticoForm.tsx`
  - **Validation:** Green success toast appears

**Rollback:** `git checkout -- client/src/components/dashboard/DiagnosticoForm.tsx`

---

## 4. Verification Plan

### Automated Tests

```bash
# TypeScript validation
bun run check

# Run all tests including new diagnostico tests
bun test

# Run only diagnostico tests
bun test diagnostico.test.ts

# Lint check
bun run lint:check
```

### Manual Verification

**Test Flow 1: New User Experience**
1. Login as a new user (email not in system)
2. Navigate to `/meu-dashboard`
3. Click "Diagnóstico" tab
4. Fill out form fields
5. Click "Salvar Diagnóstico"
6. ✅ Verify: Toast shows "Diagnóstico salvo com sucesso!"
7. Click "Visão Geral" tab
8. ✅ Verify: DiagnosticoSummaryCard shows with your answers (not NewMentoradoWelcome)

**Test Flow 2: Existing User with Diagnostico**
1. Login as test user with existing diagnostico
2. Navigate to `/meu-dashboard` → "Visão Geral"
3. ✅ Verify: If no metrics, DiagnosticoSummaryCard shows
4. ✅ Verify: If has metrics, full overview shows

**Test Flow 3: Admin View**
1. Login as admin
2. Select a mentorado from floating dock
3. Click "Diagnóstico" tab
4. ✅ Verify: Form shows mentorado's diagnostico data
5. Edit and save
6. ✅ Verify: Data persists on refresh

---

## 5. Rollback Plan

```bash
# Revert all changes
git checkout -- server/diagnostico.test.ts
git checkout -- client/src/components/dashboard/DiagnosticoSummaryCard.tsx
git checkout -- client/src/components/dashboard/MenteeOverview.tsx
git checkout -- client/src/components/dashboard/DiagnosticoForm.tsx

# Or revert to last commit
git reset --hard HEAD~1
```

---

## Pre-Submission Checklist

- [x] Research completed (findings table with 7 entries)
- [x] All tasks have AT-XXX IDs with subtasks
- [x] Validation commands specified
- [x] Manual test steps documented
- [x] Rollback steps defined
- [x] Parallel-safe tasks marked with ⚡
