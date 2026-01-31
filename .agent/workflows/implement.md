---
description: Execute approved plan from /plan workflow. Reads PLAN-{slug}.md and executes Atomic Tasks with validation gates.
---

# /implement - Execute Approved Plan

Execute the approved implementation plan from `docs/PLAN-{slug}.md`.

---

## 🔴 CRITICAL RULES

1. **PLAN REQUIRED**: Must have approved `docs/PLAN-{slug}.md` from `/plan` workflow
2. **SKILL ACTIVATION**: Read `.agent/skills/planning/SKILL.md` for R.P.I.V Phase 2
3. **ATOMIC EXECUTION**: Execute one AT-XXX task at a time with validation
4. **VALIDATION GATES**: Run validation command after each task before proceeding
5. **ROLLBACK READY**: On failure, execute rollback steps from plan

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
    parallel_safe: true  # ⚡ marker
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
    B --> C[Parse Atomic Tasks]
    C --> D{Has pending AT-XXX?}
    D -->|Yes| E[Execute AT-XXX]
    E --> F[Run Validation Command]
    F --> G{Passed?}
    G -->|Yes| H[Mark [x] + Update task_boundary]
    G -->|No| I[Run Rollback Steps]
    I --> J[Sequential Thinking: Analyze]
    J --> K{Recoverable?}
    K -->|Yes| E
    K -->|No| L[Mark [!] + notify_user]
    H --> D
    D -->|No| M[Run Final Validation Gates]
    M --> N[Generate walkthrough.md]
    N --> O[notify_user: Complete]
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

## Step 2: Execute Atomic Tasks

### Execution Pattern

```yaml
for_each_atomic_task:
  1_pre_check:
    - Verify dependencies completed
    - Check if parallel_safe for concurrent execution

  2_execute:
    - Set task_boundary status: "Executing AT-XXX: {title}"
    - Perform the action (create/modify files)
    - Mark [/] in task.md

  3_validate:
    - Run validation command from AT-XXX
    - If passed: Mark [x] in task.md
    - If failed: Execute rollback, mark [!]

  4_parallel_optimization:
    - Group tasks marked ⚡ PARALLEL-SAFE
    - Execute independent tasks concurrently
    - Wait at dependency barriers
```

### Phase-Based Execution

| Phase | Focus                    | Checkpoint Command         |
| ----- | ------------------------ | -------------------------- |
| 1     | Setup & Scaffolding      | `bun install`              |
| 2     | Core Logic & Backend     | `bun run check`            |
| 3     | Frontend Components      | `bun run build`            |
| 4     | Integration & Routes     | `bun run check`            |
| 5     | Verification & Polish    | `bun test`                 |

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

  2_analyze:
    action: "Use sequential-thinking MCP"
    thoughts:
      - "What exactly failed?"
      - "Why did it fail? (root cause)"
      - "3 possible fixes"
      - "Which fix is safest?"

  3_rollback:
    action: "Execute rollback steps from AT-XXX"
    update: "Mark [!] with error reason"

  4_decide:
    recoverable:
      action: "Apply fix, retry AT-XXX"
    not_recoverable:
      action: "notify_user with error details"
      include:
        - Failed task ID and title
        - Error message
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
      - Validation results
      - Screenshots if UI changes

  3_notify_user:
    action: "notify_user with completion summary"
    message: |
      ✅ Implementation complete: {plan_title}

      Tasks executed: {completed}/{total}
      Validation gates: {passed}/{total}

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
  Load Plan → Parse AT-XXX → Execute → Validate → Repeat

VALIDATION PATTERN:
  AT-XXX → validation command → pass? → next : rollback

FAILURE PROTOCOL:
  PAUSE → THINK (sequential-thinking) → ROLLBACK → RETRY or NOTIFY

STATUS MARKERS:
  [ ] pending  |  [/] in progress  |  [x] done  |  [!] failed
```

---

## Pre-Completion Checklist

```yaml
execution:
  - [ ] All AT-XXX tasks marked [x]?
  - [ ] No [!] failed tasks remaining?
  - [ ] Dependencies respected?
  - [ ] Parallel tasks executed when safe?

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
- Skill: `.agent/skills/planning/SKILL.md`
- Debug: `.agent/workflows/debug.md`
