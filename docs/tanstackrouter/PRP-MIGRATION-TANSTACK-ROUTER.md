# ═══════════════════════════════════════════════════════════════════════════════
# PRP: Migração Wouter → TanStack Router + TanStack Query
# Goal: Migração completa e funcional em uma única execução
# ═══════════════════════════════════════════════════════════════════════════════

metadata:
  complexity: "L9 - Migração de sistema de roteamento com 21 páginas e 19 componentes"
  estimated_time: "20 horas (2-3 dias)"
  parallel_safe: false
  project: "neondash"
  branch: "dev-test"

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1: ROLE & OBJECTIVE
# ─────────────────────────────────────────────────────────────────────────────
role: "Senior Full-Stack Developer especializado em React Router Migration"
expertise_areas:
  - "TanStack Router (file-based routing, loaders, type-safety)"
  - "TanStack Query (cache, SSR, dehydration/hydration)"
  - "React 19 + TypeScript"
  - "tRPC integration"
  - "Vite build system"

objective:
  task: "Migrar completamente o sistema de roteamento de Wouter para TanStack Router, integrando com TanStack Query"
  context: "Dashboard SaaS de gestão de mentorados, usando React 19, tRPC, Clerk Auth, Vite"
  success_criteria:
    - "Todas as 21 páginas migradas para file-based routing"
    - "Todos os 19 componentes refatorados para usar TanStack Router"
    - "Loaders implementados para pré-carregamento de dados"
    - "Guards de autenticação e onboarding funcionando"
    - "Type-safety completa em rotas, params e search params"
    - "Build sem erros TypeScript"
    - "Todos os testes passando"

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2: CODEBASE CONTEXT
# ─────────────────────────────────────────────────────────────────────────────

## Estrutura Atual do Projeto

```
neondash/
├── client/
│   └── src/
│       ├── App.tsx                    # ❌ DELETAR após migração
│       ├── main.tsx                   # ✏️ MODIFICAR (RouterProvider)
│       ├── pages/                     # 📦 MIGRAR para routes/
│       │   ├── LandingPage.tsx
│       │   ├── MyDashboard.tsx
│       │   ├── PrimeiroAcesso.tsx
│       │   ├── ... (18 páginas)
│       ├── components/
│       │   ├── DashboardLayout.tsx    # ✏️ REFATORAR
│       │   ├── auth/
│       │   │   └── ProtectedRoute.tsx # ✏️ REFATORAR
│       │   ├── ... (17 componentes)
│       └── lib/
│           └── trpc.ts                # ✅ MANTER
├── vite.config.ts                     # ✏️ MODIFICAR (plugin)
└── package.json                       # ✏️ MODIFICAR (deps)
```

## Roteamento Atual (Wouter)

**Arquivo:** `client/src/App.tsx`

```tsx
<Switch>
  <Route path="/" component={LandingPage} />
  <Route path="/comece-aqui" component={MentorshipStart} />
  <Route path="/primeiro-acesso" component={PrimeiroAcesso} />
  <Route path="/meu-dashboard" component={MyDashboard} />
  <Route path="/admin/mentorados" component={GestaoMentorados} />
  <Route path="/admin/call-preparation/:mentoradoId" component={CallPreparation} />
  <Route path="/crm/leads" component={LeadsPage} />
  <Route path="/financeiro" component={FinanceiroPage} />
  <Route path="/financeiro/analise" component={AnaliseFinanceiraPage} />
  {/* ... 12 rotas adicionais */}
</Switch>
```

## Componentes Usando Wouter (19 arquivos)

1. `client/src/App.tsx` - `Route, Switch, Redirect`
2. `client/src/components/DashboardLayout.tsx` - `Link, Redirect, useLocation`
3. `client/src/components/auth/ProtectedRoute.tsx` - `Redirect`
4. `client/src/components/admin/MenteeManagementView.tsx` - `Link`
5. `client/src/components/agenda/NeonWeeklyCalendar.tsx` - `Link`
6. `client/src/components/chat/LeadChatWindow.tsx` - `Link`
7. `client/src/components/dashboard/SubmitMetricsForm.tsx` - `useLocation`
8. `client/src/components/financeiro/cards/NeonCoachCard.tsx` - `useLocation`
9. `client/src/components/landing/MentorshipContent.tsx` - `Link`
10. `client/src/components/mentor/CallNotesForm.tsx` - `useLocation`
11. `client/src/components/ui/sidebar.tsx` - `Link`
12. `client/src/pages/CallPreparation.tsx` - `Link, useParams`
13. `client/src/pages/ChatPage.tsx` - `Link`
14. `client/src/pages/Diagnostico.tsx` - `useLocation`
15. `client/src/pages/LandingPage.tsx` - `useLocation`
16. `client/src/pages/MentorshipStart.tsx` - `Link`
17. `client/src/pages/NotFound.tsx` - `useLocation`
18. `client/src/pages/PrimeiroAcesso.tsx` - `useLocation`
19. `client/src/pages/crm/LeadsPage.tsx` - `useSearch`

## TanStack Query - Configuração Atual

**Arquivo:** `client/src/main.tsx`

```tsx
const queryClient = new QueryClient()

// ❌ SEM configurações de cache otimizadas
// ❌ SEM query keys padronizadas
```

## Padrões de Autenticação

- **Clerk Auth** para autenticação
- **ProtectedRoute** wrapper para rotas privadas
- **Onboarding guard** para mentorados não-admins
- **Role-based access** (admin vs mentorado)

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3: IMPLEMENTATION PLAN (ATOMIC TASKS)
# ─────────────────────────────────────────────────────────────────────────────

## FASE 1: Setup e Configuração Inicial

### AT-001: Instalar Dependências

**Objetivo:** Adicionar TanStack Router e plugins necessários.

**Comandos:**
```bash
cd /home/ubuntu/neondash
bun add @tanstack/react-router
bun add -D @tanstack/router-plugin @tanstack/react-router-devtools
```

**Validação:**
```bash
bun install
grep "@tanstack/react-router" package.json
```

**Rollback:**
```bash
bun remove @tanstack/react-router @tanstack/router-plugin @tanstack/react-router-devtools
```

---

### AT-002: Configurar Vite Plugin

**Objetivo:** Adicionar o plugin do TanStack Router ao Vite para gerar rotas automaticamente.

**Arquivo:** `vite.config.ts`

**Modificação:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite(), // ⚠️ DEVE vir ANTES do plugin React
    react(),
  ],
  // ... resto da config
})
```

**Validação:**
```bash
bun run build
# Deve compilar sem erros
```

**Rollback:**
Remover a linha `TanStackRouterVite()` do array de plugins.

---

### AT-003: Criar `tsr.config.json`

**Objetivo:** Configurar o gerador de rotas file-based.

**Arquivo:** `tsr.config.json` (raiz do projeto)

**Conteúdo:**
```json
{
  "routesDirectory": "./client/src/routes",
  "generatedRouteTree": "./client/src/routeTree.gen.ts",
  "quoteStyle": "single",
  "semicolons": false
}
```

**Validação:**
```bash
cat tsr.config.json
```

**Rollback:**
```bash
rm tsr.config.json
```

---

### AT-004: Criar Setup do Router

**Objetivo:** Criar o arquivo de configuração do router com QueryClient integrado.

**Arquivo:** `client/src/router.tsx` (NOVO)

**Conteúdo:**
```typescript
import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'

export function createAppRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,        // 5 minutos
        gcTime: 1000 * 60 * 10,          // 10 minutos (antes cacheTime)
        refetchOnWindowFocus: false,     // Evita refetch desnecessário
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
      },
    },
  })

  const router = createRouter({
    routeTree,
    context: {
      queryClient,
    },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  return { router, queryClient }
}

// Declaração de tipo para TypeScript
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>['router']
  }
}
```

**Validação:**
```bash
bun run check
# Deve compilar sem erros TypeScript
```

**Rollback:**
```bash
rm client/src/router.tsx
```

---

### AT-005: Atualizar `main.tsx` com `RouterProvider`

**Objetivo:** Substituir o componente `<App />` pelo `<RouterProvider>`.

**Arquivo:** `client/src/main.tsx`

**Modificação:**
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { createAppRouter } from './router'
import './index.css'

const { router, queryClient } = createAppRouter()

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>
)
```

**Validação:**
```bash
bun run dev
# Deve iniciar sem erros (mesmo que ainda não tenha rotas)
```

**Rollback:**
Reverter para o código anterior com `<App />`.

---

## FASE 2: Migração da Estrutura Core

### AT-006: Criar Layout Raiz (`__root.tsx`)

**Objetivo:** Criar o layout raiz que envolve todas as rotas.

**Arquivo:** `client/src/routes/__root.tsx` (NOVO)

**Conteúdo:**
```typescript
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthSync } from '@/components/auth/AuthSync'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <AuthSync />
          <Outlet />
          {import.meta.env.DEV && <TanStackRouterDevtools />}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
```

**Validação:**
```bash
bun run dev
# Layout raiz deve renderizar
```

**Rollback:**
```bash
rm client/src/routes/__root.tsx
```

---

### AT-007: Criar Layout do Dashboard (`_dashboard.tsx`)

**Objetivo:** Criar um layout pathless para rotas do dashboard (com sidebar).

**Arquivo:** `client/src/routes/_dashboard.tsx` (NOVO)

**Conteúdo:**
```typescript
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/_core/hooks/useAuth'

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: async ({ context, location }) => {
    // Guard de autenticação
    const { isAuthenticated, loading } = useAuth()
    
    if (!loading && !isAuthenticated) {
      throw redirect({
        to: '/',
        search: {
          redirect: location.href,
        },
      })
    }

    // Guard de onboarding (apenas para não-admins)
    const { user } = useAuth()
    const isOnboardingExemptRoute =
      location.pathname.startsWith('/primeiro-acesso') ||
      location.pathname.startsWith('/diagnostico')

    if (user && user.role !== 'admin' && !isOnboardingExemptRoute) {
      const isOnboardingComplete = await context.queryClient.ensureQueryData({
        queryKey: ['mentorados', 'onboarding-complete'],
        queryFn: () => context.trpc.mentorados.isOnboardingComplete.query(),
      })

      if (!isOnboardingComplete) {
        throw redirect({ to: '/primeiro-acesso' })
      }
    }
  },
  component: DashboardLayoutWrapper,
})

function DashboardLayoutWrapper() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}
```

**Validação:**
```bash
bun run dev
# Layout do dashboard deve renderizar para rotas protegidas
```

**Rollback:**
```bash
rm client/src/routes/_dashboard.tsx
```

---

### AT-008: Implementar Guards de Autenticação

**Objetivo:** Garantir que os guards de autenticação e onboarding funcionem corretamente.

**Ação:** Já implementado no AT-007 via `beforeLoad`.

**Validação:**
- Acessar rota protegida sem autenticação → redireciona para `/`
- Acessar rota protegida como mentorado sem onboarding → redireciona para `/primeiro-acesso`

**Rollback:**
Remover a função `beforeLoad` do layout `_dashboard.tsx`.

---

## FASE 3: Migração de Páginas (21 páginas)

### Estrutura de Rotas File-Based

```
client/src/routes/
├── __root.tsx                              # Layout raiz
├── _dashboard.tsx                          # Layout do dashboard (pathless)
├── index.tsx                               # / (LandingPage)
├── comece-aqui.tsx                         # /comece-aqui
├── primeiro-acesso.tsx                     # /primeiro-acesso
├── _dashboard.meu-dashboard.tsx            # /meu-dashboard
├── _dashboard.diagnostico.tsx              # /diagnostico
├── _dashboard.agenda.tsx                   # /agenda
├── _dashboard.assistente.tsx               # /assistente
├── _dashboard.chat.tsx                     # /chat
├── _dashboard.configuracoes.tsx            # /configuracoes
├── _dashboard.vincular-emails.tsx          # /vincular-emails
├── account-deletion.tsx                    # /account-deletion (público)
├── _dashboard.admin/
│   ├── mentorados.tsx                      # /admin/mentorados
│   ├── call-preparation.$mentoradoId.tsx   # /admin/call-preparation/:mentoradoId
│   └── settings.finance-coach.tsx          # /admin/settings/finance-coach
├── _dashboard.crm/
│   └── leads.tsx                           # /crm/leads
└── _dashboard.financeiro/
    ├── index.tsx                           # /financeiro
    └── analise.tsx                         # /financeiro/analise
```

### AT-009: Migrar `LandingPage` (Rota Pública)

**Arquivo:** `client/src/routes/index.tsx` (NOVO)

**Conteúdo:**
```typescript
import { createFileRoute } from '@tanstack/react-router'
import LandingPage from '@/pages/LandingPage'

export const Route = createFileRoute('/')({
  component: LandingPage,
})
```

**Validação:**
```bash
curl http://localhost:5173/
# Deve retornar a página de landing
```

**Rollback:**
```bash
rm client/src/routes/index.tsx
```

---

### AT-010 a AT-029: Migrar Páginas Restantes

**Padrão para Rotas Protegidas (com Dashboard Layout):**

**Exemplo:** `client/src/routes/_dashboard.meu-dashboard.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import MyDashboard from '@/pages/MyDashboard'

// Query options para pré-carregamento
const userQuery = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: () => trpc.auth.me.query(),
  staleTime: 1000 * 60 * 10, // 10 min
})

export const Route = createFileRoute('/_dashboard/meu-dashboard')({
  // Pré-carrega dados antes de renderizar
  loader: ({ context }) => context.queryClient.ensureQueryData(userQuery),
  component: MyDashboard,
})
```

**Padrão para Rotas com Parâmetros:**

**Exemplo:** `client/src/routes/_dashboard.admin.call-preparation.$mentoradoId.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'
import CallPreparation from '@/pages/CallPreparation'

export const Route = createFileRoute('/_dashboard/admin/call-preparation/$mentoradoId')({
  component: CallPreparation,
})

// No componente CallPreparation.tsx:
// const { mentoradoId } = Route.useParams()
```

**Lista de Páginas a Migrar:**

| ID | Página | Rota File-Based | Público/Protegido |
|----|--------|-----------------|-------------------|
| AT-010 | MentorshipStart | `comece-aqui.tsx` | Público |
| AT-011 | PrimeiroAcesso | `primeiro-acesso.tsx` | Público |
| AT-012 | MyDashboard | `_dashboard.meu-dashboard.tsx` | Protegido |
| AT-013 | GestaoMentorados | `_dashboard.admin.mentorados.tsx` | Protegido (Admin) |
| AT-014 | CallPreparation | `_dashboard.admin.call-preparation.$mentoradoId.tsx` | Protegido (Admin) |
| AT-015 | LeadsPage | `_dashboard.crm.leads.tsx` | Protegido |
| AT-016 | FinanceiroPage | `_dashboard.financeiro.index.tsx` | Protegido |
| AT-017 | AnaliseFinanceiraPage | `_dashboard.financeiro.analise.tsx` | Protegido |
| AT-018 | DiagnosticoPage | `_dashboard.diagnostico.tsx` | Protegido |
| AT-019 | AgendaPage | `_dashboard.agenda.tsx` | Protegido |
| AT-020 | SettingsPage | `_dashboard.configuracoes.tsx` | Protegido |
| AT-021 | ChatPage | `_dashboard.chat.tsx` | Protegido |
| AT-022 | OpenClawPage | `_dashboard.assistente.tsx` | Protegido |
| AT-023 | VincularEmails | `_dashboard.vincular-emails.tsx` | Protegido |
| AT-024 | FinancialCoachSettings | `_dashboard.admin.settings.finance-coach.tsx` | Protegido (Admin) |
| AT-025 | AccountDeletion | `account-deletion.tsx` | Público |
| AT-026 | NotFound | `404.tsx` | Público |
| AT-027 | ComponentShowcase | `_dashboard.showcase.tsx` | Protegido (Dev) |

**Validação para Cada Página:**
```bash
bun run dev
# Navegar para a rota e verificar renderização
```

**Rollback:**
Deletar o arquivo de rota correspondente.

---

## FASE 4: Refatoração de Componentes (19 componentes)

### AT-030: Refatorar `DashboardLayout.tsx`

**Arquivo:** `client/src/components/DashboardLayout.tsx`

**Modificações:**
```typescript
// ❌ ANTES
import { Link, Redirect, useLocation } from "wouter";

// ✅ DEPOIS
import { Link, redirect, useLocation } from "@tanstack/react-router";

// ❌ ANTES
if (!user) {
  return <Redirect to="/" />;
}

// ✅ DEPOIS
if (!user) {
  throw redirect({ to: '/' });
}

// ❌ ANTES
<Link href="/dashboard">

// ✅ DEPOIS
<Link to="/dashboard">
```

**Validação:**
```bash
bun run check
bun run dev
# Sidebar deve renderizar e navegar corretamente
```

**Rollback:**
Reverter imports e código para `wouter`.

---

### AT-031 a AT-048: Refatorar Componentes Restantes

**Padrão de Refatoração:**

1. **Substituir imports:**
   ```typescript
   // ❌ ANTES
   import { Link, useLocation, useParams, useSearch, Redirect } from "wouter";
   
   // ✅ DEPOIS
   import { Link, useLocation, useParams, useSearch, redirect } from "@tanstack/react-router";
   ```

2. **Atualizar `<Link>`:**
   ```typescript
   // ❌ ANTES
   <Link href="/about">About</Link>
   
   // ✅ DEPOIS
   <Link to="/about">About</Link>
   ```

3. **Substituir `<Redirect>` por `redirect()`:**
   ```typescript
   // ❌ ANTES
   return <Redirect to="/login" />;
   
   // ✅ DEPOIS
   throw redirect({ to: '/login' });
   ```

4. **Atualizar `useParams()` (se tipado):**
   ```typescript
   // ❌ ANTES
   const { mentoradoId } = useParams();
   
   // ✅ DEPOIS
   const { mentoradoId } = Route.useParams();
   ```

5. **Atualizar `useSearch()` (se usado):**
   ```typescript
   // ❌ ANTES
   const search = useSearch();
   const query = new URLSearchParams(search).get('q');
   
   // ✅ DEPOIS
   const { q } = Route.useSearch();
   ```

**Lista de Componentes a Refatorar:**

| ID | Componente | Hooks/Componentes Wouter |
|----|------------|--------------------------|
| AT-031 | `MenteeManagementView.tsx` | `Link` |
| AT-032 | `NeonWeeklyCalendar.tsx` | `Link` |
| AT-033 | `ProtectedRoute.tsx` | `Redirect` |
| AT-034 | `LeadChatWindow.tsx` | `Link` |
| AT-035 | `SubmitMetricsForm.tsx` | `useLocation` |
| AT-036 | `NeonCoachCard.tsx` | `useLocation` |
| AT-037 | `MentorshipContent.tsx` | `Link` |
| AT-038 | `CallNotesForm.tsx` | `useLocation` |
| AT-039 | `sidebar.tsx` | `Link` |
| AT-040 | `CallPreparation.tsx` | `Link, useParams` |
| AT-041 | `ChatPage.tsx` | `Link` |
| AT-042 | `Diagnostico.tsx` | `useLocation` |
| AT-043 | `LandingPage.tsx` | `useLocation` |
| AT-044 | `MentorshipStart.tsx` | `Link` |
| AT-045 | `NotFound.tsx` | `useLocation` |
| AT-046 | `PrimeiroAcesso.tsx` | `useLocation` |
| AT-047 | `LeadsPage.tsx` | `useSearch` |

**Validação para Cada Componente:**
```bash
bun run check
# Deve compilar sem erros TypeScript
```

**Rollback:**
Reverter imports e código para `wouter`.

---

## FASE 5: Integração e Otimização com TanStack Query

### AT-049: Implementar Loaders nas Rotas

**Objetivo:** Pré-carregar dados críticos usando `loader` nas rotas.

**Exemplo:** `client/src/routes/_dashboard.meu-dashboard.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { queryOptions } from '@tanstack/react-query'

const userQuery = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: () => trpc.auth.me.query(),
  staleTime: 1000 * 60 * 10,
})

const mentoradoQuery = (userId: number) =>
  queryOptions({
    queryKey: ['mentorados', 'me', userId],
    queryFn: () => trpc.mentorados.me.query(),
    staleTime: 1000 * 60 * 5,
  })

export const Route = createFileRoute('/_dashboard/meu-dashboard')({
  loader: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(userQuery)
    if (user.role !== 'admin') {
      await context.queryClient.ensureQueryData(mentoradoQuery(user.id))
    }
  },
  component: MyDashboard,
})
```

**Rotas que Precisam de Loaders:**
- `/meu-dashboard` - Dados do usuário e mentorado
- `/admin/mentorados` - Lista de mentorados
- `/admin/call-preparation/:mentoradoId` - Dados do mentorado específico
- `/crm/leads` - Lista de leads
- `/financeiro` - Dados financeiros
- `/financeiro/analise` - Análise financeira
- `/diagnostico` - Dados do diagnóstico
- `/agenda` - Eventos da agenda

**Validação:**
```bash
bun run dev
# Navegar para cada rota e verificar que dados são carregados antes da renderização
```

**Rollback:**
Remover a função `loader` das rotas.

---

### AT-050: Refatorar Componentes para `useSuspenseQuery`

**Objetivo:** Substituir `useQuery` por `useSuspenseQuery` para melhor integração com loaders.

**Exemplo:** `client/src/pages/MyDashboard.tsx`

```typescript
// ❌ ANTES
const { data: user, isLoading } = trpc.auth.me.useQuery();

if (isLoading) return <div>Carregando...</div>;

// ✅ DEPOIS
const { data: user } = useSuspenseQuery(userQuery);
// Dados já estão disponíveis (pré-carregados pelo loader)
```

**Validação:**
```bash
bun run check
bun run dev
# Componentes devem renderizar sem loading states
```

**Rollback:**
Reverter para `useQuery` com `isLoading`.

---

### AT-051: Otimizar `QueryClient` (Já Feito no AT-004)

**Objetivo:** Configurar `staleTime` e `gcTime` no `QueryClient`.

**Ação:** Já implementado no AT-004.

**Validação:**
Verificar que as configurações estão aplicadas em `client/src/router.tsx`.

---

### AT-052: Criar Query Keys Padronizadas

**Objetivo:** Padronizar query keys para melhor invalidação e type-safety.

**Arquivo:** `client/src/lib/queryKeys.ts` (NOVO)

**Conteúdo:**
```typescript
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  mentorados: {
    all: ['mentorados'] as const,
    lists: () => [...queryKeys.mentorados.all, 'list'] as const,
    byId: (id: number) => [...queryKeys.mentorados.all, 'byId', id] as const,
    me: (userId: number) => [...queryKeys.mentorados.all, 'me', userId] as const,
    onboardingComplete: () => [...queryKeys.mentorados.all, 'onboarding-complete'] as const,
  },
  diagnostico: {
    all: ['diagnostico'] as const,
    byMentorado: (id: number) => [...queryKeys.diagnostico.all, id] as const,
  },
  leads: {
    all: ['leads'] as const,
    list: (filters?: any) => [...queryKeys.leads.all, 'list', filters] as const,
  },
  financeiro: {
    all: ['financeiro'] as const,
    dashboard: () => [...queryKeys.financeiro.all, 'dashboard'] as const,
    analise: () => [...queryKeys.financeiro.all, 'analise'] as const,
  },
  agenda: {
    all: ['agenda'] as const,
    events: () => [...queryKeys.agenda.all, 'events'] as const,
  },
} as const
```

**Validação:**
```bash
bun run check
# Deve compilar sem erros TypeScript
```

**Rollback:**
```bash
rm client/src/lib/queryKeys.ts
```

---

## FASE 6: Limpeza e Validação Final

### AT-053: Remover Wouter das Dependências

**Objetivo:** Remover o pacote `wouter` do projeto.

**Comandos:**
```bash
cd /home/ubuntu/neondash
bun remove wouter
```

**Validação:**
```bash
grep "wouter" package.json
# Não deve retornar nada
```

**Rollback:**
```bash
bun add wouter@^3.3.5
```

---

### AT-054: Deletar `client/src/App.tsx`

**Objetivo:** Remover o arquivo antigo de roteamento.

**Comandos:**
```bash
rm client/src/App.tsx
```

**Validação:**
```bash
bun run build
# Deve compilar sem erros
```

**Rollback:**
```bash
git checkout client/src/App.tsx
```

---

### AT-055: Executar Checklist de Validação Final

**Objetivo:** Garantir que todas as funcionalidades estão operacionais.

**Checklist:**

- [ ] Todas as rotas estão acessíveis e renderizam corretamente
- [ ] A navegação entre páginas via `<Link>` funciona
- [ ] Parâmetros de rota (e.g., `/admin/call-preparation/:mentoradoId`) são lidos corretamente
- [ ] Query params (e.g., na página de Leads) são lidos e atualizados corretamente
- [ ] O redirecionamento de usuários não autenticados para a página de login está funcionando
- [ ] O `onboarding guard` está ativo e redirecionando usuários não-admins que não completaram o onboarding
- [ ] O lazy loading das páginas continua funcional
- [ ] As queries do tRPC estão sendo executadas corretamente dentro dos `loaders` das rotas
- [ ] As configurações de `staleTime` e `gcTime` estão otimizando o cache do TanStack Query
- [ ] Os DevTools do TanStack Router estão ativos e funcionando em ambiente de desenvolvimento
- [ ] O projeto compila sem erros de TypeScript (`bun run check`)
- [ ] Todos os testes unitários e de integração estão passando (`bun test`)
- [ ] O build de produção é gerado com sucesso (`bun run build`)

**Validação:**
```bash
bun run check
bun test
bun run build
```

**Rollback:**
Analisar e corrigir os pontos que falharam.

---

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4: VALIDATION & ROLLBACK
# ─────────────────────────────────────────────────────────────────────────────

## Comandos de Validação

```bash
# TypeScript check
bun run check

# Testes
bun test

# Build de produção
bun run build

# Servidor de desenvolvimento
bun run dev
```

## Estratégia de Rollback

Cada tarefa atômica possui um plano de rollback específico. Em caso de falha crítica:

```bash
# Reverter todas as mudanças
git reset --hard HEAD

# Ou reverter para um commit específico
git reset --hard <commit-hash>

# Reinstalar wouter se necessário
bun add wouter@^3.3.5
```

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 5: EDGE CASES & GOTCHAS
# ─────────────────────────────────────────────────────────────────────────────

## Edge Cases Identificados

1. **Redirect vs Redirect Component**
   - Wouter usa `<Redirect to="/" />`
   - TanStack Router usa `throw redirect({ to: '/' })`
   - ⚠️ Não pode ser usado dentro de JSX, apenas em `beforeLoad` ou funções

2. **useParams() Tipado**
   - Wouter: `const { id } = useParams()`
   - TanStack Router: `const { id } = Route.useParams()`
   - ⚠️ Requer que o componente esteja dentro de uma rota file-based

3. **Search Params JSON-first**
   - Wouter: `useSearch()` retorna string
   - TanStack Router: `useSearch()` retorna objeto tipado
   - ⚠️ Requer definição de schema de validação (opcional, mas recomendado)

4. **Lazy Loading**
   - Wouter: `lazy(() => import('./Page'))`
   - TanStack Router: Automático via file-based routing
   - ⚠️ Não precisa de `lazy()` explícito

5. **Onboarding Guard**
   - Deve ser implementado em `beforeLoad` do layout `_dashboard.tsx`
   - ⚠️ Não pode ser um componente wrapper como no Wouter

6. **tRPC Context**
   - Precisa estar disponível no contexto do router
   - ⚠️ Adicionar `trpc` ao contexto do router em `router.tsx`

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 6: SUCCESS CRITERIA
# ─────────────────────────────────────────────────────────────────────────────

## Critérios de Sucesso

1. ✅ **Funcionalidade Completa**
   - Todas as 21 páginas acessíveis e funcionais
   - Todos os 19 componentes refatorados
   - Navegação entre páginas sem erros

2. ✅ **Type-Safety**
   - Zero erros TypeScript (`bun run check`)
   - Rotas, params e search params tipados

3. ✅ **Performance**
   - Loaders pré-carregando dados críticos
   - Cache otimizado com `staleTime` e `gcTime`
   - Lazy loading funcional

4. ✅ **Segurança**
   - Guards de autenticação funcionando
   - Guards de onboarding funcionando
   - Role-based access funcionando

5. ✅ **Qualidade de Código**
   - Todos os testes passando (`bun test`)
   - Build de produção bem-sucedido (`bun run build`)
   - DevTools do TanStack Router funcionando

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 7: REFERENCES & RESOURCES
# ─────────────────────────────────────────────────────────────────────────────

## Documentação Oficial

- [TanStack Router Docs](https://tanstack.com/router/latest/docs)
- [TanStack Query Integration](https://tanstack.com/router/latest/docs/integrations/query)
- [File-Based Routing Guide](https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing)
- [Migration from React Router](https://tanstack.com/router/latest/docs/framework/react/how-to/migrate-from-react-router)

## Arquivos de Referência

- `docs/research-findings.md` - Pesquisa completa sobre a migração
- `docs/PLAN-MIGRATION-TANSTACK-ROUTER.md` - Plano de migração resumido

## Comandos Úteis

```bash
# Gerar rotas manualmente (se necessário)
bun run tsr generate

# Watch mode para geração de rotas
bun run tsr watch

# Verificar estrutura de rotas gerada
cat client/src/routeTree.gen.ts
```

---

**FIM DO PRP**

Este prompt está pronto para ser executado por um agente de implementação. Cada tarefa atômica é independente, validável e possui um plano de rollback claro.
