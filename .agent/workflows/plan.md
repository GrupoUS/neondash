---
description: Create project plan using planning skill with advanced research methodology. No code writing - only plan file generation.
---

# /plan - Master Planning Command

$ARGUMENTS

---

## 🔴 MANDATORY EXECUTION RULES

> [!CAUTION]
> **HARD REQUIREMENTS** - These are NOT optional:

1. **ACTIVATE SKILL FIRST**: Read `.agent/skills/planning/SKILL.md` before anything
2. **EXECUTE APEX RESEARCH**: Complete ALL 4 phases of research cascade
3. **CREATE PLAN FILE**: `docs/PLAN-{task-slug}.md` is MANDATORY output
4. **NO CODE WRITING**: This command creates plan file ONLY
5. **R.P.I.V WORKFLOW**: Research → Plan → (skip Implement) → Validate
6. **SOCRATIC GATE**: Ask clarifying questions if request is unclear
7. **ATOMIC DECOMPOSITION**: All tasks must have subtasks with validation

---

## Skills to Activate

| Priority | Skill                             | Purpose                      |
| -------- | --------------------------------- | ---------------------------- |
| P0       | `.agent/skills/planning/SKILL.md` | Core R.P.I.V methodology     |
| P1       | APEX Research Protocol (below)    | Advanced multi-source search |

**MANDATORY**: Read `.agent/skills/planning/SKILL.md` FIRST, then apply APEX Research Protocol.

---

## APEX Research Protocol

### Phase 0: Search Planning

Before executing any search:

```yaml
SEARCH_CONTEXT:
  objectives: [Clear information needs from user request]
  quality_criteria: [Precision > 90%, relevance, authority]
  source_constraints: [Official docs first, then web if insufficient]
  coverage_expectations: [Comprehensive for L4+ tasks]
```

### Research Cascade (Strict Order)

```
┌─────────────────────────────────────────────────────────────────┐
│  APEX RESEARCH CASCADE (execute in order)                       │
├─────────────────────────────────────────────────────────────────┤
│  1. LOCAL CODEBASE (patterns, conventions)                      │
│     └─→ grep_search, view_file, list_dir                        │
│     └─→ Document: file_structure, naming, error_handling        │
│                                                                  │
│  2. CONTEXT7 (official documentation)                           │
│     └─→ resolve-library-id → query-docs                         │
│     └─→ Document: API patterns, best practices, constraints     │
│                                                                  │
│  3. TAVILY (web search) - ONLY if 1 and 2 insufficient          │
│     └─→ tavily-search with specific query                       │
│     └─→ tavily-extract for promising URLs                       │
│     └─→ Document: latest patterns, edge cases, security         │
│                                                                  │
│  4. SEQUENTIAL THINKING (synthesis + decision)                  │
│     └─→ Combine all sources                                     │
│     └─→ Analyze trade-offs                                      │
│     └─→ Define approach with confidence score                   │
└─────────────────────────────────────────────────────────────────┘
```

### Search Quality Metrics

| Metric     | Target     | Validation                          |
| ---------- | ---------- | ----------------------------------- |
| Precision  | > 90%      | Findings directly answer objectives |
| Coverage   | Complete   | All major aspects researched        |
| Sources    | ≥ 3 types  | Codebase + docs + web/synthesis     |
| Confidence | 4-5 / 5    | Each finding rated                  |
| Edge Cases | ≥ 5 for L4 | Documented failure modes            |

### Research Outputs (Required)

```yaml
RESEARCH_DELIVERABLES:
  findings_table:
    format: "| # | Finding | Confidence (1-5) | Source | Impact |"
    minimum_entries: 5

  knowledge_gaps:
    description: "What remains unknown after research"
    action: "Document for Phase 1 or ask user"

  assumptions_to_validate:
    description: "Explicit assumptions requiring confirmation"
    action: "Mark in plan for validation during implementation"

  edge_cases:
    description: "Potential failure modes and boundary conditions"
    minimum: 5 (for L4+ complexity)

  source_quality:
    authoritative: "Official docs, official repos"
    verified: "Cross-referenced across 2+ sources"
    current: "Published within last 12 months preferred"
```

---

## Phase 0.5: Historical Context Retrieval (AUTOMATIC)

> [!NOTE]
> **Self-Evolving Agent Integration** - Runs automatically before research

Before starting research, the `self-evolving-agent` skill automatically:

1. **Query Memory**: Searches for similar past tasks via `memory_manager.py load_context`
2. **Retrieve Observations**: Loads relevant tool usage patterns and outcomes
3. **Inject Learnings**: Provides compressed historical context to inform planning
4. **Suggest Approaches**: Recommends proven strategies based on success scores

```yaml
HISTORICAL_CONTEXT:
  trigger: "Automatic at /plan start"
  data_sources:
    - Similar sessions (semantic search)
    - Successful patterns from past planning
    - Common pitfalls and their solutions
  injection_point: "Before APEX Research Phase 1"
  token_budget: 2000  # Max tokens from historical context
```

This phase is **passive** - it enhances research without requiring explicit action.

---

## 🔴 MANDATORY: Plan File Creation

> [!IMPORTANT]
> **YOU MUST CREATE THE PLAN FILE BEFORE FINISHING**
>
> The plan file `docs/PLAN-{task-slug}.md` is the PRIMARY deliverable.
> Do NOT skip this step. Do NOT just summarize in chat.
> The file MUST exist in the `docs/` folder.

### Plan File Template (REQUIRED STRUCTURE)

```markdown
# PLAN-{task-slug}: {Title}

> **Goal:** {One-line description of the objective}

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | ... | X/5 | ... | ... |

### Knowledge Gaps & Assumptions
- **Gap:** {What remains unknown}
- **Assumption:** {What we're assuming to be true}

---

## 1. User Review Required (If Any)

> [!IMPORTANT/WARNING/CAUTION]
> {Critical decisions, breaking changes, or clarifications needed}

---

## 2. Proposed Changes

### Phase N: {Phase Name}

#### [MODIFY/NEW/DELETE] [filename](file:///absolute/path)
- **Action:** {What will be done}
- **Details:** {Specifics}

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Each task MUST have subtasks. No single-line tasks allowed.

### AT-001: {Task Title}
**Goal:** {What this task accomplishes}
**Dependencies:** None | AT-XXX

#### Subtasks:
- [ ] ST-001.1: {Specific action}
  - **File:** `path/to/file`
  - **Validation:** {How to verify}
- [ ] ST-001.2: {Specific action}
  - **File:** `path/to/file`
  - **Validation:** {How to verify}

**Rollback:** {How to undo if needed}

### AT-002: {Task Title}
**Goal:** {What this task accomplishes}
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: {Specific action}
  - **File:** `path/to/file`
  - **Validation:** {How to verify}

**Rollback:** {How to undo if needed}

---

## 4. Verification Plan

### Automated Tests
- `bun run check` - TypeScript validation
- `bun run lint` - Code formatting
- `bun test` - Unit tests

### Manual Verification
- {Step-by-step manual checks}

---

## 5. Rollback Plan

- {Git commands or steps to revert changes}
```

---

## Task Execution

```yaml
CONTEXT:
  user_request: $ARGUMENTS
  mode: CONSERVATIVE (plan only, no code)
  output_location: docs/PLAN-{task-slug}.md

WORKFLOW:
  0. CLASSIFY:
     - Determine complexity level (L1-L10)
     - If L4+: Execute APEX Research Protocol fully
     - If L1-L3: Codebase search + docs may suffice

  1. RESEARCH (APEX Protocol):
     - Codebase: patterns, conventions, existing implementations
     - Context7: official docs for all technologies involved
     - Tavily: best practices, security, edge cases (if needed)
     - Sequential Thinking: synthesize and decide approach

  2. PLAN:
     - Create Findings Table with confidence scores
     - List Knowledge Gaps explicitly
     - List Assumptions to Validate
     - Decompose into Atomic Tasks (AT-XXX)
     - MANDATORY: Each AT-XXX has Subtasks (ST-XXX.N)
     - Define validation commands + rollback steps
     - Mark parallel-safe tasks with ⚡

  3. OUTPUT (MANDATORY):
     ┌─────────────────────────────────────────────────────────┐
     │  ⚠️ CRITICAL: CREATE THE FILE IN docs/                  │
     │                                                         │
     │  Use write_to_file tool to create:                     │
     │  docs/PLAN-{slug}.md                                   │
     │                                                         │
     │  DO NOT just respond in chat.                          │
     │  The file IS the deliverable.                          │
     └─────────────────────────────────────────────────────────┘
     - Include all research artifacts
     - Mark parallel-safe tasks with ⚡
     - Include pre-submission checklist

NAMING_RULES:
  - Extract 2-3 key words from request
  - Lowercase, hyphen-separated
  - Max 30 characters
  - Example: "e-commerce cart" → PLAN-ecommerce-cart.md

CONSTRAINTS:
  - DO NOT write any code files
  - DO NOT skip research phase
  - DO NOT skip plan file creation
  - DO NOT guess file paths or APIs
  - DO NOT proceed without meeting precision target
  - MUST create docs/PLAN-{slug}.md file
  - MUST decompose tasks into subtasks
  - REPORT the exact file name created
```

---

## Complexity Classification

| Level  | Description               | Research Depth | Edge Cases | Min Subtasks/Task |
| ------ | ------------------------- | -------------- | ---------- | ----------------- |
| L1-L2  | Bug fix, single function  | Repo-only      | 2          | 2                 |
| L3-L5  | Feature, multi-file       | Docs + repo    | 3-5        | 3                 |
| L6-L8  | Architecture, integration | Deep research  | 5-8        | 4                 |
| L9-L10 | Migrations, multi-service | Comprehensive  | 8+         | 5+                |

---

## Expected Output

| Deliverable                  | Location                   | Status   |
| ---------------------------- | -------------------------- | -------- |
| Research Digest              | Inside plan file           | Required |
| Findings Table               | Inside plan file           | Required |
| Knowledge Gaps               | Inside plan file           | Required |
| Assumptions                  | Inside plan file           | Required |
| Edge Cases                   | Inside plan file           | Required |
| Atomic Tasks (AT-XXX)        | Inside plan file           | Required |
| **Subtasks (ST-XXX.N)**      | Inside plan file           | Required |
| Validation Gates             | Inside plan file           | Required |
| **Project Plan File**        | `docs/PLAN-{task-slug}.md` | Required |

---

## After Planning

> [!IMPORTANT]
> **MANDATORY VALIDATION BEFORE COMPLETION:**
> 1. Verify `docs/PLAN-{slug}.md` file exists
> 2. Verify all AT-XXX tasks have ST-XXX.N subtasks
> 3. Verify findings table has 5+ entries

Tell user:

```
✅ Plan created: docs/PLAN-{slug}.md

Research Summary:
- Sources consulted: [count]
- Findings documented: [count]
- Confidence level: [HIGH/MEDIUM/LOW]
- Knowledge gaps: [count] (if any)

Task Breakdown:
- Atomic Tasks: [count]
- Total Subtasks: [count]
- Parallel-safe: [count] ⚡

Next steps:
- Review the plan: docs/PLAN-{slug}.md
- Run `/implement` to start implementation
- Or modify plan manually
```

---

## Pre-Submission Checklist

Before delivering the plan, verify:

```yaml
file_creation:
  - [ ] Created docs/PLAN-{slug}.md file? (MANDATORY)
  - [ ] File follows template structure?
  - [ ] File is readable and complete?

research:
  - [ ] Codebase patterns searched and documented?
  - [ ] Context7 docs consulted for all technologies?
  - [ ] Tavily used if Context7 insufficient?
  - [ ] Sequential thinking applied for decisions?
  - [ ] Cross-validation across 2+ sources?
  - [ ] Precision target (>90%) met?

context:
  - [ ] Findings Table with 5+ entries and confidence scores?
  - [ ] Knowledge Gaps explicitly listed?
  - [ ] Assumptions to Validate listed?
  - [ ] Edge cases documented (min 5 for L4+)?
  - [ ] Relevant files specified with paths?

tasks:
  - [ ] All tasks have AT-XXX IDs?
  - [ ] All tasks have subtasks (ST-XXX.N)?
  - [ ] Each subtask has validation?
  - [ ] Dependencies mapped?
  - [ ] Rollback steps defined?
  - [ ] Parallel-safe marked with ⚡?

quality:
  - [ ] Mode specified (CONSERVATIVE)?
  - [ ] Output format explicit?
  - [ ] Success criteria measurable?
  - [ ] Failure handling defined?
```

---

## Failure Protocol

If unable to complete the plan file:

```yaml
ON_FAILURE:
  1. DO NOT silently skip file creation
  2. Explain what research was completed
  3. Explain what is blocking file creation
  4. Ask user for clarification or missing info
  5. Resume planning once blockers resolved
```

---
