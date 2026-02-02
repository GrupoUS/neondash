# PLAN-agenda-redesign: Neon Integrated Schedule

> **Goal:** Redesign the Agenda page to match the "Neon Clinic Integrated Schedule" visual design, including sidebar integration, dark-themed calendar, and dashboard widgets.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | `Agenda.tsx` uses `react-big-calendar`. | 5/5 | `client/src/pages/Agenda.tsx` | Reuse core logic, replace UI wrapper. |
| 2 | `DashboardLayout.tsx` controls sidebar. | 5/5 | `client/src/components/DashboardLayout.tsx` | Need to add Agenda link here. |
| 3 | Project uses Navy/Gold (GPUS) theme. | 4/5 | Conversation Context | Styling must match this palette. |
| 4 | No existing "Schedule" components found. | 5/5 | `list_dir` | Need to build `QuickStats`, `NextPatient`, `Filters`. |
| 5 | External "neonpro" repo inaccessible. | 5/5 | Tool Constraints | Must build components from scratch based on image. |

### Knowledge Gaps & Assumptions
- **Gap:** Logic for "Expected Revenue" is not present in current data model.
- **Assumption:** We will use mock data or count-based estimates for stats initially.
- **Assumption:** "Next Patient" is the next upcoming event in the list.
- **Assumption:** Filters will operate on client-side event data (text matching).

---

## 2. Proposed Changes

### Phase 1: Sidebar Integration
#### [MODIFY] `client/src/components/DashboardLayout.tsx`
- Add `/agenda` to `navItems` with Calendar icon.

### Phase 2: Component Creation
#### [NEW] `client/src/components/agenda/NextPatientBanner.tsx`
- Highlight card for the next upcoming event.
#### [NEW] `client/src/components/agenda/QuickStats.tsx`
- Sidebar card showing Total Appointments, Revenue (estimated), New Patients.
#### [NEW] `client/src/components/agenda/ScheduleFilters.tsx`
- Dropdowns for Professional and Room filtering.
#### [NEW] `client/src/components/agenda/NeonCalendarWrapper.tsx`
- Custom styled wrapper for `react-big-calendar`.

### Phase 3: Page Redesign
#### [MODIFY] `client/src/pages/Agenda.tsx`
- Implement 2-column grid layout (Calendar Left, Widgets Right).
- Integrate new components.
- Apply Navy/Gold theme styles (Gold borders, Dark background).

---

## 3. Atomic Implementation Tasks

### AT-001: Sidebar Integration
**Goal:** Add Agenda link to proper navigation location.
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Import `Calendar` icon from `lucide-react` in `DashboardLayout.tsx`.
  - **File:** `client/src/components/DashboardLayout.tsx`
  - **Validation:** Visual check of sidebar.
- [ ] ST-001.2: Add `/agenda` item to `navItems` array.
  - **File:** `client/src/components/DashboardLayout.tsx`
  - **Validation:** Link navigates to Agenda page.

### AT-002: Agenda Components Implementation
**Goal:** Build individual UI widgets for the agenda dashboard.
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Create `NextPatientBanner` component.
  - **File:** `client/src/components/agenda/NextPatientBanner.tsx`
  - **Validation:** Renders static data correctly.
- [ ] ST-002.2: Create `QuickStats` component.
  - **File:** `client/src/components/agenda/QuickStats.tsx`
  - **Validation:** Renders stats grid.
- [ ] ST-002.3: Create `ScheduleFilters` component.
  - **File:** `client/src/components/agenda/ScheduleFilters.tsx`
  - **Validation:** Renders styled select inputs.

### AT-003: Agenda Page Assembly
**Goal:** Assemble the full page layout and integrate logic.
**Dependencies:** AT-002

#### Subtasks:
- [ ] ST-003.1: Refactor `Agenda.tsx` layout structure (Grid).
  - **File:** `client/src/pages/Agenda.tsx`
  - **Validation:** Page structure is 2-column.
- [ ] ST-003.2: Integrate `NextPatientBanner` with real event data.
  - **File:** `client/src/pages/Agenda.tsx`
  - **Validation:** Shows correct next event.
- [ ] ST-003.3: Integrate `QuickStats` and `Filters`.
  - **File:** `client/src/pages/Agenda.tsx`
  - **Validation:** Widgets appear in sidebar.
- [ ] ST-003.4: Apply Custom CSS for `react-big-calendar`.
  - **File:** `client/src/pages/Agenda.tsx` (or new css file)
  - **Validation:** Calendar visual matches Grid styling (Navy/Gold).

---

## 4. Verification Plan

### Automated Tests
- `bun run check`
- `bun run lint`

### Manual Verification
- **Sidebar**: Verify "Agenda" link exists and is active.
- **Layout**: Verify 2-column layout on desktop, stacked on mobile.
- **Visuals**: Verify Gold borders, "Neon" glow effects, Dark background.
- **Data**: Verify "Next Patient" updates based on current time/events.
- **Interactions**: Verify Calendar view switching and event clicking.

---

## 5. Rollback Plan
- Revert changes to `DashboardLayout.tsx` and `Agenda.tsx`.
- Delete `client/src/components/agenda/` directory.
