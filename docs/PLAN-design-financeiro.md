# PLAN-design-financeiro: Financial Dashboard Overhaul
> **Goal:** Transform the Financial page into a high-engagement, gamified, and prestigious dashboard using the "Avant-Garde" Neon/Gold aesthetic.

## Research Findings
| # | Finding | Confidence | Source |
|---|---------|------------|--------|
| 1 | `NeonCard` exists but is underutilized (basic bg colors) | High | `TransacoesTab.tsx` |
| 2 | `BentoGrid` is available for better layouts | High | `components/ui/bento-grid.tsx` |
| 3 | `Animation` components available (Counter, Progress, Confetti) | High | `components/ui/` |
| 4 | No visual charts currently in Transacoes tab | High | `TransacoesTab.tsx` |
| 5 | Theme variables for Navy/Gold are defined in `index.css` | High | `index.css` |
| 6 | `Recharts` is available in package.json | High | `package.json` |

## Design Specs
- **Theme:** "Opulence" - Deep Navy backgrounds (`bg-slate-950` / `bg-neon-blue-dark`), Gold Accents (`text-neon-gold`), Glassmorphism cards.
- **Hierarchy:**
  1.  **Hero Section:** Financial Health Score + Current Balance (Glow effect).
  2.  **Neon Coach:** AI-powered financial advisor card (Full Width or Prominent).
  3.  **Gamification:** "Streak" of days tracking finance + "Level" based on consistency.
  4.  **Action Area:** Quick Add Transaction (Floating Action/Prominent Button).
  5.  **Data:** Recent Activity (Bento or clean list) + Month Summary.
- **Typography:** Manrope (headings), JetBrains Mono (numbers/currency).

## Gamification Strategy
1.  **Consistency Streak:** Track days in a row with at least 1 transaction/check-in.
2.  **Monthly Goal Progress:** Circular progress bar showing % of revenue goal.
3.  **Celebration:** Confetti explosion when "Lucro" > 0 or Goal reached.

## Proposed Changes

### Phase 1: Component Upgrades
#### [MODIFY] `TransacoesTab.tsx`
- Replace simple grid with `BentoGrid`.
- **Card 1 (Hero):** "Saldo Atual" - Uses `NeonCard` variant="glow". Animated Counter for value.
- **Card 2 (Neon Coach):** "Neon Coach Financeiro" - AI Insights card.
  - Textarea/Display area for AI suggestions.
  - "Gerar Análise" button triggering AI.
- **Card 3 (Income/Expense):** Split view with mini trend indicators.
- **Card 4 (Gamification):** "Ofensiva Financeira" (Streak). Show fire icon + days count.
- **Card 5 (Goal):** "Meta Mensal" - Circular progress ring.
- **Charts:** Add a simple AreaChart (Recharts) for 30-day cash flow in a wide Bento card.

### Phase 1.5: Neon Coach & Settings
#### [NEW] `client/src/pages/admin/FinancialCoachSettings.tsx`
- Configuration page for Financial Coach.
- Fields: `Master Prompt`, `Analysis Focus` (e.g., Cost reduction, Revenue growth).
- Save to `adminSettings` or similar table.

#### [NEW] `client/src/components/financeiro/NeonCoachCard.tsx`
- Component to display AI analysis.
- Connects to a new tRPC endpoint `financeiro.analyze`.

#### [MODIFY] `server/routers/financeiroRouter.ts`
- Add `analyze` mutation.
- Fetches financial data (summary, recent transactions).
- Calls AI service (mock or real) using the configured Master Prompt.

### Phase 2: Visual Polish
- **Icons:** Replace standard Lucide icons with animated versions or larger, styled icons (Gold/Gradient).
- **Animations:** Entry animations (`framer-motion`) for table rows and cards.
- **Interactions:** Hover effects on all cards (lift + glow).

### Phase 3: "Empty State" Gamification
- If no data, show a "Start Your Empire" empty state with a gold coin illustration (using `generate_image` later if needed, or CSS art).

---

## Atomic Implementation Tasks

### AT-001: Implement Financial Health & Streak Logic
- [ ] Calculate "Streak" (consecutive days with transactions) on client-side from `transacoes` list.
- [ ] Calculate "Health Score" (Profit Margin %).

### AT-002: Rebuild TransacoesTab with BentoGrid
- [ ] Replace top grid with `BentoGrid`.
- [ ] Create `FinancialSummaryCard` (Saldo).
- [ ] Create `StreakCard` (Gamification).
- [ ] Create `QuickActionCard` (New Transaction).

### AT-003: Implement Neon Coach (Financeiro)
- [ ] Create `FinancialCoachSettings` page in `client/src/pages/admin/`.
- [ ] Update `adminRouter` to handle financial coach settings keys (`financial_coach_prompt`, `financial_coach_config`).
- [ ] Create `NeonCoachCard` component in `client/src/components/financeiro/`.
- [ ] Implement `financeiro.analyze` procedure in backend (calls AI with context).

### AT-004: Integrate Charts
- [ ] Add `Recharts` AreaChart for daily balance evolution.

### AT-005: Apply Neon/Gold Theme
- [ ] Update all colors to use `var(--color-neon-gold)` and `var(--color-neon-blue-dark)`.
- [ ] Add `celebration-effect` triggering on positive balance.

## Verification Plan
- **Manual:**
  - Verify "Glow" effect on Saldo card.
  - Check Streak calculation (add transaction yesterday/today).
  - Check Mobile responsiveness of BentoGrid.
  - Verify Confetti triggers on goal reached.
