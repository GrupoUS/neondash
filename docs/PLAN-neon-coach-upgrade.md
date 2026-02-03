# PLAN-neon-coach-upgrade: Upgrade Neon Coach AI & Task System

> **Goal:** Upgrade Neon Coach to use Gemini 2.0 Flash, implement a "Hybrid" task view (Manual + AI), add an Admin Config for prompts, and enrich AI context with full database access.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Gemini OpenAI Compatibility URL is `https://generativelanguage.googleapis.com/v1beta/openai/` | 5/5 | Tavily | Critical for `llm.ts` config |
| 2 | `LLM_API_KEY` is currently hardcoded required in `llm.ts` | 5/5 | Codebase | Need to change logic to accept `GEMINI_API_KEY` |
| 3 | `tasks` table stores source as text, currently 'manual' or 'atividade' | 5/5 | Codebase | Will add 'ai_coach' as a new source |
| 4 | No existing table for global system settings (prompts) | 5/5 | Codebase | Need to create `system_settings` table |
| 5 | `tasks.generateFromAI` uses restricted context (metrics only) | 5/5 | Codebase | Need to expand to fetch Diagnostics, Leads, etc. |

### Knowledge Gaps & Assumptions
- **Assumption:** The user wants `gemini-3-flash-preview` 
- **Assumption:** "Hybrid" view means showing all tasks (Manual + AI) in one list, while allowing filtering.
- **Assumption:** Admin access is already handled by `role='admin'` in `users` table.

---

## 1. User Review Required

> [!IMPORTANT]
> **Model Selection**: We will config the system to use `gemini-3-flash-preview`.
> **API Key**: We will modify the server to prioritize `GEMINI_API_KEY` from `.env.local`.

---

## 2. Proposed Changes

### Phase 1: AI Infrastructure & Database
#### [MODIFY] [server/_core/llm.ts](file:///home/mauricio/neondash/server/_core/llm.ts)
- **Action:** Update `resolveApiUrl` to check for `GEMINI_API_KEY` and use Google endpoint.
- **Action:** Update `assertApiKey` to accept `GEMINI_API_KEY`.
- **Action:** Set default model to `gemini-3-flash-preview`.

#### [MODIFY] [drizzle/schema.ts](file:///home/mauricio/neondash/drizzle/schema.ts)
- **Action:** Create `system_settings` table to store `neon_coach_prompt` and `neon_config`.
- **Details:** `key` (PK, varchar), `value` (text), `updatedAt`.

### Phase 2: Backend Logic
#### [MODIFY] [server/routers/admin.ts](file:///home/mauricio/neondash/server/routers/admin.ts) (New File)
- **Action:** Create router for `getSystemSettings` and `updateSystemSettings`.

#### [MODIFY] [server/routers/tasks.ts](file:///home/mauricio/neondash/server/routers/tasks.ts)
- **Action:** Update `generateFromAI` to:
    1. Fetch Master Prompt from `system_settings`.
    2. Fetch Context: `diagnosticos`, `metricasMensais` (last 3), `leads` (stats), `tasks` (recent).
    3. Generate tasks with `source: 'ai_coach'`.

### Phase 3: Frontend Implementation
#### [NEW] [client/src/pages/admin/CoachSettings.tsx](file:///home/mauricio/neondash/client/src/pages/admin/CoachSettings.tsx)
- **Action:** Admin page to edit Master Prompt and Instructions.

#### [MODIFY] [client/src/components/dashboard/AITasksCard.tsx](file:///home/mauricio/neondash/client/src/components/dashboard/AITasksCard.tsx)
- **Action:** Update task filtering logic.
- **Action:** Add Tabs: "Todos" (Hybrid), "AI Coach", "Manuais".
- **Action:** Update mutation trigger to use new backend logic.

---

## 3. Atomic Implementation Tasks

### AT-001: Upgrade AI Infrastructure
**Goal:** Configure LLM to use Gemini via OpenAI compatibility layer.
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Modify `server/_core/llm.ts` to support `GEMINI_API_KEY` and Google Base URL.
  - **File:** `server/_core/llm.ts`
  - **Validation:** `bun test` (create a test script to invoke LLM).

### AT-002: Schema & Admin Settings
**Goal:** Create storage for prompts and Admin API.
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Add `system_settings` to `drizzle/schema.ts`.
  - **File:** `drizzle/schema.ts`
  - **Validation:** `bun db:push`
- [ ] ST-002.2: Create `server/routers/admin.ts` with settings CRUD.
  - **File:** `server/routers/admin.ts`
  - **Validation:** Manual tRPC query test.
- [ ] ST-002.3: Register `admin` router in `server/routers.ts`.
  - **File:** `server/routers.ts`

### AT-003: AI Context & Logic Upgrade
**Goal:** Enhance Task Generation with full context and configurable prompt.
**Dependencies:** AT-002

#### Subtasks:
- [ ] ST-003.1: Update `tasks.generateFromAI` to fetch full context (Diagnostics, Metrics, etc.).
  - **File:** `server/routers/tasks.ts`
- [ ] ST-003.2: Update `tasks.generateFromAI` to use prompt from `system_settings`.
  - **File:** `server/routers/tasks.ts`
  - **Validation:** Verify context gathering via logs.

### AT-004: Frontend Admin & Task View
**Goal:** UI for Admin Config and Hybrid Task View.
**Dependencies:** AT-003

#### Subtasks:
- [ ] ST-004.1: Create `client/src/pages/admin/CoachSettings.tsx`.
  - **File:** `client/src/pages/admin/CoachSettings.tsx`
- [ ] ST-004.2: Update `AITasksCard.tsx` with Tabs (Hybrid/AI/Manual).
  - **File:** `client/src/components/dashboard/AITasksCard.tsx`
  - **Validation:** Visual check of tabs and filtering.

---

## 4. Verification Plan

### Automated Tests
- `bun run check` - Ensure no type errors.
- `bun db:push` - Schema sync.

### Manual Verification
1. **AI Check:** Trigger "Gerar Missões". Verify it works with Gemini Key.
2. **Context Check:** Verify AI references diagnostic data (e.g., specific pain points).
3. **Admin Check:** Go to Admin -> Coach Settings. Update Prompt. Generate tasks again. Verify prompt change effect.
4. **Hybrid View:** Create a manual task. Generate AI task. Toggle "Todos" tab to see both.

---

## 5. Rollback Plan

- **Schema:** Drop `system_settings` table.
- **Code:** Revert `llm.ts` to use `LLM_API_KEY`.
