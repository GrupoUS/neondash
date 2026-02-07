---
description: Create project plan using planning skill with advanced research methodology. No code writing - only plan file generation.
---

# /plan - Master Planning Command

$ARGUMENTS

---

## 🔴 RULES

1. **SKILL FIRST**: Read `.agent/skills/planning/SKILL.md`
2. **RESEARCH CASCADE**: Local → Context7 → Tavily → Sequential Thinking
3. **OUTPUT**: `docs/PLAN-{slug}.md` is the ONLY deliverable
4. **NO CODE**: Plan file only, never write implementation code
5. **ATOMIC**: All tasks must have subtasks with validation + rollback
6. **SOCRATIC GATE**: Ask if request is unclear

---

## Execution Flow

```mermaid
flowchart TD
    A[/plan] --> B[Load Historical Context]
    B --> C[Classify Complexity]
    C --> D[APEX Research Cascade]
    D --> E[Sequential Thinking: Synthesize]
    E --> F[Write docs/PLAN-slug.md]
    F --> G[Validate Plan Structure]
    G --> H[notify_user: Plan Ready]
```

---

## Step 0: Historical Context (evolution-core)

```bash
# turbo
python3 .agent/skills/evolution-core/scripts/memory_manager.py load_context --project "$PWD" --task "$TASK_DESCRIPTION"
```

Loads similar past tasks, proven patterns, and common pitfalls to inform research.

---

## Step 1: Classify Complexity

| Level | Description | Research Depth | Min Subtasks/Task |
|-------|-------------|----------------|-------------------|
| L1-L3 | Bug fix, single feature | Repo + docs | 2 |
| L4-L5 | Multi-file feature | Full cascade | 3 |
| L6-L8 | Architecture, integration | Deep research | 4 |
| L9-L10 | Migration, multi-service | Comprehensive | 5+ |

---

## Step 2: APEX Research Cascade

Execute in strict order:

```
1. LOCAL CODEBASE
   └─→ grep_search, view_file, list_dir
   └─→ Document: patterns, conventions, existing code

2. CONTEXT7 (official docs)
   └─→ resolve-library-id → query-docs
   └─→ All relevant: tRPC, Drizzle, shadcn, React, Clerk, etc.

3. TAVILY (only if 1+2 insufficient)
   └─→ tavily-search → tavily-extract for good URLs

4. SEQUENTIAL THINKING (synthesis)
   └─→ Combine sources, analyze trade-offs
   └─→ Define approach with confidence score
```

### Research Quality

- **Precision** > 90% — findings must answer objectives
- **Sources** ≥ 3 types — codebase + docs + web/synthesis
- **Confidence** 1-5 per finding
- **Edge cases** ≥ 5 for L4+ complexity

---

## Step 3: Create Plan File (MANDATORY)

> [!CAUTION]
> Use `write_to_file` to create `docs/PLAN-{slug}.md`. DO NOT just respond in chat.

### Naming: 2-3 keywords, lowercase, hyphen-separated, max 30 chars
Example: "e-commerce cart" → `PLAN-ecommerce-cart.md`

### Required Structure

```markdown
# PLAN-{slug}: {Title}
> **Goal:** {One-line objective}

## 0. Research Findings
| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|

### Knowledge Gaps & Assumptions
- **Gap:** {What remains unknown}
- **Assumption:** {What we're assuming}

---

## 1. User Review Required (if any)
> [!WARNING]
> {Breaking changes, critical decisions}

---

## 2. Proposed Changes

### Phase N: {Name}
#### [MODIFY/NEW/DELETE] [filename](file:///path)
- **Action:** {What} — **Details:** {How}

---

## 3. Atomic Tasks

### AT-001: {Title}
**Goal:** {Objective} | **Dependencies:** None | AT-XXX

- [ ] ST-001.1: {Action} → File: `path` → Validation: {check}
- [ ] ST-001.2: {Action} → File: `path` → Validation: {check}

**Rollback:** {Undo steps}

---

## 4. Verification Plan
- `bun run check` — TypeScript
- `bun run lint` — Biome
- `bun test` — Vitest
- {Manual checks}

## 5. Rollback Plan
- {Git/manual revert steps}
```

---

## Step 4: Validate & Deliver

Before completing, verify:

```yaml
file:     [ ] docs/PLAN-{slug}.md exists?
research: [ ] Findings table 5+ entries? Gaps listed? Assumptions listed?
tasks:    [ ] All AT-XXX have ST-XXX.N subtasks? Validation per subtask?
quality:  [ ] Dependencies mapped? Rollback defined? ⚡ parallel marked?
```

### Output Message

```
✅ Plan created: docs/PLAN-{slug}.md

Research: {count} findings | Confidence: {HIGH/MEDIUM/LOW}
Tasks: {count} AT | {count} ST | {count} ⚡ parallel

Next: Review plan → `/implement` to start
```

---

## Failure Protocol

```yaml
on_failure:
  1: Do NOT silently skip file creation
  2: Explain what research completed
  3: Explain blocker
  4: Ask user for missing info
  5: Resume after resolved
```

---

## References

- Skill: `.agent/skills/planning/SKILL.md`
- Evolution: `.agent/skills/evolution-core/SKILL.md`
- Implement: `.agent/workflows/implement.md`
