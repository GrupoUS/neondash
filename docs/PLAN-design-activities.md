# PLAN-design-activities: Enhanced Activities & Admin Interaction

> **Goal:** Transform the Activities tab into an interactive learning hub with detailed implementation guides (accordions) and robust feedback loops (admin grading/notes).

## Research Findings
| # | Finding | Confidence | Source |
|---|---------|------------|--------|
| 1 | Activities are currently a flat list of steps with simple checkboxes. | 100% | `AtividadesContent.tsx` |
| 2 | `atividadeProgress` table stores `completed` and user `notes`, but no `grade` or admin `feedback`. | 100% | `schema.ts` |
| 3 | `atividades-data.ts` lacks detailed implementation guides (only short descriptions). | 100% | `atividades-data.ts` |
| 4 | Admin view exists (`mentoradoId` prop) but is read-only for progress. | 100% | `AtividadesContent.tsx` |

## Design Specs

### I. UX Redesign: Subactivity Accordions
Instead of a simple list, each **Step** (Subactivity) will be an expandable Accordion Item.
- **Collapsed State:**
  - Checkbox (Status)
  - Activity Grade (e.g., "9.5/10") if graded.
  - Step Label.
  - Short Description.
- **Expanded State:**
  - **Implementation Guide:** Rich text/Markdown field explaining *how* to do the task.
  - **User Notes:** Existing personal notes functionality.
  - **Admin Area (Visible to Admin & User):**
    - **Grade:** Score input (0-10).
    - **Feedback:** Text area for mentor feedback.

### II. Data Architecture
#### 1. Database Schema (`drizzle/schema.ts`)
Update `atividadeProgress` table:
```typescript
{
  ...existingFields,
  grade: integer("grade"), // 0-100 or 0-10
  feedback: text("feedback"), // Admin feedback
  feedbackAt: timestamp("feedback_at"),
  gradedBy: integer("graded_by").references(() => users.id),
}
```

#### 2. Static Data (`shared/atividades-data.ts`)
Extend `AtividadeStep` interface:
```typescript
interface AtividadeStep {
  ...
  detalhes?: string; // HTML/Markdown for implementation guide
}
```

### III. Permissions
- **User:**
  - Can check/uncheck `completed`.
  - Can edit `notes`.
  - **Read-only:** `grade`, `feedback`.
- **Admin:**
  - **Read/Write:** `grade`, `feedback`.
  - **Read-only:** `notes` (User's private notes), `completed`.

## Atomic Tasks

### AT-001: Backend & Schema
- [ ] ST-001.1: Add `grade`, `feedback` columns to `atividadeProgress` in `drizzle/schema.ts`.
- [ ] ST-001.2: Update `atividadesRouter` with `updateGrade` and `updateFeedback` mutations.
- [ ] ST-001.3: Run migrations (`db:push`).

### AT-002: Data Models
- [ ] ST-002.1: Update `AtividadeStep` type in `atividades-data.ts`.
- [ ] ST-002.2: Add "detailed" content placeholders to `atividades-data.ts` (using existing description or generic "Guia passo a passo..." for now).

### AT-003: Components & UI
- [ ] ST-003.1: Create `StepAccordion` component to replace `AnimatedItem`.
- [ ] ST-003.2: Implement "Detailed Content" view.
- [ ] ST-003.3: Implement `AdminGradingControl` (Grade Input + Feedback Textarea).
- [ ] ST-003.4: Integrate into `AtividadesContent`.

## Verification Plan
### Automated Tests
- `server/routers/atividades.test.ts`:
  - Test `updateGrade` allows admin, rejects user.
  - Test `updateFeedback` persists correctly.

### Manual Verification
1. **User View:**
   - Click activity -> Expand step -> See "Detalhes".
   - Check item -> Celebrate.
   - Cannot see Grade inputs.
2. **Admin View:**
   - Go to Mentorado Dashboard.
   - Expand step.
   - Enter Grade (e.g., 9) and Feedback. Save.
   - Verify toast success.
3. **User View (Again):**
   - Refresh.
   - See Grade "9" and Feedback.
