# Plano de Migração: Wouter → TanStack Router

**Status**: 🟡 Análise em andamento
**Prioridade**: Alta
**Complexidade**: Média-Alta
**Data**: 21/01/2026

---

## 1. Análise de Contexto

### Stack Atual
- **Router**: Wouter 3.7.1 (com patch customizado `patches/wouter@3.7.1.patch`)
- **Framework**: React 19.2 + Vite 7
- **Backend**: tRPC 11 + Express + Neon PostgreSQL
- **Auth**: Clerk
- **State**: TanStack Query 5
- **Package Manager**: Bun 1.3+

### Uso Atual do Wouter (6 arquivos)
| Arquivo | Hooks/Componentes | Propósito |
|---------|------------------|-----------|
| `client/src/App.tsx` | `<Route>`, `<Switch>` | Definição de rotas |
| `client/src/components/DashboardLayout.tsx` | `<Link>`, `useLocation`, `<Redirect>` | Navegação dashboard |
| `client/src/components/auth/ProtectedRoute.tsx` | `<Redirect>` | Redirecionamento login |
| `client/src/pages/LandingPage.tsx` | `useLocation` | URL tracking |
| `client/src/pages/MyDashboard.tsx` | `useLocation` | URL tracking |
| `client/src/pages/NotFound.tsx` | `useLocation` | URL tracking |

### Patch Customizado no Wouter
```diff
diff --git a/esm/index.js b/esm/index.js
@@ -338,6 +338,23 @@ const Switch = ({ children, location }) => {
+  // Collect all route paths to window object
+  if (typeof window !== 'undefined') {
+    if (!window.__WOUTER_ROUTES__) {
+      window.__WOUTER_ROUTES__ = [];
+    }
+    ...
```

**Propósito do patch**: Expor lista de rotas em `window.__WOUTER_ROUTES__` provavelmente para auditoria/análise dinâmica.

---

## 2. Comparação Wouter vs TanStack Router

| Feature | Wouter (Atual) | TanStack Router | Impacto NEON |
|---------|---------------|-----------------|--------------|
| **Bundle Size** | ~3KB gzipped | ~18KB gzipped | ⚠️ +15KB |
| **Type Safety** | Básico (params) | Full (rotas/params/search) | ✅ Upgrade |
| **Loaders** | ❌ Não nativo | ✅ Integrado | ✅ Upgrade |
| **tRPC Integration** | Manual (hooks) | Nativo (context) | ✅ Upgrade |
| **Search Params** | String parsing | Zod schema + typed | ✅ Upgrade |
| **Route Preloading** | Manual | Automático (`intent`) | ✅ Upgrade |
| **File-based Routing** | ❌ Apenas code-based | ✅ Ambos | ✅ Flexibilidade |
| **DevTools** | ❌ Não | ✅ Router DevTools | ✅ DX |
| **Learning Curve** | Baixa | Alta | ⚠️ Temporário |
| **Community/Maintenance** | Medium | Alta | ✅ Melhor |
| **SSR Support** | Básico | Avançado | ⚠️ Não usado |

---

## 3. Benefícios da Migração para NEON

### ✅ Benefícios Claros
1. **Type-Safety Radical**: Rotas, params e search params 100% tipados
2. **Data Fetching Orquestrado**: Loaders integrados com tRPC para pré-carregar dados
3. **Search Params Profissionais**: Filtros, ordenação, paginação com validação Zod
4. **Route Preloading**: Hover em links → pré-carregamento de tRPC queries + componentes
5. **DevTools**: Debug visual de rotas, loaders, navigation events
6. **Melhor DX Codebase**: Elimina o patch customizado do Wouter

### ⚠️ Trade-offs
1. **Bundle +15KB**: Impacto mínimo em app já carregado (shadcn/ui + tRPC já >200KB)
2. **Learning Curve**: Equipe precisa aprender API do TanStack Router (2-3 dias)
3. **Refactoring**: ~6-8 horas de migração codebase
4. **Boilerplate**: Código ligeiramente mais verboso

---

## 4. Recomendação: ✅ **FAZER MIGRAÇÃO**

### Justificativa

**Sim, vale a pena migrar** pelas seguintes razões:

1. **Stack Alinhada**: NEON já usa TanStack Query + tRPC → TanStack Router naturalmente se encaixa ("TanStack Ecosystem")
2. **Complexidade Justificada**: Dashboard com 16 rotas, filtros, lazy loading, auth → beneficia de loaders + preloading
3. **Elimina Técnica Debt**: Patch customizado no Wouter é anti-pattern e quebrará em updates
4. **Features Valiosas**:
   - Loaders para pré-carregar tRPC queries antes de renderizar (`trpc.mentorados.list.useQuery()`)
   - Search params tipados para filtros (dashboard por mÊs, ano, turma)
   - Route preloading para SPA instantâneo
5. **Futuro-Proof**: TanStack Router é o padrão emergente para React SPA complexas

### Quando NÃO Migrar
- Se NEON fosse app ultra-simples (<5 rotas, sem filtros, sem tRPC)
- Se bundle size fosse critical constraint (PWA <50KB)
- Se timeline fosse extremamente apertada (entrega <3 dias)

**Para NEON**: Nenhuma das condições acima aplica → **Prosseguir**.

---

## 5. Plano de Migração

### Fase 1: Setup (30 min)
```bash
# Instalar TanStack Router
bun add @tanstack/react-router @tanstack/router-devtools

# Configurar Vite plugin
bun add -d @tanstack/router-plugin
```

### Fase 2: Configuração Base (1h)
1. Criar `client/src/router.tsx` com `createRouter`
2. Registrar tRPC no router context
3. Configurar `vite.config.ts` com `@tanstack/router-plugin`
4. Registrar types (`declare module '@tanstack/react-router'`)

### Fase 3: Migração de Rotas (2-3h)
**Estrutura recomendada**:
```
client/src/routes/          # File-based (optional)
├── __root.tsx             # Layout root
├── index.tsx              # Landing page (/)
├── dashboard.tsx           # Dashboard (/dashboard)
├── meu-dashboard.tsx      # Meu Dashboard (/meu-dashboard)
├── admin.tsx              # Admin (/admin)
├── admin.vincular.tsx     # Vincular Emails (/admin/vincular)
└── ...
```

**Mapeamento Wouter → TanStack**:
| Wouter | TanStack Router |
|--------|-----------------|
| `<Route path="/" component={Home} />` | `client/src/routes/index.tsx` |
| `useLocation()` | `Route.useLoaderData()` (params) |
| `useNavigate()` | `useNavigate()` (mesmo) |
| `<Redirect to="/" />` | `redirect('/')` (function) |
| `<Switch>` | (file-based routing automático) |

### Fase 4: Ajuste de Componentes (1-2h)
| Arquivo | Mudanças |
|---------|----------|
| `App.tsx` | Substituir `<Switch>` por `<RouterProvider />` |
| `DashboardLayout.tsx` | Substituir `<Link>` por `<Link from="/dashboard" to="/dashboard">` |
| `ProtectedRoute.tsx` | Substituir `<Redirect>` por `throw redirect()` |
| Pages | Ajustar `useLocation()` → `Route.useLocation()` |

### Fase 5: Implementar Loaders (2-3h)
**Exemplo**: `/dashboard` com loader tRPC
```typescript
// client/src/routes/dashboard.tsx
import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '@/lib/trpc'

export const Route = createFileRoute('/dashboard')({
  loader: async ({ context: { trpc } }) => {
    return { mentorados: await trpc.mentorados.list.fetch() }
  },
  component: Dashboard,
})

function Dashboard() {
  const { mentorados } = Route.useLoaderData()
  return <div>...</div>
}
```

### Fase 6: Search Params Tipados (1h)
**Exemplo**: Filtros dashboard
```typescript
// client/src/routes/comparativo.tsx
import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'

const searchSchema = z.object({
  ano: z.coerce.number().default(new Date().getFullYear()),
  mes: z.coerce.number().default(new Date().getMonth() + 1),
  turma: z.enum(['neon_estrutura', 'neon_escala']).optional(),
})

export const Route = createFileRoute('/comparativo')({
  validateSearch: searchSchema,
  loader: async ({ context: { trpc }, searchParams }) => {
    return { dados: await trpc.metricas.byPeriod.fetch(searchParams) }
  },
})
```

### Fase 7: Remover Wouter & Patch (15 min)
```bash
# Remover Wouter e patch
bun remove wouter
rm patches/wouter@3.7.1.patch

# Limpar imports
grep -r "from 'wouter'" client/src --delete  # Manual
```

### Fase 8: Testes & Validação (1h)
- [ ] Todas rotas funcionando
- [ ] Auth (Clerk) redirecionando
- [ ] Layout dashboard ativo
- [ ] Lazy loading operacional
- [ ] tRPC carregando via loaders
- [ ] Search params trabalhando
- [ ] Mobile menu funcional

---

## 6. Prompt para Antigravity (Migração)

Copie e execute este prompt:

```markdown
# TASK: Migrate Wouter to TanStack Router

## Context
- Project: NEON Dashboard (React 19 + Vite 7 + tRPC 11 + Bun)
- Current Router: Wouter 3.7.1 (with custom patch)
- Target: TanStack Router with tRPC integration

## Scope
1. Install & configure @tanstack/react-router
2. Migrate all 16 routes from wouter to TanStack Router (file-based)
3. Preserve existing features:
   - Lazy loading with React.lazy()
   - Auth protection (Clerk)
   - Dashboard Layout with navigation
   - Custom NotFound page

4. Implement loaders for data fetching:
   - /dashboard → trpc.mentorados.list
   - /meu-dashboard → trpc.mentorados.getMine
   - /comparativo → trpc.metrics.byPeriod (with search params)

5. Add typed search params with Zod:
   - /comparativo → { ano, mes, turma }
   - /ranking → { ano, mes }

6. Remove Wouter and custom patch (patches/wouter@3.7.1.patch)

## Requirements
- Use file-based routing (client/src/routes/)
- Register tRPC client in router context
- Keep existing UI components unchanged
- Maintain mobile responsiveness
- All tests must pass: bun test && bun run check

## Files to Modify
- client/src/App.tsx (replace <Switch> with <RouterProvider />)
- client/src/router.tsx (new, create router instance)
- client/src/routes/* (new, file-based routes)
- client/src/components/DashboardLayout.tsx (update Link components)
- client/src/components/auth/ProtectedRoute.tsx (update Redirect)
- client/src/vite.config.ts (add @tanstack/router-plugin)

## References
- TanStack Router + tRPC: https://tanstack.com/router/v1/docs/framework/react/examples/with-trpc
- File-based routing: https://tanstack.com/router/v1/docs/framework/react/guide/file-based-routing
- Loaders: https://tanstack.com/router/v1/docs/framework/react/guide/data-loading

## Validation Criteria
✅ All routes navigable
✅ tRPC queries working via loaders
✅ Auth protection functional (Clerk)
✅ Search params typed + validated
✅ No build errors (bun run check)
✅ No Wouter remains in dependencies
```

---

## 7. Timeline Estimada

| Fase | Tempo | Responsável |
|------|-------|-------------|
| Setup | 30 min | Dev |
| Configuração | 1h | Dev |
| Migração Rotas | 2-3h | Dev |
| Ajuste Componentes | 1-2h | Dev |
| Loaders | 2-3h | Dev |
| Search Params | 1h | Dev |
| Limpeza Wouter | 15 min | Dev |
| Testes | 1h | QA |
| **Total** | **9-11.5h** | ~1.5-2 dias |

---

## 8. Riscos e Mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|----------|-----------|
| Bugs em rotas complexas | Média | Alto | Testes manuais em cada rota |
| Loaders duplicando queries | Baixa | Médio | Reuse hooks existentes (`useFeature`) |
| Search params schema errors | Baixa | Médio | Validar com Zod |
| Breaking changes em tipos | Baixa | Alto | Backup do branch antes |

---

## 9. Next Steps

- [ ] Aprovar plano
- [ ] Executar prompt Antigravity
- [ ] Testar migração
- [ ] Remover Wouter
- [ ] Documentar changelog

---

**Anexo**: Comparação de downloads NPM (últimos 365 dias)
- Wouter: ~150K downloads/semana
- TanStack Router: ~600K downloads/semana
- Tendência: TanStack crescendo 30%+ YoY
