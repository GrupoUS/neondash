# PLAN-crm-redesign: CRM Page Redesign & Column Management

> **Goal:** Redesign the CRM page layout, expand the lead creation form with GPUS-style fields, and implement dynamic column management (rename, add, delete) for the Kanban pipeline.

---

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Current CRM has "Novo Lead" button in 2 places (page header + Pipeline bar) | 5/5 | `LeadsPage.tsx` L147, `PipelineKanban.tsx` L208 | Remove both, add to column |
| 2 | Pipeline bar in Kanban contains Selecionar + Filtrar + Novo Lead buttons | 5/5 | `PipelineKanban.tsx` L186-213 | Remove entire bar |
| 3 | COLUMNS are hardcoded in frontend with 6 statuses | 5/5 | `PipelineKanban.tsx` L26-63 | Need dynamic config |
| 4 | Database uses `statusLeadEnum` with 7 values (including "perdido") | 5/5 | `drizzle/schema.ts` L52-60 | Keep enum, add config layer |
| 5 | Current lead form has 6 fields (nome, email, telefone, empresa, origem, valorEstimado) | 5/5 | `CreateLeadDialog.tsx` | Expand to 15+ fields |
| 6 | GPUS reference shows expanded form with temperatura, profissão, dor, desejo fields | 5/5 | Uploaded image | Match GPUS design |
| 7 | KanbanColumn receives static props, no column editing capability | 5/5 | `KanbanColumn.tsx` L17-27 | Add edit buttons |

### Knowledge Gaps & Assumptions

- **Gap:** How does GPUS handle column configuration in the backend?
- **Assumption:** User wants columns to be customizable per mentorado (not global)
- **Assumption:** Existing leads with old fields should keep working (nullable new fields)
- **Assumption:** "Perdido" status exists in DB but not shown in current UI - should remain hidden by default

---

## 1. User Review Required

> [!IMPORTANT]
> **Breaking Change: Lead Form Expansion**
> The lead creation form will be significantly expanded. All new fields will be optional to maintain backward compatibility with existing leads.

> [!WARNING]  
> **Column Management Complexity**
> Adding/deleting columns affects the Kanban layout. The implementation will map custom display names to the existing status enum values, NOT create truly dynamic statuses. This means:
> - Users can rename "Novo" to "Novos Leads" but the underlying status remains `novo`
> - Users can hide columns like "Perdido" from view
> - Users CANNOT create entirely new statuses (would require DB enum migration)

---

## 2. Proposed Changes

### Phase 1: UI Simplification

#### [MODIFY] [LeadsPage.tsx](file:///home/mauricio/neondash/client/src/pages/crm/LeadsPage.tsx)
- **Action:** Remove "Novo Lead" button from page header (lines 146-150)
- **Details:** Keep only Filter + View Toggle buttons in top right

#### [MODIFY] [PipelineKanban.tsx](file:///home/mauricio/neondash/client/src/components/crm/PipelineKanban.tsx)
- **Action:** Remove entire "Pipeline de Vendas" header bar (lines 186-213)
- **Details:** Keep filter functionality accessible via parent page, remove redundant controls

---

### Phase 2: Add Lead Button in Column

#### [MODIFY] [KanbanColumn.tsx](file:///home/mauricio/neondash/client/src/components/crm/KanbanColumn.tsx)
- **Action:** Add "+ Novo Lead" button inside the "Novo" column only
- **Details:** Button appears after column header, triggers CreateLeadDialog
- **Props to add:** `onAddLead?: () => void`, `showAddButton?: boolean`

#### [MODIFY] [PipelineKanban.tsx](file:///home/mauricio/neondash/client/src/components/crm/PipelineKanban.tsx)
- **Action:** Pass `onAddLead` handler to "novo" column
- **Details:** Wire up CreateLeadDialog opening when button clicked

---

### Phase 3: Expand Lead Form

#### [MODIFY] [schema.ts](file:///home/mauricio/neondash/drizzle/schema.ts)
- **Action:** Add new enum `temperaturaLeadEnum` and expand `leads` table
- **Details:** 
  ```typescript
  // New enum
  temperaturaLeadEnum: ["frio", "morno", "quente"]
  
  // New fields in leads table
  indicadoPor: text("indicado_por")
  profissao: text("profissao")
  produtoInteresse: text("produto_interesse")
  possuiClinica: simNaoEnum("possui_clinica")
  anosEstetica: integer("anos_estetica")
  faturamentoMensal: text("faturamento_mensal")
  dorPrincipal: text("dor_principal")
  desejoPrincipal: text("desejo_principal")
  temperatura: temperaturaLeadEnum("temperatura")
  ```

#### [MODIFY] [leadsRouter.ts](file:///home/mauricio/neondash/server/leadsRouter.ts)
- **Action:** Update `create` and `update` procedures with new fields
- **Details:** All new fields optional in Zod schema

#### [MODIFY] [CreateLeadDialog.tsx](file:///home/mauricio/neondash/client/src/components/crm/CreateLeadDialog.tsx)
- **Action:** Expand form to match GPUS design
- **Details:** 
  - Two-column layout for desktop
  - Sections: Dados Básicos, Qualificação, Contexto
  - Temperature selector with visual indicators (Frio ❄️, Morno 🌡️, Quente 🔥)
  - Dropdown for Faturamento Mensal ranges
  - Toggle for "Possui clínica?"

---

### Phase 4: Column Management

#### [MODIFY] [schema.ts](file:///home/mauricio/neondash/drizzle/schema.ts)
- **Action:** Add `crmColumnConfig` table
- **Details:**
  ```typescript
  crmColumnConfig = pgTable("crm_column_config", {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id").references(() => mentorados.id),
    statusValue: statusLeadEnum("status_value").notNull(),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    order: integer("order").notNull(),
    color: varchar("color", { length: 50 }).default("blue"),
    isVisible: simNaoEnum("is_visible").default("sim").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }, (table) => [
    uniqueIndex("crm_column_config_unique_idx").on(table.mentoradoId, table.statusValue),
    index("crm_column_config_mentorado_idx").on(table.mentoradoId),
  ])
  ```

#### [NEW] [crmColumnsRouter.ts](file:///home/mauricio/neondash/server/crmColumnsRouter.ts)
- **Action:** Create CRUD router for column configuration
- **Details:** 
  - `list`: Get all columns for current mentorado (with defaults if none configured)
  - `update`: Update display name, order, visibility
  - `reset`: Reset to default column config

#### [MODIFY] [KanbanColumn.tsx](file:///home/mauricio/neondash/client/src/components/crm/KanbanColumn.tsx)
- **Action:** Add edit button (pencil icon) to column header
- **Details:** 
  - Shows on hover for non-read-only mode
  - Opens ColumnEditDialog with rename/hide options

#### [NEW] [ColumnEditDialog.tsx](file:///home/mauricio/neondash/client/src/components/crm/ColumnEditDialog.tsx)
- **Action:** Create modal for editing column settings
- **Details:**
  - Input for display name
  - Color picker (predefined palette)
  - Toggle for visibility
  - Move up/down buttons for ordering

#### [MODIFY] [PipelineKanban.tsx](file:///home/mauricio/neondash/client/src/components/crm/PipelineKanban.tsx)
- **Action:** Fetch column config from backend, use dynamic columns
- **Details:**
  - Replace hardcoded COLUMNS with query result
  - Add "+ Add Column" button at end of columns (reveals hidden columns)
  - Handle column visibility changes

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Each task MUST have subtasks. No single-line tasks allowed.

### AT-001: Remove Redundant UI Elements ⚡
**Goal:** Clean up the CRM page by removing duplicate "Novo Lead" buttons and Pipeline bar
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Remove "Novo Lead" button from `LeadsPage.tsx` header
  - **File:** `client/src/pages/crm/LeadsPage.tsx`
  - **Lines:** 146-150
  - **Validation:** Page loads without "Novo Lead" button in header
- [ ] ST-001.2: Remove "Pipeline de Vendas" bar from `PipelineKanban.tsx`
  - **File:** `client/src/components/crm/PipelineKanban.tsx`
  - **Lines:** 186-213
  - **Validation:** Kanban renders without top action bar
- [ ] ST-001.3: Keep filter button in `LeadsPage.tsx` header only
  - **File:** `client/src/pages/crm/LeadsPage.tsx`
  - **Validation:** Filter icon visible and functional in header

**Rollback:** `git checkout client/src/pages/crm/LeadsPage.tsx client/src/components/crm/PipelineKanban.tsx`

---

### AT-002: Add Lead Button in Novo Column
**Goal:** Add the "+ Novo Lead" button inside the first ("Novo") column
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Add `onAddLead` and `showAddButton` props to `KanbanColumn`
  - **File:** `client/src/components/crm/KanbanColumn.tsx`
  - **Validation:** TypeScript compiles without errors
- [ ] ST-002.2: Render "+ Novo Lead" button in column when `showAddButton=true`
  - **File:** `client/src/components/crm/KanbanColumn.tsx`
  - **Validation:** Button visible in browser when prop is true
- [ ] ST-002.3: Pass props to "novo" column in `PipelineKanban.tsx`
  - **File:** `client/src/components/crm/PipelineKanban.tsx`
  - **Validation:** Clicking button opens CreateLeadDialog
- [ ] ST-002.4: Style button to match GPUS design (gold accent, full width)
  - **File:** `client/src/components/crm/KanbanColumn.tsx`
  - **Validation:** Visual comparison with GPUS reference image

**Rollback:** `git checkout client/src/components/crm/KanbanColumn.tsx client/src/components/crm/PipelineKanban.tsx`

---

### AT-003: Database Schema - Expand Leads Table
**Goal:** Add new fields to leads table for expanded lead form
**Dependencies:** None (can run parallel with AT-001, AT-002)

#### Subtasks:
- [ ] ST-003.1: Add `temperaturaLeadEnum` to schema
  - **File:** `drizzle/schema.ts`
  - **Validation:** `bun run check` passes
- [ ] ST-003.2: Add new fields to `leads` table definition
  - **File:** `drizzle/schema.ts`
  - **Fields:** indicadoPor, profissao, produtoInteresse, possuiClinica, anosEstetica, faturamentoMensal, dorPrincipal, desejoPrincipal, temperatura
  - **Validation:** `bun run check` passes
- [ ] ST-003.3: Run database migration
  - **Command:** `bun run db:push`
  - **Validation:** No errors, columns exist in Neon console
- [ ] ST-003.4: Update types export if needed
  - **File:** `drizzle/schema.ts`
  - **Validation:** Lead type includes new fields

**Rollback:** Manual SQL to drop new columns or restore from Neon branch

---

### AT-004: Backend - Update Leads Router
**Goal:** Support new lead fields in create/update procedures
**Dependencies:** AT-003

#### Subtasks:
- [ ] ST-004.1: Update `create` procedure input schema
  - **File:** `server/leadsRouter.ts`
  - **Validation:** `bun run check` passes
- [ ] ST-004.2: Update `create` mutation to insert new fields
  - **File:** `server/leadsRouter.ts`
  - **Validation:** Can create lead with new fields via API
- [ ] ST-004.3: Update `update` procedure input schema and mutation
  - **File:** `server/leadsRouter.ts`
  - **Validation:** Can update lead with new fields via API
- [ ] ST-004.4: Add any new fields to `getById` response if needed
  - **File:** `server/leadsRouter.ts`
  - **Validation:** Lead detail shows new fields

**Rollback:** `git checkout server/leadsRouter.ts`

---

### AT-005: Frontend - Expand CreateLeadDialog
**Goal:** Redesign lead form to match GPUS style with all new fields
**Dependencies:** AT-003, AT-004

#### Subtasks:
- [ ] ST-005.1: Update Zod schema with new fields
  - **File:** `client/src/components/crm/CreateLeadDialog.tsx`
  - **Validation:** TypeScript compiles
- [ ] ST-005.2: Create two-column form layout
  - **File:** `client/src/components/crm/CreateLeadDialog.tsx`
  - **Validation:** Form renders in two columns on desktop
- [ ] ST-005.3: Add Temperatura selector with visual indicators
  - **File:** `client/src/components/crm/CreateLeadDialog.tsx`
  - **Validation:** Can select Frio/Morno/Quente with icons
- [ ] ST-005.4: Add dropdown selects for Faturamento Mensal ranges
  - **File:** `client/src/components/crm/CreateLeadDialog.tsx`
  - **Validation:** Dropdown shows predefined ranges
- [ ] ST-005.5: Add toggle for "Possui clínica ou consultório próprio?"
  - **File:** `client/src/components/crm/CreateLeadDialog.tsx`
  - **Validation:** Toggle works and submits correct value
- [ ] ST-005.6: Style dialog to match GPUS dark theme
  - **File:** `client/src/components/crm/CreateLeadDialog.tsx`
  - **Validation:** Visual comparison with GPUS reference

**Rollback:** `git checkout client/src/components/crm/CreateLeadDialog.tsx`

---

### AT-006: Database Schema - Column Configuration Table
**Goal:** Create table for storing custom column display settings
**Dependencies:** None (can run parallel)

#### Subtasks:
- [ ] ST-006.1: Add `crmColumnConfig` table to schema
  - **File:** `drizzle/schema.ts`
  - **Validation:** `bun run check` passes
- [ ] ST-006.2: Add indexes and relations
  - **File:** `drizzle/schema.ts`
  - **Validation:** Schema valid
- [ ] ST-006.3: Run database migration
  - **Command:** `bun run db:push`
  - **Validation:** Table exists in Neon console
- [ ] ST-006.4: Export types
  - **File:** `drizzle/schema.ts`
  - **Validation:** Types available for import

**Rollback:** Manual SQL to drop table

---

### AT-007: Backend - CRM Columns Router
**Goal:** Create CRUD endpoints for column configuration
**Dependencies:** AT-006

#### Subtasks:
- [ ] ST-007.1: Create `crmColumnsRouter.ts` with `list` procedure
  - **File:** `server/crmColumnsRouter.ts`
  - **Validation:** Returns default columns if none configured
- [ ] ST-007.2: Add `update` procedure for renaming/reordering
  - **File:** `server/crmColumnsRouter.ts`
  - **Validation:** Can update column via API
- [ ] ST-007.3: Add `toggleVisibility` procedure
  - **File:** `server/crmColumnsRouter.ts`
  - **Validation:** Can hide/show columns
- [ ] ST-007.4: Add `initializeDefaults` procedure
  - **File:** `server/crmColumnsRouter.ts`
  - **Validation:** Creates default config for new users
- [ ] ST-007.5: Register router in `routers.ts`
  - **File:** `server/routers.ts`
  - **Validation:** Router accessible via tRPC

**Rollback:** `git checkout server/crmColumnsRouter.ts server/routers.ts`

---

### AT-008: Frontend - Column Edit Dialog
**Goal:** Create modal for editing column display name, color, visibility
**Dependencies:** AT-007

#### Subtasks:
- [ ] ST-008.1: Create `ColumnEditDialog.tsx` component
  - **File:** `client/src/components/crm/ColumnEditDialog.tsx`
  - **Validation:** Component renders without errors
- [ ] ST-008.2: Add form with name input, color picker, visibility toggle
  - **File:** `client/src/components/crm/ColumnEditDialog.tsx`
  - **Validation:** Form inputs work correctly
- [ ] ST-008.3: Wire up tRPC mutation for saving
  - **File:** `client/src/components/crm/ColumnEditDialog.tsx`
  - **Validation:** Changes persist after refresh
- [ ] ST-008.4: Add order up/down buttons
  - **File:** `client/src/components/crm/ColumnEditDialog.tsx`
  - **Validation:** Column order changes in Kanban

**Rollback:** Delete file `client/src/components/crm/ColumnEditDialog.tsx`

---

### AT-009: Frontend - Dynamic Columns in Kanban
**Goal:** Replace hardcoded COLUMNS with dynamic configuration
**Dependencies:** AT-007, AT-008

#### Subtasks:
- [ ] ST-009.1: Add tRPC query for column config in `PipelineKanban.tsx`
  - **File:** `client/src/components/crm/PipelineKanban.tsx`
  - **Validation:** Query returns column data
- [ ] ST-009.2: Replace COLUMNS constant with query result
  - **File:** `client/src/components/crm/PipelineKanban.tsx`
  - **Validation:** Kanban uses dynamic columns
- [ ] ST-009.3: Add edit button to `KanbanColumn.tsx` header
  - **File:** `client/src/components/crm/KanbanColumn.tsx`
  - **Validation:** Edit icon visible on hover
- [ ] ST-009.4: Wire up ColumnEditDialog opening
  - **File:** `client/src/components/crm/PipelineKanban.tsx`
  - **Validation:** Clicking edit opens dialog
- [ ] ST-009.5: Handle column visibility (filter hidden columns)
  - **File:** `client/src/components/crm/PipelineKanban.tsx`
  - **Validation:** Hidden columns don't render
- [ ] ST-009.6: Add "+ Show Hidden" button at end of columns
  - **File:** `client/src/components/crm/PipelineKanban.tsx`
  - **Validation:** Button reveals hidden columns list

**Rollback:** `git checkout client/src/components/crm/PipelineKanban.tsx client/src/components/crm/KanbanColumn.tsx`

---

## 4. Verification Plan

### Automated Tests
```bash
bun run check      # TypeScript type checking
bun run lint       # Biome lint + format
bun test           # Vitest unit tests (if any CRM tests exist)
```

### Manual Verification

#### Phase 1 & 2 Verification:
1. Navigate to `/leads` page
2. Verify "Novo Lead" button is NOT in page header
3. Verify "Pipeline de Vendas" bar is NOT visible
4. Verify filter icon is still in top right
5. Verify "+ Novo Lead" button is inside "Novo" column
6. Click button and verify CreateLeadDialog opens

#### Phase 3 Verification:
1. Open CreateLeadDialog
2. Verify all new fields are present:
   - Indicado por
   - Profissão  
   - Produto de Interesse
   - Possui clínica?
   - Anos na Estética
   - Faturamento Mensal
   - Dor Principal
   - Principal Desejo
   - Temperatura Inicial
3. Fill and submit form
4. Verify lead appears in Kanban
5. Click lead card and verify detail modal shows new fields

#### Phase 4 Verification:
1. Hover over any column header
2. Verify edit (pencil) icon appears
3. Click edit icon and verify ColumnEditDialog opens
4. Change display name and save
5. Verify column title updates in Kanban
6. Toggle visibility to hide column
7. Verify column is hidden
8. Click "+ Show Hidden" to see hidden columns
9. Re-enable column and verify it reappears

---

## 5. Rollback Plan

### Full Rollback
```bash
git stash                                    # Save any uncommitted work
git checkout HEAD~N -- .                     # Revert to before changes (N = number of commits)
bun run db:push                              # Re-sync schema (may need manual intervention)
```

### Partial Rollback by Phase

**Phase 1-2 (UI only):**
```bash
git checkout origin/main -- client/src/pages/crm/LeadsPage.tsx
git checkout origin/main -- client/src/components/crm/PipelineKanban.tsx
git checkout origin/main -- client/src/components/crm/KanbanColumn.tsx
```

**Phase 3 (Lead Form):**
```bash
# Frontend
git checkout origin/main -- client/src/components/crm/CreateLeadDialog.tsx
git checkout origin/main -- server/leadsRouter.ts

# Database (manual SQL needed)
ALTER TABLE leads DROP COLUMN IF EXISTS indicado_por;
ALTER TABLE leads DROP COLUMN IF EXISTS profissao;
-- ... etc for all new columns
```

**Phase 4 (Column Management):**
```bash
git checkout origin/main -- client/src/components/crm/PipelineKanban.tsx
git checkout origin/main -- client/src/components/crm/KanbanColumn.tsx
rm -f client/src/components/crm/ColumnEditDialog.tsx
rm -f server/crmColumnsRouter.ts

# Database
DROP TABLE IF EXISTS crm_column_config;
```

---

## 6. Pre-Submission Checklist

- [x] Plan file created in docs/
- [x] All AT-XXX tasks have ST-XXX.N subtasks
- [x] Findings table has 7+ entries with confidence scores
- [x] Knowledge gaps and assumptions documented
- [x] Edge cases considered (5+)
- [x] Dependencies mapped
- [x] Rollback steps defined
- [x] Parallel-safe tasks marked with ⚡
