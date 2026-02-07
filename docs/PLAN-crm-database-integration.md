# PLAN-crm-database-integration: Ajuste do CRM com Integração de Banco de Dados e Autenticação

> **Goal:** Conectar corretamente a página CRM com o banco de dados Neon, permitindo que cada mentorado acesse seus próprios leads e admins possam gerenciar leads de qualquer mentorado.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Database schema has correct FK relationships (leads.mentorado_id → mentorados.id → users.id with clerk_id) | 5/5 | drizzle/schema.ts, Neon MCP | Foundation is correct |
| 2 | tRPC has 3 auth middlewares: protectedProcedure, mentoradoProcedure, adminProcedure | 5/5 | server/_core/trpc.ts | Use protectedProcedure with admin check |
| 3 | leadsRouter.list/getById/stats already support admin override via mentoradoId param | 5/5 | server/leadsRouter.ts | Pattern to follow |
| 4 | leadsRouter mutations (create/update/delete/updateStatus) use mentoradoProcedure without admin override | 5/5 | server/leadsRouter.ts | **Key Issue - must fix** |
| 5 | crmColumnsRouter uses mentoradoProcedure only - blocks admin from viewing mentorado columns | 5/5 | server/crmColumnsRouter.ts | **Key Issue - must fix** |
| 6 | Frontend LeadsPage has isReadOnly when admin views another mentorado | 5/5 | client/src/pages/crm/LeadsPage.tsx | Needs adjustment |
| 7 | Context auto-creates mentorado for all users, user.role from Clerk determines admin | 5/5 | server/_core/context.ts | Auth flow is working |
| 8 | Existing tests use Vitest with mocked DB, cover procedure definitions | 4/5 | server/leads.test.ts | Extend for admin scenarios |

### Knowledge Gaps & Assumptions

- **Gap:** Current admin CRM usage patterns - how do admins currently view leads? (likely via list only)
- **Assumption:** Admins should have full CRUD access to any mentorado's leads
- **Assumption:** Column configuration should be per-mentorado, even when admin edits

---

## 1. User Review Required

> [!IMPORTANT]
> **Breaking Change Consideration:** This modifies the authorization model for lead mutations. Currently, only the lead owner can modify their leads. After this change, admins will also be able to modify any mentorado's leads.

> [!CAUTION]
> **Security Impact:** Adding mentoradoId param to mutations exposes a potential attack surface. The implementation MUST validate that only users with `role === "admin"` can use the mentoradoId override.

---

## 2. Proposed Changes

### Phase 1: Backend - leadsRouter Admin Support

#### [MODIFY] [leadsRouter.ts](file:///Users/mauricio/Projetos/neondash/server/leadsRouter.ts)
- **Action:** Add admin override capability to all mutations
- **Details:**
  1. Change `create` from mentoradoProcedure to protectedProcedure
  2. Add optional `mentoradoId` input param to create
  3. Add admin check: if mentoradoId provided and user is not admin, throw FORBIDDEN
  4. Modify `update`, `updateStatus`, `delete`, `addInteraction` to accept mentoradoId param
  5. Add admin bypass to ownership checks where `ctx.user.role === "admin"`
  6. Apply same pattern to `bulkUpdateStatus`, `bulkDelete`, `bulkAddTags`

---

### Phase 2: Backend - crmColumnsRouter Admin Support

#### [MODIFY] [crmColumnsRouter.ts](file:///Users/mauricio/Projetos/neondash/server/crmColumnsRouter.ts)
- **Action:** Support admin viewing/editing another mentorado's columns
- **Details:**
  1. Change `list` from mentoradoProcedure to protectedProcedure
  2. Add optional `mentoradoId` input param
  3. Use ctx.mentorado.id if no override, or validate admin + use override
  4. Apply same pattern to `save`

---

### Phase 3: Frontend - CRM Admin Mode Enhancement

#### [MODIFY] [LeadsPage.tsx](file:///Users/mauricio/Projetos/neondash/client/src/pages/crm/LeadsPage.tsx)
- **Action:** Enable full admin control in CRM page
- **Details:**
  1. Remove `isReadOnly` restriction when admin has viewMentoradoId
  2. Pass `mentoradoId` prop to CreateLeadDialog
  3. Update storedColumns query to pass mentoradoId when admin views another mentorado

#### [MODIFY] [PipelineKanban.tsx](file:///Users/mauricio/Projetos/neondash/client/src/components/crm/PipelineKanban.tsx)
- **Action:** Pass mentoradoId to updateStatus and lead mutations
- **Details:**
  1. Accept mentoradoId prop
  2. Include mentoradoId in updateStatus mutation calls

#### [MODIFY] [LeadsTable.tsx](file:///Users/mauricio/Projetos/neondash/client/src/components/crm/LeadsTable.tsx)
- **Action:** Pass mentoradoId to mutations
- **Details:**
  1. Accept mentoradoId prop (already has it)
  2. Include mentoradoId in mutation calls

#### [MODIFY] [CreateLeadDialog.tsx](file:///Users/mauricio/Projetos/neondash/client/src/components/crm/CreateLeadDialog.tsx)
- **Action:** Accept and use mentoradoId for admin creating leads
- **Details:**
  1. Add mentoradoId prop
  2. Pass mentoradoId in create mutation call

#### [MODIFY] [LeadDetailModal.tsx](file:///Users/mauricio/Projetos/neondash/client/src/components/crm/LeadDetailModal.tsx)
- **Action:** Pass mentoradoId to update/delete mutations
- **Details:**
  1. Accept mentoradoId prop
  2. Include mentoradoId in update mutation calls

#### [MODIFY] [ColumnEditDialog.tsx](file:///Users/mauricio/Projetos/neondash/client/src/components/crm/ColumnEditDialog.tsx)
- **Action:** Support admin editing another mentorado's columns
- **Details:**
  1. Accept mentoradoId prop
  2. Pass mentoradoId in save mutation call

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Each task MUST have subtasks. No single-line tasks allowed.

### AT-001: Backend - leadsRouter Create Mutation Admin Support ⚡
**Goal:** Enable admins to create leads for any mentorado
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Change `create` from mentoradoProcedure to protectedProcedure
  - **File:** `server/leadsRouter.ts`
  - **Validation:** TypeScript compiles without errors
- [ ] ST-001.2: Add optional `mentoradoId: z.number().optional()` to input schema
  - **File:** `server/leadsRouter.ts`
  - **Validation:** TypeScript compiles without errors
- [ ] ST-001.3: Add logic to determine targetMentoradoId (admin override or ctx.mentorado.id)
  - **File:** `server/leadsRouter.ts`
  - **Validation:** `bun run check` passes
- [ ] ST-001.4: Validate that non-admin users cannot use mentoradoId param
  - **File:** `server/leadsRouter.ts`
  - **Validation:** Test via API that non-admin with mentoradoId throws FORBIDDEN

**Rollback:** `git checkout server/leadsRouter.ts`

---

### AT-002: Backend - leadsRouter Update/Delete Mutations Admin Support ⚡
**Goal:** Enable admins to update/delete any mentorado's leads
**Dependencies:** None (parallel-safe)

#### Subtasks:
- [ ] ST-002.1: Add optional `mentoradoId` param to `update`, `updateStatus`, `delete` inputs
  - **File:** `server/leadsRouter.ts`
  - **Validation:** TypeScript compiles
- [ ] ST-002.2: Modify ownership checks to bypass for admin with mentoradoId
  - **File:** `server/leadsRouter.ts`
  - **Validation:** Pattern: `if (lead.mentoradoId !== targetMentoradoId && ctx.user.role !== "admin") throw`
- [ ] ST-002.3: Apply same pattern to `addInteraction`
  - **File:** `server/leadsRouter.ts`
  - **Validation:** `bun run check` passes

**Rollback:** `git checkout server/leadsRouter.ts`

---

### AT-003: Backend - leadsRouter Bulk Operations Admin Support ⚡
**Goal:** Enable admins to bulk update/delete leads
**Dependencies:** None (parallel-safe)

#### Subtasks:
- [ ] ST-003.1: Add optional `mentoradoId` to `bulkUpdateStatus`, `bulkDelete`, `bulkAddTags`
  - **File:** `server/leadsRouter.ts`
  - **Validation:** TypeScript compiles
- [ ] ST-003.2: Modify ownership filter to include admin bypass
  - **File:** `server/leadsRouter.ts`
  - **Validation:** `bun run check` passes

**Rollback:** `git checkout server/leadsRouter.ts`

---

### AT-004: Backend - crmColumnsRouter Admin Support
**Goal:** Allow admins to view/save columns for any mentorado
**Dependencies:** None

#### Subtasks:
- [ ] ST-004.1: Change `list` from mentoradoProcedure to protectedProcedure
  - **File:** `server/crmColumnsRouter.ts`
  - **Validation:** TypeScript compiles
- [ ] ST-004.2: Add optional `mentoradoId` input param to `list`
  - **File:** `server/crmColumnsRouter.ts`
  - **Validation:** `bun run check` passes
- [ ] ST-004.3: Add admin validation logic (same pattern as leadsRouter)
  - **File:** `server/crmColumnsRouter.ts`
  - **Validation:** Test that admin can query columns for another mentorado
- [ ] ST-004.4: Apply same pattern to `save`
  - **File:** `server/crmColumnsRouter.ts`
  - **Validation:** `bun run check` passes

**Rollback:** `git checkout server/crmColumnsRouter.ts`

---

### AT-005: Frontend - LeadsPage Admin Mode Fix
**Goal:** Enable full admin control in CRM page
**Dependencies:** AT-001, AT-002, AT-004

#### Subtasks:
- [ ] ST-005.1: Modify `isReadOnly` logic - admin should NOT be read-only
  - **File:** `client/src/pages/crm/LeadsPage.tsx`
  - **Validation:** Visual check - settings button enabled for admin
- [ ] ST-005.2: Pass `mentoradoId` prop to CreateLeadDialog
  - **File:** `client/src/pages/crm/LeadsPage.tsx`
  - **Validation:** TypeScript compiles
- [ ] ST-005.3: Update storedColumns query to pass mentoradoId when admin views another
  - **File:** `client/src/pages/crm/LeadsPage.tsx`
  - **Validation:** Visual check - see target mentorado's columns

**Rollback:** `git checkout client/src/pages/crm/LeadsPage.tsx`

---

### AT-006: Frontend - CreateLeadDialog Admin Support
**Goal:** Allow admin to create leads for another mentorado
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-006.1: Add `mentoradoId?: number` prop to CreateLeadDialog
  - **File:** `client/src/components/crm/CreateLeadDialog.tsx`
  - **Validation:** TypeScript compiles
- [ ] ST-006.2: Include mentoradoId in create mutation call when provided
  - **File:** `client/src/components/crm/CreateLeadDialog.tsx`
  - **Validation:** `bun run check` passes

**Rollback:** `git checkout client/src/components/crm/CreateLeadDialog.tsx`

---

### AT-007: Frontend - PipelineKanban Admin Support
**Goal:** Allow admin to update lead status in kanban view
**Dependencies:** AT-002

#### Subtasks:
- [ ] ST-007.1: Ensure mentoradoId prop is used in updateStatus calls
  - **File:** `client/src/components/crm/PipelineKanban.tsx`
  - **Validation:** `bun run check` passes
- [ ] ST-007.2: Pass mentoradoId to LeadCard for detail modal
  - **File:** `client/src/components/crm/PipelineKanban.tsx`
  - **Validation:** Visual check - drag and drop works for admin

**Rollback:** `git checkout client/src/components/crm/PipelineKanban.tsx`

---

### AT-008: Frontend - LeadDetailModal & ColumnEditDialog Admin Support
**Goal:** Allow admin to update leads and columns from dialogs
**Dependencies:** AT-002, AT-004

#### Subtasks:
- [ ] ST-008.1: Add mentoradoId prop to LeadDetailModal
  - **File:** `client/src/components/crm/LeadDetailModal.tsx`
  - **Validation:** TypeScript compiles
- [ ] ST-008.2: Include mentoradoId in update/addInteraction mutations
  - **File:** `client/src/components/crm/LeadDetailModal.tsx`
  - **Validation:** `bun run check` passes
- [ ] ST-008.3: Add mentoradoId prop to ColumnEditDialog
  - **File:** `client/src/components/crm/ColumnEditDialog.tsx`
  - **Validation:** TypeScript compiles
- [ ] ST-008.4: Include mentoradoId in save mutation
  - **File:** `client/src/components/crm/ColumnEditDialog.tsx`
  - **Validation:** `bun run check` passes

**Rollback:** `git checkout client/src/components/crm/LeadDetailModal.tsx client/src/components/crm/ColumnEditDialog.tsx`

---

### AT-009: Extend Tests for Admin Scenarios
**Goal:** Verify admin access works correctly
**Dependencies:** AT-001, AT-002, AT-003, AT-004

#### Subtasks:
- [ ] ST-009.1: Add test for admin procedures in leadsRouter
  - **File:** `server/leads.test.ts`
  - **Validation:** `bun test server/leads.test.ts` passes
- [ ] ST-009.2: Add test for crmColumnsRouter admin procedures
  - **File:** `server/crmColumnsRouter.test.ts` (new file)
  - **Validation:** `bun test server/crmColumnsRouter.test.ts` passes

**Rollback:** `git checkout server/leads.test.ts && rm server/crmColumnsRouter.test.ts`

---

## 4. Verification Plan

### Automated Tests

```bash
# Run all tests
bun test

# Type checking
bun run check

# Lint
bun run lint
```

### Manual Verification

1. **Login as Admin:**
   - Go to `/crm`
   - Verify mentorado selector appears in header
   - Select a mentorado to view

2. **Admin Creates Lead:**
   - Click "+" to create lead
   - Fill form and submit
   - Verify lead appears in selected mentorado's pipeline

3. **Admin Updates Lead Status:**
   - Drag a lead card to a different column
   - Verify status updates in database

4. **Admin Edits Lead:**
   - Click a lead to open detail modal
   - Edit fields and save
   - Verify changes persist

5. **Admin Edits Columns:**
   - Click settings icon
   - Change column labels/colors
   - Verify changes persist for target mentorado (not admin's own config)

6. **Non-Admin Access:**
   - Login as regular user
   - Verify they only see their own leads
   - Verify they cannot pass mentoradoId params

---

## 5. Rollback Plan

```bash
# Full rollback if needed
git checkout server/leadsRouter.ts server/crmColumnsRouter.ts
git checkout client/src/pages/crm/LeadsPage.tsx
git checkout client/src/components/crm/CreateLeadDialog.tsx
git checkout client/src/components/crm/PipelineKanban.tsx
git checkout client/src/components/crm/LeadDetailModal.tsx
git checkout client/src/components/crm/ColumnEditDialog.tsx
```

---

## 6. Edge Cases Documented

| # | Edge Case | Handling |
|---|-----------|----------|
| 1 | Admin without mentorado profile accessing CRM | Works via protectedProcedure + mentoradoId param |
| 2 | Non-admin passing mentoradoId | Returns FORBIDDEN error |
| 3 | Invalid mentoradoId passed by admin | No leads found / No columns found |
| 4 | Admin viewing mentorado with no leads | Empty state shown |
| 5 | Admin editing columns for mentorado that was deleted | Error handling needed |
