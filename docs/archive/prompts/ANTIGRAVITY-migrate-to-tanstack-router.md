# PROMPT PARA ANTIGRAVITY: Migração Wouter → TanStack Router

Execute este plano de migração completa do Wouter para TanStack Router.

## PROJECT CONTEXT

- **Project**: NEON Dashboard (Portal mentorias.black)
- **Tech Stack**: React 19.2 + Vite 7 + tRPC 11 + Drizzle ORM + Neon PostgreSQL + Express + Clerk + Bun 1.3+
- **Current Router**: Wouter 3.7.1 (com patch customizado em `patches/wouter@3.7.1.patch`)
- **Target**: @tanstack/react-router com integração nativa tRPC

## MIGRATION SCOPE

### 1. INSTALLATION & SETUP

```bash
# Install TanStack Router and devtools
bun add @tanstack/react-router @tanstack/router-devtools

# Add Vite plugin for file-based routing
bun add -d @tanstack/router-plugin
```

### 2. CONFIGURE VITE

Edit `vite.config.ts` to add TanStack Router plugin:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanStackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    react(),
    tanStackRouter(), // <-- ADD THIS
  ],
});
```

### 3. CREATE ROUTER INSTANCE

Create `client/src/router.tsx`:

```typescript
import { createRouter, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { trpc } from '@/lib/trpc'
import { lazy } from 'react'

// Import route tree (will be auto-generated)
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreload: 'intent', // Preload on hover
  context: {
    trpc, // Inject tRPC client for loaders
  },
  defaultPendingComponent: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  ),
})

// Register types for TypeScript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export { router }
```

### 4. MIGRATE App.tsx

Replace Wouter's `<Switch>` with TanStack Router's `<RouterProvider>`:

**BEFORE:**

```typescript
import { Route, Switch } from "wouter"

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      {/* ... more routes ... */}
    </Switch>
  )
}
```

**AFTER:**

```typescript
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'

// No more manual route definitions - they're file-based now
export default function App() {
  return <RouterProvider router={router} />
}
```

### 5. CREATE FILE-BASED ROUTES

Create directory structure `client/src/routes/`:

#### 5.1 Root Layout (`client/src/routes/__root.tsx`)

```typescript
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ThemeProvider } from '../contexts/ThemeContext'
import { TooltipProvider } from '../components/ui/tooltip'
import { Toaster } from '../components/ui/sonner'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react"
import ErrorBoundary from '../components/ErrorBoundary'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <header className="flex justify-end p-4 gap-4">
            <SignedOut>
              <SignInButton mode="modal" />
              <SignUpButton mode="modal" />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          <Outlet />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
```

#### 5.2 Landing Page (`client/src/routes/index.tsx`)

```typescript
import { createFileRoute } from "@tanstack/react-router";
import LandingPage from "../pages/LandingPage";

export const Route = createFileRoute("/")({
  component: LandingPage,
});
```

#### 5.3 Dashboard Routes

**`client/src/routes/dashboard.tsx`:**

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "../components/DashboardLayout";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ context: { trpc } }) => {
    // Check auth via Clerk (or use tRPC auth check)
    // This is where you'd perform auth validation
  },
  loader: async ({ context: { trpc } }) => {
    // Preload dashboard data via tRPC
    return {};
  },
  component: DashboardLayout,
});
```

**`client/src/routes/dashboard_.$id.tsx`** (Example for dynamic route):

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import Estrutura from "../pages/Estrutura";
import Escala from "../pages/Escala";

export const Route = createFileRoute("/dashboard_.$id")({
  loader: async ({ params: { id }, context: { trpc } }) => {
    // Preload data for specific mentorado
    return { mentorado: await trpc.mentorados.byId.query(parseInt(id)) };
  },
  component: MentoradoDetail,
});

function MentoradoDetail() {
  const { id } = Route.useParams();
  const data = Route.useLoaderData();
  // Render page
}
```

**All other routes to migrate:**

```
/client/src/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx              → LandingPage
│   ├── dashboard.tsx          → Home
│   ├── meu-dashboard.tsx      → MyDashboard
│   ├── enviar-metricas.tsx    → SubmitMetrics
│   ├── admin.tsx              → Admin
│   ├── admin.vincular.tsx     → VincularEmails
│   ├── admin.mentorados.tsx    → GestaoMentorados
│   ├── comparativo.tsx         → DashboardComparativo
│   ├── conquistas.tsx         → Conquistas
│   ├── ranking.tsx           → RankingMensal
│   ├── notificacoes.tsx       → Notificacoes
│   ├── estrutura.tsx          → Estrutura
│   ├── escala.tsx             → Escala
│   ├── primeiro-acesso.tsx    → PrimeiroAcesso
│   └── 404.tsx               → NotFound
```

### 6. UPDATE DashboardLayout

Update Link components in `client/src/components/DashboardLayout.tsx`:

```typescript
// BEFORE:
import { Link } from "wouter"
<Link href="/dashboard">Visão Geral</Link>

// AFTER:
import { Link } from '@tanstack/react-router'
<Link to="/dashboard">Visão Geral</Link>
```

### 7. UPDATE ProtectedRoute

Update redirect pattern:

```typescript
// BEFORE:
import { Redirect } from "wouter"
if (!user) return <Redirect to="/" />

// AFTER:
import { redirect } from '@tanstack/react-router'
if (!user) throw redirect({ to: '/' })
```

### 8. IMPLEMENT LOADERS WITH tRPC

#### Example: `/comparativo` with search params

**`client/src/routes/comparativo.tsx`:**

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import DashboardComparativo from "../pages/DashboardComparativo";

// Define typed search params with Zod
const searchSchema = z.object({
  ano: z.coerce.number().default(new Date().getFullYear()),
  mes: z.coerce.number().default(new Date().getMonth() + 1),
  turma: z.enum(["neon_estrutura", "neon_escala"]).optional(),
});

export const Route = createFileRoute("/comparativo")({
  validateSearch: searchSchema,
  loader: async ({ context: { trpc }, searchParams }) => {
    return {
      dados: await trpc.metricas.comparativo.fetch(searchParams),
    };
  },
  component: DashboardComparativo,
});

// In the component:
function DashboardComparativo() {
  const search = Route.useSearch();
  const { dados } = Route.useLoaderData();
  // Access typed search params: search.ano, search.mes, search.turma
}
```

#### Example: `/meu-dashboard` with auth check

**`client/src/routes/meu-dashboard.tsx`:**

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import MyDashboard from "../pages/MyDashboard";

export const Route = createFileRoute("/meu-dashboard")({
  loader: async ({ context: { trpc } }) => {
    const mentorados = await trpc.mentorados.listMine.fetch();

    if (!mentorados || mentorados.length === 0) {
      throw redirect({ to: "/primeiro-acesso" });
    }

    return { mentorados };
  },
  component: MyDashboard,
});
```

### 9. REMOVE WOUTER & PATCH

```bash
# Remove Wouter
bun remove wouter

# Remove custom patch
rm patches/wouter@3.7.1.patch
rm -rf patches/

# Remove patchedDependencies from package.json
# Clean up any remaining wouter imports
```

### 10. UPDATE PAGES

Replace `useLocation` usage in pages:

**BEFORE (all pages):**

```typescript
import { useLocation } from "wouter";
const [location] = useLocation();
```

**AFTER:**

```typescript
import { useLocation } from "@tanstack/react-router";
const location = useLocation().pathname;
```

## VALIDATION CRITERIA

✅ **Build**: `bun run check` passes (no TypeScript errors)
✅ **Dependencies**: `wouter` removed from `package.json`
✅ **Routes**: All 16 routes navigable and rendering correctly
✅ **Auth**: Clerk authentication still protecting routes
✅ **Data**: tRPC queries working in loaders
✅ **Search Params**: Typed search params working (comparativo, ranking)
✅ **Lazy Loading**: All lazy-loaded components still lazy
✅ **Mobile**: Mobile menu and responsive layout intact
✅ **Patch**: No more `patches/` directory

## FILES TO CREATE/MODIFY

### CREATE:

- `client/src/router.tsx` - Router instance
- `client/src/routes/__root.tsx` - Root layout
- `client/src/routes/index.tsx` - Landing page
- `client/src/routes/dashboard.tsx` - Dashboard route
- `client/src/routes/meu-dashboard.tsx` - My Dashboard route
- `client/src/routes/enviar-metricas.tsx` - Submit Metrics
- `client/src/routes/admin.tsx` - Admin
- `client/src/routes/admin.vincular.tsx` - Vincular Emails
- `client/src/routes/admin.mentorados.tsx` - Gestão Mentorados
- `client/src/routes/comparativo.tsx` - Comparativo
- `client/src/routes/conquistas.tsx` - Conquistas
- `client/src/routes/ranking.tsx` - Ranking
- `client/src/routes/notificacoes.tsx` - Notificações
- `client/src/routes/estrutura.tsx` - Estrutura
- `client/src/routes/escala.tsx` - Escala
- `client/src/routes/primeiro-acesso.tsx` - Primeiro Acesso
- `client/src/routes/404.tsx` - Not Found (optional, or handle via throwNotFound)

### MODIFY:

- `vite.config.ts` - Add tanStackRouter plugin
- `client/src/App.tsx` - Replace Switch with RouterProvider
- `client/src/components/DashboardLayout.tsx` - Update Link imports
- `client/src/components/auth/ProtectedRoute.tsx` - Update redirect pattern
- `client/src/pages/LandingPage.tsx` - Update useLocation import
- `client/src/pages/MyDashboard.tsx` - Update useLocation import
- `client/src/pages/NotFound.tsx` - Update useLocation import

### DELETE:

- `patches/wouter@3.7.1.patch`
- `patches/` directory (if empty)

## TROUBLESHOOTING

### Issue: "Cannot find module './routeTree.gen'"

**Solution**: The `@tanstack/router-plugin` generates this file. Make sure it's in `vite.config.ts`. Run `bun dev` to trigger generation.

### Issue: "Type 'trpc' does not exist on RouterContext"

**Solution**: Ensure `declare module '@tanstack/react-router'` is in `client/src/router.tsx` and `trpc` is passed in context.

### Issue: Loader not running

**Solution**: Check if route is wrapped in layout. Loaders only run on routes that are actually visited, not on parent routes.

### Issue: Search params not validated

**Solution**: Ensure `validateSearch` returns a function or object. Use `z.coerce.number()` for numeric params.

## SUCCESS METRICS

- Time to complete: 8-12 hours
- Bundle size impact: +15KB (acceptable)
- Route navigation latency: Improved (preload on hover)
- Type safety: 100% for routes, params, and search params
- Test pass rate: 100%

## FINAL NOTES

- This migration eliminates the custom Wouter patch and provides a more robust, type-safe routing solution
- All existing UI components (pages, layouts, shadcn/ui components) remain unchanged
- The migration preserves all current functionality while adding advanced features (loaders, typed search params, preloading)
- After migration, the codebase will be more maintainable and aligned with modern React patterns

---

**Execute this migration now. Commit with message:**

```
feat: migrate from wouter to tanstack router

- Replace wouter with @tanstack/react-router
- Implement file-based routing structure
- Add loaders for data fetching with tRPC
- Implement typed search params with Zod
- Configure route preloading on hover
- Remove custom wouter patch

BREAKING CHANGE: Wouter replaced with TanStack Router
```
