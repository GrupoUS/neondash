# Mentorado Evolution & Linkage Plan

## 1. Research & Analysis (Current State)

### Database Findings
Analysis of the `neondb` (Project: `neondash`) revealed:

| Table | Count | Notes |
| :--- | :--- | :--- |
| `mentorados` | 3 | **Bruno Paixão**, **Elica Pereira** (Unlinked), **Mauricio** (Linked) |
| `metricas_mensais` | 1 | Only **Jan 2026** data for Mauricio exists. **Dec 2025 data is missing.** |
| `users` | 4 | 1 Linked, 3 Potential admins/users |

> [!WARNING]
> The "dataset from December 2025" mentioned in the request was **NOT found** in the `metricas_mensais` table. It implies this data needs to be imported or manually entered.

### Goal
1.  **Linkage**: Automatically link registered `users` (Clerk) to existing `mentorados` (Neon) by email.
2.  **Evolution**: Visualize monthly performance (Faturamento, Lucro, etc.) in Dashboard.
3.  **Data Entry**: Provide mechanism to input the missing Dec 2025 data.

---

## 2. Implementation Plan

### Phase 1: User-Mentee Linkage System (Critical)
**Objective**: Ensure when Bruno or Elica log in, they see *their* data.

**Logic**:
-   **Current**: `mentorados` has `email` but `user_id` is NULL.
-   **New Flow**:
    1.  Create a tRPC mutation `auth.syncUser`.
    2.  Call this mutation on `App.tsx` mount or after Clerk sign-in.
    3.  Backend logic:
        -   Get `ctx.auth.userId` (Clerk ID) and `email`.
        -   Check if `users` table has this Clerk ID. If not, insert/update.
        -   Check `mentorados` table for matching `email`.
        -   If match found AND `mentorados.user_id` is NULL:
            -   Update `mentorados` set `user_id = users.id`.
            -   Return "Linked Successfully".

### Phase 2: Missing Data Ingestion (Dec 2025)
**Objective**: Populate the missing historical data.

**Strategy**:
-   Create a **"Seed/Import" Script** or a **"Manual Entry" UI**.
-   **Recommendation**: Since it's likely just a few records, we will add a "Lançamento Retroativo" (Retroactive Entry) feature in the Dashboard or run a one-time SQL script if you provide the CSV.

### Phase 3: Dashboard Evolution (Frontend)
**Objective**: "Comparativo mensal para ver a evolução".

**Components**:
1.  **`EvolutionChart.tsx`**:
    -   Use `recharts` (AreaChart or ComposedChart).
    -   X-Axis: Month/Year (e.g., "Dez/25", "Jan/26").
    -   Lines/Bars: Faturamento vs Meta, Lucro, Leads.
2.  **Tabs**:
    -   `Dashboard`: Summary + Mini Charts.
    -   `Comparativo`: Detailed Month-over-Month table and complex charts.

### Phase 4: Backend Procedures
**Router**: `routers/metricas.ts`

-   `getEvolution`: Returns array of metrics sorted by date (ASC) for the current user.
-   `upsertMetrica`: Allow updating past months (for Dec 2025 entry).

---

## 3. Atomic Tasks

- [ ] **AT-001**: Implement `auth.syncUser` tRPC procedure to link User <-> Mentorado by email.
- [ ] **AT-002**: Create `EvolutionChart` component using `recharts` for Faturamento/Lucro.
- [ ] **AT-003**: Create `Comparativo` tab in `DashboardPage` with monthly data table.
- [ ] **AT-004**: Update `metricas` router to support fetching full history (not just current month).
- [ ] **AT-005**: (Optional) SQL Seed script for Dec 2025 data if provided.

## 4. Verification Plan

### Automated
-   **Test Linkage**: Create a mock user with email "test@example.com", create unlinked mentorado with same email. Run sync. Verify `user_id` is updated.
-   **Test Query**: Insert metrics for Dec 2025 and Jan 2026. Verify `getEvolution` returns 2 records ordered chronologically.

### Manual
-   Login as "Bruno".
-   Verify Dashboard shows "Bruno Paixão".
-   Go to "Comparativo".
-   Verify Chart shows 0 (or entered data) -> Jan 2026 data.
