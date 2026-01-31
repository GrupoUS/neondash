---
description: Create project plan using planning skill with advanced research methodology. No code writing - only plan file generation.
---

# /plan - Master Planning Command

$ARGUMENTS

---

## 🔴 CRITICAL RULES

1. **ACTIVATE SKILL**: Read and follow `.agent/skills/planning/SKILL.md`
2. **APEX RESEARCH**: Execute advanced research protocol before planning
3. **NO CODE WRITING** - This command creates plan file only
4. **R.P.I.V WORKFLOW** - Research → Plan → (skip Implement) → Validate
5. **SOCRATIC GATE** - Ask clarifying questions before planning if unclear
6. **DYNAMIC NAMING** - Plan file named based on task

---

## Skills to Activate

| Priority | Skill                             | Purpose                       |
| -------- | --------------------------------- | ----------------------------- |
| P0       | `.agent/skills/planning/SKILL.md` | Core R.P.I.V methodology      |
| P1       | APEX Research Protocol (below)    | Advanced multi-source search  |

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

| Metric       | Target     | Validation                          |
| ------------ | ---------- | ----------------------------------- |
| Precision    | > 90%      | Findings directly answer objectives |
| Coverage     | Complete   | All major aspects researched        |
| Sources      | ≥ 3 types  | Codebase + docs + web/synthesis     |
| Confidence   | 4-5 / 5    | Each finding rated                  |
| Edge Cases   | ≥ 5 for L4 | Documented failure modes            |

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
     - Define validation commands + rollback steps
     - Mark parallel-safe tasks with ⚡

  3. OUTPUT:
     - Create docs/PLAN-{slug}.md using template
     - Include all research artifacts
     - Mark parallel-safe tasks
     - Include pre-submission checklist

NAMING_RULES:
  - Extract 2-3 key words from request
  - Lowercase, hyphen-separated
  - Max 30 characters
  - Example: "e-commerce cart" → PLAN-ecommerce-cart.md

CONSTRAINTS:
  - DO NOT write any code files
  - DO NOT skip research phase
  - DO NOT guess file paths or APIs
  - DO NOT proceed without meeting precision target
  - REPORT the exact file name created
```

---

## Complexity Classification

| Level  | Description                   | Research Depth     | Edge Cases |
| ------ | ----------------------------- | ------------------ | ---------- |
| L1-L2  | Bug fix, single function      | Repo-only          | 2          |
| L3-L5  | Feature, multi-file           | Docs + repo        | 3-5        |
| L6-L8  | Architecture, integration     | Deep research      | 5-8        |
| L9-L10 | Migrations, multi-service     | Comprehensive      | 8+         |

---

## Expected Output

| Deliverable           | Location                   |
| --------------------- | -------------------------- |
| Research Digest       | Inside plan file           |
| Findings Table        | Inside plan file           |
| Knowledge Gaps        | Inside plan file           |
| Assumptions           | Inside plan file           |
| Edge Cases            | Inside plan file           |
| Atomic Tasks (AT-XXX) | Inside plan file           |
| Validation Gates      | Inside plan file           |
| Project Plan          | `docs/PLAN-{task-slug}.md` |

---

## After Planning

Tell user:

```
✅ Plan created: docs/PLAN-{slug}.md

Research Summary:
- Sources consulted: [count]
- Findings documented: [count]
- Confidence level: [HIGH/MEDIUM/LOW]
- Knowledge gaps: [count] (if any)

Next steps:
- Review the plan
- Run `/implement` to start implementation
- Or modify plan manually
```

---

## Pre-Submission Checklist

Before delivering the plan, verify:

```yaml
research:
  - [ ] Codebase patterns searched and documented?
  - [ ] Context7 docs consulted for all technologies?
  - [ ] Tavily used if Context7 insufficient?
  - [ ] Sequential thinking applied for decisions?
  - [ ] Cross-validation across 2+ sources?
  - [ ] Precision target (>90%) met?

context:
  - [ ] Findings Table with confidence scores?
  - [ ] Knowledge Gaps explicitly listed?
  - [ ] Assumptions to Validate listed?
  - [ ] Edge cases documented (min 5 for L4+)?
  - [ ] Relevant files specified with paths?

tasks:
  - [ ] Truly atomic (single action)?
  - [ ] Validation command for each?
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