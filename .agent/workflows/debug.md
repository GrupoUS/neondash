---
description: Unified debugging workflow with integrated QA pipeline. Systematic investigation, root cause analysis, fix, and validation.
---

# /debug - Systematic Investigation & QA

$ARGUMENTS

> "Don't guess. Investigate systematically. Fix root causes, not symptoms."

---

## 🔴 RULES

1. **SKILLS**: Load `.agent/skills/debug/SKILL.md` + `.agent/skills/backend-design/SKILL.md`
2. **REPRODUCE FIRST**: Can't fix what you can't see
3. **ONE CHANGE**: Multiple changes = confusion
4. **ROOT CAUSE**: Symptoms hide the real problem
5. **REGRESSION TEST**: Every bug needs a test
6. **EVOLVE**: Query past errors, capture solutions

---

## Execution Flow

```mermaid
flowchart TD
    A[/debug] --> B[Query Past Errors]
    B --> C[Phase 1: Reproduce]
    C --> D[Phase 2: Isolate]
    D --> E[Phase 3: Root Cause]
    E --> F{Found?}
    F -->|Yes| G[Phase 4: Fix + Verify]
    F -->|No| H[Expand Search]
    H --> D
    G --> I[Phase 5: QA Pipeline]
    I --> J{Pass?}
    J -->|Yes| K[Capture Solution + Done]
    J -->|No| L[Research + Re-fix]
    L --> I
```

---

## Step 0: Historical Context (evolution-core)

```bash
# turbo
python3 .agent/skills/evolution-core/scripts/memory_manager.py query --text "[ERROR_MESSAGE]"
```

Check if this error pattern was solved before. Apply known solutions first.

---

## Phase 1: Reproduce & Gather

1. **What** is happening? (exact error/symptoms)
2. **What should** happen? (expected behavior)
3. **When** did it start? (recent changes?)
4. **Reproduce** rate? (100%? intermittent?)
5. **Already tried?** (rule out)

```bash
# Check logs and database
railway logs --latest -n 100
# mcp-server-neon: list_slow_queries, run_sql
```

---

## Phase 2: Isolate & Analyze

### By Domain

| Domain | Symptoms → Investigation |
|--------|--------------------------|
| **Frontend** | UI not updating → state/hooks deps · Crashes → null access · Slow → re-renders |
| **Backend** | 500 → stack trace/middleware · Auth → JWT/CORS · Slow → N+1/queries |
| **Database** | Slow → EXPLAIN/indexes · Wrong data → constraints · Pool → leaks/timeouts |

### Techniques

- **Binary Search**: Find works/fails points, check middle, repeat
- **Git Bisect**: `git bisect start` → `bad HEAD` → `good <commit>`
- **Data Trace**: DB → API → Frontend (follow the data)

---

## Phase 3: Root Cause (5 Whys)

```
WHY error? → API returns 500
WHY 500? → Query fails
WHY fails? → Table missing
WHY missing? → Migration not run
WHY not run? → Deploy script skips it ← ROOT CAUSE
```

Use `sequential-thinking` MCP for complex analysis.

---

## Phase 4: Fix & Verify

1. Fix the root cause (one change only)
2. Run quality checks:

```bash
bun run check        # TypeScript
bun run lint:check   # Biome
bun run test         # Vitest
```

3. Check security: no hardcoded secrets, inputs validated, auth in place
4. Add regression test for the bug

---

## Phase 5: QA Pipeline

```bash
# Local
bun run check && bun run lint:check && bun run test

# Database (if applicable)
# mcp-server-neon: run_sql, explain_sql_statement

# Deploy (if applicable)
railway status && railway logs --latest -n 50
```

### If QA Fails → Auto-Research

1. Aggregate errors: stack trace, lib versions, logs
2. Research: context7 → tavily (if needed)
3. Apply fix → re-run QA pipeline

---

## Post-Fix: Capture Solution (evolution-core)

```bash
# turbo
python3 .agent/skills/evolution-core/scripts/memory_manager.py capture "Fixed: [ERROR_TYPE] in [FILE] - Solution: [SOLUTION]" -t "bug_fix"
```

---

## Quick Checklists

### Code Review

```yaml
security:    [ ] Inputs validated? Auth checked? No secrets? No eval()?
quality:     [ ] No any? Edge cases? Error handling? DRY?
performance: [ ] Indexes? No SELECT *? No N+1? Lazy loading?
testing:     [ ] Regression test added? All tests pass?
```

### Anti-Patterns

| ❌ Don't | ✅ Do |
|---------|------|
| Random changes hoping to fix | Systematic investigation |
| Fixing symptoms only | Find root cause |
| Multiple changes at once | One change, then verify |
| No regression test | Always add test |
| `SELECT *` | Select needed columns |
| Hardcoded secrets | Environment variables |

---

## Output Format

```markdown
## 🔍 Debug Report: [Issue Title]

**Issue:** [description]
**Root Cause:** [actual problem]

### Fix Applied
- [files changed + why]

### Verification
- [ ] Type check ✓ | Tests ✓ | Regression test added ✓

### Prevention
- [how to avoid in future]
```

---

## Quick Reference

```
PIPELINE: reproduce → isolate → root cause → fix → QA → capture
RESEARCH: Local → context7 → tavily → sequential-thinking
QUALITY:  bun run check && bun run lint:check && bun run test
EVOLVE:   query past errors → fix → capture solution
```

---

## References

- Debug Skill: `.agent/skills/debug/SKILL.md`
- Backend Skill: `.agent/skills/backend-design/SKILL.md`
- Evolution: `.agent/skills/evolution-core/SKILL.md`
