# Deploy Preparation Audit - Implementation Plan

> **Complexity:** L6-L7 (Architecture + Security)
> **Estimated Time:** ~10 hours across 3 phases
> **Spec:** `.agent/specs/deploy-prep-audit-20260121/spec.md`

---

## Objective

Prepare the Neon Dashboard for production deployment by resolving:

1. **1.6MB bundle** → optimize to <500KB
2. **Missing env vars** → fix build warnings
3. **Security gaps** → audit tRPC auth
4. **660 unformatted files** → run Prettier
5. **12 skipped tests** → enable all tests
6. **Database indexes** → verify (already done in schema)

---

## Environment

| Layer    | Technology                    |
| -------- | ----------------------------- |
| Runtime  | Bun 1.3.6                     |
| Frontend | React 19.2 + Vite 7           |
| Backend  | Express 4 + tRPC 11           |
| Database | Neon PostgreSQL + Drizzle ORM |
| Auth     | Clerk                         |
| Testing  | Bun test                      |

---

## Proposed Changes

### Phase 1: Critical Blockers

---

#### [MODIFY] [vite.config.ts](file:///d:/Coders/neondash/vite.config.ts)

**Bundle Optimization Changes:**

1. Add `build.rollupOptions.output.manualChunks` for vendor splitting:
   - `vendor-react`: react, react-dom
   - `vendor-trpc`: @trpc/client, @trpc/react-query
   - `vendor-radix`: all @radix-ui/\* packages
   - `vendor-ui`: framer-motion, recharts, lucide-react, sonner

2. Add terser minification to drop console.log:

   ```typescript
   build: {
     minify: 'terser',
     terserOptions: { compress: { drop_console: true } }
   }
   ```

3. Increase `chunkSizeWarningLimit: 1000` temporarily during optimization

---

#### [MODIFY] [client/index.html](file:///d:/Coders/neondash/client/index.html)

**Fix analytics script:**

```diff
-<script defer src="%VITE_ANALYTICS_ENDPOINT%/umami" data-website-id="%VITE_ANALYTICS_WEBSITE_ID%"></script>
+<script defer src="%VITE_ANALYTICS_ENDPOINT%/umami" data-website-id="%VITE_ANALYTICS_WEBSITE_ID%" type="module"></script>
```

Or conditionally remove if analytics not yet configured.

---

#### [MODIFY] [.env.example](file:///d:/Coders/neondash/.env.example)

**Add missing analytics vars:**

```diff
+# Analytics (Umami or similar) - Optional
+VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
+VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

---

#### [NEW] [.env.production.example](file:///d:/Coders/neondash/.env.production.example)

Document all production-required variables with security notes.

---

### Phase 1: Security Audit

---

#### [MODIFY] [server/\_core/trpc.ts](file:///d:/Coders/neondash/server/_core/trpc.ts)

**Verify/Add protected procedure:**

```typescript
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { user: ctx.user } });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next(ctx);
});
```

---

#### [MODIFY] [server/mentoradosRouter.ts](file:///d:/Coders/neondash/server/mentoradosRouter.ts)

**Audit all procedures:**

- Ensure `create`, `update`, `delete` use `protectedProcedure`
- Admin-only routes use `adminProcedure`

---

#### [MODIFY] [server/gamificacaoRouter.ts](file:///d:/Coders/neondash/server/gamificacaoRouter.ts)

**Audit all procedures:**

- Same pattern as mentoradosRouter

---

### Phase 2: Code Quality

---

#### [MODIFY] Multiple files via command

**Format all 660 files:**

```bash
bun run format
```

---

#### [MODIFY] [server/gamificacao.test.ts](file:///d:/Coders/neondash/server/gamificacao.test.ts)

**Enable 12 skipped tests:**

Current tests are skipped because they require database connection. Options:

1. **Option A (Recommended):** Create proper mocks that simulate DB responses
2. **Option B:** Setup test database with Neon branching
3. **Option C:** Use SQLite in-memory for isolated tests

---

### Phase 3: Database (✅ Already Done)

The Drizzle schema at `drizzle/schema.ts` already has proper indexes:

- `mentorados_user_id_idx` on `userId`
- `metricas_mentorado_idx` on `mentoradoId`
- All FK relationships have corresponding indexes

**No changes needed** - just verify migrations are up to date.

---

## Verification Plan

### Automated Tests

| ID     | Command                  | Expected                            | Notes                          |
| ------ | ------------------------ | ----------------------------------- | ------------------------------ |
| VT-001 | `bun run check`          | Exit 0                              | TypeScript validation          |
| VT-002 | `bun run format --check` | No warnings                         | After running `bun run format` |
| VT-003 | `bun test`               | 32+ pass, 0 skip, 0 fail            | After enabling skipped tests   |
| VT-004 | `bun run build`          | No critical warnings, chunks <500KB | After bundle optimization      |

### Manual Verification

| ID     | Test              | Steps                                                                                         |
| ------ | ----------------- | --------------------------------------------------------------------------------------------- |
| MV-001 | Bundle Size Check | 1. Run `bun run build` 2. Check output for largest chunk size 3. Verify no file exceeds 500KB |
| MV-002 | Auth Protection   | 1. Start dev server 2. Call tRPC mutation without auth 3. Verify UNAUTHORIZED response        |
| MV-003 | Admin Routes      | 1. Login as regular user 2. Try admin route 3. Verify FORBIDDEN response                      |

---

## Rollback Plan

| Change              | Rollback                                           |
| ------------------- | -------------------------------------------------- |
| vite.config.ts      | `git checkout vite.config.ts`                      |
| tRPC auth changes   | Previous commit + test                             |
| Database migrations | `drizzle-kit rollback` or restore from Neon backup |

---

## Timeline

| Phase                      | Duration | Depends On |
| -------------------------- | -------- | ---------- |
| Phase 1: Critical Blockers | ~5 hours | None       |
| Phase 2: Must Fix          | ~4 hours | Phase 1    |
| Phase 3: Staging           | ~1 hour  | Phase 2    |

**Suggested Schedule:**

- Day 1: Phase 1 (Bundle + Env + Security)
- Day 2: Phase 2 (Format + Tests) + Phase 3

---

## Risks

| Risk                              | Probability | Impact   | Mitigation                          |
| --------------------------------- | ----------- | -------- | ----------------------------------- |
| Bundle optimization breaks pages  | Medium      | High     | Test each page after optimization   |
| Auth changes break existing users | Low         | Critical | Thorough auth testing before deploy |
| Tests reveal hidden bugs          | Medium      | Medium   | Fix bugs before production          |

---

## Next Steps

After user approval:

1. Run `bun run format` to fix 660 files
2. Implement vite.config.ts bundle optimization
3. Fix client/index.html analytics script
4. Audit and secure tRPC routers
5. Enable skipped tests
6. Final verification: `bun run check && bun run format --check && bun test && bun run build`
