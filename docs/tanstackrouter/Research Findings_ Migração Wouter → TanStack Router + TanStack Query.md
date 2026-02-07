# Research Findings: Migração Wouter → TanStack Router + TanStack Query

## 📊 Estado Atual do Projeto neondash

### Roteador Atual
- **Wouter v3.3.5** - Roteador leve e minimalista
- **19 arquivos** importando do Wouter
- **21 páginas** no diretório `/pages`
- Roteamento centralizado no `App.tsx` usando `<Switch>` e `<Route>`
- Lazy loading implementado para páginas pesadas

### Hooks e Componentes Wouter em Uso
1. **Route, Switch, Redirect** - Definição de rotas (App.tsx)
2. **Link** - Navegação (11 arquivos)
3. **useLocation** - Acesso à localização atual (8 arquivos)
4. **useParams** - Parâmetros de rota (1 arquivo: CallPreparation.tsx)
5. **useSearch** - Query params (1 arquivo: LeadsPage.tsx)

### TanStack Query
- ✅ **Já instalado**: `@tanstack/react-query: ^5.90.2`
- ✅ **Configurado corretamente** no `main.tsx`
- ✅ **Integrado com tRPC** usando `httpBatchLink`
- ❌ **Sem configurações de cache** (staleTime, gcTime)
- ❌ **Sem query keys padronizadas**

---

## 🎯 TanStack Router: Características Principais

### Vantagens sobre Wouter
1. **Type-Safety 100%**: Inferência completa de tipos para rotas, params, search params
2. **File-Based Routing**: Geração automática de rotas baseada em arquivos
3. **Built-in Loaders**: Pré-carregamento de dados com cache SWR integrado
4. **Search Params de Primeira Classe**: Validação, tipagem e serialização JSON
5. **Integração Nativa com TanStack Query**: SSR, streaming, dehydration/hydration
6. **Code Splitting Automático**: Otimização de bundle por rota
7. **Route Context**: Contexto tipado herdado entre rotas (ideal para auth)

### Arquitetura File-Based Routing
```
src/routes/
├── __root.tsx                    # Layout raiz + providers
├── index.tsx                     # / (LandingPage)
├── comece-aqui.tsx              # /comece-aqui (MentorshipStart)
├── primeiro-acesso.tsx          # /primeiro-acesso (PrimeiroAcesso)
├── meu-dashboard.tsx            # /meu-dashboard (MyDashboard)
├── diagnostico.tsx              # /diagnostico (DiagnosticoPage)
├── agenda.tsx                   # /agenda (AgendaPage)
├── assistente.tsx               # /assistente (OpenClawPage)
├── chat.tsx                     # /chat (ChatPage)
├── configuracoes.tsx            # /configuracoes (SettingsPage)
├── account-deletion.tsx         # /account-deletion (AccountDeletion)
├── admin/
│   ├── mentorados.tsx           # /admin/mentorados (GestaoMentorados)
│   ├── call-preparation.$mentoradoId.tsx  # /admin/call-preparation/:mentoradoId
│   └── settings.finance-coach.tsx         # /admin/settings/finance-coach
├── crm/
│   └── leads.tsx                # /crm/leads (LeadsPage)
└── financeiro/
    ├── index.tsx                # /financeiro (FinanceiroPage)
    └── analise.tsx              # /financeiro/analise (AnaliseFinanceiraPage)
```

---

## 🔗 Integração TanStack Router + TanStack Query

### Padrão Recomendado: Loader + useSuspenseQuery

**Benefícios:**
- Pré-carregamento de dados no loader (evita waterfalls)
- SSR/Streaming automático
- Cache compartilhado entre loader e componente
- Type-safety completa

**Exemplo:**
```tsx
// src/routes/meu-dashboard.tsx
import { createFileRoute } from '@tanstack/react-router'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

const userQuery = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: () => trpc.auth.me.query(),
  staleTime: 1000 * 60 * 10, // 10 min
})

export const Route = createFileRoute('/meu-dashboard')({
  // Pré-carrega dados antes de renderizar
  loader: ({ context }) => context.queryClient.ensureQueryData(userQuery),
  component: MyDashboard,
})

function MyDashboard() {
  // Lê do cache (já populado pelo loader)
  const { data: user } = useSuspenseQuery(userQuery)
  return <div>{user.name}</div>
}
```

### Streaming de Queries (Não Bloqueantes)
```tsx
export const Route = createFileRoute('/dashboard')({
  loader: ({ context }) => {
    // Não awaita - query é iniciada no servidor e streamed ao cliente
    context.queryClient.fetchQuery(heavyDataQuery)
  },
})
```

---

## 📋 Mapeamento de Migração: Wouter → TanStack Router

| Wouter | TanStack Router | Notas |
|--------|-----------------|-------|
| `<Route path="/" component={Home} />` | `createFileRoute('/')({ component: Home })` | File-based routing |
| `<Link href="/about">` | `<Link to="/about">` | Mesma API, tipagem forte |
| `useLocation()` | `useLocation()` | API similar, mais features |
| `useParams()` | `Route.useParams()` | Type-safe, validação de schema |
| `useSearch()` | `Route.useSearch()` | JSON-first, validação Zod |
| `<Redirect to="/login" />` | `redirect({ to: '/login' })` | Função, não componente |
| `<Switch>` | Roteamento automático via arquivos | Não necessário |

---

## 🛠️ Configuração Necessária

### 1. Instalação de Pacotes
```bash
bun add @tanstack/react-router @tanstack/router-plugin
bun add -D @tanstack/react-router-devtools
```

### 2. Configuração Vite (vite.config.ts)
```ts
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite(), // ANTES do plugin React
    react(),
  ],
})
```

### 3. Configuração do Router (tsr.config.json)
```json
{
  "routesDirectory": "./client/src/routes",
  "generatedRouteTree": "./client/src/routeTree.gen.ts",
  "quoteStyle": "single",
  "semicolons": false
}
```

### 4. Setup do Router (client/src/router.tsx)
```tsx
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { QueryClient } from '@tanstack/react-query'

export function createAppRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 min
        gcTime: 1000 * 60 * 10,   // 10 min
      },
    },
  })

  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
```

---

## 🚨 Pontos de Atenção

### 1. ProtectedRoute Pattern
**Wouter:**
```tsx
<ProtectedRoute>
  <MyDashboard />
</ProtectedRoute>
```

**TanStack Router:**
```tsx
// src/routes/__root.tsx
export const Route = createRootRoute({
  beforeLoad: async ({ context, location }) => {
    const { isAuthenticated } = context.auth
    if (!isAuthenticated && location.pathname !== '/') {
      throw redirect({ to: '/' })
    }
  },
})
```

### 2. DashboardLayout com Sidebar
**Solução:** Usar layout routes
```
src/routes/
├── __root.tsx           # Layout global
├── _dashboard.tsx       # Layout do dashboard (pathless)
├── _dashboard.meu-dashboard.tsx
├── _dashboard.agenda.tsx
└── _dashboard.financeiro.tsx
```

### 3. Onboarding Guard
**Implementar em `beforeLoad` do layout `_dashboard.tsx`:**
```tsx
beforeLoad: async ({ context }) => {
  const { user, queryClient } = context
  if (user.role !== 'admin') {
    const isComplete = await queryClient.ensureQueryData(onboardingQuery)
    if (!isComplete) throw redirect({ to: '/primeiro-acesso' })
  }
}
```

---

## 📦 Arquivos a Serem Modificados/Criados

### Novos Arquivos
1. `tsr.config.json` - Configuração do router
2. `client/src/router.tsx` - Setup do router
3. `client/src/routes/__root.tsx` - Layout raiz
4. `client/src/routes/_dashboard.tsx` - Layout do dashboard
5. 21 arquivos de rota em `client/src/routes/`

### Arquivos a Modificar
1. `vite.config.ts` - Adicionar plugin
2. `client/src/main.tsx` - Substituir App por RouterProvider
3. `client/src/App.tsx` - **DELETAR** (substituído por __root.tsx)
4. `package.json` - Remover wouter, adicionar @tanstack/react-router

### Arquivos a Refatorar (19 arquivos)
- Substituir imports de `wouter` por `@tanstack/react-router`
- Atualizar `Link`, `useLocation`, `useParams`, `useSearch`
- Migrar lógica de `<Redirect>` para `redirect()`

---

## ⏱️ Estimativa de Esforço

| Fase | Tarefa | Tempo Estimado |
|------|--------|----------------|
| 1 | Setup inicial (plugins, config) | 1h |
| 2 | Criar estrutura de rotas file-based | 2h |
| 3 | Migrar __root.tsx e layouts | 2h |
| 4 | Migrar 21 páginas para routes/ | 4h |
| 5 | Refatorar 19 arquivos com imports wouter | 3h |
| 6 | Configurar loaders + TanStack Query | 3h |
| 7 | Implementar guards (auth, onboarding) | 2h |
| 8 | Testes e ajustes | 3h |
| **TOTAL** | | **20h (2-3 dias)** |

---

## ✅ Checklist de Validação Pós-Migração

- [ ] Todas as rotas acessíveis via navegação
- [ ] Links funcionando corretamente
- [ ] Parâmetros de rota tipados e validados
- [ ] Search params funcionando (LeadsPage)
- [ ] Redirect de autenticação funcionando
- [ ] Onboarding guard ativo para não-admins
- [ ] Lazy loading mantido
- [ ] tRPC queries funcionando nos loaders
- [ ] Cache do TanStack Query otimizado
- [ ] DevTools do Router funcionando
- [ ] Build sem erros TypeScript
- [ ] Testes passando

---

## 🔗 Referências

- [TanStack Router Docs](https://tanstack.com/router/latest/docs)
- [TanStack Query Integration](https://tanstack.com/router/latest/docs/integrations/query)
- [Migration from React Router](https://tanstack.com/router/latest/docs/framework/react/how-to/migrate-from-react-router)
- [File-Based Routing Guide](https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing)
