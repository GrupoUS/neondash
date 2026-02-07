# PLAN: CRM 403, Leads Loading, Performance, and Flicker Stabilization

## 0. Scope and Workflow Contract

- Workflow: **R.P.I.V** (`Research → Plan → Validate`), **implementation intentionally excluded**.
- Scope lock: planning document only.
- Target symptoms:
  - Leads not showing for mentorado context.
  - Slow CRM load.
  - Background flicker during page transitions/loading.
  - Repeated `403` in batched endpoint `/api/trpc/leads.list,leads.stats,crmColumns.list`.

## 1. Complexity Classification

- Classification: **L4+** (cross-cutting issue across auth/scoping, API semantics, pagination behavior, performance path, and visual UX stability).
- Reasoning:
  1. Multiple procedures contribute to one batched failure surface.
  2. Frontend and backend contracts currently have ambiguous mentorado scoping rules.
  3. Performance concerns involve both data path and render path.
  4. Validation requires role matrix and data-volume matrix, not a single happy path.

## 2. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---|---|---|---|
| 1 | Non-admin requests that include `mentoradoId` are treated as admin-override intent and rejected with `FORBIDDEN` in leads list guard | 5/5 | `server/leadsRouter.ts` | Primary failure path for repeated 403 and empty CRM results |
| 2 | `leads.stats` has duplicated/ambiguous mentorado override logic, including nullish handling and hard failure when target is unresolved | 4/5 | `server/leadsRouter.ts` | Can independently trigger 403/401 in same batch and increase error rate |
| 3 | CRM columns listing enforces the same override behavior and can fail in the same batched call | 5/5 | `server/crmColumnsRouter.ts` | Confirms multi-procedure failure in a single batched request |
| 4 | Frontend derives `viewMentoradoId` and passes it into CRM queries for both list and stats paths | 5/5 | `client/src/pages/crm/LeadsPage.tsx` | Confirms frontend can unintentionally pass override-shaped input |
| 5 | Kanban uses `leads.list` with default backend `limit=20` and no explicit pagination strategy | 4/5 | `client/src/components/crm/PipelineKanban.tsx`, `server/leadsRouter.ts` | For datasets above 20, users may perceive missing leads |
| 6 | Stats endpoint currently loads all matching rows and aggregates in-memory | 5/5 | `server/leadsRouter.ts` | Performance risk under high-volume mentorado datasets |
| 7 | Layout executes multiple status queries in parallel, adding baseline latency during navigation/load | 4/5 | `client/src/components/DashboardLayout.tsx` | Competes for network/resources during CRM initialization |
| 8 | tRPC batching can return mixed-status envelopes for parallel procedures; one failing member still yields per-procedure errors in client handling | 4/5 | Context7 `/trpc/trpc` docs on batching and 207 behavior | Explains repeated error noise and perceived global CRM failure |
| 9 | Evidence confirms mentorado 18 has leads in DB (`leads_count=6`) | 5/5 | Provided Neon evidence | Strongly points away from missing data insertion and toward auth/scoping path |

## 3. Knowledge Gaps

1. Whether non-admin users can ever reach CRM before `mentorados.me` hydration completes with a transient undefined mentorado context.
2. Whether the current tRPC client link setup applies retries globally that amplify 403 repetition.
3. Whether any stale client cache key shape causes mentorado context leakage across route transitions.
4. Whether there are DB indexes aligned with the most frequent list/stats filters for larger accounts.
5. Whether flicker is primarily from background class mismatch, suspense fallback swaps, or animation mount/unmount behavior.

## 4. Assumptions to Validate Early

1. Non-admin users should **never** be required to send `mentoradoId`; backend should resolve from authenticated context.
2. Admin users may explicitly override `mentoradoId` and this remains supported.
3. In CRM view, missing mentorado selection for admin should block/guide, not hard-fail noisy queries.
4. For Kanban default UX, seeing only first 20 leads is undesirable unless clearly labeled/paginated.
5. Stats can be computed via DB aggregation without behavior regression in displayed KPIs.

## 5. Edge Cases

1. **Non-admin own mentorado**: user has valid mentorado context, no override input, all three procedures succeed.
2. **Admin override**: admin selects mentorado and receives isolated data for that mentorado only.
3. **Admin with no selection**: CRM should avoid firing dependent queries or show deterministic empty/select-state.
4. **More than 20 leads in Kanban**: user must not misinterpret truncation as missing data.
5. **High-volume stats**: stats response remains stable under large lead counts.
6. **Mentorado deleted/deactivated after login**: procedures should return deterministic access/empty behavior.
7. **Mixed batch outcomes**: one procedure fails while others succeed; UI should isolate errors per widget.
8. **Rapid mentorado switching by admin**: in-flight requests should not paint stale data from prior selection.
9. **Theme toggle during load**: no full-background flash between layout and CRM container.

## 6. Target State Definition

A stable CRM page where:
- Non-admin mentorado flow is context-derived and never blocked by override semantics.
- Admin override remains explicit and safe.
- Leads rendering in Kanban/Table is consistent with expected dataset visibility.
- Stats computation and initial page load are performant enough for high-volume mentorados.
- Background/fallback transitions avoid visible flicker.
- Batched endpoint errors are reduced, and unavoidable failures are isolated in UX.

## 7. Atomic Decomposition

### AT-001 Align mentorado scoping contract across CRM procedures

- **Objective:** eliminate false `FORBIDDEN` in non-admin flow and keep admin override explicit.
- **Dependencies:** none.

#### ST-001.1 Map current input/guard matrix per procedure
- Document exact accepted input contract for `leads.list`, `leads.stats`, `crmColumns.list`.
- Validation: written matrix reviewed against source behavior.

#### ST-001.2 Define canonical resolution order
- Specify resolution precedence: explicit admin override → authenticated mentorado context → deterministic error/select-state.
- Validation: contract includes role-specific acceptance criteria.

#### ST-001.3 Define rejection semantics
- Standardize when to return `FORBIDDEN` vs `UNAUTHORIZED` vs safe no-op gating at caller layer.
- Validation: error taxonomy table completed and unambiguous.

#### ST-001.4 Add gate criteria for batched safety
- Ensure all three procedures use congruent scoping semantics to avoid partial failure by design mismatch.
- Validation: checklist confirms semantic parity across the three endpoints.

#### ST-001.5 Prepare regression scenarios
- Build role-driven scenario matrix for non-admin own mentorado, admin override, admin no-selection.
- Validation: all mandatory gates represented in test matrix.

---

### AT-002 Define query triggering and pagination behavior for CRM visibility correctness

- **Objective:** avoid missing-lead perception and suppress unnecessary failing requests.
- **Dependencies:** AT-001 contract.

#### ST-002.1 Define enablement policy per query
- Specify exactly when `leads.list`, `leads.stats`, and `crmColumns.list` should execute for admin and non-admin.
- Validation: policy table maps each route state to query enabled/disabled outcome.

#### ST-002.2 Specify pagination strategy per view
- Determine explicit strategy for Kanban default (raise limit, cursor/page controls, or lazy load) and table parity.
- Validation: chosen approach satisfies `>20 leads` visibility gate.

#### ST-002.3 Specify empty/select-state UX contract
- Define behavior for admin with no mentorado selected and non-admin with unresolved mentorado.
- Validation: UX state machine drafted and free of ambiguous transitions.

#### ST-002.4 Specify cache key and invalidation hygiene
- Document cache segmentation by mentorado context to prevent stale cross-mentorado rendering.
- Validation: cache-key conventions reviewed against tRPC query inputs.

#### ST-002.5 Define retry/noise policy for authorization failures
- Document that auth failures should not retry aggressively and should display targeted feedback.
- Validation: policy includes explicit handling for repeated 403 suppression.

---

### AT-003 Plan data-path performance improvements for CRM stats/list

- **Objective:** reduce latency and improve responsiveness under volume.
- **Dependencies:** AT-001 contract, AT-002 query policies.

#### ST-003.1 Baseline current performance path
- Define baseline measurements for list and stats under normal and high-volume mentorado data.
- Validation: baseline metrics table established with reproducible method.

#### ST-003.2 Specify stats aggregation optimization path
- Replace in-memory aggregation approach with DB-side aggregation strategy in implementation phase.
- Validation: target query behavior and expected complexity reduction documented.

#### ST-003.3 Specify list query tuning opportunities
- Document filter/index alignment hypotheses and required DB inspection checks.
- Validation: index review checklist and acceptance thresholds defined.

#### ST-003.4 Specify parallel request budget during CRM load
- Identify non-critical concurrent queries that can be deferred/lazy to reduce critical path contention.
- Validation: critical-path request map created.

#### ST-003.5 Define performance acceptance gates
- Set pass criteria for high-volume stats and first-render data availability.
- Validation: measurable thresholds documented for QA and profiling.

---

### AT-004 Plan visual stability and flicker mitigation

- **Objective:** remove background flash/flicker perception during load and transitions.
- **Dependencies:** AT-002 state/enablement policy.

#### ST-004.1 Audit background ownership across layout and CRM page
- Document where background layers are defined and where mount swaps occur.
- Validation: component ownership map completed.

#### ST-004.2 Define skeleton/fallback continuity strategy
- Ensure loading placeholders preserve backdrop and container dimensions.
- Validation: fallback continuity checklist complete.

#### ST-004.3 Define animation transition guardrails
- Restrict transitions likely to trigger perceptual flash on initial mount.
- Validation: animation policy includes allowed/disallowed patterns for first paint.

#### ST-004.4 Define theme-state stabilization steps
- Ensure theme class resolution and page render order prevent light/dark flashes.
- Validation: theme transition scenarios enumerated and testable.

#### ST-004.5 Define UX acceptance criteria
- Document no-flicker criteria under cold load, mentorado switch, and theme toggle.
- Validation: manual QA script includes reproducible verification sequence.

---

### AT-005 Build validation and rollout safety runbook

- **Objective:** ensure safe verification and controlled rollout without regressions.
- **Dependencies:** AT-001 through AT-004.

#### ST-005.1 Define automated command gates
- Include mandatory project checks:
  - `bun run check`
  - `bun run lint`
  - `bun test`
- Validation: all command gates required before merge.

#### ST-005.2 Define manual QA matrix by role and dataset size
- Include mandatory validations:
  - non-admin own mentorado
  - admin override
  - missing mentorado selection
  - >20 leads
  - high-volume stats performance
- Validation: matrix includes expected result and failure signal for each case.

#### ST-005.3 Define observability checks
- Add browser network/log checks for batched endpoint error frequency and timing.
- Validation: success criteria include reduced repeated 403 signatures.

#### ST-005.4 Define staged rollout checkpoints
- Plan verification in local/staging before production promotion.
- Validation: promotion criteria and stop conditions documented.

#### ST-005.5 Define rollback playbook
- Establish immediate rollback triggers and reversal sequence for auth/perf/UX regressions.
- Validation: rollback runbook executable without code archaeology.

## 8. Proposed Phases

1. **Phase A - Contract Hardening:** finalize scoping semantics and error taxonomy.
2. **Phase B - Query Behavior:** enforce execution gating, pagination clarity, retry/noise policy.
3. **Phase C - Performance:** optimize stats/list path and reduce critical-path concurrency pressure.
4. **Phase D - UX Stability:** eliminate flicker sources and stabilize loading transitions.
5. **Phase E - Validation and Rollout:** execute command gates, QA matrix, observability checks, and rollback readiness.

## 9. Manual QA Matrix

| Case ID | Scenario | Preconditions | Expected Result | Failure Signal |
|---|---|---|---|---|
| QA-01 | Non-admin own mentorado | User role non-admin with linked mentorado | Leads, stats, columns load with no 403 | Any FORBIDDEN on CRM batch for own context |
| QA-02 | Admin override | Admin selects valid mentorado | All CRM data reflects selected mentorado only | Mixed mentorado data, 403, or unresolved states |
| QA-03 | Admin missing selection | Admin enters CRM without selection | Predictable select/empty-state and no noisy failing requests | Repeated batch 403 or broken widgets |
| QA-04 | Dataset >20 leads | Mentorado with >20 leads | Kanban/table behavior clearly exposes full dataset strategy | User sees only first page with no affordance |
| QA-05 | High-volume stats | Mentorado with large lead volume | Stats remains responsive and stable | Long stalls, timeouts, or excessive CPU |
| QA-06 | Rapid mentorado switch | Admin changes selection quickly | UI converges to latest selected mentorado only | Stale prior mentorado data flashes |
| QA-07 | Theme toggle while loading | Toggle theme during CRM loading | No full-background flash | Visible white/black flash or container reset |
| QA-08 | Partial procedure failure simulation | Force one procedure failure path | Localized error handling, no global CRM collapse | Entire page unusable due to one widget failure |

## 10. Verification Plan

### 10.1 Static and automated gates

1. `bun run check`
2. `bun run lint`
3. `bun test`

### 10.2 Runtime verification gates

- Gate V1: Non-admin own mentorado path succeeds end-to-end without 403.
- Gate V2: Admin override path succeeds with strict tenant isolation.
- Gate V3: Admin missing selection produces deterministic non-error UX state.
- Gate V4: Dataset greater than 20 leads is fully discoverable.
- Gate V5: High-volume stats meet target responsiveness and avoid in-memory bottleneck symptoms.
- Gate V6: No perceptible page background flicker during cold load and state transitions.

### 10.3 Network/log verification

- Monitor `/api/trpc/leads.list,leads.stats,crmColumns.list` for status distribution and repetition.
- Confirm reduction of repeated `FORBIDDEN` events after scoping alignment.
- Validate per-procedure error isolation behavior in batched responses.

## 11. Rollback Plan

### 11.1 Rollback triggers

- Spike in CRM 403 rates post-change.
- Regression where non-admin cannot see own leads.
- Admin override returning empty/incorrect tenant data.
- Severe performance degradation in stats/list.
- Reintroduced or worsened flicker reports.

### 11.2 Rollback actions

1. Revert the CRM scoping/pagination/perf/flicker change set to last known good revision.
2. Clear/refresh affected client caches and redeploy stable build.
3. Re-run QA-01 through QA-05 on stable revision.
4. Keep observability watch on batched endpoint until error baseline normalizes.
5. Open follow-up incident plan with isolated reproduction artifacts.

### 11.3 Data safety note

- Planned changes are behavior/performance focused and should avoid destructive schema operations.
- If any DB-level optimization is introduced later, require reversible migration steps and pre-checks.

## 12. Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Over-correcting guard logic weakens tenant isolation | Medium | High | Keep explicit role-based contract and negative tests for unauthorized access |
| Pagination change alters UX expectations | Medium | Medium | Provide explicit visibility strategy and acceptance criteria for >20 leads |
| Performance tuning introduces query complexity regressions | Medium | Medium | Baseline first, then staged validation with high-volume dataset |
| Flicker fix conflicts with existing animation polish | Medium | Low | Define first-paint rules separate from post-load micro-interactions |
| Batch error handling still noisy due to retries | Medium | Medium | Explicit no-retry policy for authorization failures and localized UX errors |

## 13. Plan Exit Criteria

This plan is complete when:
1. All AT/ST definitions are approved.
2. Validation and rollback runbooks are accepted.
3. Required gates and QA matrix are accepted as implementation contract.
4. No open critical knowledge gaps remain untracked.
