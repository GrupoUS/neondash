# Plan File Template (PRP Format)

> Reference documentation for creating implementation-ready plan files.

## File Location & Naming

| Request                           | Plan File                     |
| --------------------------------- | ----------------------------- |
| `/plan e-commerce site with cart` | `docs/PLAN-ecommerce-cart.md` |
| `/plan mobile app for fitness`    | `docs/PLAN-fitness-app.md`    |
| `/plan add dark mode feature`     | `docs/PLAN-dark-mode.md`      |
| `/plan SaaS dashboard`            | `docs/PLAN-saas-dashboard.md` |

**Rules:**

1. Extract 2-3 key words from request
2. Lowercase, hyphen-separated
3. Max 30 characters
4. Location: `docs/PLAN-{slug}.md`

---

## Complete Template

```yaml
# File: docs/PLAN-{task-slug}.md

# [Task Title]

## Metadata
complexity: "L[1-10] — [JUSTIFICATION]"
estimated_time: "[DURATION]"
parallel_safe: [true/false]

## Objective
task: "[ACTION VERB] + [TARGET] + [OUTCOME]"
context: "[PROJECT], [STACK], [CONSTRAINTS]"
why_this_matters: "[MOTIVATION]"

## Environment
runtime: "Bun 1.x"
framework: "React 19"
database: "Neon PostgreSQL"
orm: "Drizzle"
auth: "Clerk"
ui: "shadcn/ui"
testing: "Bun test"

## Research Summary
### Findings Table
| # | Finding | Confidence | Source | Impact |

### Knowledge Gaps
- [gaps]

### Assumptions to Validate
- [assumptions]

## Relevant Files
### Must Read
- path: "[PATH]"
  relevance: "[WHY]"

### May Reference
- path: "[PATH]"
  relevance: "[WHY]"

## Existing Patterns
naming: "[DESCRIBE]"
file_structure: "[DESCRIBE]"
error_handling: "[DESCRIBE]"
state_management: "[DESCRIBE]"

## Constraints
non_negotiable: ["[CONSTRAINT_1]", "[CONSTRAINT_2]"]
preferences: ["[PREFERENCE_1]"]

## Chain of Thought
### Research
- Codebase patterns: _____
- Docs consulted: _____
- Security: _____
- Edge cases: _____

### Analyze
- Core requirement: _____
- Technical constraints: _____
- Integration points: _____

### Think
step_by_step: ["First: _____", "Then: _____", "Finally: _____"]
tree_of_thoughts:
  approach_a: {description, pros, cons, score}
  approach_b: {description, pros, cons, score}
  selected: "[CHOSEN]"
  rationale: "[WHY]"

## Atomic Tasks
- id: "AT-001"
  title: "[ACTION] [TARGET]"
  phase: 1
  priority: "critical"
  dependencies: []
  parallel_safe: true
  files_to_create: ["[PATH]"]
  files_to_modify: ["[PATH]"]
  validation: "[COMMAND]"
  rollback: "[UNDO]"
  acceptance_criteria: ["[CRITERION]"]

## Validation Gates
automated:
  - {id: "VT-001", command: "bun run build", expected: "Exit 0"}
  - {id: "VT-002", command: "bun run check", expected: "No errors"}
  - {id: "VT-003", command: "bun test", expected: "All pass"}
manual_review:
  - {reviewer: "@code-reviewer", focus: "[ASPECT]", required_if: "[CONDITION]"}

## Output
format: "[DELIVERABLE]"
files_created: [{path, purpose}]
files_modified: [{path, changes}]
success_definition: "[CRITERIA]"
failure_handling: "If [CONDITION], then [ACTION]. Rollback: [STEPS]"
```

---

## Atomic Task Schema

Each atomic task should follow this structure:

```yaml
task_template:
  id: "AT-XXX"
  title: "Action verb + specific target"
  phase: "1-5 (foundation → core → integration → polish → validation)"
  priority: "critical | high | medium | low"
  dependencies: "[AT-XXX]"
  parallel_safe: "true/false (mark ⚡ PARALLEL-SAFE when true)"
  files_to_create: "[paths]"
  files_to_modify: "[paths]"
  validation: "Specific command/check"
  rollback: "Exact undo steps"
  acceptance_criteria: "[measurable bullets]"
```

**Parallel-safe conditions:**

- No shared file modifications
- No dependency chain
- Independent validation

---

## Research Outputs Schema

```yaml
outputs:
  - "Findings Table: | # | Finding | Confidence (1-5) | Source | Impact |"
  - "Knowledge Gaps: what you still don't know"
  - "Assumptions to Validate: explicit assumptions requiring confirmation"
  - "Edge Cases / Failure Modes: at least 5 when complexity ≥ L4"
```

---

## Pre-Submission Checklist

```yaml
research:
  - [ ] Codebase searched?
  - [ ] Docs consulted (Context7)?
  - [ ] Web research done (Tavily)?
  - [ ] Security/compliance identified?
  - [ ] Edge cases considered (min 5 for L4+)?

context:
  - [ ] Findings Table included?
  - [ ] Knowledge Gaps listed?
  - [ ] Assumptions to Validate listed?
  - [ ] Relevant files specified?
  - [ ] WHY included for instructions?

tasks:
  - [ ] Truly atomic?
  - [ ] Validation command each?
  - [ ] Dependencies mapped?
  - [ ] Rollback defined?
  - [ ] Parallel-safe marked?

behavior:
  - [ ] Mode specified (CONSERVATIVE/PROACTIVE)?
  - [ ] Output format explicit?
  - [ ] Success criteria measurable?
  - [ ] Failure handling defined?
```
