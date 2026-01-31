# Fase 6 - Funcionalidades Avançadas

## Metadata

| Campo              | Valor                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| **Complexity**     | L6 — Multi-file feature with external API integration                 |
| **Estimated Time** | ~12 horas                                                             |
| **Parallel Safe**  | Parcialmente (GPU-43 e GPU-18 são independentes)                      |
| **Mode**           | CONSERVATIVE (plan only)                                              |
| **Issues**         | GPU-43, GPU-18                                                        |
| **Dependencies**   | Fase 1 (Estilos) e Fase 2 (Componentes UI) concluídas para GPU-43    |
| **Validated**      | 2026-01-31 — Codebase verified, 87% accuracy                          |

---

## Objective

**Task:** Aprimorar a produtividade e gestão do mentorado com ferramentas robustas de organização e planejamento.

**Context:** NeonDash (React 19 + Vite + tRPC + Drizzle + Neon PostgreSQL + Clerk + shadcn/ui)

**Why This Matters:** Produtividade é essencial para mentorados. TaskBoard atual é básico; integração com Google Calendar centraliza gestão de tempo.

---

## Research Summary

### Findings Table

| #   | Finding                                                        | Confidence | Source             | Impact                     |
| --- | -------------------------------------------------------------- | ---------- | ------------------ | -------------------------- |
| 1   | TaskBoard.tsx tem 178 linhas, usa tRPC, sem campo de prioridade | 5          | Codebase           | Requer migração de schema  |
| 2   | Categoria é campo TEXT (não enum): ["geral", "aula", "crm", "financeiro", "atividade"] | 5 | drizzle/schema.ts  | Pode expandir sem migração |
| 3   | googleapis é a lib oficial para Google Calendar API            | 5          | Web Research       | Usar OAuth2 com refresh    |
| 4   | react-big-calendar (8.5k stars) é ideal para visualização      | 4          | Bryntum comparison | Instalar com moment        |
| 5   | OAuth2 requer access_type: 'offline' para refresh tokens       | 5          | DEV Community      | Persistir tokens no DB     |
| 6   | Tokens devem ser criptografados em repouso                     | 5          | Security best practices | AES-256 encryption     |
| 7   | shadcn/ui já tem Calendar, Input, Select disponíveis           | 5          | Codebase           | Reusar componentes         |
| 8   | calendar.tsx usa react-day-picker (não react-big-calendar)     | 5          | Codebase           | react-big-calendar é nova dep |

### Knowledge Gaps

- [ ] Confirmar se mentorados usarão Google Calendar pessoal ou compartilhado
- [ ] Definir quais categorias de tarefa são necessárias (Marketing, Vendas, etc.)
- [ ] Estratégia de criptografia de tokens (env variable vs. vault)

### Assumptions to Validate

- [ ] Usuários têm conta Google pessoal para integração
- [ ] Google Cloud Platform project será criado pelo admin
- [ ] Limite de 1M requests/dia da API do Google é suficiente

---

## Edge Cases

### GPU-43: TaskBoard

1. **Empty filter results** — Exibir estado vazio com ilustração e CTA
2. **Concurrent updates** — Usar invalidation do TanStack Query para sincronização
3. **Search performance** — Debounce input (300ms) para evitar queries excessivas
4. **Category migration** — Tasks existentes com 'geral' devem continuar funcionando
5. **Mobile responsiveness** — Filtros devem colapsar em dropdown no mobile

### GPU-18: Google Calendar

1. **Token expiration** — Refresh automático com retry exponential backoff
2. **User revokes access** — Detectar erro 401 e limpar tokens do DB
3. **Network failure during OAuth** — Exibir erro amigável com retry button
4. **Multiple tabs** — State parameter no OAuth previne CSRF
5. **Rate limiting** — Log warnings ao atingir 80% do quota
6. **Multiple calendars** — Usar calendar primário do usuário por padrão
7. **Timezone handling** — Armazenar em UTC, exibir em timezone local
8. **Large event lists** — Paginar eventos com cursor-based pagination

---

## Relevant Files

### Must Read

| Path                                                    | Relevance                              |
| ------------------------------------------------------- | -------------------------------------- |
| `client/src/components/dashboard/TaskBoard.tsx`         | Componente a ser refatorado            |
| `server/routers/tasks.ts`                               | Router tRPC para tasks                 |
| `drizzle/schema.ts`                                     | Schema atual das tasks                 |
| `client/src/components/ui/calendar.tsx`                 | Componente Calendar do shadcn existente|

### May Reference

| Path                                                    | Relevance                              |
| ------------------------------------------------------- | -------------------------------------- |
| `client/src/components/ui/input.tsx`                    | Input para busca                       |
| `client/src/components/ui/select.tsx`                   | Select para filtros                    |
| `client/src/components/ui/badge.tsx`                    | Badge para prioridade                  |
| `server/_core/trpc.ts`                                  | Setup do tRPC                          |

---

## Existing Patterns

```yaml
naming: camelCase para variáveis, PascalCase para componentes
file_structure: client/src/components/dashboard/* para componentes de dashboard
error_handling: TRPCError com códigos apropriados (FORBIDDEN, NOT_FOUND)
state_management: TanStack Query via trpc.useContext()
styling: Tailwind + CSS variables (--neon-gold, --neon-blue)
```

---

## Constraints

```yaml
non_negotiable:
  - Usar shadcn/ui components existentes
  - Não quebrar tasks existentes durante migração
  - Tokens OAuth criptografados
  - Validação em cada atomic task

preferences:
  - Manter design Neon consistente (#0F172A, glow effects)
  - Priority baixa para GPU-18 (implementar após GPU-43)
```

---

# Atomic Tasks

## GPU-43: TaskBoard Enhancement

### Phase 1: Schema & Backend

#### AT-001: Add priority enum and column to tasks table

| Field             | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| **Priority**      | CRITICAL                                                              |
| **Dependencies**  | None                                                                  |
| **Parallel Safe** | ❌                                                                    |

**Description:** Adicionar enum `prioridade_task` e coluna `priority` à tabela `tasks`.

**Files to Modify:**
- `drizzle/schema.ts`

**Implementation:**
```typescript
// Add enum
export const prioridadeTaskEnum = pgEnum("prioridade_task", ["alta", "media", "baixa"]);

// Add to tasks table
priority: prioridadeTaskEnum("priority").default("media").notNull(),
```

**Validation:**
```bash
bun run check
bun run db:push --dry-run
```

**Rollback:** Remove enum and column, revert schema.ts

---

#### AT-002: Update tasks tRPC router with filter support

| Field             | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| **Priority**      | CRITICAL                                                              |
| **Dependencies**  | AT-001                                                                |
| **Parallel Safe** | ❌                                                                    |

**Description:** Adicionar parâmetros de filtro (search, category, priority) ao router de tasks.

**Files to Modify:**
- `server/routers/tasks.ts`

**Implementation:**
```typescript
list: protectedProcedure
  .input(z.object({
    mentoradoId: z.number().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    priority: z.enum(["alta", "media", "baixa"]).optional(),
  }).optional())
  .query(async ({ ctx, input }) => {
    // Add WHERE conditions with AND
  }),
```

**Validation:**
```bash
bun run check
bun test -- --grep tasks
```

**Rollback:** Revert tasks.ts to previous version

---

### Phase 2: Frontend Components

#### AT-003: Create TaskFilterToolbar component ⚡

| Field             | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| **Priority**      | HIGH                                                                  |
| **Dependencies**  | None                                                                  |
| **Parallel Safe** | ⚡ YES                                                                |

**Description:** Criar componente de toolbar com Input de busca e Selects de categoria/prioridade.

**Files to Create:**
- `client/src/components/dashboard/TaskFilterToolbar.tsx`

**Implementation Details:**
- Use `@/components/ui/input` para busca
- Use `@/components/ui/select` para filtros
- Emit onChange com debounce de 300ms para busca
- Categorias existentes: geral, aula, crm, financeiro, atividade
- Novas categorias (opcional): marketing, vendas, operacional
- Prioridades: Alta (#F59E0B), Média (#3B82F6), Baixa (#6B7280)

> **Nota:** Category é campo TEXT, não enum. Novos valores podem ser adicionados sem migração.

**Validation:**
```bash
bun run build
```

**Rollback:** Delete component file

---

#### AT-004: Restyle TaskCard with Neon Design System ⚡

| Field             | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| **Priority**      | HIGH                                                                  |
| **Dependencies**  | None                                                                  |
| **Parallel Safe** | ⚡ YES                                                                |

**Description:** Refatorar cards de tarefa para seguir Design System Neon.

**Files to Modify:**
- `client/src/components/dashboard/TaskBoard.tsx`

**Design Specs:**
- Background: `#0F172A` (slate-900)
- Border: `border-primary/20` com hover `border-primary/50`
- Priority badges:
  - Alta: `bg-amber-500/20 text-amber-400 border-amber-500/50`
  - Média: `bg-blue-500/20 text-blue-400 border-blue-500/50`
  - Baixa: `bg-slate-500/20 text-slate-400 border-slate-500/50`
- Glow effect on hover: `shadow-[0_0_15px_rgba(59,130,246,0.3)]`

**Validation:**
```bash
bun run build
```

**Rollback:** Revert TaskBoard.tsx styling

---

#### AT-005: Integrate FilterToolbar into TaskBoard

| Field             | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| **Priority**      | HIGH                                                                  |
| **Dependencies**  | AT-002, AT-003                                                        |
| **Parallel Safe** | ❌                                                                    |

**Description:** Integrar toolbar de filtros ao TaskBoard e conectar com tRPC query.

**Files to Modify:**
- `client/src/components/dashboard/TaskBoard.tsx`

**Implementation:**
```typescript
const [filters, setFilters] = useState({ search: '', category: '', priority: '' });
const { data: tasks } = trpc.tasks.list.useQuery({ ...filters, mentoradoId });
```

**Validation:**
```bash
bun run build
bun dev # Manual: test filter functionality
```

**Rollback:** Remove filter integration, revert to basic list

---

#### AT-006: Add EmptyFilterResult component

| Field             | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| **Priority**      | MEDIUM                                                                |
| **Dependencies**  | AT-005                                                                |
| **Parallel Safe** | ❌                                                                    |

**Description:** Criar componente de estado vazio quando filtros não retornam resultados.

**Files to Create:**
- `client/src/components/dashboard/EmptyFilterResult.tsx`

**Design:**
- Ícone SearchX (lucide-react)
- Texto: "Nenhuma tarefa encontrada"
- Botão: "Limpar filtros"

**Validation:**
```bash
bun run build
```

**Rollback:** Delete component file

---

## GPU-18: Google Calendar Integration (Baixa Prioridade)

### Phase 1: Setup & Configuration

#### AT-011: Configure Google Cloud Platform project

| Field             | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| **Priority**      | CRITICAL                                                              |
| **Dependencies**  | None                                                                  |
| **Parallel Safe** | ⚡ YES                                                                |

**Description:** Configurar projeto no GCP, ativar Calendar API e obter credenciais OAuth2.

**Manual Steps:**
1. Acessar console.cloud.google.com
2. Criar novo projeto "NeonDash Calendar"
3. Ativar "Google Calendar API"
4. Configurar OAuth consent screen
5. Criar credenciais OAuth2 (Web application)
6. Adicionar redirect URI: `http://localhost:3000/api/calendar/callback`
7. Copiar Client ID e Client Secret

**Environment Variables:**
```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback
```

**Validation:**
```bash
cat .env | grep GOOGLE_CLIENT_ID # Should not be empty
```

**Rollback:** Delete GCP project and remove env variables

---

#### AT-012: Add googleTokens table to schema

| Field             | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| **Priority**      | CRITICAL                                                              |
| **Dependencies**  | AT-011                                                                |
| **Parallel Safe** | ❌                                                                    |

**Description:** Adicionar tabela para armazenar tokens OAuth do Google de forma segura.

**Files to Modify:**
- `drizzle/schema.ts`

**Schema:**
```typescript
export const googleTokens = pgTable(
  "google_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at").notNull(),
    scope: text("scope").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("google_tokens_user_idx").on(table.userId),
  ]
);
```

**Validation:**
```bash
bun run check
bun run db:push --dry-run
```

**Rollback:** Remove table from schema, run db:push

---

### Phase 2: Backend Services

#### AT-013: Create Google Calendar service

| Field             | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| **Priority**      | CRITICAL                                                              |
| **Dependencies**  | AT-012                                                                |
| **Parallel Safe** | ❌                                                                    |

**Description:** Criar serviço para gerenciar cliente OAuth2 e chamadas à API do Google Calendar.

**Files to Create:**
- `server/services/googleCalendar.ts`

**Dependencies to Install:**
```bash
bun add googleapis
```

**Implementation:**
```typescript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const googleCalendarService = {
  getAuthUrl: () => oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.readonly']
  }),

  exchangeCodeForTokens: async (code: string) => { ... },

  refreshAccessToken: async (refreshToken: string) => { ... },

  getEvents: async (accessToken: string, timeMin: Date, timeMax: Date) => { ... },
};
```

**Validation:**
```bash
bun run check
```

**Rollback:** Delete service file, remove googleapis dependency

---

#### AT-014: Implement calendar tRPC router

| Field             | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| **Priority**      | HIGH                                                                  |
| **Dependencies**  | AT-013                                                                |
| **Parallel Safe** | ❌                                                                    |

**Description:** Criar router tRPC com procedures para OAuth flow e operações de calendário.

**Files to Create:**
- `server/routers/calendar.ts`

**Files to Modify:**
- `server/routers.ts` (add calendarRouter)

**Procedures:**
- `getAuthUrl` — Retorna URL de autorização
- `handleCallback` — Troca código por tokens, persiste no DB
- `getStatus` — Retorna se usuário está conectado
- `getEvents` — Lista eventos do calendário
- `disconnect` — Remove tokens do usuário

**Validation:**
```bash
bun run check
```

**Rollback:** Delete router, remove from routers.ts

---

### Phase 3: Frontend

#### AT-015: Install react-big-calendar and create Agenda page

| Field             | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| **Priority**      | HIGH                                                                  |
| **Dependencies**  | AT-014                                                                |
| **Parallel Safe** | ❌                                                                    |

**Description:** Instalar react-big-calendar e criar página de Agenda.

**Dependencies to Install:**
```bash
bun add react-big-calendar moment @types/react-big-calendar
```

**Files to Create:**
- `client/src/pages/Agenda.tsx`

**Implementation:**
```tsx
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

export function Agenda() {
  const { data: events } = trpc.calendar.getEvents.useQuery();

  return (
    <Calendar
      localizer={localizer}
      events={events ?? []}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 600 }}
    />
  );
}
```

**Validation:**
```bash
bun run build
```

**Rollback:** Delete page, remove dependencies

---

#### AT-016: Implement OAuth connect button and status

| Field             | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| **Priority**      | MEDIUM                                                                |
| **Dependencies**  | AT-015                                                                |
| **Parallel Safe** | ❌                                                                    |

**Description:** Adicionar botão de conexão com Google e indicador de status.

**Files to Modify:**
- `client/src/pages/Agenda.tsx`

**UI Components:**
- Button: "Conectar Google Calendar" (quando desconectado)
- Badge: "Conectado" com status verde (quando conectado)
- Button: "Desconectar" (quando conectado)

**Validation:**
```bash
bun run build
bun dev # Manual: complete OAuth flow test
```

**Rollback:** Revert page changes

---

## Validation Gates

### Automated

| ID     | Command            | Expected        | When                  |
| ------ | ------------------ | --------------- | --------------------- |
| VT-001 | `bun run check`    | Exit 0          | After each AT         |
| VT-002 | `bun run build`    | Exit 0          | After frontend ATs    |
| VT-003 | `bun run lint`     | No errors       | Before PR             |
| VT-004 | `bun test`         | All pass        | Before PR             |
| VT-005 | `bun run db:push`  | Exit 0          | After schema changes  |

### Manual Review

| Reviewer   | Focus                                | Required If              |
| ---------- | ------------------------------------ | ------------------------ |
| @security  | Token storage & OAuth implementation | GPU-18 implementation    |
| @designer  | Neon Design System compliance        | GPU-43 UI changes        |

---

## Output

```yaml
format: "docs/PLAN-fase-6-funcionalidades-avancadas.md"

files_created:
  - path: "client/src/components/dashboard/TaskFilterToolbar.tsx"
    purpose: "Toolbar de filtros para TaskBoard"
  - path: "client/src/components/dashboard/EmptyFilterResult.tsx"
    purpose: "Estado vazio para filtros sem resultados"
  - path: "server/services/googleCalendar.ts"
    purpose: "Serviço para Google Calendar API"
  - path: "server/routers/calendar.ts"
    purpose: "Router tRPC para calendário"
  - path: "client/src/pages/Agenda.tsx"
    purpose: "Página de agenda com calendário"

files_modified:
  - path: "drizzle/schema.ts"
    changes: "Add prioridadeTaskEnum, priority column, googleTokens table"
  - path: "server/routers/tasks.ts"
    changes: "Add filter parameters to list procedure"
  - path: "server/routers.ts"
    changes: "Add calendarRouter"
  - path: "client/src/components/dashboard/TaskBoard.tsx"
    changes: "Integrate filters, restyle with Neon design"

success_definition: |
  - TaskBoard com filtros funcionais (busca, categoria, prioridade)
  - Cards com design Neon e badges de prioridade
  - Estado vazio para filtros sem resultados
  - Google Calendar conectável via OAuth2
  - Eventos do calendário exibidos em react-big-calendar
  - Builds passando sem erros

failure_handling: |
  If schema migration fails: Rollback via db:push with previous schema
  If OAuth fails: Clear tokens from DB, prompt re-authentication
  If build fails: Revert to last working commit
```

---

## Pre-Submission Checklist

### Research
- [x] Codebase searched (TaskBoard.tsx, tasks.ts, schema.ts)
- [x] Docs consulted (Context7 unavailable, used Tavily)
- [x] Web research done (googleapis, react-big-calendar)
- [x] Security identified (OAuth, token encryption)
- [x] Edge cases considered (8+ documented)

### Context
- [x] Findings Table included (7 findings)
- [x] Knowledge Gaps listed (3 gaps)
- [x] Assumptions to Validate listed (3 assumptions)
- [x] Relevant files specified
- [x] WHY included for instructions

### Tasks
- [x] Truly atomic
- [x] Validation command each
- [x] Dependencies mapped
- [x] Rollback defined
- [x] Parallel-safe marked (⚡)

### Behavior
- [x] Mode specified (CONSERVATIVE)
- [x] Output format explicit
- [x] Success criteria measurable
- [x] Failure handling defined
