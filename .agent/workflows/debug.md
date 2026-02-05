---
description: Unified debugging workflow with integrated QA pipeline. Activates DEBUG mode using debugger agent with skills debug and backend-design for systematic investigation, architecture validation, database analysis, API testing, and auto-fix.
---

# /debug - Systematic Problem Investigation & QA Pipeline

$ARGUMENTS

---

## Core Philosophy

> "Don't guess. Investigate systematically. Test thoroughly. Fix root causes."

### Mindset

- **Reproduce first**: Can't fix what you can't see
- **Evidence-based**: Follow the data, not assumptions
- **Root cause focus**: Symptoms hide the real problem
- **One change at a time**: Multiple changes = confusion
- **Regression prevention**: Every bug needs a test
- **Security is non-negotiable**: Validate everything, trust nothing
- **Type safety prevents bugs**: TypeScript strict mode everywhere

---

## Skills to Apply

**MANDATORY**: Load and apply these skills:

| Skill                                   | Use For                                              |
| --------------------------------------- | ---------------------------------------------------- |
| `.agent/skills/debug/SKILL.md`          | Testing, CLI tools, security checklist, E2E          |
| `.agent/skills/backend-design/SKILL.md` | API patterns, TypeScript, database, LEVER principles |

---

## Integrated Flow

```mermaid
flowchart TD
    A[/debug] --> B[Phase 1: Reproduce & Gather]
    B --> C[Phase 2: Isolate & Analyze]
    C --> D[Phase 3: Root Cause]
    D --> E{Issue Found?}

    E -->|Yes| F[Phase 4: Fix & Verify]
    F --> G[Phase 5: QA Pipeline]

    E -->|No| H[Expand Search]
    H --> C

    G --> I{All Tests Pass?}
    I -->|Yes| J[✅ DEBUG COMPLETE]
    I -->|No| K[Auto-Research & Fix]
    K --> G
```

---

## Phase 1: Reproduce & Gather Context

```
┌─────────────────────────────────────────────────────────────┐
│  • Get exact reproduction steps                              │
│  • Determine reproduction rate (100%? intermittent?)         │
│  • Document expected vs actual behavior                      │
│  • Query context: architecture, patterns, constraints        │
└─────────────────────────────────────────────────────────────┘
```

### Investigation Start Questions

1. **What is happening?** (exact error, symptoms)
2. **What should happen?** (expected behavior)
3. **When did it start?** (recent changes?)
4. **Can you reproduce?** (steps, rate)
5. **What have you tried?** (rule out)

### Commands

```bash
# Check backend logs
railway logs --latest -n 100

# Check database (Neon MCP)
# mcp_mcp-server-neon_list_slow_queries
# mcp_mcp-server-neon_run_sql
```

---

## Phase 2: Isolate & Analyze

```
┌─────────────────────────────────────────────────────────────┐
│  • When did it start? What changed?                          │
│  • Which component is responsible? (Frontend/Backend/DB)     │
│  • Create minimal reproduction case                          │
│  • Review code quality, security, performance                │
└─────────────────────────────────────────────────────────────┘
```

### Investigation by Domain

#### Frontend Issues

| Symptom                | Investigation                                  |
| ---------------------- | ---------------------------------------------- |
| **UI not updating**    | Check state management, reactivity, hooks deps |
| **Crashes on render**  | Check null access, component lifecycle         |
| **Slow performance**   | Profile with DevTools, check re-renders        |
| **Hydration mismatch** | SSR/CSR data consistency                       |
| **Type errors**        | TypeScript strict, Zod validation              |

#### Backend/API Issues

| Symptom            | Investigation                                   |
| ------------------ | ----------------------------------------------- |
| **500 errors**     | Read stack trace, check middleware chain        |
| **Auth failures**  | JWT validation, session state, CORS             |
| **Slow endpoints** | Profile queries, N+1, caching                   |
| **Type mismatch**  | tRPC inference, Zod schemas                     |
| **Memory leaks**   | Event listeners, closures, unclosed connections |

#### Database Issues

| Symptom             | Investigation                      |
| ------------------- | ---------------------------------- |
| **Slow queries**    | EXPLAIN ANALYZE, missing indexes   |
| **Wrong data**      | Check constraints, trace mutations |
| **Connection pool** | Pool size, leaks, timeouts         |
| **Migration fails** | Schema conflicts, data integrity   |
| **N+1 queries**     | JOINs, eager loading, DataLoader   |

### Debugging Techniques

#### Binary Search Debugging

1. Find a point where it works
2. Find a point where it fails
3. Check the middle
4. Repeat until exact location found

#### Git Bisect for Regressions

```bash
git bisect start
git bisect bad HEAD
git bisect good <known-good-commit>
```

---

## Phase 3: Understand Root Cause

```
┌─────────────────────────────────────────────────────────────┐
│  • Apply "5 Whys" technique                                  │
│  • Trace data flow from DB → API → Frontend                  │
│  • Identify the actual bug, not the symptom                  │
│  • Check for architecture/pattern violations                 │
└─────────────────────────────────────────────────────────────┘
```

### The 5 Whys

```
WHY is the user seeing an error?
→ Because the API returns 500.

WHY does the API return 500?
→ Because the database query fails.

WHY does the query fail?
→ Because the table doesn't exist.

WHY doesn't the table exist?
→ Because migration wasn't run.

WHY wasn't migration run?
→ Because deployment script skips it. ← ROOT CAUSE
```

### 5 Whys Template

```markdown
**Problem**: [Error description]

1. Why? → [First cause]
2. Why? → [Deeper cause]
3. Why? → [Underlying issue]
4. Why? → [Systemic reason]
5. Why? → [Root cause]

**Root Cause**: [Final determination]
**Fix**: [Proposed solution]
```

---

## Phase 4: Fix, Verify & Prevent

```
┌─────────────────────────────────────────────────────────────┐
│  • Fix the root cause                                        │
│  • Verify fix across all layers                              │
│  • Add regression test                                       │
│  • Check for similar issues elsewhere                        │
└─────────────────────────────────────────────────────────────┘
```

### Quality Control Loop (MANDATORY)

After every fix:

```bash
# 1. Type check
bun run check

# 2. Lint (Biome)
bun run lint:check

# 3. Test (Vitest)
bun run test

# 4. Security check
# - No hardcoded secrets
# - Input validated
# - Auth checks in place

# 5. Database check (if applicable)
# - Migration reversible
# - Indexes cover queries
```

---

## Phase 5: QA Validation Pipeline

> **🔴 CRITICAL GATE**: Ensure fix doesn't break other things

### 5.1 Local Quality Checks

```bash
bun run check      # Type safety
bun run lint:check # Biome lint
bun run test       # Vitest unit tests
bun run test:coverage
```

### 5.2 Deployment Validation

```bash
railway status
railway logs --latest -n 50
# mcp_mcp-server-neon_run_sql "SELECT 1"
```

### 5.3 E2E Validation (if UI affected)

> [!IMPORTANT]
> **SEMPRE prefira `agent-browser` CLI** ao invés do `browser_subagent` padrão.
> O `agent-browser` oferece controle programático preciso, snapshots reproduzíveis, e refs consistentes para debugging.

```bash
# Workflow preferido para validação frontend
agent-browser open http://localhost:3000   # Abre página
agent-browser snapshot                     # Lista elementos interativos (@refs)
agent-browser screenshot debug-result.png  # Captura estado visual
agent-browser get text @e1                 # Verifica conteúdo de elemento
agent-browser close                        # Cleanup obrigatório
```

**Quando usar cada ferramenta:**

| Cenário                        | Ferramenta          | Motivo                                |
| ------------------------------ | ------------------- | ------------------------------------- |
| Validar UI visualmente         | `agent-browser`     | Snapshots reproduzíveis, refs estáveis |
| Testar fluxos de usuário       | `agent-browser`     | Comandos encadeados, sem overhead     |
| Capturar screenshots           | `agent-browser`     | Direto, salva como PNG                |
| Gravar vídeo de reprodução     | `browser_subagent`  | Único caso para usar (grava WebP)     |
| Debugging interativo complexo  | `agent-browser`     | Controle step-by-step                 |

---

## Auto-Research & Fix (If QA Fails)

1. **Aggregate Errors**: Stack trace, lib versions, affected code, logs
2. **Invoke Research**: `/research "Debug Fix: [resumo]. Context: [logs]."`
3. **Generate Atomic Tasks**: Research → Apply fix → Verify
4. **Re-run QA Pipeline**

---

## Post-Error Analysis (AUTOMATIC)

> [!NOTE]
> **Self-Evolving Agent Integration** - Runs automatically after any error

After any error, the `self-evolving-agent` skill automatically:

1. **Analyze Pattern**: Compares error against historical failure data via `evolution_engine.py analyze_failure`
2. **Suggest Solutions**: Retrieves fixes that worked for similar errors
3. **Store Learning**: Records error-solution pair for future reference
4. **Update Strategies**: Adjusts mutation strategies to prevent recurrence

```yaml
POST_ERROR_ANALYSIS:
  trigger: "After any build/test/runtime error"
  actions:
    - Extract error signature (type, message, stack trace)
    - Query similar errors from memory database
    - Rank solutions by success rate
    - Store new error if not previously seen
  output:
    - "Historical matches: X similar errors found"
    - "Suggested fix: [description] (Y% success rate)"
    - "Related files: [list]"
```

**Example Output**:

```
🔍 Historical Analysis (3 similar errors found):
   1. "Type instantiation too deep" - Solution: Early cast (92% success)
   2. Similar tRPC inference issue - Solution: Explicit generics (87% success)
   
💡 Recommended: Apply early cast pattern from AT-015
```

---

## Code Review Checklist

### Security (CRITICAL - Check First)

- [ ] **Input Validation**: All inputs validated and sanitized
- [ ] **Authentication**: Protected routes have auth middleware
- [ ] **Authorization**: Role-based access control implemented
- [ ] **SQL Injection**: Using parameterized queries/ORM
- [ ] **XSS Prevention**: Output encoding, Content-Security-Policy
- [ ] **Secrets**: Environment variables, not hardcoded
- [ ] **Dependencies**: No known vulnerabilities

### Code Quality

- [ ] **Logic correctness**: Edge cases handled
- [ ] **Error handling**: Centralized, consistent format
- [ ] **Type safety**: No `any`, proper generics
- [ ] **Naming**: Descriptive, consistent conventions
- [ ] **Complexity**: Cyclomatic complexity < 10
- [ ] **DRY**: No duplicated logic
- [ ] **SOLID**: Single responsibility, dependency injection

### Performance

- [ ] **Database**: Indexes for query patterns, no SELECT \*
- [ ] **API**: Response size, caching strategy
- [ ] **Frontend**: Bundle size, lazy loading, memoization
- [ ] **Async**: Non-blocking I/O, proper await handling

### Testing

- [ ] **Coverage**: Critical paths tested > 80%
- [ ] **Unit tests**: Business logic isolated
- [ ] **Integration**: API endpoints verified
- [ ] **E2E**: User journeys covered
- [ ] **Regression**: Test for every bug fix

---

## Architecture Validation

### Layered Architecture Check

```
Controller → Service → Repository → Database
     │           │           │
   Validate    Logic      Query
   Route       Rules       Data
```

- ❌ Don't put business logic in controllers
- ❌ Don't skip the service layer
- ❌ Don't mix concerns across layers
- ✅ Use dependency injection for testability

### API Design Check

- [ ] Consistent response format
- [ ] Appropriate HTTP status codes
- [ ] Rate limiting implemented
- [ ] OpenAPI/tRPC documentation
- [ ] Version strategy defined

### Database Schema Check

- [ ] Primary keys defined
- [ ] Foreign keys constrained
- [ ] Indexes match query patterns
- [ ] Appropriate data types
- [ ] Normalization level appropriate

---

## Common Anti-Patterns

| ❌ Anti-Pattern              | ✅ Correct Approach           |
| ---------------------------- | ----------------------------- |
| Random changes hoping to fix | Systematic investigation      |
| Ignoring stack traces        | Read every line carefully     |
| "Works on my machine"        | Reproduce in same environment |
| Fixing symptoms only         | Find and fix root cause       |
| No regression test           | Always add test for the bug   |
| Multiple changes at once     | One change, then verify       |
| Guessing without data        | Profile and measure first     |
| SELECT \* everywhere         | Select only needed columns    |
| N+1 queries                  | Use JOINs or eager loading    |
| Hardcoded secrets            | Environment variables only    |
| Skipping auth checks         | Verify every protected route  |
| Giant controllers            | Split into services           |

---

## Framework-Specific Debugging

### tRPC + TanStack Query

```typescript
// Check: Query key conflicts
// Check: Stale time configuration
// Check: Error boundaries for mutations
// Check: Optimistic update rollback

const { data, error, isLoading, status } = trpc.feature.list.useQuery();
console.log({ status, error });
```

### Drizzle ORM + Neon

```typescript
// Check: .returning() for PostgreSQL inserts
// Check: Index usage with EXPLAIN
// Check: Connection pooling (serverless)

const result = await db.select().from(table);
console.log(db.toSQL(query)); // See generated SQL
```

### React 19 + Hooks

```typescript
// Check: Hook dependency arrays
// Check: ref-as-prop (no forwardRef needed)
// Check: use() for promises
// Check: Key prop for lists

useEffect(() => {
  console.log("Component rerendered with:", deps);
}, [deps]);
```

---

## Tool Selection by Problem

### Browser/Frontend

| Need             | Tool                  |
| ---------------- | --------------------- |
| Network requests | Network tab           |
| DOM state        | Elements tab          |
| Debug JS         | Sources + breakpoints |
| Performance      | Performance tab       |
| Memory           | Memory tab profiler   |

### Backend/API

| Need               | Tool                   |
| ------------------ | ---------------------- |
| Request flow       | Structured logging     |
| Step-by-step debug | --inspect flag         |
| Slow queries       | Query logging, EXPLAIN |
| Memory issues      | Heap snapshots         |
| Regression         | git bisect             |

### Database

| Need              | Approach                        |
| ----------------- | ------------------------------- |
| Slow queries      | EXPLAIN ANALYZE                 |
| Wrong data        | Check constraints, trace writes |
| Connection issues | Check pool, connection logs     |
| Index efficiency  | pg_stat_statements              |

---

## Investigation Checklist

### Before Starting

- [ ] Can reproduce consistently
- [ ] Have error message/stack trace
- [ ] Know expected behavior
- [ ] Checked recent changes (git diff)

### During Investigation

- [ ] Added strategic logging
- [ ] Traced data flow (DB → API → UI)
- [ ] Used debugger/breakpoints
- [ ] Checked relevant logs
- [ ] Reviewed code for anti-patterns

### After Fix

- [ ] Root cause documented
- [ ] Fix verified in all affected areas
- [ ] Regression test added
- [ ] Similar code checked for same issue
- [ ] Debug logging removed
- [ ] Type check passes
- [ ] Lint passes

---

## Output Format

```markdown
## 🔍 Debug Report: [Issue Title]

**Issue:** [one-line description]
**Root Cause:** [what was actually wrong]

### Analysis

- [key findings from investigation]

### Fix Applied

- [files changed]
- [what was changed and why]

### Verification

- [ ] Type check passes
- [ ] Tests pass
- [ ] Regression test added
- [ ] Similar issues checked

### Prevention

- [how to prevent this in the future]
```

---

## Success Metrics

| Gate         | Command                     | Expected      |
| ------------ | --------------------------- | ------------- |
| Type Check   | `bun run check`             | 0 errors      |
| Lint         | `bun run lint:check`        | 0 warnings    |
| Tests        | `bun run test`              | All pass      |
| Build        | `bun run build`             | Clean build   |
| DB Schema    | `bun run db:push --dry-run` | No drift      |
| Slow Queries | Neon MCP                    | < 100ms avg   |
| Deploy       | `railway status`            | Healthy       |
| Logs         | `railway logs`              | No new errors |

---

## Quick Reference

| Task         | Command                        |
| ------------ | ------------------------------ |
| Debug issue  | `/debug [description]`         |
| Check types  | `bun run check`                |
| Lint & fix   | `bun run lint`                 |
| Lint check   | `bun run lint:check`           |
| Run tests    | `bun run test`                 |
| Watch tests  | `bun run test:watch`           |
| Slow queries | Neon MCP tools                 |
| Check logs   | `railway logs --latest -n 100` |
| Full QA      | `/qa`                          |
| Research fix | `/research "Debug: ..."`       |

---

> **Remember:** Debugging is detective work. Follow the evidence, not your assumptions. Fix root causes, not symptoms.

**Pipeline: `/debug` → reproduce → isolate → root cause → fix → QA validate → (se falhar) → auto-research → re-fix**
