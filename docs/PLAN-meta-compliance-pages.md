# PLAN-meta-compliance-pages: Privacy Policy, ToS & Test Endpoints

> **Objetivo:** Implementar páginas de compliance exigidas pela Meta e endpoints de teste para screencasts.

---

## Status Atual

### ✅ Já Implementado
| Item | Localização |
|------|-------------|
| Meta Webhooks | `server/_core/index.ts:65` via `registerMetaWebhooks()` |
| Instagram Data Deletion | `POST /api/instagram/delete` |
| Instagram Deauth Callback | `POST /api/instagram/deauth` |
| Account Deletion Page | `/account-deletion` (`AccountDeletion.tsx`) |

### ❌ Falta Implementar
| Item | Rota | Prioridade |
|------|------|------------|
| Privacy Policy Page | `/privacidade` | 🔴 Alta |
| Terms of Service Page | `/termos` | 🔴 Alta |
| Test Endpoints (Screencasts) | `/api/test/*` | 🟡 Média |

---

## Proposed Changes

### Frontend

---

#### [NEW] [PrivacyPolicy.tsx](file:///home/mauricio/neondash/client/src/pages/PrivacyPolicy.tsx)

Página pública de Política de Privacidade seguindo padrão do `AccountDeletion.tsx`:
- Conteúdo completo em português
- Seção específica sobre APIs da Meta (WhatsApp, Instagram, Facebook Ads)
- Seção sobre Clerk para autenticação
- Informações sobre coleta, uso e exclusão de dados
- Layout standalone (sem sidebar)

---

#### [NEW] [TermsOfService.tsx](file:///home/mauricio/neondash/client/src/pages/TermsOfService.tsx)

Página pública de Termos de Serviço:
- Definições e escopo do serviço
- Responsabilidades do usuário
- Limitações de responsabilidade
- Condições de uso das integrações (WhatsApp, Instagram)
- Layout standalone (sem sidebar)

---

#### [MODIFY] [App.tsx](file:///home/mauricio/neondash/client/src/App.tsx)

Adicionar rotas para as novas páginas públicas:
```tsx
// Public Pages - Meta Compliance
<Route path="/privacidade" component={PrivacyPolicy} />
<Route path="/termos" component={TermsOfService} />
```

---

### Backend

---

#### [MODIFY] [index.ts](file:///home/mauricio/neondash/server/_core/index.ts)

Adicionar endpoints de teste para facilitar screencasts:
```typescript
// Test Endpoints (for Meta App Review screencasts)
app.get("/api/test/webhook-status", ...);   // Verificar status webhooks
app.post("/api/test/echo-message", ...);    // Testar envio de mensagem
```

---

## Atomic Tasks

### Phase 1: Frontend Pages

#### AT-001: ⚡ Create Privacy Policy Page
- **File:** `client/src/pages/PrivacyPolicy.tsx`
- **Dependencies:** None
- **Validation:** `bun run check`
- **Rollback:** Delete file

#### AT-002: ⚡ Create Terms of Service Page
- **File:** `client/src/pages/TermsOfService.tsx`
- **Dependencies:** None
- **Validation:** `bun run check`
- **Rollback:** Delete file

#### AT-003: Add Routes to App.tsx
- **File:** `client/src/App.tsx`
- **Dependencies:** AT-001, AT-002
- **Validation:** `bun run check`
- **Rollback:** Remove added routes

---

### Phase 2: Test Endpoints

#### AT-004: Add Webhook Status Endpoint
- **File:** `server/_core/index.ts`
- **Dependencies:** None
- **Validation:** `curl http://localhost:3000/api/test/webhook-status`
- **Rollback:** Remove endpoint

#### AT-005: Add Echo Message Test Endpoint
- **File:** `server/_core/index.ts`
- **Dependencies:** None
- **Validation:** `curl -X POST http://localhost:3000/api/test/echo-message`
- **Rollback:** Remove endpoint

---

## Validation Gates

### VG-001: TypeScript Check
```bash
bun run check
```
**Expected:** No type errors

### VG-002: Build
```bash
bun run build
```
**Expected:** Exit 0, no errors

### VG-003: Manual Page Verification
1. Start dev server: `bun dev`
2. Navigate to `http://localhost:3000/privacidade`
3. Navigate to `http://localhost:3000/termos`
4. Verify both pages render correctly without login

### VG-004: Test Endpoint Verification
```bash
# Webhook status endpoint
curl -s http://localhost:3000/api/test/webhook-status | jq

# Expected response:
# { "status": "ok", "meta_verify_token_configured": true/false, ... }
```

---

## Rollback Steps

1. Remove new files: `PrivacyPolicy.tsx`, `TermsOfService.tsx`
2. Revert changes to `App.tsx`
3. Revert changes to `server/_core/index.ts`
4. Run `bun run check` to confirm clean state

---

## Estimates

| Task | Time |
|------|------|
| AT-001: Privacy Policy | ~5 min |
| AT-002: Terms of Service | ~5 min |
| AT-003: Add Routes | ~2 min |
| AT-004-005: Test Endpoints | ~5 min |
| Validation | ~5 min |
| **Total** | **~22 min** |
