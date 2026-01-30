# Plano de Implementação: Fase 6 - Funcionalidades Avançadas

**Objetivo:** Aprimorar a produtividade e a gestão do mentorado dentro da plataforma, adicionando ferramentas robustas de organização e planejamento.

**Tempo Total Estimado:** ~12 horas

**Complexidade Média:** L6

**Issues Envolvidos:** GPU-43, GPU-18

**Dependências:** Conclusão da Fase 1 (Estilos) e Fase 2 (Componentes UI) para GPU-43. GPU-18 é independente, mas de baixa prioridade.

---

## Tarefas Sequenciais

### 1. GPU-43: Aprimorar Gestão de Tarefas (TaskBoard)

**Objetivo:** Transformar o TaskBoard em uma ferramenta de produtividade mais completa e intuitiva.

#### Atomic Tasks

- **AT-001:** No componente `client/src/components/dashboard/TaskBoard.tsx`, adicionar uma barra de ferramentas superior contendo um campo de busca, um `Select` para categorias (Marketing, Vendas, etc.) e um `Select` para prioridade (Alta, Média, Baixa).
- **AT-002:** Refatorar o visual dos cards de tarefa para seguir o Design System Neon: fundo escuro (`#0F172A`), bordas com brilho sutil e `badges` coloridos para indicar a prioridade (ex: `#F59E0B` para Alta).
- **AT-003:** Implementar a lógica de filtro no frontend para que a lista de tarefas seja atualizada dinamicamente conforme o usuário interage com a busca e os seletores.
- **AT-004:** Adicionar um estado de "lista vazia" visualmente agradável que aparece quando nenhum resultado é encontrado.

#### Antigravity Prompt

```markdown
# ROLE: Frontend UX Engineer

# CONTEXT: Projeto NeonDash (React + Tailwind)

# TASK: Refatorar o TaskBoard com filtros e busca

1.  Abra o arquivo `client/src/components/dashboard/TaskBoard.tsx`.
2.  Adicione uma barra de ferramentas superior com: Input de Busca, Select de Categoria (Marketing, Vendas, Financeiro, Operacional) e Select de Prioridade (Alta, Média, Baixa).
3.  Refatore os cards de tarefa para usarem o estilo Neon: Fundo escuro (`#0F172A`), bordas com brilho e badges coloridos para prioridade (`#F59E0B` para Alta).
4.  Implemente a lógica de filtro no frontend para atualizar a lista de tarefas instantaneamente.
5.  Adicione um indicador visual de "Sem tarefas encontradas" quando os filtros não retornarem resultados.
6.  Garanta que o layout seja responsivo e funcione bem em tablets.
7.  Execute `bun run build` para validar.
```

---

### 2. GPU-18: Implementar Agenda com Google Calendar (Baixa Prioridade)

**Objetivo:** Centralizar a gestão de tempo do mentorado, permitindo a visualização e gerenciamento de compromissos do Google Calendar diretamente no NeonDash.

#### Atomic Tasks

- **AT-001:** Configurar um novo projeto no Google Cloud Platform, ativar a API do Google Calendar e obter as credenciais OAuth2 (Client ID e Client Secret).
- **AT-002:** No backend, instalar a biblioteca `googleapis` e criar um serviço (`server/services/googleCalendar.ts`) para gerenciar o cliente OAuth2 e as chamadas à API.
- **AT-003:** Implementar as rotas tRPC necessárias em `server/routers/calendar.ts`: `getAuthUrl`, `handleCallback` (para trocar o código de autorização por um token de acesso), `getEvents` e `createEvent`.
- **AT-004:** No frontend, criar a página `client/src/pages/Agenda.tsx` e adicionar um componente de calendário (como `react-big-calendar` ou um customizado) para exibir os eventos.
- **AT-005:** Implementar o fluxo de autorização, onde o usuário clica em "Conectar Google Calendar" e é redirecionado para a tela de consentimento do Google.

#### Antigravity Prompt

```markdown
# ROLE: Backend & Integration Specialist

# CONTEXT: Projeto NeonDash (Node.js + React + Google API)

# TASK: Integrar Google Calendar com fluxo OAuth2

1.  Instale a dependência `googleapis` no servidor.
2.  Crie o serviço `server/services/googleCalendar.ts` para gerenciar o cliente OAuth2 e as chamadas à API do Calendar.
3.  Implemente as rotas tRPC em `server/routers/calendar.ts`: `getAuthUrl`, `callback` (para trocar code por token), `getEvents` e `createEvent`.
4.  No frontend, crie `client/src/pages/Agenda.tsx`. Use um componente de calendário (ex: `react-big-calendar`) para exibir os eventos.
5.  Adicione um botão "Conectar Google Calendar" que inicie o fluxo de autorização OAuth2.
6.  Garanta que os tokens de acesso e refresh sejam armazenados de forma segura no banco de dados, associados ao usuário.
7.  Execute `bun run build` e `bun run check` para validar a implementação.
```
