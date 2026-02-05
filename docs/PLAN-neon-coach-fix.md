# PLAN-neon-coach-fix: Debug & Enhance Neon Financial Coach

> **Goal:** Fix the non-responsive Neon Coach button and enhance the financial coach with configurable settings.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | `NeonCoachCard` is imported and rendered in `TransacoesTab.tsx` at line 222 | 5/5 | Codebase search | Core integration correct |
| 2 | `coach.analyze` mutation exists in `financeiroRouter.ts` at line 654 | 5/5 | Codebase search | Backend ready |
| 3 | Settings page `FinancialCoachSettings.tsx` uses `trpc.admin.getSetting/updateSetting` | 5/5 | Codebase search | Admin route exists |
| 4 | Button handler calls `analyze()` which is the tRPC mutation | 5/5 | NeonCoachCard.tsx | Click handler correct |
| 5 | No error handling for `onError` in the mutation hook | 4/5 | NeonCoachCard.tsx | Silent failures |
| 6 | LLM invocation uses `gemini-2.0-flash-exp` with dynamic import | 4/5 | financeiroRouter.ts | Could fail silently |

### Knowledge Gaps & Assumptions
- **Gap:** Cannot confirm if LLM API key is configured correctly for this mentorado
- **Assumption:** The `invokeLLM` function is correctly configured server-side
- **Gap:** No browser console logs provided to diagnose client-side issues

---

## 1. User Review Required

> [!IMPORTANT]
> **Debugging Required:** The button click likely triggers but fails silently. We need to:
> 1. Add `onError` handler to the mutation to surface errors
> 2. Check browser Network tab for 500 errors
> 3. Verify LLM API key is set

---

## 2. Proposed Changes

### Phase 1: Debug the Coach Button

#### [MODIFY] [NeonCoachCard.tsx](file:///home/mauricio/neondash/client/src/components/financeiro/cards/NeonCoachCard.tsx)
- **Action:** Add `onError` handler to mutation to show toast on failure
- **Details:** Display error message so failures aren't silent

---

### Phase 2: Enhance Coach Configuration (After Debug)

#### [MODIFY] [FinancialCoachSettings.tsx](file:///home/mauricio/neondash/client/src/pages/admin/FinancialCoachSettings.tsx)
- **Action:** Expand settings page with additional configuration fields
- **Details:** Add fields for:
  - Focus areas (checkboxes: lucro, despesas, marketing, etc.)
  - Tone of voice (dropdown: professional, motivacional, direto)
  - Analysis depth (slider: quick vs comprehensive)

#### [MODIFY] [financeiroRouter.ts](file:///home/mauricio/neondash/server/financeiroRouter.ts)
- **Action:** Enhance `coach.analyze` to include more financial data
- **Details:** Add:
  - Monthly aggregates (receita, despesa, lucro)
  - Category breakdowns
  - Comparison with previous periods

---

## 3. Atomic Implementation Tasks

### AT-001: Add Error Handling to NeonCoachCard
**Goal:** Surface mutation errors to the user
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Add `onError` callback to mutation hook
  - **File:** `client/src/components/financeiro/cards/NeonCoachCard.tsx`
  - **Validation:** `bun run check` passes
- [ ] ST-001.2: Display toast with error message
  - **File:** Same file
  - **Validation:** Manual test - click button, check for error toast if fails

**Rollback:** `git checkout client/src/components/financeiro/cards/NeonCoachCard.tsx`

---

### AT-002: Test Coach Button in Browser
**Goal:** Verify the button works and identify root cause
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Open Financeiro page in browser, open DevTools Network tab
  - **Validation:** See tRPC request to `financeiro.coach.analyze`
- [ ] ST-002.2: Click "Gerar Análise Financeira" button
  - **Validation:** Request fires, check response status
- [ ] ST-002.3: If 500 error, check server logs for LLM invocation errors
  - **Validation:** Identify specific error message

**Rollback:** N/A (read-only debugging)

---

## 4. Verification Plan

### Automated Tests
- `bun run check` - TypeScript validation
- `bun run lint` - Code formatting

### Manual Verification
1. Navigate to Financeiro > Transações tab
2. Scroll to NeonCoachCard section
3. Click "Gerar Análise Financeira" button
4. **Expected:** Either:
   - Loading spinner appears → AI response displays
   - Error toast appears with message (if API fails)
5. Check browser console for errors

---

## 5. Rollback Plan

```bash
git checkout client/src/components/financeiro/cards/NeonCoachCard.tsx
```
