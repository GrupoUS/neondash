# Deploy Preparation Audit - Neon Dashboard

> **Generated:** 2026-01-21
> **Framework:** React 19.2 + Vite 7 + Bun 1.3.6 + tRPC 11 + Drizzle ORM + Neon PostgreSQL + Clerk
> **Audit Type:** Pre-Production Production Readiness

---

## Executive Summary

| Category        | Status      | Issues       | Blocking?  |
| --------------- | ----------- | ------------ | ---------- |
| TypeScript      | ✅ Clear    | 0            | ❌ No      |
| Tests           | ⚠️ Partial  | 12 skipped   | ⚠️ Partial |
| Code Formatting | ❌ Issues   | 660 files    | ❌ No      |
| Bundle Size     | 🔴 Critical | 1.6MB bundle | ✅ **YES** |
| Security        | ⚠️ Pending  | TBD          | ⚠️ Pending |
| Environment     | 🔴 Critical | Missing vars | ✅ **YES** |
| Build Warnings  | 🔴 Critical | 3+ warnings  | ⚠️ Partial |

### Overall Deploy Status: 🔴 **NOT READY FOR PRODUCTION**

**Critical Blockers:**

1. Bundle size 1.6MB (3x recommended max of 500KB)
2. Missing environment variables in `client/index.html`
3. Chunk size warnings affecting load performance

**Priority Execution Order:** Critical → High → Medium → Low

---

## CRITICAL ISSUES (BLOCKING DEPLOY)

### Issue 1: Massive Bundle Size (1.6MB 🔴)

**Location:** Output from `bun run build`

**Current State:**

```
dist/public/assets/index-BW8Vxk6z.js   1,603.86 kB │ gzip: 429.56 kB
```

**Why This Blocks Deploy:**

- 1.6MB ungzipped is ~3x the recommended max (500KB)
- Results in poor First Contentful Paint (FCP) and LCP
- Blocks initial render on slow connections (3G/4G)
- Core Web Vitals will fail Performance audits
- High bounce risk for mobile users

**Root Cause Analysis (Based on Context7 Research):**

- No manual chunk splitting configured
- No lazy loading of heavy dependencies
- All UI components bundled into single chunk
- No vendor chunk separation

**Fix Strategy (From Vite Best Practices - Context7):**

```typescript
// vite.config.ts - Add Manual Chunks
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 1. Vendor chunks - separate third-party libraries
          "vendor-react": ["react", "react-dom", "react-dom/client"],
          "vendor-trpc": ["@trpc/client", "@trpc/react-query"],
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            // ...other radix imports
          ],
          "vendor-ui": ["framer-motion", "recharts", "lucide-react", "sonner"],
          // 2. Feature chunks - separate by route
          dashboard: ["./src/pages/Home.tsx", "./src/pages/MyDashboard.tsx"],
          admin: ["./src/pages/Admin.tsx"],
          auth: [
            "./client/src/pages/VincularEmails.tsx",
            "./client/src/pages/PrimeiroAcesso.tsx",
          ],
        },
      },
    },
    // 3. Increase warning limit after implementing chunks
    chunkSizeWarningLimit: 1000, // Increase from default 500
  },
  // 4. Code splitting for dynamic imports
  plugins: [
    // Example: lazy load heavy routes
  ],
});
```

**Atomic Tasks:**

- [ ] **Task 1.1:** Analyze bundle composition
  - Run `bunx vite-bundle-visualizer` or similar tool
  - Identify top 10 largest modules
  - Identify which routes/components are responsible
  - **Time:** 10 min
  - **Verification:** Report found in `.agent/specs/deploy-prep-audit-20260121/bundle-analysis.md`

- [ ] **Task 1.2:** Implement vendor chunk splitting in `vite.config.ts`
  - Add `manualChunks` to `rollupOptions.output`
  - Create vendor chunks for: react, trpc, radix-ui, ui-libraries
  - Test build to verify chunks separated
  - **Time:** 15 min
  - **Verification:** Build creates multiple chunk files (vendor-\*.js)

- [ ] **Task 1.3:** Implement feature-based code splitting
  - Identify routes that can be lazy loaded (Admin, Comparativo, etc.)
  - Use `lazy()` from `react-dom` for heavy routes
  - Add Suspense boundaries with loading states
  - **Time:** 30 min
  - **Example:**

  ```typescript
  // Change from:
  import Admin from "./pages/Admin";
  // To:
  const Admin = lazy(() => import("./pages/Admin"));
  ```

  - **Verification:** Console logs show dynamic imports on route navigation

- [ ] **Task 1.4:** Enable source maps for production debugging (optional)
  - Add `sourcemap: true` to build config
  - Only for staging, disable for production
  - **Time:** 5 min
  - **Verification:** Build includes .map files

- [ ] **Task 1.5:** Remove `console.log` in production (Best Practice - Context7)
  - Add to `vite.config.ts`:

  ```typescript
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  }
  ```

  - **Time:** 5 min
  - **Verification:** Production build has no console statements

- [ ] **Task 1.6:** Optimize Recharts imports (common bundle bloat)
  - Import specific charts instead of full library:

  ```typescript
  // ❌ Bad
  import { BarChart, LineChart, PieChart } from "recharts";
  // ✅ Good
  import BarChart from "recharts/es6/chart/BarChart";
  ```

  - **Time:** 20 min
  - **Verification:** Bundle analyzer shows reduced recharts footprint

- [ ] **Task 1.7:** Verify bundle after optimization
  - Run `bun run build`
  - Check largest chunk is < 500KB
  - Verify gzip size total < 300KB
  - **Time:** 10 min
  - **Verification:** Build passes without chunk size warnings

- [ ] **Task 1.8:** Add bundle analysis to monitoring
  - Add `vite-plugin-bundle-analyzer` to devDependencies
  - Configure to run on build
  - Save reports to `dist/bundle-report.html`
  - **Time:** 15 min
  - **Verification:** Report generates on build

**Success Criteria:**

- Largest bundle < 500KB
- Total vendor chunks separated
- Dynamic routes lazy loaded
- No critical Core Web Vitals failures

**Estimated Total Time:** 110 min

---

### Issue 2: Missing Environment Variables in index.html 🔴

**Location:** `client/index.html`

**Current Warnings:**

```
(!) %VITE_ANALYTICS_ENDPOINT% is not defined in env variables found in /index.html.
(!) %VITE_ANALYTICS_WEBSITE_ID% is not defined in env variables found in /index.html.
<script src="%VITE_ANALYTICS_ENDPOINT%/umami"> can't be bundled without type="module" attribute
```

**Why This Blocks Deploy:**

- Build fails or produces invalid HTML
- Analytics script won't load in production
- Type="module" missing causes script execution errors

**Fix Strategy (Best Practices - Bun & Standard):**

**Atomic Tasks:**

- [ ] **Task 2.1:** Review `.env.example` for missing analytics vars
  - Check if `VITE_ANALYTICS_ENDPOINT` is documented
  - Check if `VITE_ANALYTICS_WEBSITE_ID` is documented
  - **Time:** 5 min
  - **Verification:** Both vars in `.env.example`

- [ ] **Task 2.2:** Add missing vars to `.env.example`

  ```bash
  # Analytics (Umami or similar)
  VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
  VITE_ANALYTICS_WEBSITE_ID=your-website-id
  ```

  - **Time:** 3 min
  - **Verification:** File updated

- [ ] **Task 2.3:** Check `.env.local` exists with production values
  - Verify all vars are set for local dev
  - Document which vars are dev-only vs production
  - **Time:** 5 min
  - **Verification:** `.env.local` has analytics vars

- [ ] **Task 2.4:** Fix script tag type in `client/index.html`

  ```html
  <!-- ❌ Bad -->
  <script src="%VITE_ANALYTICS_ENDPOINT%/umami">

  <!-- ✅ Good -->
  <script src="%VITE_ANALYTICS_ENDPOINT%/umami" type="module">
  ```

  - **Time:** 2 min
  - **Verification:** Build warning disappears

- [ ] **Task 2.5:** Create `.env.production.example` for production
  - Document all production-required variables
  - Mark sensitive vars (CLERK_SECRET_KEY) as "provide from secrets"
  - **Time:** 10 min
  - **Verification:** File created with all required vars

- [ ] **Task 2.6:** Update README with environment setup
  - Document how to configure environment
  - List all required variables
  - **Time:** 15 min
  - **Verification:** README updated

**Success Criteria:**

- Build passes without env warnings
- `.env.example` has all vars documented
- Analytics script loads correctly

**Estimated Total Time:** 40 min

---

### Issue 3: Security Audit Required for Clerk Auth 🔴

**Location:** All tRPC routers in `server/`

**Current State:** Unknown - needs audit

**Why This Is Critical:**

- Unauthorized access can expose sensitive data (mentees metrics, revenue)
- Without proper auth checks, any API call can succeed
- Production breach risk

**Best Practices from Context7 (tRPC + Clerk):**

```typescript
// ✅ CORRECT: Protected procedure with auth middleware
const protectedProcedure = t.procedure.use(opts => {
  if (!opts.ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }

  return opts.next({
    ctx: {
      user: opts.ctx.user,
    },
  });
});

// ✅ CORRECT: Usage in router
export const appRouter = router({
  createMentorado: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // ctx.user is guaranteed to exist
      return await ctx.db.insert(mentorados).values({
        ...input,
        userId: ctx.user.id,
      });
    }),
});
```

**Atomic Tasks:**

- [ ] **Task 3.1:** Audit all tRPC routers for auth
  - List all procedures in: `mentoradosRouter`, `gamificacaoRouter`
  - Mark each as: `public`, `protected`, or `needs-review`
  - **Time:** 30 min
  - **Output:** `.agent/specs/deploy-prep-audit-20260121/auth-audit.md`

- [ ] **Task 3.2:** Verify `protectedProcedure` implementation
  - Check `server/_core/trpc.ts` for auth middleware
  - Verify `ctx.user` is being set correctly from Clerk
  - **Time:** 15 min
  - **Verification:** Middleware throws UNAUTHORIZED when no auth

- [ ] **Task 3.3:** Add auth to all write operations
  - Ensure all `mutation` procedures use `protectedProcedure`
  - Critical routers: all `create`, `update`, `delete`, `submit` methods
  - **Time:** 20 min
  - **Verification:** No public mutations that modify data

- [ ] **Task 3.4:** Add auth to sensitive read operations
  - Admin routes, user-specific queries, rankings
  - Check: `me`, `comparativeStats`, `userMetrics`
  - **Time:** 15 min
  - **Verification:** User can only access their own data

- [ ] **Task 3.5:** Implement role-based access (RBAC)
  - Add `admin` role check for admin-only procedures
  - Create `adminProcedure` middleware
  - Protect: `Admin.tsx` page routes
  - **Time:** 30 min
  - **Example:**

  ```typescript
  const adminProcedure = protectedProcedure.use(opts => {
    if (opts.ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return opts.next(opts);
  });
  ```

  - **Verification:** Non-admin users get FORBIDDEN error

- [ ] **Task 3.6:** Write auth tests
  - Test public procedures work without auth
  - Test protected procedures fail without auth
  - Test admin procedures fail for regular users
  - **Time:** 45 min
  - **Verification:** All auth tests pass

- [ ] **Task 3.7:** Configure Clerk Express middleware
  - Verify `server/_core/clerk.ts` has proper middleware
  - Check `server/index.ts` uses middleware on all routes
  - **Time:** 15 min
  - **Verification:** Requests require valid Clerk session

**Success Criteria:**

- All mutations are protected
- All sensitive reads are protected
- Admin routes require admin role
- Auth tests cover all endpoints

**Estimated Total Time:** 150 min

---

### Issue 4: 660 Code Formatting Warnings ⚠️

**Location:** Project-wide

**Current State:**

```
bun run format --check
[warn] 660 files need formatting
```

**Why This Matters:**

- Code inconsistency
- Potential merge conflicts
- Prettier warns about deprecated config
- CI/CD may fail on format checks

**Fix Strategy:**

**Atomic Tasks:**

- [ ] **Task 4.1:** Run automatic formatter

  ```bash
  bun run format
  ```

  - This will format all 660 files
  - **Time:** 5 min
  - **Verification:** `bun run format --check` passes

- [ ] **Task 4.2:** Review `.prettierrc` configuration
  - Check if config matches project style
  - Verify no deprecated options
  - **Time:** 10 min
  - **Verification:** Config uses current Prettier API

- [ ] **Task 4.3:** Add format check to pre-commit hook (optional)
  - Use `husky` or `lefthook`
  - Run `prettier --write` on staged files
  - **Time:** 15 min
  - **Verification:** Pre-commit hook runs on commit

**Success Criteria:**

- Zero formatting warnings
- Consistent code style across project

**Estimated Total Time:** 30 min

---

## HIGH PRIORITY ISSUES (MUST FIX)

### Issue 5: Test Coverage - 12 Skipped Tests ⚠️

**Location:** `server/gamificacao.test.ts`

**Current State:**

```
20 pass
12 skip
0 fail
```

**Skipped Tests (Database Not Available):**

- `initializeBadges`
- `checkAndAwardBadges`
- `calculateMonthlyRanking`
- `updateProgressiveGoals`
- `sendMetricsReminders`
- `checkUnmetGoalsAlerts`
- `getMentoradoBadges`
- `getRanking` (no turma param)
- `getNotificacoes`
- `markNotificationRead`
- `getAllBadges`
- `getProgressiveGoals`

**Why This Matters:**

- Critical gameplay logic not tested
- Badge awarding logic unverified
- May have bugs in production

**Fix Strategy:**

**Atomic Tasks:**

- [ ] **Task 5.1:** Setup test database
  - Configure test environment with separate database
  - Or use in-memory SQLite for tests
  - **Time:** 20 min
  - **Verification:** Tests run with DB connection

- [ ] **Task 5.2:** Write test data fixtures
  - Create helper functions to seed test data
  - Mock users, mentorados, metrics
  - **Time:** 30 min
  - **File:** `server/fixtures/test-data.ts`

- [ ] **Task 5.3:** Enable `initializeBadges` test
  - Write test to verify badges are created in DB
  - Verify all badge categories exist
  - **Time:** 15 min
  - **Verification:** Test passes

- [ ] **Task 5.4:** Enable `checkAndAwardBadges` test
  - Create mentee with metrics meeting badge criteria
  - Verify badge is awarded
  - **Time:** 20 min
  - **Verification:** Test passes

- [ ] **Task 5.5:** Enable `getRanking` test with turma param
  - Test ranking with `neon_estrutura` filter
  - Test ranking with `neon_escala` filter
  - **Time:** 15 min
  - **Verification:** Returns correct rankings

- [ ] **Task 5.6:** Enable notification tests
  - Enable `getNotificacoes`
  - Enable `markNotificationRead`
  - **Time:** 20 min
  - **Verification:** Tests pass

- [ ] **Task 5.7:** Enable remaining gamification tests
  - `calculateMonthlyRanking`
  - `updateProgressiveGoals`
  - `sendMetricsReminders`
  - `checkUnmetGoalsAlerts`
  - `getAllBadges`
  - `getProgressiveGoals`
  - **Time:** 30 min
  - **Verification:** All tests pass

- [ ] **Task 5.8:** Calculate final test coverage
  - Run `bun test --coverage` if available
  - Or estimate manually
  - Target: 90%+ coverage
  - **Time:** 10 min
  - **Verification:** Coverage report generated

**Success Criteria:**

- All 12 tests enabled and passing
- Total: 32+ tests passing
- Coverage > 90%

**Estimated Total Time:** 160 min

---

### Issue 6: Database Schema & Migrations Verification ⚠️

**Location:** `drizzle/schema.ts`, `drizzle/migrations/`

**Why This Matters:**

- Orphan migrations
- Missing indexes (performance)
- Incorrect relations (data integrity)

**Best Practices from Context7 (Drizzle ORM):**

```typescript
// ✅ Index on foreign keys for performance
export const posts = pgTable(
  "posts",
  {
    id: pgSerial("id").primaryKey(),
    authorId: pgInteger("author_id").references(() => users.id),
  },
  t => [
    index("posts_author_id_idx").on(t.authorId), // ← CRITICAL for 1:N performance
  ]
);

// ✅ One-to-many with index
export const mentorados = pgTable(
  "mentorados",
  {
    id: pgSerial("id").primaryKey(),
    userId: pgInteger("user_id").references(() => users.id),
  },
  t => [index("mentorados_user_id_idx").on(t.userId)]
);
```

**Atomic Tasks:**

- [ ] **Task 6.1:** Review all foreign keys lack indexes
  - Check `mentorados.userId`, `metricasMensais.mentoradoId`, etc.
  - List all FKs without indexes
  - **Time:** 15 min
  - **Output:** List of missing indexes

- [ ] **Task 6.2:** Add missing indexes to schema
  - Add index for `mentorados.userId`
  - Add index for `metricasMensais.mentoradoId`
  - Add index for `feedbacks.mentoradoId`
  - **Time:** 10 min
  - **Verification:** Schema has index definitions

- [ ] **Task 6.3:** Generate new migration for indexes

  ```bash
  bun run db:generate
  ```

  - **Time:** 5 min
  - **Verification:** New migration SQL file created

- [ ] **Task 6.4:** Apply migration to local database

  ```bash
  bun run db:push
  ```

  - **Time:** 5 min
  - **Verification:** Migration applied without errors

- [ ] **Task 6.5:** Verify migration compatibility
  - Test queries with new indexes
  - Verify performance improvement
  - **Time:** 15 min
  - **Verification:** Queries execute faster

- [ ] **Task 6.6:** Review relations configuration
  - Check `drizzle/relations.ts`
  - Verify all 1:N and N:M relations defined
  - **Time:** 10 min
  - **Verification:** Relations match schema

**Success Criteria:**

- All FKs have corresponding indexes
- Migrations generated and tested
- Relations properly defined

**Estimated Total Time:** 60 min

---

### Issue 7: Production Bundle Warnings

**Location:** Build output

**Current Warnings:**

```
(!) Some chunks are larger than 500 kB after minification
(!) %VITE_ANALYTICS_* % not defined
```

**Atomic Tasks:** (Covered in Issues 1 & 2)

**Estimated Total Time:** (Already included)

---

## MEDIUM PRIORITY ISSUES

### Issue 8: Dependency Security Audit

**Atomic Tasks:**

- [ ] **Task 8.1:** Run security audit

  ```bash
  bunx npm audit --production
  bunx snyk test
  ```

  - **Time:** 5 min
  - **Verification:** No high/critical vulnerabilities

- [ ] **Task 8.2:** Fix any found vulnerabilities
  - Update vulnerable packages
  - Test after updates
  - **Time:** 20 min
  - **Verification:** Audit passes

**Estimated Time:** 25 min

---

## LOW PRIORITY / TECHNICAL DEBT

### Issue 9: Documentation & README

**Atomic Tasks:**

- [ ] **Task 9.1:** Update README with deploy instructions
- [ ] **Task 9.2:** Document API endpoints
- [ ] **Task 9.3:** Add CONTRIBUTING.md
- [ ] **Task 9.4:** Create CHANGELOG.md

**Estimated Time:** 60 min

---

## PHASES & EXECUTION ORDER

### Phase 1: CRITICAL BLOCKERS (Deploy Fails Without These)

- [ ] Issue 1: Bundle Optimization (110 min)
- [ ] Issue 2: Environment Variables (40 min)
- [ ] Issue 3: Security Audit (150 min)

**Subtotal:** 300 min (5 hours)

### Phase 2: MUST FIX Before Production

- [ ] Issue 4: Code Formatting (30 min)
- [ ] Issue 5: Test Coverage (160 min)
- [ ] Issue 6: Database Indexes (60 min)

**Subtotal:** 250 min (4.2 hours)

### Phase 3: STAGING VERIFICATION

- [ ] Deploy to staging
- [ ] Run E2E tests
- [ ] Load testing
- [ ] Security scan

**Subtotal:** 60 min (1 hour)

### Phase 4: PRODUCTION DEPLOY

- [ ] Deploy to production
- [ ] Monitor errors (first hour)
- [ ] Rollback plan ready

---

## VERIFICATION COMMANDS

After completing all atomic tasks, run this checklist:

```bash
# 1. TypeScript check
bun run check
# Expected: No errors

# 2. Format check
bun run format --check
# Expected: No warnings

# 3. All tests
bun test
# Expected: 32+ pass, 0 fail, 0 skip

# 4. Production build
bun run build
# Expected: No critical warnings, bundle < 500KB

# 5. Security audit
bunx npm audit --production
# Expected: No high/critical vulns

# 6. Full verification
bun run check && bun run format --check && bun test && bun run build
# Expected: All pass
```

---

## NEXT STEPS AFTER AUDIT COMPLETION

1. ✅ Execute all Phase 1 atomic tasks
2. ✅ Execute all Phase 2 atomic tasks
3. ⚠️ Deploy to staging environment
4. ⚠️ Run E2E tests on staging
5. ⚠️ Fix any staging issues
6. ✅ Deploy to production
7. ✅ Monitor for 24 hours
8. ✅ Rollback if critical issues

---

## TIMELINE ESTIMATE

| Phase                         | Time            | Dependencies     |
| ----------------------------- | --------------- | ---------------- |
| Phase 1: Critical Blockers    | 5 hours         | None             |
| Phase 2: Must Fix             | 4.2 hours       | Phase 1 complete |
| Phase 3: Staging Verification | 1 hour          | Phase 2 complete |
| **Total**                     | **~10.2 hours** |                  |

**Suggested Schedule:**

- Day 1: Phase 1 (Critical Blockers)
- Day 2: Phase 2 (Must Fix) + Phase 3 (Staging)
- Day 3: Production Deploy + Monitoring

---

## RISK MITIGATION

| Risk                              | Probability | Impact   | Mitigation                          |
| --------------------------------- | ----------- | -------- | ----------------------------------- |
| Bundle optimization breaks pages  | Medium      | High     | Test each page after optimization   |
| Auth changes break existing users | Low         | Critical | Thorough auth testing before deploy |
| Migration fails in production     | Low         | Critical | Backup database before migration    |
| Environment vars not set in prod  | Medium      | High     | Checklist for prod deployment       |

---

## REFERENCES

- **Vite Bundle Optimization:** Context7 - `/vitejs/vite`
- **tRPC Auth Patterns:** Context7 - `/trpc/trpc`
- **Drizzle Indexes:** Context7 - `/websites/rqbv2_drizzle-orm-fe_pages_dev`
- **Clerk Security:** Context7 - `/clerk/clerk-docs`
- **Bun Environment:** Tavily Search - "Bun production deployment best practices 2025"
- **Env Var Security:** Tavily Search - "Environment Variables in Deployment: Best Practices"

---

**Status:** 📝 **AUDIT PLAN CREATED**
**Next Action:** Begin Phase 1 Task 1.1 - Analyze bundle composition
