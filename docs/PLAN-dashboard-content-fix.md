# PLAN-dashboard-content-fix: Fix Dashboard Display After Diagnostico

> **Goal:** After filling the diagnostico, show meaningful content in "Visão Geral" and "Evolução" tabs instead of welcome screen or empty states.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | MenteeOverview shows welcome screen if `chartData.length === 0` | 5/5 | MenteeOverview.tsx:64-72 | High - blocks overview even with diagnostico |
| 2 | EvolucaoView shows "Nenhum dado encontrado" when no metrics | 5/5 | EvolucaoView.tsx:115-120 | Medium - expected empty state |
| 3 | DiagnosticoSummaryCard exists but not integrated | 5/5 | DiagnosticoSummaryCard.tsx | Can be used for overview |
| 4 | No diagnostico context passed to MenteeOverview | 5/5 | MyDashboard.tsx | Need to add prop or fetch |
| 5 | User completed diagnostico but has zero metrics | 5/5 | Screenshots | This is expected UX flow |

### Knowledge Gaps
- Should "Visão Geral" show just the DiagnosticoSummary until metrics exist?
- Should "Evolução" show the metrics form prominently for first-time users?

### Assumptions
- After diagnostico, user should see their diagnostico summary + empty metrics placeholder
- "Evolução" should guide user to fill first metrics

---

## 1. User Review Required

> [!IMPORTANT]
> **Design Decision Needed:**
> After filling diagnostico (no metrics yet), what should each tab show?
>
> **Option A - Minimal:**
> - Visão Geral: DiagnosticoSummaryCard + "Aguardando primeiras métricas" card
> - Evolução: SubmitMetricsForm (prominent) + empty table
>
> **Option B - Guided:**
> - Visão Geral: DiagnosticoSummaryCard + "Complete suas métricas" call-to-action
> - Evolução: Highlighted "Preencha suas primeiras métricas" section

---

## 2. Proposed Changes

### Phase 1: Fix MenteeOverview

#### [MODIFY] [MenteeOverview.tsx](file:///home/mauricio/neondash/client/src/components/dashboard/MenteeOverview.tsx)
- **Action:** Add diagnostico query and show summary card when diagnostico exists but no metrics
- **Details:**
  - Add `trpc.diagnostico.get.useQuery()`
  - Modify `hasNoData` logic: show welcome ONLY if no diagnostico
  - If diagnostico exists but no metrics: show DiagnosticoSummaryCard + "Aguardando métricas" card

### Phase 2: Improve EvolucaoView

#### [MODIFY] [EvolucaoView.tsx](file:///home/mauricio/neondash/client/src/components/dashboard/EvolucaoView.tsx)
- **Action:** Add helpful empty state with highlighted metrics form
- **Details:**
  - When `evolutionData` empty: show prominent CTA card above form
  - Make SubmitMetricsForm more visible for first-time users

---

## 3. Atomic Implementation Tasks

### AT-001: Add diagnostico query to MenteeOverview
**Goal:** Fetch diagnostico data in overview component
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Add `trpc.diagnostico.get.useQuery()` call
  - **File:** `client/src/components/dashboard/MenteeOverview.tsx`
  - **Validation:** TypeScript compiles
- [ ] ST-001.2: Pass diagnostico loading state to isQueriesLoading
  - **File:** `client/src/components/dashboard/MenteeOverview.tsx`
  - **Validation:** No flicker on load

**Rollback:** Revert file to previous version

---

### AT-002: Modify welcome screen logic
**Goal:** Show welcome ONLY when no diagnostico (not based on metrics)
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Change `hasNoData` condition to check diagnostico instead of metrics
  - **File:** `client/src/components/dashboard/MenteeOverview.tsx`
  - **Validation:** With diagnostico + no metrics → doesn't show welcome
- [ ] ST-002.2: Add "metrics pending" UI when diagnostico exists but no metrics
  - **File:** `client/src/components/dashboard/MenteeOverview.tsx`
  - **Validation:** Shows DiagnosticoSummaryCard + helpful message

**Rollback:** Revert conditional logic

---

### AT-003: Improve EvolucaoView empty state
**Goal:** Show helpful guidance when no metrics exist
**Dependencies:** None (parallel-safe ⚡)

#### Subtasks:
- [ ] ST-003.1: Add empty state card with CTA before the table
  - **File:** `client/src/components/dashboard/EvolucaoView.tsx`
  - **Validation:** Empty state shows encouraging message

**Rollback:** Revert file

---

## 4. Verification Plan

### Automated Tests
- `bun run check` - TypeScript validation
- `bun run lint:check` - Code formatting

### Manual Verification
1. Login as mentorado with diagnostico filled, no metrics
2. Navigate to "Visão Geral" tab
3. ✅ Verify: Shows DiagnosticoSummaryCard (not welcome screen)
4. Navigate to "Evolução" tab
5. ✅ Verify: Shows metrics form prominently with helpful message
6. Fill and save first metric
7. ✅ Verify: Both tabs now show data

---

## 5. Rollback Plan

```bash
git checkout HEAD -- client/src/components/dashboard/MenteeOverview.tsx
git checkout HEAD -- client/src/components/dashboard/EvolucaoView.tsx
```
