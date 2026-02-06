---
name: baileys-integration
description: Operational guide for Baileys WhatsApp Web integration, including setup flow, QR authentication, troubleshooting, session persistence/recovery, and safety guardrails.
---

# Baileys Integration Skill

> **Purpose:** Operate the self-hosted Baileys provider with conservative defaults, stable QR onboarding, and low-risk recovery procedures while preserving message history and avoiding destructive actions.

---

## When to Use This Skill

Use this skill when:

- Configuring or validating Baileys environment/runtime setup
- Running QR-based WhatsApp connection flow for mentorados
- Diagnosing disconnects, stale sessions, or missing QR updates
- Recovering from session corruption while preserving history
- Planning provider transitions between Z-API, Meta Cloud API, and Baileys

---

## Setup Flow (Conservative)

1. Confirm dependencies in [`package.json`](../../../package.json).
2. Configure environment variables in [`.env`](../../../.env):
   - `BAILEYS_SESSION_DIR=.baileys-sessions`
   - `BAILEYS_ENABLE_LOGGING=false`
3. Ensure session directory exists and is writable by the runtime user.
4. Start backend with Bun (`bun dev`) and confirm no startup error in Baileys services.
5. Open settings and initiate Baileys connection only for one mentorado at a time during first-time setup.

---

## QR Authentication Flow

1. Trigger connect from the Baileys settings card.
2. Wait for QR payload emission and render.
3. Scan QR from the correct WhatsApp account/device.
4. Confirm status transition sequence:
   - `connecting` → `qr_ready` → `connected`
5. Persist credentials on auth updates (creds + keys updates).
6. After connected state, run a small send/receive smoke test before any bulk usage.

---

## Session Persistence and Recovery

### Persistence Rules

- Keep session files under `BAILEYS_SESSION_DIR` only.
- Persist auth updates incrementally (do not batch large delayed writes).
- Keep provider switch operations non-destructive by default.

### Recovery Procedure (History-Safe)

1. Detect issue scope: single mentorado vs global service issue.
2. Attempt soft reconnect first (without deleting session artifacts).
3. If reconnect fails repeatedly, backup affected session folder before any cleanup.
4. Re-authenticate via QR only for the affected mentorado.
5. Preserve database message history; avoid deleting existing `whatsappMessages` rows.
6. Record recovery action and timestamp for auditability.

---

## Troubleshooting

### QR Not Appearing

- Confirm connect mutation succeeds.
- Confirm SSE/event channel is active.
- Confirm no stale lock in session directory.
- Temporarily enable `BAILEYS_ENABLE_LOGGING=true` only for diagnosis.

### Frequent Disconnects / Status Flapping

- Verify network stability and host clock/time sync.
- Inspect close reasons and avoid reconnect storms.
- Respect backoff; do not loop aggressive reconnects.

### Session Corruption Symptoms

- Missing keys/creds files, JSON parse errors, permanent auth failure.
- Backup, then regenerate session via QR.
- Keep message history untouched.

---

## Limitations

- Baileys relies on unofficial WhatsApp Web protocol behavior.
- Long-lived sessions can be less stable than official Cloud API.
- Policy/compliance risk is higher than Meta Cloud API.
- Operational burden is higher (self-hosting, reconnection handling, observability).

---

## Anti-Spam and Safety Guardrails

- Require opt-in before any outbound campaign traffic.
- Apply rate limits and jitter for outbound sends.
- Avoid unsolicited bulk blasts and repetitive templates.
- Keep human support path for blocked/failed numbers.
- Prefer Meta Cloud API for compliance-sensitive or high-volume scenarios.

---

## Provider Transition Notes

- Prefer gradual migration by mentorado cohort.
- Keep current provider active until replacement passes smoke tests.
- Preserve history table and conversation linkage IDs.
- Use dry-run migration helpers first; enable writes only with explicit operator approval.
