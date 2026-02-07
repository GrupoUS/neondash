---
description: Execute approved plan from /plan workflow. Reads PLAN-{slug}.md and executes Atomic Tasks with validation gates.
---

# /implement - Execute Approved Plan

Execute the approved implementation plan from `docs/PLAN-{slug}.md`.

---

## 🔴 CRITICAL RULES

1. **PLAN REQUIRED**: Must have approved `docs/PLAN-{slug}.md` from `/plan` workflow
2. **PLAN ANALYSIS FIRST**: Before executing ANY task, run the Plan Intelligence Analysis (Step 1.5)
3. **SKILL LOADING**: Read ALL mapped SKILL.md files BEFORE writing code
4. **ATOMIC EXECUTION**: Execute one AT-XXX task at a time with validation
5. **MCP ACTIVATION**: Use mapped MCPs at the right moment (see Skill/MCP Router)
6. **VALIDATION GATES**: Run validation command after each task before proceeding
7. **ROLLBACK READY**: On failure, execute rollback steps from plan

---

## Trigger

- User approves plan: "approve", "proceed", "implement", "go ahead"
- Direct command: `/implement` or `/implement PLAN-{slug}`

---

## Input Contract

```yaml
input_contract:
  source: "docs/PLAN-{slug}.md from /plan workflow"

  required_sections:
    - "## Atomic Tasks" # AT-XXX with validation + rollback
    - "## Validation Gates" # Final verification commands

  atomic_task_format:
    id: "AT-XXX"
    title: "[ACTION] [TARGET]"
    phase: 1-5
    dependencies: ["AT-XXX"]
    parallel_safe: true # ⚡ marker
    validation: "[COMMAND]"
    rollback: "[UNDO STEPS]"

  status_markers:
    pending: "[ ]"
    in_progress: "[/]"
    completed: "[x]"
    failed: "[!]"
```

---

## Execution Flow

```mermaid
flowchart TD
    A[/implement] --> B[Load PLAN-{slug}.md]
    B --> C[🧠 Plan Intelligence Analysis]
    C --> D[Generate Skill/MCP Execution Map]
    D --> E[Load Required SKILL.md Files]
    E --> F{Has pending AT-XXX?}
    F -->|Yes| G[Activate Skills/MCPs for AT-XXX]
    G --> H[Execute AT-XXX]
    H --> I[Run Validation Command]
    I --> J{Passed?}
    J -->|Yes| K[Mark x + Update task_boundary]
    J -->|No| L[Run Rollback Steps]
    L --> M[Sequential Thinking: Analyze]
    M --> N{Recoverable?}
    N -->|Yes| H
    N -->|No| O[Mark ! + notify_user]
    K --> F
    F -->|No| P[Run Final Validation Gates]
    P --> Q[Generate walkthrough.md]
    Q --> R[notify_user: Complete]
```

---

## Step 1: Initialize Execution

```yaml
initialization:
  1_load_plan:
    action: "Read docs/PLAN-{slug}.md"
    extract:
      - complexity_level
      - atomic_tasks (AT-XXX list)
      - validation_gates
      - assumptions_to_validate

  2_create_task_md:
    action: "Create task.md in brain directory"
    format: |
      # Implementation: {plan_title}

      ## Progress
      - [ ] AT-001: {title}
      - [ ] AT-002: {title}
      ...

      ## Validation Gates
      - [ ] VG-001: bun run build
      - [ ] VG-002: bun run check
      - [ ] VG-003: bun test

  3_set_task_boundary:
    action: "task_boundary(Mode: EXECUTION, TaskName: from plan)"
```

---

## Step 1.5: 🧠 Plan Intelligence Analysis (MANDATORY)

> [!CAUTION]
> **BEFORE executing ANY Atomic Task**, the agent MUST analyze the plan to discover
> which skills and MCPs are needed, and WHEN to activate each one.

### 1. Classify Task Domains

Scan every AT-XXX in the plan and tag each with its **domain(s)**:

| Domain | Signals (keywords in task title/description) |
|--------|----------------------------------------------|
| `backend` | API, router, tRPC, procedure, query, mutation, middleware, server, endpoint |
| `database` | schema, table, column, migration, drizzle, SQL, index, seed, Neon |
| `frontend` | component, page, UI, layout, sidebar, modal, form, card, button |
| `design` | style, theme, colors, typography, animation, UX, responsive, visual |
| `auth` | Clerk, auth, session, JWT, protected, role, permission |
| `integration` | WhatsApp, Baileys, Meta API, webhook, external API, Evolution |
| `devops` | build, deploy, env, config, lint, test, CI |
| `planning` | research, architecture, decision, RFC |
| `debug` | fix, bug, error, broken, failing, regression |

### 2. Map Skills to Domains

Based on discovered domains, determine which skills to load:

| Domain | Required Skill | SKILL.md Path | When to Read |
|--------|---------------|---------------|--------------|
| `backend` | `backend-design` | `.agent/skills/backend-design/SKILL.md` | Before Phase 2 (Core Logic) |
| `database` | `backend-design` | `.agent/skills/backend-design/SKILL.md` | Before any schema work |
| `frontend` | `frontend-design` | `.agent/skills/frontend-design/SKILL.md` | Before Phase 3 (Components) |
| `design` | `ui-ux-pro-max` + `frontend-design` | Both SKILL.md files | Before any visual work |
| `design` | `gpus-theme` | `.agent/skills/gpus-theme/SKILL.md` | When applying project theme |
| `auth` | — (use Clerk MCP) | — | Before auth-related tasks |
| `integration` | `baileys-integration` | `.agent/skills/baileys-integration/SKILL.md` | Before WhatsApp tasks |
| `integration` | `meta-api-integration` | `.agent/skills/meta-api-integration/SKILL.md` | Before Meta API tasks |
| `debug` | `debug` | `.agent/skills/debug/SKILL.md` | On any failure or bug fix |
| `planning` | `planning` | `.agent/skills/planning/SKILL.md` | If re-planning needed |

### 3. Map MCPs to Domains

Determine which MCPs to activate and when:

| Domain | MCP | Activation Trigger |
|--------|-----|-------------------|
| `database` | `mcp-server-neon` | Schema changes, migrations, SQL queries, data seeding |
| `auth` | `clerk` | User management, auth flows, JWT, role checks |
| `backend` / `frontend` | `context7` | Library docs lookup (tRPC, Drizzle, shadcn, React, TanStack) |
| `*` (any unknown) | `tavily` | When context7 + local search insufficient |
| `*` (complex logic) | `sequential-thinking` | Multi-step reasoning, root cause analysis, architecture decisions |

### 4. Generate Execution Strategy

Produce an internal execution map (mental model, not a file):

```
┌─────────────────────────────────────────────────────────────┐
│  EXECUTION STRATEGY for PLAN-{slug}                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SKILLS TO LOAD (in order):                                  │
│  ┌─ Phase 1 (Setup): [list skills]                          │
│  ├─ Phase 2 (Backend): [list skills]                        │
│  ├─ Phase 3 (Frontend): [list skills]                       │
│  ├─ Phase 4 (Integration): [list skills]                    │
│  └─ Phase 5 (Verification): [list skills]                   │
│                                                              │
│  MCPs TO ACTIVATE:                                           │
│  ┌─ context7: [libraries to query]                          │
│  ├─ mcp-server-neon: [yes/no + when]                        │
│  ├─ clerk: [yes/no + when]                                  │
│  ├─ sequential-thinking: [trigger points]                   │
│  └─ tavily: [fallback topics]                               │
│                                                              │
│  PER-TASK SKILL MAP:                                         │
│  ┌─ AT-001: [skill] + [MCP]                                │
│  ├─ AT-002: [skill] + [MCP]                                │
│  └─ ...                                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Skill/MCP Router (PER ATOMIC TASK)

> [!IMPORTANT]
> For EACH AT-XXX, follow this routing protocol before writing any code:

### Pre-Task Checklist

```
┌─────────────────────────────────────────────────────────────┐
│  BEFORE EXECUTING AT-XXX:                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. IDENTIFY DOMAIN(S) of this task                          │
│     └─→ backend? frontend? database? design? auth? debug?   │
│                                                              │
│  2. LOAD SKILL (if not already loaded for this phase)        │
│     └─→ Read the mapped SKILL.md file                       │
│     └─→ Apply its rules, patterns, and checklists           │
│                                                              │
│  3. ACTIVATE MCP (as needed during execution)                │
│     └─→ context7: Query library docs BEFORE coding          │
│     └─→ neon: Run SQL for schema/data tasks                 │
│     └─→ clerk: Check auth patterns                          │
│     └─→ sequential-thinking: Complex logic decisions        │
│                                                              │
│  4. EXECUTE using skill patterns                             │
│     └─→ Follow the skill's coding standards                 │
│     └─→ Use the skill's component/API patterns              │
│                                                              │
│  5. VALIDATE using skill checklists                          │
│     └─→ Run the AT-XXX validation command                   │
│     └─→ Apply skill-specific quality checks                 │
└─────────────────────────────────────────────────────────────┘
```

### Skill Activation by Task Type

#### Backend Tasks (backend-design skill)

| When | Action |
|------|--------|
| Creating tRPC router | Apply router pattern from skill (protectedProcedure, ctx.db) |
| Writing Drizzle queries | Query context7 for Drizzle ORM patterns |
| Adding validation (Zod) | Apply Zod schema patterns from skill |
| Error handling | Apply error handling standards |
| Type safety issues | Apply TypeScript guidelines (no `any`, strict mode) |

#### Database Tasks (backend-design skill + Neon MCP)

| When | Action |
|------|--------|
| Schema changes | Use `mcp-server-neon` to inspect current schema |
| New migrations | Query context7 for Drizzle migration patterns |
| Seeding data | Use `mcp-server-neon run_sql` for seed operations |
| Query optimization | Use `mcp-server-neon explain_sql_statement` |

#### Frontend Tasks (frontend-design skill)

| When | Action |
|------|--------|
| Building components | Apply React 19 patterns (ref-as-prop, no forwardRef) |
| Adding interactivity | Apply animation standards (transform/opacity only) |
| Building forms | Apply form standards (autocomplete, inputmode, labels) |
| Styling | Apply Tailwind v4 patterns from skill |
| Using shadcn/ui | Query context7 for shadcn component API |

#### Design Tasks (ui-ux-pro-max + frontend-design skills)

| When | Action |
|------|--------|
| Starting visual work | Run `--design-system` from ui-ux-pro-max |
| Choosing colors/fonts | Run `--domain color/typography` queries |
| Adding charts | Run `--domain chart` for visualization guidance |
| Applying theme | Load gpus-theme skill for project tokens |
| Final visual review | Run Pre-Delivery Checklist from ui-ux-pro-max |

#### Auth Tasks (Clerk MCP)

| When | Action |
|------|--------|
| Auth flow design | Query Clerk MCP for SDK snippets |
| Protected routes | Use `mcp_clerk_clerk_sdk_snippet` for patterns |
| User management | Query Clerk MCP for user/session management |

#### Integration Tasks (baileys-integration / meta-api-integration skills)

| When | Action |
|------|--------|
| WhatsApp features | Load baileys-integration skill, follow QR auth flow |
| Meta API calls | Load meta-api-integration skill, follow OAuth patterns |
| External APIs | Use context7 + tavily for API documentation |

#### Debug Tasks (debug skill)

| When | Action |
|------|--------|
| Task validation fails | Load debug skill, follow systematic investigation |
| Runtime errors | Apply root cause analysis protocol |
| Type errors | Apply TypeScript diagnostic from backend-design |

### MCP Activation Protocol

```
┌─────────────────────────────────────────────────────────────┐
│  MCP ACTIVATION (follow this order for each task)            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. LOCAL FIRST                                              │
│     └─→ grep_search, view_file for existing patterns        │
│                                                              │
│  2. CONTEXT7 (official docs)                                 │
│     └─→ resolve-library-id → query-docs                     │
│     └─→ Libraries: tRPC, Drizzle, shadcn, React, Clerk,    │
│         TanStack Query, Recharts, Framer Motion, wouter     │
│                                                              │
│  3. CLERK MCP (auth tasks only)                              │
│     └─→ clerk_sdk_snippet for implementation patterns       │
│                                                              │
│  4. NEON MCP (database tasks only)                           │
│     └─→ run_sql, describe_table_schema, get_database_tables │
│                                                              │
│  5. SEQUENTIAL-THINKING (complex decisions)                  │
│     └─→ Architecture choices, multi-factor trade-offs       │
│     └─→ Root cause analysis on failures                     │
│                                                              │
│  6. TAVILY (fallback only)                                   │
│     └─→ When context7 returns insufficient results          │
│     └─→ For cutting-edge patterns not in official docs      │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 2: Execute Atomic Tasks

### Execution Pattern

```yaml
for_each_atomic_task:
  1_pre_check:
    - Verify dependencies completed
    - Check if parallel_safe for concurrent execution
    - Identify domain(s) of this task
    - Confirm required skill is loaded

  2_activate_skill_and_mcp:
    - Load SKILL.md if not already loaded for this domain
    - Query context7 for relevant library docs
    - Activate domain-specific MCP if needed

  3_execute:
    - Set task_boundary status: "Executing AT-XXX: {title}"
    - Apply skill patterns while implementing
    - Use MCP tools as needed (neon, clerk, etc.)
    - Mark [/] in task.md

  4_validate:
    - Run validation command from AT-XXX
    - Apply skill-specific quality checks
    - If passed: Mark [x] in task.md
    - If failed: Load debug skill → Execute rollback → Mark [!]

  5_parallel_optimization:
    - Group tasks marked ⚡ PARALLEL-SAFE
    - Execute independent tasks concurrently
    - Wait at dependency barriers
```

### Phase-Based Execution

| Phase | Focus | Skills | MCPs | Checkpoint |
|-------|-------|--------|------|------------|
| 1 | Setup & Scaffolding | — | — | `bun install` |
| 2 | Core Logic & Backend | `backend-design` | `context7`, `neon` | `bun run check` |
| 3 | Frontend Components | `frontend-design`, `ui-ux-pro-max` | `context7`, `clerk` | `bun run build` |
| 4 | Integration & Routes | domain-specific | all relevant | `bun run check` |
| 5 | Verification & Polish | `debug` | `sequential-thinking` | `bun test` |

---

## Evolution Checkpoint (AUTOMATIC - Every 5 Steps)

> [!NOTE]
> **Self-Evolving Agent Integration** - Runs automatically during implementation

The `self-evolving-agent` skill automatically triggers every 5 implementation steps:

1. **Capture State**: Stores current implementation progress
2. **Analyze Patterns**: Identifies inefficiencies or anti-patterns in recent work
3. **Suggest Optimizations**: Proposes improvements if confidence > 80%
4. **Store Observations**: Records tool usage and skill effectiveness

```yaml
EVOLUTION_CHECKPOINT:
  trigger: "Every 5 AT-XXX completions"
  actions:
    - Snapshot current task.md status
    - Analyze tool/skill usage patterns
    - Evaluate MCP activation efficiency
    - Compare against successful past implementations
    - Generate mutation suggestions (if applicable)
  safety:
    confirmation_required: true
    max_suggestions: 3
```

---

## Step 3: Validation Gates

After all AT-XXX tasks complete:

```yaml
validation_gates:
  VG-001:
    command: "bun run build"
    expected: "Exit 0, no errors"

  VG-002:
    command: "bun run check"
    expected: "No TypeScript errors"

  VG-003:
    command: "bun test"
    expected: "All tests passing"

  VG-004:
    action: "Manual verification of assumptions from plan"
```

---

## Step 4: Failure Handling

```yaml
on_failure:
  1_pause:
    action: "Stop execution immediately"

  2_load_debug_skill:
    action: "Read .agent/skills/debug/SKILL.md"
    apply: "Systematic investigation protocol"

  3_analyze:
    action: "Use sequential-thinking MCP"
    thoughts:
      - "What exactly failed?"
      - "Why did it fail? (root cause)"
      - "Which skill/MCP could help diagnose?"
      - "3 possible fixes"
      - "Which fix is safest?"

  4_rollback:
    action: "Execute rollback steps from AT-XXX"
    update: "Mark [!] with error reason"

  5_decide:
    recoverable:
      action: "Apply fix, retry AT-XXX"
    not_recoverable:
      action: "notify_user with error details"
      include:
        - Failed task ID and title
        - Error message
        - Skills/MCPs attempted
        - Attempted rollback
        - Suggested next steps
```

---

## Step 5: Completion

```yaml
completion:
  1_final_validation:
    action: "Run all VG-XXX gates"

  2_generate_walkthrough:
    action: "Create walkthrough.md in brain directory"
    content:
      - Summary of changes
      - Files created/modified
      - Skills used and effectiveness
      - Validation results
      - Screenshots if UI changes

  3_notify_user:
    action: "notify_user with completion summary"
    message: |
      ✅ Implementation complete: {plan_title}

      Tasks executed: {completed}/{total}
      Validation gates: {passed}/{total}

      Skills activated: {skill_list}
      MCPs used: {mcp_list}

      Changes:
      - {file_list}

      Next steps:
      - Review walkthrough.md
      - Test manually if needed
```

---

## Quick Reference

```
EXECUTION LOOP:
  Load Plan → Analyze Domains → Map Skills/MCPs → Execute → Validate → Repeat

SKILL ROUTING:
  AT-XXX → identify domain → load skill → query MCP → execute → validate

MCP CASCADE:
  Local → context7 → clerk/neon → sequential-thinking → tavily

FAILURE PROTOCOL:
  PAUSE → LOAD debug skill → THINK (sequential-thinking) → ROLLBACK → RETRY or NOTIFY

STATUS MARKERS:
  [ ] pending  |  [/] in progress  |  [x] done  |  [!] failed
```

---

## Pre-Completion Checklist

```yaml
execution:
  - [ ] Plan Intelligence Analysis completed?
  - [ ] All required skills loaded?
  - [ ] All AT-XXX tasks marked [x]?
  - [ ] No [!] failed tasks remaining?
  - [ ] Dependencies respected?
  - [ ] Parallel tasks executed when safe?

skill_usage:
  - [ ] backend-design applied for API/DB tasks?
  - [ ] frontend-design applied for UI tasks?
  - [ ] ui-ux-pro-max applied for visual tasks?
  - [ ] debug skill used for failures?

mcp_usage:
  - [ ] context7 queried for library APIs?
  - [ ] neon MCP used for database operations?
  - [ ] clerk MCP used for auth implementations?
  - [ ] sequential-thinking used for complex logic?

validation:
  - [ ] bun run build passes?
  - [ ] bun run check passes?
  - [ ] bun test passes?
  - [ ] Assumptions validated?

delivery:
  - [ ] task.md updated with final status?
  - [ ] walkthrough.md created?
  - [ ] task_boundary set to VERIFICATION?
  - [ ] notify_user called with summary?
```

---

## References

- Planning: `.agent/workflows/plan.md`
- Design: `.agent/workflows/design.md`
- Debug: `.agent/workflows/debug.md`
- Skills: `.agent/skills/*/SKILL.md`
