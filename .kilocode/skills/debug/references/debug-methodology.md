# Debug Methodology

> 4-Phase systematic debugging: Reproduce → Isolate → Understand → Fix

## Phase 1: REPRODUCE

**Goal**: Confirm minimum reproducible steps.

- [ ] Get exact error message/behavior
- [ ] Document expected vs actual
- [ ] Identify scope (file, API, component)
- [ ] Check if reproducible consistently

```markdown
## Reproduction Notes
**Expected**: [What should happen]
**Actual**: [What actually happens]
**Steps**:
1. [Step 1]
2. [Step 2]
3. [Error occurs]
```

## Phase 2: ISOLATE

**Goal**: Narrow down the problem location.

**Binary Search**:
```
Error appears → Check midpoint
├── Error before midpoint → Check first half
└── Error after midpoint → Check second half
→ Repeat until found
```

**Git Bisect**:
```bash
git bisect start
git bisect bad           # Current commit is broken
git bisect good abc123   # Known working commit
# Git will checkout midpoint, test and mark good/bad
git bisect reset         # When done
```

**Strategic Logging**:
```typescript
console.log('>> Function called:', { input, state });
// ... code
console.log('>> Before return:', { result });
```

## Phase 3: UNDERSTAND (Root Cause)

**Goal**: Find WHY, not just WHERE.

### 5 Whys Technique

```markdown
**Problem**: Database query returns empty array

1. Why? → Query has wrong filter
2. Why? → Filter uses wrong field name
3. Why? → Schema was changed but query wasn't
4. Why? → No tests for this query
5. Why? → No testing culture for DB layer

**Root Cause**: Missing integration tests for database queries
**Fix**: Add query test + fix field name
```

### Data Flow Tracing

```
User Input → Component State → API Call → Database → Response → UI Update
     ↓            ↓              ↓          ↓          ↓          ↓
   Check        Check          Check      Check      Check      Check
```

## Phase 4: FIX & VERIFY

**Goal**: Implement fix and prove it works.

| Step | Command | Check |
|------|---------|-------|
| 1. Fix code | Edit files | Logical |
| 2. Type check | `bun run check` | No errors |
| 3. Test | `bun test` | All pass |
| 4. Visual | `agent-browser` | UI works |
| 5. Commit | `git commit` | Documented |

### Commit Message Template

```
fix(scope): brief description

Root cause: [5 Whys result]
Fix: [What was changed]

Tested: bun run check ✅, bun test ✅
```

## Common Debugging Commands

```bash
# Type errors
bun run check

# Test failures
bun test --reporter=verbose

# Git changes
git diff HEAD~5
git log --oneline -10

# Search codebase
grep -r "errorPattern" src/
```

## Anti-Patterns

❌ **Shotgun debugging**: Random changes hoping to fix
❌ **Symptom fixing**: Hiding the error without understanding
❌ **Skip reproduction**: Assuming you know the problem
❌ **No verification**: Not confirming fix actually works
