# PLAN-crm-admin-restriction: Restringir Visualização Admin no CRM

> **Goal:** Garantir que a seção "VISUALIZAÇÃO ADMIN" no CRM seja visível apenas para administradores, e que mentorados vejam apenas seus próprios dados.

---

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Frontend check `isAdmin` está correto: `user?.role === "admin"` | 5/5 | [LeadsPage.tsx:23](file:///home/mauricio/neondash/client/src/pages/crm/LeadsPage.tsx#L23) | Check correto no frontend |
| 2 | Admin selector só renderiza se `isAdmin === true` | 5/5 | [LeadsPage.tsx:128](file:///home/mauricio/neondash/client/src/pages/crm/LeadsPage.tsx#L128) | Condição correta |
| 3 | Backend valida `ctx.user.role !== "admin"` antes de permitir acesso a outros mentorados | 5/5 | [leadsRouter.ts:29-31](file:///home/mauricio/neondash/server/leadsRouter.ts#L29-L31) | Segurança backend OK |
| 4 | Role é determinado pelo email estar em `ADMIN_EMAILS` env var | 5/5 | [db.ts:107-117](file:///home/mauricio/neondash/server/db.ts#L107-L117) | Configuração via env |
| 5 | Não há verificação adicional no `adminProcedure` para rotas sensíveis | 3/5 | Codebase | Potencial melhoria |
| 6 | Não existe ferramenta para auditar usuários com role admin | 4/5 | Codebase | Dificulta diagnóstico |

### Knowledge Gaps & Assumptions

- **Gap:** Não há logs de acesso admin para auditoria
- **Assumption:** O problema reportado é um usuário específico com role "admin" incorretamente atribuído
- **Assumption:** A env var `ADMIN_EMAILS` está configurada corretamente

---

## 1. User Review Required

> [!IMPORTANT]
> **Verificação de Dados Necessária**
> 
> O código está implementado corretamente. Se um mentorado está vendo a "VISUALIZAÇÃO ADMIN", significa que:
> 1. O email dele está na lista `ADMIN_EMAILS` (verifique a env var)
> 2. OU o `role` no banco foi manualmente alterado para "admin"
> 
> **Ação recomendada:** Executar a query de auditoria no AT-001 para identificar todos os usuários admin.

---

## 2. Proposed Changes

### Component: Auditoria (Novo)

#### [NEW] SQL Query para Auditoria Admin
**Purpose:** Identificar todos os usuários com role "admin" no banco de dados.

```sql
SELECT id, email, name, role, "clerkId", "createdAt" 
FROM users 
WHERE role = 'admin';
```

---

### Component: Backend Security

#### [MODIFY] [adminRouter.ts](file:///home/mauricio/neondash/server/adminRouter.ts)
- **Action:** Adicionar endpoint de auditoria para listar usuários admin
- **Details:** Novo procedure `listAdminUsers` protegido por `adminProcedure`

---

### Component: Environment Verification

#### [VERIFY] Environment Variable
- **Action:** Verificar valor de `ADMIN_EMAILS` em produção
- **Details:** Garantir que apenas emails de admins reais estejam listados

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Este é um problema de **baixa complexidade (L2)**. O código já está correto. As tarefas abaixo são para verificação e melhorias de auditoria.

### AT-001: Auditar Usuários Admin no Banco ⚡
**Goal:** Identificar todos os usuários com role "admin" para verificar se há atribuições incorretas
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Executar query de auditoria no Neon console
  - **Query:** `SELECT id, email, name, role FROM users WHERE role = 'admin';`
  - **Validation:** Listar todos os admins e verificar se são esperados
- [ ] ST-001.2: Remover role admin de usuários que não deveriam ser admin
  - **Query:** `UPDATE users SET role = 'user' WHERE email = '...' AND role = 'admin';`
  - **Validation:** Verificar que apenas admins corretos permanecem
- [ ] ST-001.3: Verificar env var `ADMIN_EMAILS`
  - **File:** `.env` ou plataforma de deploy
  - **Validation:** Confirmar que lista contém apenas emails de admins

**Rollback:** `UPDATE users SET role = 'admin' WHERE email = '...'` para restaurar

---

### AT-002: Adicionar Endpoint de Auditoria Admin
**Goal:** Permitir que admins listem todos os usuários com acesso administrativo
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Criar procedure `admin.listAdminUsers`
  - **File:** `server/adminRouter.ts`
  - **Validation:** Apenas admins podem acessar
- [ ] ST-002.2: Retornar lista de usuários com role="admin"
  - **File:** `server/adminRouter.ts`
  - **Validation:** Query executa corretamente
- [ ] ST-002.3: Adicionar UI no painel admin (opcional)
  - **File:** `client/src/components/admin/AdminPanelView.tsx`
  - **Validation:** Lista visível no painel

**Rollback:** Reverter commits do adminRouter.ts

---

### AT-003: Melhorar Logs de Acesso Admin
**Goal:** Registrar quando um admin acessa dados de outro mentorado para auditoria
**Dependencies:** None ⚡

#### Subtasks:
- [ ] ST-003.1: Adicionar log quando admin visualiza outro mentorado
  - **File:** `server/leadsRouter.ts`
  - **Validation:** Log aparece no servidor
- [ ] ST-003.2: Incluir timestamp, adminId, targetMentoradoId no log
  - **File:** `server/leadsRouter.ts`
  - **Validation:** Informações completas no log

**Rollback:** Remover chamadas de log

---

## 4. Verification Plan

### Automated Tests
- `bun run check` - TypeScript validation
- `bun run lint` - Code formatting
- `bun test` - Unit tests

### Manual Verification
1. [ ] Logar como mentorado (não-admin) e verificar que "VISUALIZAÇÃO ADMIN" NÃO aparece
2. [ ] Logar como admin e verificar que "VISUALIZAÇÃO ADMIN" aparece
3. [ ] Admin seleciona outro mentorado → dados do mentorado selecionado são exibidos
4. [ ] Mentorado tenta acessar API com `mentoradoId` de outro → erro 403 FORBIDDEN

---

## 5. Rollback Plan

```bash
# Se alterações de código forem necessárias
git revert HEAD

# Se role foi alterado incorretamente
UPDATE users SET role = 'admin' WHERE email = 'email-do-admin-real@example.com';
```

---

## 6. Edge Cases Considered

| # | Edge Case | Handling |
|---|-----------|----------|
| 1 | Admin email removido de ADMIN_EMAILS mas role já era admin | Role persiste até próximo login |
| 2 | Múltiplos emails na env var separados incorretamente | Usar `,` como separador |
| 3 | Usuario tenta manipular request para parecer admin | Backend valida ctx.user.role |
| 4 | Cache de autenticação mostra role antigo | staleTime de 5min no useAuth |
| 5 | Mentorado com email igual a admin email | Verificar duplicatas no banco |

---

## 7. Summary

**O código está correto.** O problema reportado é provavelmente uma questão de dados:
1. Um usuário tem `role = "admin"` quando não deveria
2. OU o email do usuário está na lista `ADMIN_EMAILS`

**Ação imediata:** Executar AT-001 (auditoria) para identificar o problema.

**Melhorias opcionais:** AT-002 e AT-003 para facilitar auditoria futura.
