# PLAN-crm-database-integration: Integração CRM com Neon Database e Clerk

> **Goal:** Ajuste aprofundado da página CRM para integrar corretamente com a base de dados Neon, garantindo que cada mentorado acesse apenas seus dados e que a detecção de admin/member via Clerk funcione corretamente.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | `leads` table has `mentorado_id` FK - data isolation by design | 5/5 | `drizzle/schema.ts:426-472` | ✅ Schema correct |
| 2 | `mentoradoProcedure` enforces mentorado context in tRPC | 5/5 | `server/_core/trpc.ts:30-53` | ✅ Auth middleware exists |
| 3 | `crmColumnsRouter.list` does NOT support admin override | 5/5 | `server/crmColumnsRouter.ts:8-16` | ⚠️ Gap - admin can't view mentorado columns |
| 4 | `LeadsPage` passes `mentoradoId` to stats but columns query ignores it | 5/5 | `client/src/pages/crm/LeadsPage.tsx:75-77` | ⚠️ Gap - inconsistent admin view |
| 5 | `context.ts` auto-creates mentorado on first login | 5/5 | `server/_core/context.ts:35-76` | ✅ Auto-provisioning works |
| 6 | `protectedProcedure` allows admin to pass `mentoradoId` override in `leads.list` | 5/5 | `server/leadsRouter.ts:26-33` | ✅ Pattern exists to replicate |
| 7 | User role comes from `users.role` enum (admin/user) synced from Clerk | 5/5 | `drizzle/schema.ts:101` | ✅ Role detection works |
| 8 | `useAuth` hook fetches user via `trpc.auth.me` query | 5/5 | `client/src/_core/hooks/useAuth.ts:15-18` | ✅ Client auth works |

### Knowledge Gaps & Assumptions
- **Gap:** Need to verify if `crmColumns.save` should also support admin override (likely NO - admin views only)
- **Assumption:** Admin should be able to VIEW any mentorado's CRM but NOT edit their column configurations
- **Assumption:** When admin views a mentorado's CRM, they should see that mentorado's custom columns

---

## 1. User Review Required (If Any)

> [!IMPORTANT]
> **Admin Override Scope Decision Required**
>
> Currently, admins can VIEW leads of any mentorado. Should admins also be able to:
> 1. **Create/Edit leads** on behalf of mentorados? (Current: NO - readonly mode)
> 2. **Edit column configurations** for mentorados? (Proposed: NO - keep readonly)
>
> The plan assumes admin view is **read-only** for mentorado data. Please confirm.

---

## 2. Proposed Changes

### Backend: tRPC Routers

#### [MODIFY] [crmColumnsRouter.ts](file:///Users/mauricio/Projetos/neondash/server/crmColumnsRouter.ts)
- **Action:** Add admin override support to `list` query
- **Details:**
  - Change from `mentoradoProcedure` to `protectedProcedure`
  - Add optional `mentoradoId` input parameter
  - Admin can pass `mentoradoId` to view another mentorado's columns
  - Non-admin users get their own columns only (existing behavior)
  - Keep `save` as `mentoradoProcedure` (no admin edit)

#### [MODIFY] [leadsRouter.ts](file:///Users/mauricio/Projetos/neondash/server/leadsRouter.ts)
- **Action:** Ensure consistent admin override pattern across all lead procedures
- **Details:**
  - `list`: Already supports admin override ✅
  - `stats`: Already supports admin override ✅
  - `getById`: Add admin override support for viewing lead details
  - Keep create/update/delete as `mentoradoProcedure` (no admin edit on behalf)

#### [MODIFY] [interacoesRouter.ts](file:///Users/mauricio/Projetos/neondash/server/interacoesRouter.ts)
- **Action:** Add admin override for viewing interactions
- **Details:**
  - `getNotes`: Add optional `mentoradoId` for admin view
  - `getMeetings`: Add optional `mentoradoId` for admin view
  - Keep `createNote` as `mentoradoProcedure` (no admin create)

---

### Frontend: CRM Pages

#### [MODIFY] [LeadsPage.tsx](file:///Users/mauricio/Projetos/neondash/client/src/pages/crm/LeadsPage.tsx)
- **Action:** Fix columns query to use admin's selected mentorado
- **Details:**
  - Pass `mentoradoId` to `crmColumns.list` query when admin is viewing
  - Enable the query even in readonly mode (to load mentorado's columns)
  - Ensure `PipelineKanban` receives correct columns for viewed mentorado

#### [MODIFY] [NeonCRM.tsx](file:///Users/mauricio/Projetos/neondash/client/src/components/dashboard/NeonCRM.tsx)
- **Action:** Ensure stats query uses correct mentorado context
- **Details:**
  - Component already receives `mentoradoId` prop
  - Verify query passes it correctly (appears to work ✅)

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Each task MUST have subtasks. No single-line tasks allowed.

### AT-001: Update crmColumnsRouter for Admin Override ⚡
**Goal:** Enable admins to view any mentorado's custom CRM columns
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Change `list` procedure from `mentoradoProcedure` to `protectedProcedure`
  - **File:** `server/crmColumnsRouter.ts`
  - **Validation:** TypeScript compiles (`bun run check`)
- [ ] ST-001.2: Add `z.object({ mentoradoId: z.number().optional() })` input schema
  - **File:** `server/crmColumnsRouter.ts`
  - **Validation:** Code matches pattern from `leadsRouter.ts:26-33`
- [ ] ST-001.3: Implement admin override logic with role check
  - **File:** `server/crmColumnsRouter.ts`
  - **Validation:** Manual test - admin can query with mentoradoId param

**Rollback:** Revert `server/crmColumnsRouter.ts` to previous version via git

---

### AT-002: Fix LeadsPage Columns Query for Admin View ⚡
**Goal:** Admin sees the viewed mentorado's custom columns, not their own
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Update `crmColumns.list` query to accept optional `mentoradoId`
  - **File:** `client/src/pages/crm/LeadsPage.tsx`
  - **Validation:** TypeScript compiles
- [ ] ST-002.2: Pass `viewMentoradoId` to the query when admin is viewing
  - **File:** `client/src/pages/crm/LeadsPage.tsx`
  - **Validation:** Network tab shows query with mentoradoId param
- [ ] ST-002.3: Enable query even in readonly mode (remove `enabled: !isReadOnly`)
  - **File:** `client/src/pages/crm/LeadsPage.tsx`
  - **Validation:** Columns load when admin views mentorado CRM

**Rollback:** Revert `client/src/pages/crm/LeadsPage.tsx` changes

---

### AT-003: Add Admin View Support to interacoesRouter
**Goal:** Admin can view mentorado's notes and meetings
**Dependencies:** None ⚡

#### Subtasks:
- [ ] ST-003.1: Change `getNotes` from `mentoradoProcedure` to `protectedProcedure`
  - **File:** `server/interacoesRouter.ts`
  - **Validation:** TypeScript compiles
- [ ] ST-003.2: Add `mentoradoId` optional input and admin override logic
  - **File:** `server/interacoesRouter.ts`
  - **Validation:** Pattern matches `leadsRouter.ts` implementation
- [ ] ST-003.3: Apply same pattern to `getMeetings` procedure
  - **File:** `server/interacoesRouter.ts`
  - **Validation:** Both procedures support admin override

**Rollback:** Revert `server/interacoesRouter.ts`

---

### AT-004: Enhance getById in leadsRouter for Admin View
**Goal:** Admin can view full lead details including interactions
**Dependencies:** None ⚡

#### Subtasks:
- [ ] ST-004.1: Review existing `getById` admin check logic
  - **File:** `server/leadsRouter.ts`
  - **Validation:** Verify current behavior allows admin access (lines 124-129)
- [ ] ST-004.2: Confirm ownership check allows admin OR owner access
  - **File:** `server/leadsRouter.ts`
  - **Validation:** Code review - `isAdmin || isOwner` check exists ✅

**Rollback:** N/A - verification only, no changes needed

---

### AT-005: Add Integration Tests for Admin CRM Access
**Goal:** Verify admin can correctly view mentorado CRM data
**Dependencies:** AT-001, AT-002, AT-003

#### Subtasks:
- [ ] ST-005.1: Extend `leads.test.ts` with admin override test cases
  - **File:** `server/leads.test.ts`
  - **Validation:** `bun test server/leads.test.ts` passes
- [ ] ST-005.2: Create `crmColumns.test.ts` with admin view test
  - **File:** `server/crmColumns.test.ts` [NEW]
  - **Validation:** `bun test server/crmColumns.test.ts` passes

**Rollback:** Delete new test file, revert test changes

---

## 4. Verification Plan

### Automated Tests
```bash
# TypeScript type checking
bun run check

# Linting
bun run lint

# Run existing tests
bun test

# Run specific CRM tests
bun test server/leads.test.ts
bun test server/crmColumns.test.ts  # (new)
```

### Manual Verification

**Pre-requisites:**
1. Have dev server running: `bun dev`
2. Have admin user account and regular mentorado account

**Test 1: Admin Views Mentorado CRM**
1. Login as admin user
2. Navigate to `/leads`
3. Use admin selector to pick a mentorado with custom columns
4. Verify:
   - Leads shown belong to selected mentorado
   - Kanban columns reflect mentorado's custom configuration
   - Stats cards show mentorado's pipeline data
   - Alert banner shows "Modo de Visualização Administrativa"

**Test 2: Regular User Data Isolation**
1. Login as regular mentorado (non-admin)
2. Navigate to `/leads`
3. Verify:
   - Only own leads are visible
   - No admin selector shown
   - Custom columns (if any) are own configuration

**Test 3: Neon Database Verification**
```sql
-- Run via Neon MCP or console
-- Verify leads belong to correct mentorado
SELECT l.id, l.nome, m.nome_completo as mentorado
FROM leads l
JOIN mentorados m ON l.mentorado_id = m.id
LIMIT 10;

-- Verify column configs are per-mentorado
SELECT cc.mentorado_id, m.nome_completo, cc.original_id, cc.label
FROM crm_column_config cc
JOIN mentorados m ON cc.mentorado_id = m.id;
```

---

## 5. Rollback Plan

```bash
# If issues arise, revert the specific files:
git checkout HEAD~1 -- server/crmColumnsRouter.ts
git checkout HEAD~1 -- server/interacoesRouter.ts
git checkout HEAD~1 -- client/src/pages/crm/LeadsPage.tsx

# Or full rollback:
git revert HEAD
```

---

## 6. Edge Cases

1. **Admin without mentorado profile** - Should still be able to view other mentorados (handled by `protectedProcedure`)
2. **Mentorado with no custom columns** - Falls back to `DEFAULT_COLUMNS` (existing behavior)
3. **Race condition on column save** - Uses upsert with conflict resolution (existing)
4. **Large lead dataset** - Pagination already implemented in `leads.list`
5. **Clerk session expiry** - tRPC context handles re-auth (existing)

---

## 7. Files Affected Summary

| File | Action | Risk Level |
|------|--------|------------|
| `server/crmColumnsRouter.ts` | MODIFY | Low |
| `server/interacoesRouter.ts` | MODIFY | Low |
| `client/src/pages/crm/LeadsPage.tsx` | MODIFY | Medium |
| `server/crmColumns.test.ts` | NEW | Low |
