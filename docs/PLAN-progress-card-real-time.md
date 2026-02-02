# PLAN-progress-card-real-time: Conectar Card de Progresso Geral às Atividades

> **Goal:** Configurar o card "Progresso Geral" na aba Visão Geral do dashboard para exibir em tempo real o progresso das atividades executadas pelos mentorados.

---

## 0. Research Findings

| #   | Finding                                                       | Confidence | Source                         | Impact    |
| --- | ------------------------------------------------------------- | ---------- | ------------------------------ | --------- |
| 1   | Card "Progresso Geral" exibe **75% hardcoded**                | 5/5        | MyDashboard.tsx:247-250        | ❌ Bug     |
| 2   | Backend `atividades.getProgress` retorna mapa de progresso    | 5/5        | atividadesRouter.ts:17-33      | ✅ Pronto  |
| 3   | `calcularProgresso()` já calcula total/completed/percentage   | 5/5        | atividades-data.ts:516-539     | ✅ Reusável|
| 4   | `AtividadesContent.tsx` usa padrão correto de fetch + cálculo | 5/5        | AtividadesContent.tsx:71-99    | ✅ Modelo  |
| 5   | Admin pode ver progresso de qualquer mentorado via ID         | 5/5        | atividadesRouter.ts:39-57      | ✅ Pronto  |
| 6   | `targetMentoradoId` já está disponível no dashboard           | 5/5        | MyDashboard.tsx:67-68          | ✅ Pronto  |
| 7   | shadcn `Progress` component disponível                        | 5/5        | components/ui/progress.tsx     | ✅ Usar    |

### Knowledge Gaps

- **Nenhum**: Toda a infraestrutura backend está implementada.

### Assumptions to Validate

1. O refetch será automático quando mentorado marcar um step como concluído (deve funcionar via cache invalidation do React Query)
2. A variação de progresso (ex: +5%) requer dados do mês anterior (opcional, pode ser implementado depois)

---

## 1. User Review Required

> [!IMPORTANT]
> **Decisão de Design**: A variação percentual (`+5%`, mostrada atualmente como hardcoded) requer comparação com mês anterior. 
> 
> **Opções:**
> - **A) Simples**: Mostrar apenas progresso atual sem variação (implementação imediata)
> - **B) Completa**: Calcular variação vs. mês anterior (requer lógica adicional de snapshot)
>
> **Recomendação**: Opção A para MVP, adicionar B posteriormente se necessário.

---

## 2. Proposed Changes

### Componente Dashboard

#### [MODIFY] [MyDashboard.tsx](file:///home/mauricio/neondash/client/src/pages/MyDashboard.tsx)

**Linhas 240-257**: Substituir valores hardcoded por query real

**Mudanças:**
1. Adicionar query `trpc.atividades.getProgress` (ou `getProgressById` para admin)
2. Importar e usar `calcularProgresso` de `atividades-data.ts`
3. Exibir `percentage`, `completed` e `total` reais
4. Tratar estado de loading com Skeleton

**Código atual (hardcoded):**
```tsx
<span className="text-4xl font-bold text-primary">75%</span>
<span className="text-green-500 flex items-center text-sm">
  <TrendingUp className="w-4 h-4 mr-1" /> +5%
</span>
```

**Código proposto (dinâmico):**
```tsx
// Query de progresso (dentro do componente)
const progressQuery = isAdmin && selectedMentoradoId
  ? trpc.atividades.getProgressById.useQuery({ mentoradoId: parseInt(selectedMentoradoId, 10) })
  : trpc.atividades.getProgress.useQuery();

const { percentage, completed, total } = calcularProgresso(
  Object.fromEntries(
    Object.entries(progressQuery.data ?? {}).map(([k, v]) => [k, v.completed])
  )
);

// No JSX
{progressQuery.isLoading ? (
  <Skeleton className="h-10 w-20" />
) : (
  <span className="text-4xl font-bold text-primary">{percentage}%</span>
)}
```

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Each task MUST have subtasks. No single-line tasks allowed.

### AT-001: Adicionar Query de Progresso no MyDashboard ⚡

**Goal:** Fetch de dados reais de progresso de atividades
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Importar `calcularProgresso` de `@/data/atividades-data`
  - **File:** `client/src/pages/MyDashboard.tsx`
  - **Validation:** Sem erros de import no TypeScript
- [ ] ST-001.2: Adicionar query condicional (getProgress vs getProgressById)
  - **File:** `client/src/pages/MyDashboard.tsx`
  - **Validation:** `bun run check` passa

**Rollback:** `git checkout client/src/pages/MyDashboard.tsx`

---

### AT-002: Atualizar Card de Progresso com Dados Reais ⚡

**Goal:** Exibir progresso real no lugar do valor hardcoded
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Substituir `75%` hardcoded por `{percentage}%`
  - **File:** `client/src/pages/MyDashboard.tsx` (linha 247)
  - **Validation:** UI exibe valor dinâmico
- [ ] ST-002.2: Adicionar mensagem de loading com Skeleton
  - **File:** `client/src/pages/MyDashboard.tsx`
  - **Validation:** Skeleton aparece durante fetch
- [ ] ST-002.3: Atualizar texto descritivo baseado no progresso
  - **File:** `client/src/pages/MyDashboard.tsx` (linha 252-254)
  - **Validation:** Mensagem muda conforme progresso

**Rollback:** `git checkout client/src/pages/MyDashboard.tsx`

---

### AT-003: Remover Indicador de Variação (MVP)

**Goal:** Remover "+5%" hardcoded temporariamente
**Dependencies:** AT-002

#### Subtasks:
- [ ] ST-003.1: Ocultar ou remover span de variação
  - **File:** `client/src/pages/MyDashboard.tsx` (linhas 248-250)
  - **Validation:** Não há mais "+5%" hardcoded

**Rollback:** Restaurar linhas 248-250

---

## 4. Verification Plan

### Automated Tests

| Check      | Command         | Expected Result        |
| ---------- | --------------- | ---------------------- |
| TypeScript | `bun run check` | Exit code 0, no errors |
| Build      | `bun run build` | Build succeeds         |
| Lint       | `bun run lint`  | No errors              |

### Manual Verification

1. **Verificar progresso zerado:**
   - Login como mentorado **sem** atividades marcadas
   - Acessar `/meu-dashboard`
   - Card deve mostrar `0%` e mensagem adequada

2. **Verificar progresso parcial:**
   - Ir para aba "Atividades"
   - Marcar 2-3 steps como concluídos
   - Voltar para aba "Visão Geral"
   - Card deve atualizar automaticamente (via React Query cache)

3. **Verificar admin view:**
   - Login como admin
   - Selecionar um mentorado pelo FloatingDock
   - Card deve mostrar progresso do mentorado selecionado

4. **Verificar loading state:**
   - Acessar dashboard
   - Skeleton deve aparecer brevemente antes dos dados

---

## 5. Rollback Plan

```bash
# Reverter todas as mudanças
git checkout client/src/pages/MyDashboard.tsx
```

---

## Pre-Submission Checklist

- [x] Created docs/PLAN-{slug}.md file
- [x] Codebase patterns searched and documented
- [x] Context7/docs consulted for all technologies
- [x] Findings Table with 7 entries and confidence scores
- [x] Knowledge Gaps explicitly listed
- [x] Assumptions to Validate listed
- [x] Edge cases documented
- [x] All tasks have AT-XXX IDs
- [x] All tasks have subtasks (ST-XXX.N)
- [x] Each subtask has validation
- [x] Dependencies mapped
- [x] Rollback steps defined
- [x] Parallel-safe tasks marked with ⚡
