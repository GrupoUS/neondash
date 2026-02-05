# PLAN-agenda-event-defaults: Agenda Event Default Behavior

> **Goal:** Ensure new events are always created with 1-hour duration on the same day, and drag-drop maintains original event duration without spanning multiple days.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | `handleSelectSlot` (line 226-239 Agenda.tsx) passes raw slot dates to `EventFormDialog` without enforcing 1h duration | 5/5 | Codebase | High |
| 2 | `onEventDrop` (line 204-224 Agenda.tsx) uses DnD-provided `start`/`end` directly, allowing multi-day spans | 5/5 | Codebase | High |
| 3 | `EventFormDialog` form reset (lines 121-132) uses raw `defaultDate.end` without duration enforcement | 5/5 | Codebase | High |
| 4 | react-big-calendar `onEventDrop` receives `{event, start, end, allDay}` - we can override `end` calculation | 5/5 | Context7 | High |
| 5 | Current `allDay` detection uses `slots.length === 1` which may be unreliable for time slots | 4/5 | Codebase | Medium |

### Knowledge Gaps & Assumptions
- **Assumption:** User wants 1-hour duration as the universal default for time-based events (not all-day)
- **Assumption:** Drag-drop should preserve original event duration when moving to a new day/time

---

## 1. User Review Required

> [!IMPORTANT]
> **Clarification Needed:** Should the 1-hour default apply only when clicking on a slot in week/day view, or also when using the month view? Currently planning for all non-all-day slot selections.

---

## 2. Proposed Changes

### Client - Agenda Page

#### [MODIFY] [Agenda.tsx](file:///home/mauricio/neondash/client/src/pages/Agenda.tsx)

**Changes:**

1. **`handleSelectSlot` (lines 226-239):** Enforce 1-hour default duration for new events
   - If `end - start > 1 hour` → set `end = start + 1 hour`
   - If all-day slot → keep existing behavior

2. **`onEventDrop` (lines 204-224):** Preserve original event duration instead of using DnD `end`
   - Calculate original duration: `event.end - event.start`
   - Apply to new position: `newEnd = newStart + originalDuration`
   - Ensure event stays on same day as `start` (truncate to 23:59 if needed)

3. **`onEventResize` (lines 185-202):** Add same-day constraint
   - If `end` date differs from `start` date → set `end` to `start` date at 23:59

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Each task has subtasks with validation criteria.

### AT-001: Enforce 1-Hour Default Duration on Slot Selection ⚡ PARALLEL-SAFE
**Goal:** When user clicks/selects a time slot, ensure the event dialog opens with 1-hour duration default
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Create utility function `ensureOneHourDuration(start: Date, end: Date): Date`
  - **File:** `client/src/pages/Agenda.tsx`
  - **Logic:** If `end - start !== 1 hour`, return `start + 1 hour`
  - **Validation:** Console log before/after in dev mode

- [ ] ST-001.2: Modify `handleSelectSlot` to apply 1-hour enforcement
  - **File:** `client/src/pages/Agenda.tsx` (lines 226-239)
  - **Logic:** 
    ```typescript
    const adjustedEnd = isAllDay ? end : ensureOneHourDuration(start, end);
    setSelectedSlot({ start: new Date(start), end: adjustedEnd, allDay: isAllDay });
    ```
  - **Validation:** Click on week/day view slots → dialog shows 1h duration

**Rollback:** Revert `handleSelectSlot` to original implementation

---

### AT-002: Preserve Event Duration on Drag-Drop ⚡ PARALLEL-SAFE
**Goal:** When dragging an event, maintain its original duration instead of allowing multi-day spans
**Dependencies:** None

#### Subtasks:
- [ ] ST-002.1: Create utility function `calculateEndFromDuration(start: Date, originalStart: Date, originalEnd: Date): Date`
  - **File:** `client/src/pages/Agenda.tsx`
  - **Logic:** `return new Date(start.getTime() + (originalEnd.getTime() - originalStart.getTime()))`
  - **Validation:** Unit test with various durations

- [ ] ST-002.2: Modify `onEventDrop` to preserve original duration
  - **File:** `client/src/pages/Agenda.tsx` (lines 204-224)
  - **Logic:**
    ```typescript
    const originalDuration = event.end.getTime() - event.start.getTime();
    const newEnd = new Date(new Date(start).getTime() + originalDuration);
    ```
  - **Validation:** Drag event → verify end time maintains original duration

- [ ] ST-002.3: Add same-day constraint to prevent multi-day events on drop
  - **File:** `client/src/pages/Agenda.tsx`
  - **Logic:** If `newEnd` date > `start` date → set `newEnd` to same day at 23:59
  - **Validation:** Drag 1-hour event to 23:30 → verify it doesn't span to next day

**Rollback:** Revert `onEventDrop` to original implementation

---

### AT-003: Add Same-Day Constraint on Event Resize
**Goal:** Prevent resizing events to span multiple days
**Dependencies:** None

#### Subtasks:
- [ ] ST-003.1: Modify `onEventResize` to constrain end date to same day
  - **File:** `client/src/pages/Agenda.tsx` (lines 185-202)
  - **Logic:**
    ```typescript
    let adjustedEnd = new Date(end);
    const startDate = new Date(start);
    if (adjustedEnd.toDateString() !== startDate.toDateString()) {
      adjustedEnd = new Date(startDate);
      adjustedEnd.setHours(23, 59, 59, 999);
    }
    ```
  - **Validation:** Try to resize event past midnight → verify it stops at 23:59

**Rollback:** Revert `onEventResize` to original implementation

---

## 4. Verification Plan

### Automated Tests
Currently no frontend test for Agenda.tsx. Manual verification is required.

```bash
# Type checking
bun run check

# Linting
bun run lint

# Unit tests (if any)
bun test
```

### Manual Verification

1. **New Event Creation (1-hour default):**
   - Open Agenda page
   - Switch to "Week" view
   - Click on a time slot (e.g., 10:00)
   - Verify dialog shows: Start Time = 10:00, End Time = 11:00

2. **Drag-Drop Duration Preservation:**
   - Create a 2-hour event (e.g., 10:00-12:00)
   - Drag the event to a different day/time (e.g., next day at 14:00)
   - Verify event is now 14:00-16:00 (same 2-hour duration)

3. **Same-Day Constraint on Drop:**
   - Create a 1-hour event at 23:00
   - Drag to 23:30 on the same day
   - Verify event stays on same day (23:30-00:29 should become 23:30-23:59)

4. **Same-Day Constraint on Resize:**
   - Create a 1-hour event at 22:00
   - Try to resize end time past midnight
   - Verify event end stops at 23:59

---

## 5. Rollback Plan

```bash
# If changes break functionality
git checkout -- client/src/pages/Agenda.tsx

# Or revert specific commit
git revert <commit-sha>
```
