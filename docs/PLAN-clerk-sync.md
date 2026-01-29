# Clerk User Synchronization Plan

## Metadata
- **complexity**: L5 — Requires new capability (webhooks), infra change (express route), and business logic (sync).
- **estimated_time**: 2 hours
- **parallel_safe**: false
- **slug**: PLAN-clerk-sync.md

## Objective
- **Task**: Analyze new Clerk registrations and synchronize them to Neon DB.
- **Context**: Currently, users are not automatically created or linked in Neon when they sign up in Clerk.
- **Action**: Implement a Clerk Webhook handler to listen for `user.created` events.
- **Outcome**: When a user signs up, their data is instantly available in `users` and linked to `mentorados`.

## Environment
- **Runtime**: Bun 1.3+
- **Framework**: Express + tRPC
- **Database**: Neon PostgreSQL + Drizzle
- **Auth**: Clerk (Webhook)
- **Validation**: Svix (for signature verification)

## Research Summary

### Findings Table
| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | No existing webhook handler in `server/_core/clerk.ts` | 5/5 | Code Search | Must build from scratch |
| 2 | `svix` package missing in `package.json` | 5/5 | `package.json` | Must install dependency |
| 3 | `users` table lacks auto-sync mechanism | 5/5 | `schema.ts` | Data inconsistency risk |
| 4 | `mentorados.userId` is the link foreign key | 5/5 | `schema.ts` | Usage in sync logic |
| 5 | `server/mentoradosRouter.ts` handles manual linking | 5/5 | Code Read | Pattern to reuse/automate |

### Knowledge Gaps
- **Default Turma**: When auto-creating a mentorado, what `turma` should be assigned? (Will default to 'neon_estrutura' or check metadata).
- **Raw Body Access**: Express middleware globally sets JSON parsing. Need to ensure raw body is accessible for `svix` verification using a specific route handler or middleware bypass.

### Assumptions to Validate
- Users sign up with the *same email* that was pre-registered (if any).
- If no pre-registration exists, we should create a new Mentorado profile with defaults.
- Clerk `publicMetadata` might contain `turma` information (optional optimization).

## Relevant Files
### Must Read
- `server/_core/index.ts`: Entry point to mount webhook.
- `drizzle/schema.ts`: DB schema for `users` and `mentorados`.
- `server/mentoradosRouter.ts`: Existing create/link logic.

## Existing Patterns
- **User Creation**: Historically manual or missing.
- **Linking**: `linkEmail` procedure exists but is manual.
- **Email Service**: `sendWelcomeEmail` exists in `mentoradosRouter.ts`.

## Chain of Thought
### Research
- Checked `package.json` -> `svix` missing.
- Checked `server/routers` -> No user sync logic found.
- Checked `drizzle/schema` -> `users` table is ready.

### Analyze
- Need a robust way to receive updates. Webhooks are best practice for Clerk.
- Polling is inefficient.
- Security: Must verify Clerk signatures using `svix`.
- Data Flow: Clerk -> Webhook -> Verify -> Check DB -> Insert `users` -> Link/Create `mentorados`.

### Think
- **Step 1**: Install `svix`.
- **Step 2**: Create `server/webhooks/clerk.ts` to handle logic.
- **Step 3**: Mount at `POST /api/webhooks/clerk` in `server/_core/index.ts`.
- **Step 4**: logic:
    - upsert `users` (based on `clerkId`).
    - check `mentorados` by email.
    - if found -> update `userId`.
    - if not found -> create new `mentorados` (requires `nomeCompleto`).

## Atomic Tasks

- id: "AT-001"
  title: "Install infrastructure dependencies"
  phase: 1
  priority: "critical"
  dependencies: []
  parallel_safe: true
  files_to_create: []
  files_to_modify: ["package.json"]
  validation: "bun list svix"
  rollback: "bun remove svix"
  acceptance_criteria: ["svix installed"]

- id: "AT-002"
  title: "Create generic webhook handler utility"
  phase: 2
  priority: "critical"
  dependencies: ["AT-001"]
  parallel_safe: true
  files_to_create: ["server/webhooks/clerk.ts"]
  files_to_modify: []
  validation: "Unit test handler logic"
  rollback: "Delete file"
  acceptance_criteria: ["Handler validates signature", "Parses sensitive events"]

- id: "AT-003"
  title: "Implement User/Mentorado Sync Logic"
  phase: 2
  priority: "critical"
  dependencies: ["AT-002"]
  parallel_safe: false
  files_to_create: []
  files_to_modify: ["server/webhooks/clerk.ts", "server/services/userService.ts"]
  validation: "Simulate event and check DB"
  rollback: "Revert code"
  acceptance_criteria: ["User created in DB", "Mentorado linked or created", "Updates handled"]

- id: "AT-004"
  title: "Mount webhook endpoint in Express"
  phase: 3
  priority: "high"
  dependencies: ["AT-003"]
  parallel_safe: false
  files_to_create: []
  files_to_modify: ["server/_core/index.ts"]
  validation: "curl -X POST /api/webhooks/clerk returns 400 (missing headers) or 200 (valid)"
  rollback: "Remove route"
  acceptance_criteria: ["Endpoint accessible", "Raw body parsing works"]

## Validation Gates
automated:
  - {id: "VT-001", command: "bun run check", expected: "No type errors"}
  - {id: "VT-002", command: "bun test", expected: "All pass"}

manual_review:
  - {reviewer: "@user", focus: "Confirm webhook URL", required_if: "Deployment is live"}

## Output
format: "Implementation of Webhook Handler"
files_created: [{path: "server/webhooks/clerk.ts", purpose: "Handle Clerk events"}]
files_modified: [{path: "server/_core/index.ts", changes: "Mount webhook"}]
success_definition: "New Clerk sign-ups automatically appear in Postgres."
failure_handling: "Log error to console/Sentry. Retry handled by Clerk."
