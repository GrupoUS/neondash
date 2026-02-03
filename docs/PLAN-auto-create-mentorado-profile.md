# Plan: Auto-Criação de Perfil de Mentorado no Primeiro Login

## Metadata
- **complexity**: L6 — Envolve alterações no middleware de contexto tRPC, cache de sessão, sincronização entre Clerk e NeonDB, e múltiplos cenários de edge cases
- **estimated_time**: 4-6 hours
- **parallel_safe**: false (alterações no contexto afetam toda a aplicação)

---

## Objective
**task**: Implementar mecanismo robusto de auto-criação de perfil de mentorado no primeiro login, garantindo que novos usuários vejam a dashboard funcional imediatamente sem telas de loading infinito.

**context**: Neon Dashboard (React 19 + Vite 7 + tRPC 11 + Drizzle ORM + Neon PostgreSQL + Clerk Auth). O sistema atual possui auto-criação básica no `createContext`, mas sofre de race conditions com cache de sessão.

**why_this_matters**: Novos mentorados atualmente veem placeholders/skeletons carregando indefinidamente porque o contexto cacheado pode não conter o mentorado recém-criado, ou ocorrem falhas silenciosas na criação.

---

## Environment
- **runtime**: Bun 1.x
- **framework**: React 19 + Vite 7
- **backend**: Express + tRPC 11
- **database**: Neon PostgreSQL
- **orm**: Drizzle ORM
- **auth**: Clerk (@clerk/clerk-react + @clerk/express)
- **ui**: shadcn/ui
- **testing**: Bun test + Vitest

---

## Research Summary

### Findings Table

| # | Finding | Confidence (1-5) | Source | Impact |
|---|---------|------------------|--------|--------|
| 1 | Auto-criação de mentorado JÁ EXISTE em `server/_core/context.ts` linhas 113-148 | 5 | Code audit | A lógica existe mas tem problemas de race condition |
| 2 | Cache de sessão em `sessionCache.ts` pode retornar contexto sem mentorado | 5 | Code audit | Causa loading infinito quando cache hit sem mentorado |
| 3 | `mentorados.me` query retorna `ctx.mentorado` diretamente | 5 | `server/mentoradosRouter.ts:63-65` | Se contexto não tem mentorado, query falha |
| 4 | `getOverviewStats` lança FORBIDDEN se `ctx.mentorado` é null | 5 | `server/mentoradosRouter.ts:474-479` | Dashboard falha silenciosamente para novos usuários |
| 5 | `AuthSync.tsx` chama `syncUser` apenas uma vez via `useRef` | 5 | Code audit | Se falha, não há retry automático |
| 6 | `upsertUserFromClerk` cria/atualiza usuário mas não garante mentorado | 4 | `server/db.ts:90-137` | Separação de concerns entre user e mentorado |
| 7 | Tabela `mentorados` possui campos obrigatórios: `nomeCompleto`, `turma` | 5 | `drizzle/schema.ts:115-161` | Valores padrão devem ser fornecidos na criação |
| 8 | Dashboard espera `stats.financials.chartData` - array vazio é válido | 4 | `MenteeOverview.tsx:46-54` | NewMentoradoWelcome é exibido quando não há dados |
| 9 | Relação `users` → `mentorados` é 1:1 via `userId` FK | 5 | `drizzle/relations.ts:25-30` | Constraint importante para integridade |
| 10 | `mentoradoProcedure` middleware exige `ctx.mentorado` | 5 | `server/_core/trpc.ts:30-53` | Proteção em nível de procedure |
| 11 | Drizzle suporta `onConflictDoNothing()` para upsert idempotente | 5 | Context7 - Drizzle ORM Docs | Elimina race conditions em INSERT |
| 12 | Clerk webhooks são assíncronos e NÃO garantidos | 5 | Context7 - Clerk Docs | Não devem ser usados para onboarding síncrono |
| 13 | Neon HTTP driver é stateless, ideal para serverless | 4 | Context7 - Drizzle Docs | Limitações com transações interativas |
| 14 | `SELECT FOR UPDATE` previne race conditions em PostgreSQL | 4 | Tavily Research | Lock pessimista para concorrência |

### Knowledge Gaps

1. **Taxa de falha real**: Não temos métricas de quantos usuários encontram este problema
2. **Tempo de expiração do cache**: O TTL do `sessionCache` não está claro no código
3. **Concorrência**: Comportamento quando múltiplas requisições simultâneas tentam criar o mesmo mentorado
4. **Dados iniciais necessários**: Quais tabelas além de `mentorados` precisam ser populadas?
5. **Webhook Clerk**: O sistema usa webhooks para sincronização? (não encontrado no codebase)

### Assumptions to Validate

1. **Assumption**: O problema ocorre apenas quando o usuário existe mas mentorado não foi criado
   - **Validation**: Verificar logs de `mentorado_creation_failed`
   
2. **Assumption**: Cache de sessão é a causa principal do loading infinito
   - **Validation**: Adicionar logging para distinguir cache hit vs miss
   
3. **Assumption**: Um mentorado com dados mínimos é suficiente para dashboard funcionar
   - **Validation**: Testar dashboard com mentorado sem métricas/diagnóstico

---

## MCP Research Insights

### Clerk Best Practices (Context7)
- **Webhook Limitations**: Webhooks são assíncronos, eventualmente consistentes, e NÃO garantidos. Não devem ser usados para fluxos de onboarding síncronos.
- **Sincronização Recomendada**: Criar/atualizar perfil durante o fluxo de autenticação (em `createContext` ou endpoint dedicado), não depender de webhooks.
- **Verificação de Webhooks**: Se implementar webhooks futuramente, usar `verifyWebhook` do `@clerk/backend/webhooks` com signing secret.

### Drizzle ORM Patterns (Context7)
- **Upsert Idempotente**: Usar `onConflictDoNothing()` ou `onConflictDoUpdate()` para operações idempotentes:
  ```typescript
  await db.insert(mentorados).values(data).onConflictDoNothing();
  ```
- **Transações**: Neon HTTP driver tem limitações com transações interativas. Usar `onConflict` pattern para atomicidade em operações simples.
- **Constraints**: Adicionar UNIQUE constraint em `mentorados.userId` permite upsert seguro.

### Race Condition Prevention (Tavily Research)
- **Database-Level Locks**: Usar `SELECT FOR UPDATE` para lock pessimista quando necessário.
- **Cache Patterns**: Implementar versioned keys ou compare-and-swap para cache.
- **Distributed Locks**: Pattern Redlock para operações críticas (usar Redis ou similar).

### tRPC Middleware (Context7)
- **Composition**: Usar `t.procedure.use(middleware)` para composição.
- **Context Enrichment**: Passar dados enriquecidos via `return next({ ctx: { ...ctx, user } })`.
- **Error Handling**: Usar `TRPCError` com códigos apropriados.

---

## Relevant Files

### Must Read
- **path**: `server/_core/context.ts`
  - **relevance**: Contém lógica de auto-criação de mentorado e cache de sessão
- **path**: `server/_core/sessionCache.ts`
  - **relevance**: Gerencia cache de sessão que causa race condition
- **path**: `server/routers/auth.ts`
  - **relevance**: Endpoint `syncUser` chamado pelo frontend
- **path**: `server/mentoradosRouter.ts`
  - **relevance**: Queries `me` e `getOverviewStats` usadas pelo dashboard
- **path**: `client/src/components/auth/AuthSync.tsx`
  - **relevance**: Componente que dispara sincronização no login

### May Reference
- **path**: `client/src/pages/MyDashboard.tsx`
  - **relevance**: Página que exibe loading skeletons
- **path**: `client/src/components/dashboard/MenteeOverview.tsx`
  - **relevance**: Componente que decide entre dashboard ou welcome screen
- **path**: `server/_core/trpc.ts`
  - **relevance**: Definição de `protectedProcedure` e `mentoradoProcedure`
- **path**: `server/db.ts`
  - **relevance**: Função `upsertUserFromClerk`
- **path**: `drizzle/schema.ts`
  - **relevance**: Schema completo das tabelas

---

## Existing Patterns

### naming
- Procedures tRPC: camelCase (ex: `getOverviewStats`, `syncUser`)
- Tabelas Drizzle: snake_case no DB, camelCase no código
- Variáveis de contexto: `ctx.user`, `ctx.mentorado`

### file_structure
- Routers tRPC: `server/*Router.ts` ou `server/routers/*.ts`
- Componentes React: `client/src/components/**/*.tsx`
- Páginas: `client/src/pages/*.tsx`
- Core/Utils: `client/src/_core/` e `server/_core/`

### error_handling
- TRPCError com códigos específicos: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`
- Mensagens em português para usuário final
- Logging via `createLogger` em `_core/logger.ts`

### state_management
- TanStack Query (React Query) para cache de dados no frontend
- tRPC como camada de transporte
- Contexto tRPC com `user` e `mentorado` resolvidos por request

---

## Constraints

### non_negotiable
- NÃO quebrar autenticação existente
- Manter compatibilidade com usuários admin
- Preservar cache de sessão para performance
- Auto-criação deve ser transacional (user + mentorado)
- Respeitar rate limits do Clerk

### preferences
- Logging detalhado para debugging
- Retry automático com backoff exponencial
- Métricas/alertas para falhas de criação
- Fallback gracioso quando mentorado não existe

---

## Chain of Thought

### Research
- **Codebase patterns**: Auto-criação existe em `context.ts` mas é vulnerável a race conditions
- **Docs consulted**: Clerk Express SDK, Drizzle ORM docs (implicit knowledge)
- **Security**: Contexto protege rotas, mas cache pode expor dados stale
- **Edge cases**: Cache hit sem mentorado, múltiplas requisições simultâneas, falha no DB

### Analyze
- **Core requirement**: Garantir que todo usuário autenticado tenha um mentorado válido
- **Technical constraints**: Cache de sessão é necessário para performance
- **Integration points**: Clerk ↔ tRPC context ↔ Drizzle ORM ↔ NeonDB

### Think
**step_by_step**:
1. First: Corrigir race condition no cache de sessão (invalidar/refresh quando mentorado criado)
2. Then: Adicionar retry no `AuthSync` para lidar com falhas transitórias
3. Then: Criar endpoint dedicado `ensureMentorado` para verificação explícita
4. Then: Adicionar fallback no frontend para estado "sem mentorado"
5. Finally: Implementar métricas e monitoramento

**tree_of_thoughts**:

**approach_a**: Modificar `createContext` para sempre verificar/criar mentorado (atual)
- **pros**: Simples, centralizado
- **cons**: Race condition com cache, performance impacta todas as requests
- **score**: 6/10

**approach_b**: Endpoint dedicado `auth.ensureMentorado` chamado pelo frontend
- **pros**: Controle explícito, melhor error handling, pode retry
- **cons**: Requer mudança no frontend, uma chamada extra no login
- **score**: 8/10

**approach_c**: Webhook Clerk + background job
- **pros**: Assíncrono, não afeta login
- **cons**: Complexo, requer infra de jobs, delay no primeiro acesso
- **score**: 5/10

**selected**: approach_b com melhorias no contexto existente
**rationale**: Balanceia simplicidade com robustez, permite retry no frontend, e resolve o problema de race condition sem reescrever tudo

---

## Edge Cases / Failure Modes

| # | Edge Case | Impact | Mitigation |
|---|-----------|--------|------------|
| 1 | Usuário faz múltiplos logins simultâneos (diferentes devices) | Race condition na criação de mentorado | Usar `ON CONFLICT` ou transação com `SELECT FOR UPDATE` |
| 2 | Cache de sessão retorna user sem mentorado | Loading infinito no dashboard | Invalidar cache quando mentorado é criado; adicionar verificação no cache hit |
| 3 | Falha de rede durante criação do mentorado | Usuário sem mentorado, retries falham | Retry exponencial no frontend; endpoint idempotente |
| 4 | Clerk retorna usuário sem email | Não é possível fazer link por email | Criar mentorado sem email, associar apenas por userId |
| 5 | Banco de dados indisponível | Erro 500, usuário não consegue usar app | Fallback para modo "read-only" ou mensagem apropriada |
| 6 | Usuário existe, mentorado existe mas com `userId` null | Link não foi feito | Detectar e auto-link no `syncUser` |
| 7 | Múltiplos mentorados com mesmo email | Ambiguidade no link | Logar alerta, não fazer link automático |
| 8 | `syncUser` chamado antes de `createContext` completar | Estado inconsistente | Garantir ordem de execução via dependências React |
| 9 | Admin cria mentorado manualmente enquanto usuário loga | Conflito de criação | Verificar existência antes de inserir |
| 10 | Session cache expira entre criação e primeiro uso | Re-criação desnecessária | TTL adequado, idempotência na criação |

---

## Atomic Tasks

### Phase 1: Foundation (Fix Core Logic)

#### AT-001: Corrigir race condition no session cache
- **id**: AT-001
- **title**: Invalidar session cache quando mentorado é criado
- **phase**: 1
- **priority**: critical
- **dependencies**: []
- **parallel_safe**: false
- **files_to_modify**:
  - `server/_core/context.ts`
  - `server/_core/sessionCache.ts`
- **implementation_notes**: |
  Após criar mentorado em `context.ts`, invalidar o cache da sessão:
  ```typescript
  // Após db.insert(mentorados)...
  await invalidateCachedSession(auth.userId);
  ```
  
  Adicionar função em `sessionCache.ts`:
  ```typescript
  export async function invalidateCachedSession(clerkId: string): Promise<void> {
    await redis.del(`session:${clerkId}`);
  }
  ```
- **validation**:
  - Testar login com usuário novo
  - Verificar que cache é invalidado após criação
  - Confirmar que segunda request tem mentorado
- **rollback**: Reverter para versão anterior do context.ts
- **acceptance_criteria**:
  - [ ] Após criação de mentorado, cache é invalidado ou atualizado
  - [ ] Próxima requisição retorna mentorado correto
  - [ ] Não há race condition em testes de carga

#### AT-002: Adicionar verificação de mentorado em cache hit
- **id**: AT-002
- **title**: Verificar mentorado mesmo quando cache hit
- **phase**: 1
- **priority**: high
- **dependencies**: [AT-001]
- **parallel_safe**: false
- **files_to_modify**: 
  - `server/_core/context.ts`
- **validation**: 
  - Simular cache com user sem mentorado
  - Verificar que sistema detecta e cria mentorado
- **rollback**: Remover verificação adicional
- **acceptance_criteria**:
  - [ ] Cache hit com user sem mentorado dispara criação
  - [ ] Não há degradação de performance >100ms
  - [ ] Logs indicam "cache hit but mentorado missing"

### Phase 2: API & Frontend (Explicit Control)

#### AT-003: Criar procedure `auth.ensureMentorado`
- **id**: AT-003
- **title**: Criar endpoint dedicado para verificação/criação de mentorado
- **phase**: 2
- **priority**: critical
- **dependencies**: [AT-001, AT-002]
- **parallel_safe**: true
- **files_to_modify**:
  - `server/routers/auth.ts`
- **files_to_create**: []
- **implementation_notes**: |
  Usar padrão upsert idempotente com `onConflictDoNothing`:
  
  ```typescript
  ensureMentorado: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.mentorado) {
      return { success: true, mentorado: ctx.mentorado, created: false };
    }
    
    const user = ctx.user!;
    const db = getDb();
    
    // Tentar inserir, ignorar se já existe (race condition safe)
    await db.insert(mentorados)
      .values({
        userId: user.id,
        nomeCompleto: user.name || "Novo Usuário",
        email: user.email,
        fotoUrl: user.imageUrl,
        turma: "neon",
        ativo: "sim",
        metaFaturamento: 16000,
        metaLeads: 50,
        metaProcedimentos: 10,
        metaPosts: 12,
        metaStories: 60,
      })
      .onConflictDoNothing({ target: mentorados.userId });
    
    // Buscar o mentorado (existente ou recém-criado)
    const mentorado = await db.query.mentorados.findFirst({
      where: eq(mentorados.userId, user.id),
    });
    
    // Invalidar cache para próximas requisições
    await invalidateCachedSession(user.clerkId);
    
    return { success: true, mentorado, created: true };
  }),
  ```
  
  **Nota**: Requer constraint UNIQUE em `mentorados.userId` (AT-006).
- **validation**:
  - Testar com usuário sem mentorado → deve criar
  - Testar com usuário com mentorado → deve retornar existente
  - Testar idempotência (múltiplas chamadas simultâneas)
- **rollback**: Remover procedure
- **acceptance_criteria**:
  - [ ] Endpoint cria mentorado se não existir
  - [ ] Retorna mentorado existente se já houver
  - [ ] É idempotente (100 chamadas simultâneas = 1 mentorado)
  - [ ] Usa `onConflictDoNothing` para race condition safety

#### AT-004: Atualizar `AuthSync` para usar `ensureMentorado`
- **id**: AT-004
- **title**: Modificar componente AuthSync para usar novo endpoint com retry
- **phase**: 2
- **priority**: high
- **dependencies**: [AT-003]
- **parallel_safe**: false
- **files_to_modify**:
  - `client/src/components/auth/AuthSync.tsx`
- **implementation_notes**: |
  Usar TanStack Query's built-in retry com exponential backoff:
  
  ```typescript
  export function AuthSync() {
    const { isAuthenticated } = useAuth();
    const hasSynced = useRef(false);
    const utils = trpc.useUtils();
    
    const { mutate: ensureMentorado, isPending } = trpc.auth.ensureMentorado.useMutation({
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // 1s, 2s, 4s
      onSuccess: (data) => {
        if (data.created) {
          toast.success("Perfil criado com sucesso!");
        }
        // Invalidar queries para forçar refetch
        utils.mentorados.me.invalidate();
        utils.auth.me.invalidate();
      },
      onError: (error) => {
        toast.error("Erro ao preparar seu perfil. Tente recarregar a página.");
        console.error("ensureMentorado failed:", error);
      },
    });
    
    useEffect(() => {
      if (isAuthenticated && !hasSynced.current) {
        hasSynced.current = true;
        ensureMentorado();
      }
    }, [isAuthenticated, ensureMentorado]);
    
    // Opcional: Mostrar loading indicator
    if (isPending) {
      return <LoadingToast message="Preparando seu perfil..." />;
    }
    
    return null;
  }
  ```
- **validation**:
  - Testar login com usuário novo
  - Verificar retry em caso de falha simulada
  - Confirmar que toast aparece apenas quando apropriado
- **rollback**: Reverter para `syncUser`
- **acceptance_criteria**:
  - [ ] Usa `ensureMentorado` em vez de `syncUser`
  - [ ] Implementa retry com exponential backoff (3 tentativas: 1s, 2s, 4s)
  - [ ] Invalida queries do TanStack em sucesso
  - [ ] Mostra feedback visual durante criação

#### AT-005: Adicionar query invalidation após criação
- **id**: AT-005
- **title**: Invalidar queries de mentorado após criação bem-sucedida
- **phase**: 2
- **priority**: medium
- **dependencies**: [AT-004]
- **parallel_safe**: true
- **files_to_modify**: 
  - `client/src/components/auth/AuthSync.tsx`
- **validation**: 
  - Verificar que dashboard carrega dados após criação
  - Confirmar que não há loading indefinido
- **rollback**: Remover invalidation
- **acceptance_criteria**:
  - [ ] Query `mentorados.me` é invalidada após criação
  - [ ] Query `auth.me` é invalidada após criação
  - [ ] Dashboard recarrega automaticamente

### Phase 3: Data Integrity & Validation

#### AT-006: Criar índice único em mentorados.userId
- **id**: AT-006
- **title**: Adicionar constraint único para prevenir duplicados
- **phase**: 3
- **priority**: high
- **dependencies**: [AT-003]
- **parallel_safe**: false
- **files_to_modify**:
  - `drizzle/schema.ts`
- **implementation_notes**: |
  Modificar schema em `drizzle/schema.ts`:
  
  ```typescript
  export const mentorados = pgTable(
    "mentorados",
    {
      id: serial("id").primaryKey(),
      userId: integer("user_id")
        .references(() => users.id, { onDelete: "set null" })
        .unique(), // ADD THIS
      // ... resto dos campos
    },
    (table) => [
      index("mentorados_user_id_idx").on(table.userId),
      uniqueIndex("mentorados_user_id_unique_idx").on(table.userId), // EXPLICIT INDEX
      // ... outros índices
    ]
  );
  ```
  
  **Antes de aplicar em produção:**
  ```sql
  -- Verificar duplicados existentes
  SELECT user_id, COUNT(*)
  FROM mentorados
  WHERE user_id IS NOT NULL
  GROUP BY user_id
  HAVING COUNT(*) > 1;
  ```
  
  Gerar migração:
  ```bash
  bun run db:generate
  bun run db:push
  ```
- **validation**:
  - Verificar que não há duplicados existentes (query acima)
  - Gerar migração com `bun run db:generate`
  - Aplicar em staging e testar criação de mentorado
- **rollback**:
  ```bash
  bun run db:migrate:down
  ```
- **acceptance_criteria**:
  - [ ] Constraint UNIQUE em `mentorados.userId`
  - [ ] Migração gerada e testada em staging
  - [ ] Não há duplicados na base de dados
  - [ ] Testes de carga passam (criação simultânea)

#### AT-007: Adicionar logs estruturados para monitoramento
- **id**: AT-007
- **title**: Implementar logging detalhado para criação de mentorado
- **phase**: 3
- **priority**: medium
- **dependencies**: []
- **parallel_safe**: true
- **files_to_modify**: 
  - `server/_core/context.ts`
  - `server/routers/auth.ts`
- **validation**: 
  - Verificar logs em desenvolvimento
  - Confirmar estrutura JSON dos logs
- **rollback**: Remover logs adicionais
- **acceptance_criteria**:
  - [ ] Log de sucesso com userId e mentoradoId
  - [ ] Log de falha com erro e contexto
  - [ ] Log de cache hit/miss com mentorado presente/ausente
  - [ ] Métricas para tempo de criação

### Phase 4: Error Handling & UX

#### AT-008: Criar estado de erro no dashboard para mentorado não encontrado
- **id**: AT-008
- **title**: Adicionar tela de erro específica quando mentorado não existe
- **phase**: 4
- **priority**: medium
- **dependencies**: [AT-004]
- **parallel_safe**: true
- **files_to_modify**: 
  - `client/src/pages/MyDashboard.tsx`
- **validation**: 
  - Testar cenário de erro
  - Verificar botão de retry
- **rollback**: Reverter para comportamento anterior
- **acceptance_criteria**:
  - [ ] Tela amigável quando mentorado não encontrado
  - [ ] Botão "Tentar novamente"
  - [ ] Link para contato do suporte
  - [ ] Não mostra stack trace ou erro técnico

#### AT-009: Adicionar toast de progresso durante criação
- **id**: AT-009
- **title**: Notificar usuário durante processo de criação do perfil
- **phase**: 4
- **priority**: low
- **dependencies**: [AT-004]
- **parallel_safe**: true
- **files_to_modify**: 
  - `client/src/components/auth/AuthSync.tsx`
- **validation**: 
  - Testar fluxo completo
  - Verificar timing dos toasts
- **rollback**: Remover toasts
- **acceptance_criteria**:
  - [ ] Toast "Preparando seu perfil..." durante criação
  - [ ] Toast "Perfil criado!" em sucesso
  - [ ] Toast "Erro, tentando novamente..." em retry

---

## Validation Gates

### Automated
- **VT-001**: `bun run build` → Exit 0
- **VT-002**: `bun run check` → No errors
- **VT-003**: `bun test` → All pass
- **VT-004**: Teste de carga com 10 usuários simultâneos → Sem race conditions
- **VT-005**: Teste de integração: fluxo completo de login → Mentorado criado

### Manual Review
- **reviewer**: @code-reviewer
- **focus**: Race conditions e transações no context.ts
- **required_if**: Alterações em AT-001 ou AT-006

---

## Output

### Format
- **DELIVERABLE**: Código modificado + migração de banco + testes
- **DOCUMENTATION**: Este plano + comentários no código

### Files Created
- Nenhum arquivo novo necessário (modificações apenas)

### Files Modified
| path | changes |
|------|---------|
| `server/_core/context.ts` | Race condition fix, logging |
| `server/_core/sessionCache.ts` | Função de invalidação |
| `server/routers/auth.ts` | Nova procedure `ensureMentorado` |
| `client/src/components/auth/AuthSync.tsx` | Retry logic, invalidation |
| `drizzle/schema.ts` | Constraint único em userId |
| `client/src/pages/MyDashboard.tsx` | Error state |

### Success Definition
1. Novo usuário faz login → mentorado criado em < 2 segundos
2. Dashboard carrega sem loading infinito
3. Race conditions não ocorrem em testes de carga
4. Falhas são logadas e tratadas graciosamente
5. Usuário recebe feedback visual durante processo

### Failure Handling
**If**: Mentorado não é criado após implementação
**Then**: 
1. Verificar logs em `server/_core/context.ts`
2. Checar constraint de banco (AT-006)
3. Validar cache invalidation (AT-001)
**Rollback**:
1. Reverter para `syncUser` simples
2. Remover constraint de banco se causando erro
3. Reverter `AuthSync.tsx` para versão anterior

---

## Implementation Notes

### Critical Path
```
AT-001 (cache fix) → AT-003 (ensureMentorado) → AT-004 (AuthSync update) → AT-006 (DB constraint)
```

### Testing Strategy
1. **Unit tests**: `auth.ensureMentorado` procedure
2. **Integration tests**: Fluxo completo login → dashboard
3. **E2E tests**: Simular usuário novo em navegador
4. **Load tests**: 50 logins simultâneos

### Monitoring
- Log entries: `mentorado_created`, `mentorado_creation_failed`, `cache_hit_no_mentorado`
- Métricas: Tempo médio de criação, taxa de sucesso, cache hit ratio
- Alertas: Taxa de falha > 1%, tempo médio > 5s

---

## Rollback Plan

### Complete Rollback
```bash
# 1. Reverter código
git revert HEAD~N..HEAD

# 2. Reverter migração
bun run db:migrate:down

# 3. Reiniciar serviço
bun dev
```

### Partial Rollback (feature flag)
Se implementado com feature flag:
```typescript
// server/_core/context.ts
const ENABLE_AUTO_CREATE = process.env.ENABLE_AUTO_CREATE !== 'false';
```

Desabilitar via env var sem deploy.

---

*Plan created following R.P.I.V workflow (Research → Plan → Implement → Validate)*
*Research completed on: 2026-02-03*
*Complexity: L6 - Medium-High*
