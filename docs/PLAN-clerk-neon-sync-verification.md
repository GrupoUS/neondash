# PLAN-clerk-neon-sync-verification: Verificação de Sincronização Clerk-Neon

> **Goal:** Verificar se todos os alunos cadastrados no Clerk estão devidamente sincronizados com a base de dados no Neon e visíveis nas páginas do site.

---

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Existem 8 usuários na tabela `users` (Clerk-backed) | 5/5 | Neon DB Query | Baseline para verificação |
| 2 | Existem 7 mentorados na tabela `mentorados` | 5/5 | Neon DB Query | Todos linked com user_id |
| 3 | 1 usuário admin (Sacha) não tem perfil mentorado | 5/5 | Neon DB Query | Esperado - é admin puro |
| 4 | Sincronização ocorre via webhook (`user.created`/`user.updated`) | 5/5 | `server/webhooks/clerk.ts` | Mecanismo primário |
| 5 | Auto-criação de mentorado no primeiro login via `context.ts` | 5/5 | `server/_core/context.ts` | Fallback se webhook falhar |
| 6 | Página `/gestao-mentorados` exibe status de vinculação | 4/5 | `client/src/pages/GestaoMentorados.tsx` | Interface admin |
| 7 | Nenhum mentorado órfão detectado (user_id = NULL) | 5/5 | Neon DB Query | ✅ Sincronização OK |
| 8 | Email matching usado para auto-link em `context.ts` | 5/5 | Código fonte | Resiliência |

### Current Database State

```
Users in DB:     8
Mentorados:      7
Linked:          7 (100%)
Orphans:         0
```

**Users without Mentorado:**
- `user_id: 27` - Sacha Martins (admin) - **Esperado** (admin puro, não precisa de perfil mentorado)

### Knowledge Gaps & Assumptions

- **Gap:** Não foi possível listar diretamente os usuários do Clerk (requer API call) para comparar 1:1 com a base local
- **Gap:** Não há endpoint/script de auditoria para verificação automática de discrepâncias
- **Assumption:** Todos usuários Clerk com role "student" devem ter mentorado correspondente
- **Assumption:** Admin users podem não ter perfil mentorado (comportamento esperado)

---

## 1. User Review Required

> [!IMPORTANT]
> **Decisão Necessária:** Os 8 usuários identificados no banco correspondem aos alunos esperados?
>
> Lista atual de usuários sincronizados:
> 1. Mauricio Magalhães (admin) - ✅ Linked
> 2. Bruno Paixão - ✅ Linked
> 3. Elica Pereira - ✅ Linked
> 4. Enfa Tamara Dilma - ✅ Linked
> 5. Ana Mara Santos - ✅ Linked
> 6. Gabriela Alvares - ✅ Linked
> 7. Iza Rafaela Bezerra Pionório Freires - ✅ Linked
> 8. Sacha Martins (admin) - Sem mentorado (esperado para admin)

> [!NOTE]
> **Recomendação:** Criar um endpoint de auditoria que compare Clerk ↔ Neon automaticamente.

---

## 2. Proposed Changes

### Phase 1: Backend - Sync Audit Endpoint

#### [NEW] [syncAuditRouter.ts](file:///home/mauricio/neondash/server/syncAuditRouter.ts)
- **Action:** Criar router tRPC para auditoria de sincronização
- **Purpose:** Permitir admins verificarem discrepâncias Clerk ↔ Neon

#### [MODIFY] [routers.ts](file:///home/mauricio/neondash/server/routers.ts)
- **Action:** Registrar novo router `syncAudit` no appRouter

---

### Phase 2: Frontend - Admin Sync Dashboard

#### [MODIFY] [GestaoMentorados.tsx](file:///home/mauricio/neondash/client/src/pages/GestaoMentorados.tsx)
- **Action:** Adicionar tab "Sincronização" com status detalhado
- **Details:** Mostrar usuários sem mentorado e mentorados sem usuário

#### [NEW] [SyncStatusView.tsx](file:///home/mauricio/neondash/client/src/components/admin/SyncStatusView.tsx)
- **Action:** Componente para exibir status de sincronização
- **Details:** Cards com métricas, lista de discrepâncias, botão de força-sync

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Cada task **DEVE** ter subtasks com validação específica.

### AT-001: Criar Endpoint de Auditoria de Sync ⚡
**Goal:** Endpoint para comparar usuários Clerk vs Neon DB
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Criar `server/syncAuditRouter.ts` com procedure `getSyncStatus`
  - **File:** `server/syncAuditRouter.ts`
  - **Validation:** `bun run check` passa sem erros
- [ ] ST-001.2: Implementar query que retorna: users sem mentorado, mentorados sem user
  - **File:** `server/syncAuditRouter.ts`
  - **Validation:** Fazer chamada via tRPC devTools e verificar response
- [ ] ST-001.3: Registrar router em `routers.ts`
  - **File:** `server/routers.ts`
  - **Validation:** `bun dev` inicia sem erros

**Rollback:** `git checkout HEAD -- server/routers.ts && rm server/syncAuditRouter.ts`

---

### AT-002: Criar Componente SyncStatusView
**Goal:** UI para visualizar status de sincronização
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Criar componente com cards de métricas (total users, linked, orphans)
  - **File:** `client/src/components/admin/SyncStatusView.tsx`
  - **Validation:** Componente renderiza sem erros no browser
- [ ] ST-002.2: Adicionar tabela de discrepâncias com ações
  - **File:** `client/src/components/admin/SyncStatusView.tsx`
  - **Validation:** Tabela exibe dados do endpoint AT-001
- [ ] ST-002.3: Implementar hook `useSyncStatus` para consumir endpoint
  - **File:** `client/src/hooks/use-sync-status.ts`
  - **Validation:** `bun run check` passa sem erros

**Rollback:** `rm -rf client/src/components/admin/SyncStatusView.tsx client/src/hooks/use-sync-status.ts`

---

### AT-003: Integrar Tab de Sincronização na Gestão ⚡
**Goal:** Adicionar tab "Sincronização" em GestaoMentorados
**Dependencies:** AT-002

#### Subtasks:
- [ ] ST-003.1: Adicionar TabsTrigger "Sincronização" no TabsList
  - **File:** `client/src/pages/GestaoMentorados.tsx`
  - **Validation:** Tab aparece na interface
- [ ] ST-003.2: Adicionar TabsContent com SyncStatusView
  - **File:** `client/src/pages/GestaoMentorados.tsx`
  - **Validation:** Clicar na tab mostra o componente
- [ ] ST-003.3: Verificar responsividade (mobile + desktop)
  - **File:** `client/src/pages/GestaoMentorados.tsx`
  - **Validation:** Layout funciona em 375px e 1440px

**Rollback:** `git checkout HEAD -- client/src/pages/GestaoMentorados.tsx`

---

### AT-004: Adicionar Testes de Sync ⚡
**Goal:** Garantir que auditoria de sync está testada
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-004.1: Criar teste unitário para syncAuditRouter
  - **File:** `server/syncAudit.test.ts`
  - **Validation:** `bun test` passa com cobertura do novo router
- [ ] ST-004.2: Adicionar teste de integração manual
  - **File:** `docs/MANUAL-TESTS.md`
  - **Validation:** Documento com steps de verificação

**Rollback:** `rm server/syncAudit.test.ts`

---

## 4. Verification Plan

### Automated Tests

```bash
# TypeScript validation
bun run check

# Linting
bun run lint

# Unit tests
bun test
```

### Manual Verification

1. **Verificar endpoint de sync:**
   ```bash
   # Com o server rodando (bun dev)
   # Acessar http://localhost:3000/api/trpc/syncAudit.getSyncStatus
   # Ou usar tRPC devTools no browser
   ```

2. **Verificar UI no browser:**
   - Navegar para `/gestao-mentorados`
   - Clicar na tab "Sincronização"
   - Verificar que mostra métricas corretas (8 users, 7 linked)
   - Verificar lista de discrepâncias (1 admin sem mentorado)

3. **Teste de responsividade:**
   - DevTools → Responsive → 375px (mobile)
   - DevTools → Responsive → 1440px (desktop)
   - Verificar que layout não quebra

### Database Queries para Validação

```sql
-- Executar no Neon Console para conferir
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM mentorados) as total_mentorados,
  (SELECT COUNT(*) FROM mentorados WHERE user_id IS NOT NULL) as linked,
  (SELECT COUNT(*) FROM mentorados WHERE user_id IS NULL) as orphans;
```

---

## 5. Rollback Plan

```bash
# Reverter todas as mudanças
git checkout HEAD -- server/routers.ts
git checkout HEAD -- client/src/pages/GestaoMentorados.tsx
rm -f server/syncAuditRouter.ts
rm -f server/syncAudit.test.ts
rm -f client/src/components/admin/SyncStatusView.tsx
rm -f client/src/hooks/use-sync-status.ts
```

---

## 6. Current Status Summary

### ✅ Sincronização Funcionando

Baseado na análise da base de dados:

| Métrica | Valor | Status |
|---------|-------|--------|
| Usuários no Clerk (via DB) | 8 | ✅ |
| Mentorados | 7 | ✅ |
| Mentorados vinculados | 7 (100%) | ✅ |
| Mentorados órfãos | 0 | ✅ |
| Admins sem mentorado | 1 (Sacha) | ⚠️ Esperado |

### Mecanismos de Sincronização Ativos

1. **Webhook Clerk** → `server/webhooks/clerk.ts`
   - Evento: `user.created`, `user.updated`
   - Ação: `syncClerkUser()` → upsert user + create/link mentorado

2. **Context Auto-Creation** → `server/_core/context.ts`
   - Trigger: Primeiro request autenticado
   - Ação: Se user existe mas mentorado não → auto-cria mentorado

3. **Email Auto-Link** → `server/_core/context.ts`
   - Trigger: User sem mentorado por FK
   - Ação: Busca mentorado por email e linka

### Páginas de Administração

| Página | URL | Funcionalidade |
|--------|-----|----------------|
| Gestão Mentorados | `/gestao-mentorados` | Overview, Management, Access tabs |
| Vincular Emails | `/vincular-emails` | Manual email linking |
| Admin | `/admin` | KPIs e lista de mentorados |

---

## Pre-Submission Checklist

- [x] Codebase patterns searched and documented
- [x] Database queries executed for current state
- [x] Sync mechanisms identified and documented
- [x] Admin pages reviewed for sync visibility
- [x] Knowledge gaps explicitly listed
- [x] Assumptions documented
- [x] All tasks have AT-XXX IDs
- [x] All tasks have subtasks (ST-XXX.N)
- [x] Each subtask has validation
- [x] Dependencies mapped
- [x] Rollback steps defined
- [x] Parallel-safe tasks marked with ⚡
