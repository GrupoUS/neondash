# PLAN-agenda-enhancement: Agenda Page Enhancement

> **Goal:** Enhance the Agenda page with sidebar, drag-and-drop events, real-time stats, and fullscreen calendar layout.

---

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | `withDragAndDrop` HOC enables drag/drop/resize for react-big-calendar | 5/5 | Context7 docs | Enables event manipulation |
| 2 | `onSelectSlot` + `selectable` prop allows slot selection for new events | 5/5 | Context7 docs | Enables creating events |
| 3 | `onEventDrop`/`onEventResize` callbacks provide new dates | 5/5 | Context7 docs | Enables event updates |
| 4 | `DashboardLayout` wraps all other pages with sidebar | 5/5 | Codebase grep | Pattern for sidebar |
| 5 | Current `NextPatientBanner` and `QuickStats` use hardcoded mock data | 5/5 | View file | Need to derive from events |
| 6 | Need `react-big-calendar/lib/addons/dragAndDrop/styles.css` for DnD | 5/5 | Context7 docs | CSS import required |

### Knowledge Gaps
- Google Calendar API requires `calendar.events` scope for write access (currently `calendar.readonly`)
- To update events, need to implement `patch` or `update` in service and router
- Re-authentication will be required for all users due to scope change

### Assumptions
- **Assumption 1:** User accepts the "unverified app" warning during re-authentication (unless they verified it)
- **Assumption 2:** "Next Patient" = first event starting after current time today
- **Assumption 3:** Stats calculated from current month's events

---

## 1. User Review Required

> [!IMPORTANT]
> **Re-authentication Required**
> 
> Changing the OAuth scope to `calendar.events` (write access) means **ALL users must disconnect and reconnect** their Google Calendar to grant the new permissions.
> 
> **Two-Way Sync Strategy:**
> 1.  **Scope:** Update to `https://www.googleapis.com/auth/calendar.events`
> 2.  **Backend:** Implement `createEvent`, `updateEvent` (patch), `deleteEvent` in `googleCalendarService` and `calendarRouter`
> 3.  **Frontend:** Call TRPC mutations on `onEventDrop`, `onEventResize`, and form submit
> 4.  **Optimistic Updates:** UI updates immediately, reverts on error

---

## 2. Proposed Changes

### Phase 1: Backend & Two-Way Sync Support

#### [MODIFY] [googleCalendarService.ts](file:///home/mauricio/neondash/server/services/googleCalendarService.ts)
- Update `SCOPES` to `["https://www.googleapis.com/auth/calendar.events"]`
- Implement `createEvent(accessToken, eventEvent)`
- Implement `updateEvent(accessToken, eventId, eventData)` (PATCH)
- Implement `deleteEvent(accessToken, eventId)`

#### [MODIFY] [calendar.ts](file:///home/mauricio/neondash/server/routers/calendar.ts)
- Add `createEvent` mutation (Zod input: title, start, end, description)
- Add `updateEvent` mutation (Zod input: id, start, end)
- Add `deleteEvent` mutation (Zod input: id)

#### [MODIFY] [Agenda.tsx](file:///home/mauricio/neondash/client/src/pages/Agenda.tsx)
- Wrap content with `DashboardLayout` component
- Remove background styling that conflicts with layout

---

### Phase 2: Drag-and-Drop Implementation

#### [MODIFY] [Agenda.tsx](file:///home/mauricio/neondash/client/src/pages/Agenda.tsx)
- Import `withDragAndDrop` HOC and CSS
- Create `DnDCalendar = withDragAndDrop(Calendar)`
- Add `selectable={true}` prop
- Implement `onSelectSlot` -> open Dialog
- Implement `onEventDrop` -> call `updateEvent.mutate` (optimistic update)
- Implement `onEventResize` -> call `updateEvent.mutate` (optimistic update)
- Add local state for optimistic UI updates

#### [NEW] [EventFormDialog.tsx](file:///home/mauricio/neondash/client/src/components/agenda/EventFormDialog.tsx)
- Dialog for creating/editing events
- Fields: title, start, end, description
- Uses shadcn Dialog + Form

---

### Phase 3: Real Data Integration

#### [MODIFY] [NextPatientBanner.tsx](file:///home/mauricio/neondash/client/src/components/agenda/NextPatientBanner.tsx)
- Accept `events` array as prop
- Calculate next upcoming event from current time
- Display "No upcoming appointments" when none

#### [MODIFY] [QuickStats.tsx](file:///home/mauricio/neondash/client/src/components/agenda/QuickStats.tsx)
- Accept `events` array as prop
- Calculate total appointments (current month)
- Calculate "Expected Revenue" placeholder or estimate
- Count unique titles as "New Patients" proxy

#### [MODIFY] [Agenda.tsx](file:///home/mauricio/neondash/client/src/pages/Agenda.tsx)
- Pass real events to `NextPatientBanner` and `QuickStats`

---

### Phase 4: Fullscreen Calendar Layout

#### [MODIFY] [Agenda.tsx](file:///home/mauricio/neondash/client/src/pages/Agenda.tsx)
- Change grid from `grid-cols-4` to single column
- Move `QuickStats` and `Filters` to horizontal bar above calendar
- Increase calendar height to `calc(100vh - 200px)`
- Remove `NextPatientBanner` (or make compact inline)

---

## 3. Atomic Implementation Tasks

### AT-001: Backend Two-Way Sync Support
**Goal:** Enable write access to Google Calendar
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Update SCOPES in `googleCalendarService.ts`
  - **File:** `server/services/googleCalendarService.ts`
  - **Validation:** Check value is `calendar.events`
- [ ] ST-001.2: Implement `updateEvent` (patch) in service
  - **File:** `server/services/googleCalendarService.ts`
  - **Validation:** Code compiles
- [ ] ST-001.3: Implement `createEvent` in service
  - **File:** `server/services/googleCalendarService.ts`
  - **Validation:** Code compiles
- [ ] ST-001.4: Add `updateEvent` mutation to `calendar.ts` router
  - **File:** `server/routers/calendar.ts`
  - **Validation:** Mutation accepts id, start, end
- [ ] ST-001.5: Add `createEvent` mutation to `calendar.ts` router
  - **File:** `server/routers/calendar.ts`
  - **Validation:** Mutation accepts payload

**Rollback:** `git checkout server/services/googleCalendarService.ts server/routers/calendar.ts`

---

### AT-002: DashboardLayout & Drag-and-Drop UI
**Goal:** UI structure and interactivity
**Dependencies:** AT-001 (for mutations)

#### Subtasks:
- [ ] ST-002.1: Wrap `Agenda.tsx` with `DashboardLayout`
  - **File:** `client/src/pages/Agenda.tsx`
  - **Validation:** Sidebar visible
- [ ] ST-002.2: Implement `DnDCalendar` and styles
  - **File:** `client/src/pages/Agenda.tsx`
  - **Validation:** Calendar renders with DnD
- [ ] ST-002.3: Connect `onEventDrop` / `onEventResize` to mutations
  - **File:** `client/src/pages/Agenda.tsx`
  - **Validation:** Dragging event calls backend

**Rollback:** `git checkout client/src/pages/Agenda.tsx`

---

### AT-003: Create Event Form Dialog ⚡ PARALLEL-SAFE
**Goal:** Modal for creating new events
**Dependencies:** None (can be parallel with AT-002)

#### Subtasks:
- [ ] ST-003.1: Create `EventFormDialog.tsx` component
  - **File:** `client/src/components/agenda/EventFormDialog.tsx`
  - **Validation:** Component exports correctly
- [ ] ST-003.2: Add form fields (title, start, end datetime, description)
  - **File:** `client/src/components/agenda/EventFormDialog.tsx`
  - **Validation:** Form renders with inputs
- [ ] ST-003.3: Style with GPUS theme (Navy/Gold)
  - **File:** `client/src/components/agenda/EventFormDialog.tsx`
  - **Validation:** Matches existing theme

**Rollback:** `rm client/src/components/agenda/EventFormDialog.tsx`

---

### AT-004: Slot Selection for New Events
**Goal:** Click/drag on calendar to create events
**Dependencies:** AT-002, AT-003

#### Subtasks:
- [ ] ST-004.1: Add `selectable={true}` prop to calendar
  - **File:** `client/src/pages/Agenda.tsx`
  - **Validation:** Slots are selectable
- [ ] ST-004.2: Implement `onSelectSlot` to open EventFormDialog
  - **File:** `client/src/pages/Agenda.tsx`
  - **Validation:** Dialog opens on slot select
- [ ] ST-004.3: Call `createEvent` mutation on form submit
  - **File:** `client/src/pages/Agenda.tsx`
  - **Validation:** New event created in Google & UI

**Rollback:** `git checkout client/src/pages/Agenda.tsx`

---

### AT-005: Real Data for NextPatientBanner
**Goal:** Display actual next appointment
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-005.1: Modify props to accept `events` array
  - **File:** `client/src/components/agenda/NextPatientBanner.tsx`
  - **Validation:** TypeScript accepts new prop
- [ ] ST-005.2: Calculate next event from current time
  - **File:** `client/src/components/agenda/NextPatientBanner.tsx`
  - **Validation:** Shows correct next event
- [ ] ST-005.3: Handle empty state (no upcoming events)
  - **File:** `client/src/components/agenda/NextPatientBanner.tsx`
  - **Validation:** Shows "No upcoming appointments"
- [ ] ST-005.4: Update Agenda.tsx to pass events
  - **File:** `client/src/pages/Agenda.tsx`
  - **Validation:** Props connected correctly

**Rollback:** `git checkout client/src/components/agenda/NextPatientBanner.tsx client/src/pages/Agenda.tsx`

---

### AT-006: Real Data for QuickStats
**Goal:** Calculate stats from actual events
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-006.1: Modify props to accept `events` array
  - **File:** `client/src/components/agenda/QuickStats.tsx`
  - **Validation:** TypeScript accepts new prop
- [ ] ST-006.2: Calculate total appointments (current month)
  - **File:** `client/src/components/agenda/QuickStats.tsx`
  - **Validation:** Count matches events
- [ ] ST-006.3: Update Agenda.tsx to pass events
  - **File:** `client/src/pages/Agenda.tsx`
  - **Validation:** Props connected correctly

**Rollback:** `git checkout client/src/components/agenda/QuickStats.tsx client/src/pages/Agenda.tsx`

---

### AT-007: Fullscreen Calendar Layout
**Goal:** Maximize calendar visibility
**Dependencies:** AT-001, AT-005, AT-006

#### Subtasks:
- [ ] ST-007.1: Change grid to single column layout
  - **File:** `client/src/pages/Agenda.tsx`
  - **Validation:** No sidebar column on right
- [ ] ST-007.2: Move stats to horizontal bar above calendar
  - **File:** `client/src/pages/Agenda.tsx`
  - **Validation:** Stats show as row
- [ ] ST-007.3: Increase calendar height to near fullscreen
  - **File:** `client/src/pages/Agenda.tsx`
  - **Validation:** Calendar fills viewport
- [ ] ST-007.4: Make NextPatientBanner compact/inline
  - **File:** `client/src/pages/Agenda.tsx`
  - **Validation:** Less vertical space used

**Rollback:** `git checkout client/src/pages/Agenda.tsx`

---

## 4. Verification Plan

### Automated Tests
```bash
bun run check    # TypeScript validation
bun run lint     # Biome lint + format
bun run build    # Production build
```

### Manual Verification
1. **Sidebar visible:** Navigate to `/agenda`, verify sidebar appears with menu items
2. **Drag event:** Drag an existing event to different day, verify it moves
3. **Resize event:** Drag edge of event to change duration
4. **Create event:** Click empty slot, fill form, verify event appears
5. **Next Patient:** Verify banner shows next upcoming event (not mock)
6. **Quick Stats:** Verify count matches number of events
7. **Fullscreen calendar:** Verify calendar is larger and fills most of the page

---

## 5. Rollback Plan

```bash
# Revert all changes
git checkout client/src/pages/Agenda.tsx
git checkout client/src/components/agenda/NextPatientBanner.tsx
git checkout client/src/components/agenda/QuickStats.tsx
rm client/src/components/agenda/EventFormDialog.tsx 2>/dev/null
```
