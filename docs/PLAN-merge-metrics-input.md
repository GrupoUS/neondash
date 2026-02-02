# PLAN-merge-metrics-input: Merge Metrics Input into Evolution Tab

> **Goal:** Incorporate the "Lançar Métrica" functionality directly into the "Evolução" tab within a structured shadcn/ui card, removing the separate tab.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | `MyDashboard.tsx` manages `NeonTabs` including "lancar-metricas" and "evolucao". | 5/5 | `client/src/pages/MyDashboard.tsx` | Needs modification to remove the old tab. |
| 2 | `EvolucaoView.tsx` renders the content for the "evolucao" tab. | 5/5 | `client/src/components/dashboard/EvolucaoView.tsx` | Target for injecting the form. |
| 3 | `SubmitMetricsForm.tsx` is a standalone form component. | 5/5 | `client/src/components/dashboard/SubmitMetricsForm.tsx` | Will be reused inside `EvolucaoView`. |

### Knowledge Gaps & Assumptions
- **Assumption:** The user wants the form visible by default or easily accessible within the Evolution view without navigating away.
- **Assumption:** The shadcn `Card` component is preferred for consistency within `EvolucaoView`.

---

## 2. Proposed Changes

### Phase 1: Frontend Composition

#### [MODIFY] client/src/pages/MyDashboard.tsx
- **Action:** Remove the `NeonTabsTrigger` for "lancar-metricas".
- **Action:** Remove the `NeonTabsContent` for "lancar-metricas".
- **Details:** This cleans up the top-level navigation.

#### [MODIFY] client/src/components/dashboard/EvolucaoView.tsx
- **Action:** Import `SubmitMetricsForm`.
- **Action:** Add a new `Card` component containing `SubmitMetricsForm`.
- **Details:** Place the form card likely below the chart or in a grid layout alongside data. I will place it effectively to ensure good UX (e.g., inside a collapsible card or just a standard card if it fits well).
- **Details:** Ensure the `Card` has a clear title like "Lançar Métricas Mensais" and description.

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Each task MUST have subtasks. No single-line tasks allowed.

### AT-001: Move Metrics Form to Evolution View
**Goal:** Integrate the form into the destination component.
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Modify `EvolucaoView.tsx` to import and render `SubmitMetricsForm`.
  - **File:** `client/src/components/dashboard/EvolucaoView.tsx`
  - **Validation:** Visual check that form appears.
- [ ] ST-001.2: Wrap the form in a shadcn `Card` with `CardHeader` and `CardContent`.
  - **File:** `client/src/components/dashboard/EvolucaoView.tsx`
  - **Validation:** Verify styling matches other cards.

### AT-002: Cleanup Dashboard Tabs
**Goal:** Remove the redundant tab.
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Remove `lancar-metricas` trigger from `MyDashboard.tsx`.
  - **File:** `client/src/pages/MyDashboard.tsx`
  - **Validation:** Tab should disappear.
- [ ] ST-002.2: Remove `lancar-metricas` content block from `MyDashboard.tsx`.
  - **File:** `client/src/pages/MyDashboard.tsx`
  - **Validation:** No errors in console.

---

## 4. Verification Plan

### Automated Tests
- `bun run check` - Ensure no type errors after moving components.
- `bun run lint` - Code formatting.

### Manual Verification
1. Open "Meu Dashboard" (or Admin view).
2. Click "Evolução" tab.
3. Verify "Lançar Métricas" form is present and styled correctly.
4. Verify "Lançar Métricas" tab is gone from the top menu.
5. Try submitting a metric and ensure it still works (it uses tRPC mutation so location shouldn't matter).

---

## 5. Rollback Plan

- Revert changes to `MyDashboard.tsx` and `EvolucaoView.tsx`.
- `git checkout client/src/pages/MyDashboard.tsx client/src/components/dashboard/EvolucaoView.tsx`
