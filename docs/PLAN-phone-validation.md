# PLAN-phone-validation: Brazilian Phone Validation with +55 Auto-Prefix

> **Goal:** Configure phone number fields for leads and patients to auto-prepend +55 country code, validate DDD (area code), and ensure correct digit count for WhatsApp communication.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Existing `validatePhone` in `patient-validators.ts` already validates DDD (11-99), mobile 9th digit, and 10/11 digit length | 5/5 | `client/src/lib/patient-validators.ts:48-69` | Reuse existing validation |
| 2 | Existing `formatPhone`, `maskPhone` functions format phones to `(DDD) XXXXX-XXXX` format | 5/5 | `client/src/lib/patient-validators.ts:107-166` | Reuse for display formatting |
| 3 | `zapiService.ts` has `normalizePhoneNumber` that adds +55 prefix for WhatsApp API | 5/5 | `server/services/zapiService.ts:247-263` | Existing normalization pattern |
| 4 | `CreateLeadDialog.tsx` has no phone validation, accepts raw string | 5/5 | `client/src/components/crm/CreateLeadDialog.tsx` | Needs validation + formatting |
| 5 | `AddPatientWizard.tsx` already uses `formatPhone` and `maskPhone` | 5/5 | `client/src/components/pacientes/AddPatientWizard.tsx` | Already implemented for patients |
| 6 | `leadsRouter.ts` accepts `telefone: z.string().optional()` with no validation | 5/5 | `server/leadsRouter.ts:139` | Backend validation needed |
| 7 | Tests exist in `patient-validators.test.ts` with comprehensive phone validation tests | 5/5 | `client/src/lib/__tests__/patient-validators.test.ts:42-60` | Tests already cover validation |

### Knowledge Gaps & Assumptions
- **Assumption:** Phone storage format will be digits-only with +55 prefix (e.g., `5511999999999`) for WhatsApp API compatibility
- **Assumption:** Display format will be `+55 (DDD) XXXXX-XXXX` for user-facing UI

---

## 1. User Review Required

> [!IMPORTANT]
> **Storage Format Decision:** Should we store phones as:
> - Option A: Normalized digits only (`5511999999999`) - optimal for WhatsApp API
> - Option B: Formatted string (`+55 (11) 99999-9999`) - human readable but requires parsing
>
> **Recommendation:** Option A (digits only) with display formatting on frontend

---

## 2. Proposed Changes

### Shared Phone Utilities

#### [MODIFY] [phone-utils.ts](file:///home/mauricio/neondash/shared/phone-utils.ts)
Create shared phone utilities for both client and server:
- `normalizeBrazilianPhone(phone: string)`: Returns `5511999999999` format
- `formatPhoneWithCountryCode(phone: string)`: Returns `+55 (11) 99999-9999`
- `validateBrazilianPhone(phone: string)`: Returns validation result with error message

---

### Backend Validation

#### [MODIFY] [leadsRouter.ts](file:///home/mauricio/neondash/server/leadsRouter.ts)
- Add phone validation using `validateBrazilianPhone` in `create` and `update` mutations
- Normalize phone to digits-only format before storing
- Return validation error if phone is invalid

#### [MODIFY] [pacientesRouter.ts](file:///home/mauricio/neondash/server/pacientesRouter.ts)
- Add phone validation using `validateBrazilianPhone`
- Normalize phone before storing

---

### Frontend Components

#### [MODIFY] [CreateLeadDialog.tsx](file:///home/mauricio/neondash/client/src/components/crm/CreateLeadDialog.tsx)
- Add `+55` prefix display before phone input field
- Add real-time phone masking using `maskPhone`
- Add validation feedback using `validatePhone`
- Show inline error for invalid phones
- Auto-format on blur

#### [MODIFY] [EditLeadDialog.tsx](file:///home/mauricio/neondash/client/src/components/crm/EditLeadDialog.tsx)
- Same changes as CreateLeadDialog for phone field

---

### Schema (No Changes Needed)

The database schema already stores `telefone` as `varchar(50)`, which accommodates the normalized format.

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Each task MUST have subtasks with validation.

### AT-001: Create Shared Phone Utilities ⚡
**Goal:** Create reusable phone validation/normalization utilities for server and client
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Create `shared/phone-utils.ts` with Brazilian phone utilities
  - **File:** `shared/phone-utils.ts`
  - **Functions:** `normalizeBrazilianPhone`, `formatPhoneWithCountryCode`, `validateBrazilianPhone`
  - **Validation:** Run `bun run check` to verify TypeScript compiles
- [ ] ST-001.2: Add unit tests for phone utilities
  - **File:** `shared/__tests__/phone-utils.test.ts`
  - **Validation:** Run `bun test shared/__tests__/phone-utils.test.ts`
- [ ] ST-001.3: Export from shared barrel (if exists)
  - **File:** `shared/index.ts`
  - **Validation:** Run `bun run check`

**Rollback:** Delete `shared/phone-utils.ts` and `shared/__tests__/phone-utils.test.ts`

---

### AT-002: Add Backend Phone Validation 
**Goal:** Validate and normalize phone numbers on server side
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Update `leadsRouter.ts` create mutation with phone validation
  - **File:** `server/leadsRouter.ts`
  - **Action:** Import `validateBrazilianPhone`, `normalizeBrazilianPhone` and apply to `telefone` field
  - **Validation:** Send invalid phone via API, expect 400 error
- [ ] ST-002.2: Update `leadsRouter.ts` update mutation with phone validation
  - **File:** `server/leadsRouter.ts`
  - **Validation:** Update lead with invalid phone, expect 400 error
- [ ] ST-002.3: Update `pacientesRouter.ts` with phone validation
  - **File:** `server/pacientesRouter.ts`
  - **Validation:** Create patient with invalid phone, expect 400 error

**Rollback:** `git checkout server/leadsRouter.ts server/pacientesRouter.ts`

---

### AT-003: Update Lead Dialogs with Phone Input ⚡
**Goal:** Add +55 prefix, masking, and validation to lead phone inputs
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-003.1: Update CreateLeadDialog phone field
  - **File:** `client/src/components/crm/CreateLeadDialog.tsx`
  - **Changes:** Add +55 prefix badge, apply `maskPhone`, validate with `validatePhone`, show error
  - **Validation:** Visual test: open dialog, enter invalid phone, see error
- [ ] ST-003.2: Update EditLeadDialog phone field (if exists)
  - **File:** `client/src/components/crm/EditLeadDialog.tsx` (or inline edit)
  - **Validation:** Visual test: edit lead, enter invalid phone, see error
- [ ] ST-003.3: Verify form submission with normalized phone
  - **Validation:** Create lead, check database value is `5511999999999` format

**Rollback:** `git checkout client/src/components/crm/CreateLeadDialog.tsx`

---

### AT-004: Visual Integration Testing
**Goal:** End-to-end verification of phone validation workflow
**Dependencies:** AT-002, AT-003

#### Subtasks:
- [ ] ST-004.1: Test lead creation with valid phone
  - **Test:** Create lead with `(11) 99999-9999`, verify stored as `5511999999999`
- [ ] ST-004.2: Test lead creation with invalid phone
  - **Test:** Enter `(00) 99999-9999` (invalid DDD), expect error message
- [ ] ST-004.3: Test landline vs mobile detection
  - **Test:** Enter `(11) 3333-4444` (10 digits landline), should accept
- [ ] ST-004.4: Verify WhatsApp compatibility
  - **Test:** Verify stored number works with `zapiService.normalizePhoneNumber`

**Rollback:** N/A (testing only)

---

## 4. Verification Plan

### Automated Tests
```bash
# Run all tests
bun test

# Run specific phone validation tests
bun test client/src/lib/__tests__/patient-validators.test.ts

# Run new shared utils tests (after implementation)
bun test shared/__tests__/phone-utils.test.ts

# TypeScript check
bun run check

# Lint check
bun run lint:check
```

### Manual Verification
1. **Start dev server:** `bun dev`
2. **Navigate to CRM/Leads page**
3. **Test Create Lead:**
   - Click "Novo Lead" button
   - Observe +55 prefix before phone field
   - Type `11999999999` → shows `(11) 99999-9999` with formatting
   - Type `00999999999` → shows validation error (invalid DDD)
   - Submit valid phone → check database has `5511999999999`
4. **Test Patient Creation:**
   - Navigate to Pacientes page
   - Add new patient with phone
   - Verify same validation behavior

---

## 5. Rollback Plan

```bash
# Revert all changes
git checkout server/leadsRouter.ts
git checkout server/pacientesRouter.ts
git checkout client/src/components/crm/CreateLeadDialog.tsx
rm shared/phone-utils.ts
rm shared/__tests__/phone-utils.test.ts
```

---

## 6. Edge Cases Documented

| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| 1 | DDD = 00 | Reject: DDD must be 11-99 |
| 2 | DDD = 10 | Reject: DDD must be 11-99 |
| 3 | 11 digits not starting with 9 | Reject: Mobile must start with 9 |
| 4 | 9 digits only | Reject: Too short |
| 5 | 12 digits (with partial country code) | Normalize: Remove partial 5, add 55 |
| 6 | Already has +55 prefix | Accept: Clean and normalize |
| 7 | International format (+55 11 99999-9999) | Accept: Normalize to digits |
| 8 | Empty phone | Accept: Field is optional |
