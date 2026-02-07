---
description: Execute approved plan from /plan workflow. Reads PLAN-{slug}.md and executes Atomic Tasks with validation gates.
---

# /implement - Execute Approved Plan

## 🔴 CRITICAL RULES

1. **PLAN REQUIRED**: Approved `docs/PLAN-{slug}.md` from `/plan`
2. **ANALYZE FIRST**: Run Plan Intelligence Analysis before ANY code
3. **LOAD SKILLS**: Read mapped SKILL.md files BEFORE writing code
4. **ATOMIC**: One AT-XXX at a time with validation
5. **EVOLVE**: Start/end evolution-core session for learning

---

## Trigger

- User: "approve", "proceed", "implement", "go ahead"
- Direct: `/implement` or `/implement PLAN-{slug}`

---

## Execution Flow

```mermaid
flowchart TD
    A[/implement] --> B[Load PLAN + Start Evolution Session]
    B --> C[🧠 Plan Intelligence Analysis]
    C --> D[Load Required SKILL.md Files]
    D --> E{Pending AT-XXX?}
    E -->|Yes| F[Route Skill/MCP → Execute]
    F --> G{Validation OK?}
    G -->|Yes| H[Mark x + Capture Progress]
    G -->|No| I[Debug Skill + Sequential Thinking]
    I --> J{Recoverable?}
    J -->|Yes| F
    J -->|No| K[Mark ! + notify_user]
    H --> L{Every 5 tasks?}
    L -->|Yes| M[Evolution Heartbeat]
    L -->|No| E
    M --> E
    E -->|No| N[Final Validation Gates]
    N --> O[End Evolution Session + Walkthrough]
```

---

## Step 1: Initialize

```yaml
actions:
  - Read docs/PLAN-{slug}.md → extract atomic_tasks, validation_gates
  - Create task.md in brain directory with AT-XXX checklist
  - task_boundary(Mode: EXECUTION, TaskName: from plan)
  - "python3 .agent/skills/evolution-core/scripts/memory_manager.py session start -t 'Implementing PLAN-{slug}'"
```

---

## Step 1.5: 🧠 Plan Intelligence Analysis (MANDATORY)

> [!CAUTION]
> BEFORE executing ANY task, classify domains and map skills/MCPs.

### Domain Classification

Scan every AT-XXX and tag with domain(s):

| Domain | Signals |
|--------|---------|
| `backend` | API, router, tRPC, procedure, query, mutation, middleware |
| `database` | schema, table, migration, drizzle, SQL, seed, Neon |
| `frontend` | component, page, UI, layout, form, card, sidebar |
| `design` | style, theme, colors, typography, animation, UX |
| `auth` | Clerk, auth, session, JWT, role, permission |
| `integration` | WhatsApp, Baileys, Meta API, webhook, external API |
| `debug` | fix, bug, error, broken, failing |

### Skill Router

| Domain | Skill to Load | SKILL.md Path |
|--------|--------------|---------------|
| `backend` / `database` | `backend-design` | `.agent/skills/backend-design/SKILL.md` |
| `frontend` | `frontend-design` | `.agent/skills/frontend-design/SKILL.md` |
| `design` | `ui-ux-pro-max` + `frontend-design` | Both SKILL.md |
| `design` (theme) | `gpus-theme` | `.agent/skills/gpus-theme/SKILL.md` |
| `integration` (WhatsApp) | `baileys-integration` | `.agent/skills/baileys-integration/SKILL.md` |
| `integration` (Meta) | `meta-api-integration` | `.agent/skills/meta-api-integration/SKILL.md` |
| `debug` | `debug` | `.agent/skills/debug/SKILL.md` |

### MCP Router

| Domain | MCP | When |
|--------|-----|------|
| `database` | `mcp-server-neon` | Schema, migrations, SQL, seeding |
| `auth` | `clerk` | SDK snippets, auth flows, roles |
| `backend`/`frontend` | `context7` | Library docs (tRPC, Drizzle, shadcn, React, TanStack) |
| complex logic | `sequential-thinking` | Architecture decisions, root cause analysis |
| fallback | `tavily` | When context7 insufficient |

### Execution Strategy (mental model)

```
FOR EACH AT-XXX:
  1. DOMAIN → identify (backend? frontend? design? auth?)
  2. SKILL  → load mapped SKILL.md (if not loaded)
  3. MCP    → Local → context7 → domain MCP → sequential-thinking → tavily
  4. CODE   → apply skill patterns
  5. CHECK  → validation command + skill checklist
```

---

## Step 2: Execute Atomic Tasks

### Per-Task Protocol

```yaml
for_each_AT:
  pre: Verify dependencies + identify domain
  load: Read mapped SKILL.md (skip if already loaded)
  query: context7 for library docs when needed
  execute: Apply skill patterns, use domain MCPs
  validate: Run AT validation command
  capture: "python3 memory_manager.py capture 'Completed AT-XXX: {title}'"
  status: Mark [x] in task.md
```

### Phase Checkpoints

| Phase | Focus | Skills | MCPs | Check |
|-------|-------|--------|------|-------|
| 1 | Setup | — | — | `bun install` |
| 2 | Backend | `backend-design` | `context7`, `neon` | `bun run check` |
| 3 | Frontend | `frontend-design`, `ui-ux-pro-max` | `context7`, `clerk` | `bun run build` |
| 4 | Integration | domain-specific | all relevant | `bun run check` |
| 5 | Polish | `debug` | `sequential-thinking` | `bun test` |

---

## Evolution Checkpoints (Every 5 Tasks)

```bash
# turbo
python3 .agent/skills/evolution-core/scripts/heartbeat.py
```

Captures: tool usage patterns, skill effectiveness, anti-patterns detected.
If confidence > 80%, suggests optimizations (requires approval).

---

## Step 3: Validation Gates

```yaml
VG-001: "bun run build"    # Exit 0
VG-002: "bun run check"    # No TS errors
VG-003: "bun test"         # All passing
VG-004: Manual assumption verification
```

---

## Step 4: Failure Handling

```yaml
on_failure:
  1_pause: Stop immediately
  2_skill: Read .agent/skills/debug/SKILL.md
  3_think: sequential-thinking → root cause + 3 fixes
  4_capture: "python3 memory_manager.py capture 'Failed AT-XXX: {error}' -t bug_fix"
  5_rollback: Execute rollback from AT-XXX, mark [!]
  6_decide: Recoverable → retry | Not → notify_user
```

---

## Step 5: Completion

```yaml
completion:
  1_validate: Run all VG-XXX gates
  2_end_session: "python3 memory_manager.py session end -s 'Completed PLAN-{slug}: {summary}'"
  3_walkthrough: Create walkthrough.md (changes, skills used, validation results)
  4_notify: |
    ✅ Implementation complete: {plan_title}
    Tasks: {completed}/{total} | Gates: {passed}/{total}
    Skills: {list} | MCPs: {list}
    Files: {file_list}
```

---

## Quick Reference

```
LOOP:     Load Plan → Analyze → Map Skills/MCPs → Execute → Validate → Repeat
ROUTING:  AT-XXX → domain → skill → MCP → execute → validate
MCP:      Local → context7 → clerk/neon → sequential-thinking → tavily
FAILURE:  PAUSE → debug skill → sequential-thinking → ROLLBACK → RETRY/NOTIFY
MARKERS:  [ ] pending | [/] progress | [x] done | [!] failed
EVOLVE:   session start → capture per-task → heartbeat/5 → session end
```

---

## Checklist

```yaml
analysis:  [ ] Domains classified? Skills mapped? MCPs routed?
execution: [ ] All [x]? No [!]? Dependencies respected?
skills:    [ ] Correct skills loaded per domain?
mcps:      [ ] context7 for docs? neon for DB? clerk for auth?
validation:[ ] build ✓ | check ✓ | test ✓ | assumptions ✓
evolution: [ ] Session started? Captures logged? Session ended?
delivery:  [ ] task.md final? walkthrough.md created? notify_user?
```

---

## References

- Planning: `.agent/workflows/plan.md`
- Design: `.agent/workflows/design.md`
- Debug: `.agent/workflows/debug.md`
- Evolution: `.agent/skills/evolution-core/SKILL.md`
