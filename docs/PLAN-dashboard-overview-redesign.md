# PLAN-dashboard-overview-redesign: Dashboard Overview Redesign

> **Goal:** Redesign the Dashboard "Overview" tab to match the "High Performer" single-mentee view, including financial history, ROI, notes, and milestones.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Current "Visão Geral" (`Home.tsx`) is an Admin Dashboard (Top Performers, etc). | 5/5 | `client/src/pages/Home.tsx` | Replacing it directly breaks Admin capabilities unless conditioned by Role or Selection. |
| 2 | Image data maps to `metricasMensais` (Financials), `mentorados` (Header), `diagnosticos` (Specialty). | 4/5 | `drizzle/schema.ts` | Existing data structures are largely sufficient. |
| 3 | "Anotações Privadas" can use `interacoes` table (type='nota'). | 4/5 | `drizzle/schema.ts` | Reuse existing table instead of creating new one. |
| 4 | "Histórico de Reuniões" likely maps to `interacoes` (type='reuniao') or `classes` (type='encontro'). | 3/5 | `drizzle/schema.ts` | Need to confirm if "reuniao" interactions are actively used/logged. |
| 5 | "Marcos" (Milestones) like "Início", "Primeira Clínica" don't have a dedicated table. | 3/5 | `drizzle/schema.ts` | May need new `timeline_events` or logic based on `diagnosticos`/`tasks`. |

### Knowledge Gaps & Assumptions
- **Gap:** How specific milestones ("Contratação da Primeira Secretária") are tracked.
- **Assumption:** The user wants this view to appear when clicking into a mentee's details (or logged in as mentee), not replacing the global admin dashboard.
- **Assumption:** "ROI" will be calculated based on (Revenue / Fixed Cost) or simple Revenue growth, as investment data is missing.
- **Assumption:** The uploaded image represents the target design for *Desktop*.

---

## 1. User Review Required

> [!IMPORTANT]
> **Integration Context**: This design represents a **Single Mentee** view. The current "Visão Geral" in `Home.tsx` is an **Admin Aggregation** view.
> We will implement this as `MenteeOverview.tsx`. You will need to decide:
> 1. Should this be a new page (e.g., `/mentorado/:id`)?
> 2. Or a modal/sidebar/drill-down from the main dashboard?
> *Plan assumes implementation of the component and a route to view it.*

> [!WARNING]
> **Milestones**: We will use a mockup data structure or query specific `tasks`/`diagnosticos` fields to populate this for now, as no dedicated "Timeline" table exists.

---

## 2. Proposed Changes

### Phase 1: Backend Data Access (tRPC)

#### [MODIFY] `server/mentoradosRouter.ts`
- **Action:** Add `getOverviewData` procedure.
- **Details:** Fetch:
  - Mentee Header (Name, Avatar, Specialty from `diagnosticos`).
  - Financials (Last 12 months from `metricasMensais` for chart & totals).
  - Notes (Recent `interacoes` of type 'nota').
  - Meetings (Recent `interacoes` of type 'reuniao').

#### [MODIFY] `server/interacoesRouter.ts` (if exists, or add to `routers.ts`)
- **Action:** Ensure `createNote` and `getNotes` exist.

### Phase 2: Frontend Components

#### [NEW] `client/src/components/dashboard/MenteeOverview.tsx`
- **Action:** Main container implementing the layout in the image.
- **Details:** Grid layout with Header, Financial Chart (Left), Stats (Center), Notes & Meetings (Right), Timeline (Bottom).

#### [NEW] `client/src/components/dashboard/FinancialHistoryChart.tsx`
- **Action:** Recharts LineChart implementation.
- **Details:** Gold gradient styling to match "High Performer" theme.

#### [NEW] `client/src/components/dashboard/MilestoneTimeline.tsx`
- **Action:** Horizontal scrollable timeline.
- **Details:** Display milestones with icons.

#### [NEW] `client/src/components/dashboard/MentorNotes.tsx`
- **Action:** Textarea with "Salvar Notas" button.
- **Details:** Wires to `createNote` mutation.

---

## 3. Atomic Implementation Tasks

### AT-001: Backend Data Preparation
**Goal:** Create tRPC endpoints to fetch all required data for the single view.
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Create `getOverviewStats` in `mentoradosRouter` (Financials, ROI calculation).
  - **File:** `server/mentoradosRouter.ts`
  - **Validation:** `await trpc.mentorados.getOverviewStats.query({ mentoradoId: 1 })`
- [ ] ST-001.2: Create/Verify `getInteractionNotes` and `createNote` in backend.
  - **File:** `server/routers.ts` (or relevant router)
  - **Validation:** Test creating and fetching a note.

### AT-002: UI Components Skeleton
**Goal:** Create the visual structure matching the image (Grid, Cards, Typography).
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Implement `MenteeOverview` container with CSS Grid layout.
  - **File:** `client/src/components/dashboard/MenteeOverview.tsx`
  - **Validation:** Render component and verify layout responsiveness.
- [ ] ST-002.2: Implement `FinancialHistoryChart` with mock data.
  - **File:** `client/src/components/dashboard/FinancialHistoryChart.tsx`
  - **Validation:** Visual check of chart styling (Gold gradient).

### AT-003: Feature Components (Notes, Timeline, Meetings)
**Goal:** Implement the interactive and list widgets.
**Dependencies:** AT-002

#### Subtasks:
- [ ] ST-003.1: Implement `MentorNotes` component with mutation.
  - **File:** `client/src/components/dashboard/MentorNotes.tsx`
  - **Validation:** Type note -> Save -> Refresh -> Verify persistence.
- [ ] ST-003.2: Implement `MilestoneTimeline` (static/mock for now).
  - **File:** `client/src/components/dashboard/MilestoneTimeline.tsx`
  - **Validation:** Verify horizontal scrolling and styling.
- [ ] ST-003.3: Implement `MeetingHistory` list.
  - **File:** `client/src/components/dashboard/MenteeOverview.tsx` (or separate component)
  - **Validation:** Check visual alignment.

### AT-004: Integration
**Goal:** Hook up real data and place component in the app.
**Dependencies:** AT-003

#### Subtasks:
- [ ] ST-004.1: Connect `MenteeOverview` to `useQuery` from AT-001.
  - **File:** `client/src/components/dashboard/MenteeOverview.tsx`
  - **Validation:** Verify real data loads.
- [ ] ST-004.2: Add route or conditional interaction to view this.
  - **File:** `client/src/pages/Home.tsx` (or `App.tsx` router)
  - **Validation:** Navigate to view and confirm functionality.

---

## 4. Verification Plan

### Automated Tests
- `bun run check` - Verify tRPC type safety.
- `bun test` - Unit test strict utility functions (e.g. ROI calc).

### Manual Verification
- **Visual:** Compare implementation vs Image.
  - Check Dark Mode compatibility (Gold/Navy theme).
  - Check Chart gradients.
- **Functional:**
  - Add a note -> Verify it appears.
  - Check Financial numbers match DB.

---

## 5. Rollback Plan

- Revert `server/mentoradosRouter.ts` changes.
- Delete new components in `client/src/components/dashboard/`.
