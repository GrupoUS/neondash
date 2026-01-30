# Plano de Implementação: Fase 5 - Onboarding

**Objetivo:** Criar uma experiência de primeiro acesso guiada e envolvente para novos mentorados, garantindo que eles configurem seus perfis e entendam as funcionalidades da plataforma.

**Tempo Total Estimado:** ~6 horas

**Complexidade:** L6

**Issues Envolvidos:** GPU-12

**Dependências:** Conclusão da Fase 1 (Estilos) e Fase 2 (Componentes UI).

---

## Tarefa Sequencial

### 1. GPU-12: Implementar Onboarding - Módulo 0

**Objetivo:** Desenvolver um fluxo de onboarding multi-etapas que seja intuitivo e prepare o mentorado para o uso completo do NeonDash.

#### Atomic Tasks

- **AT-001:** Criar um novo arquivo de página em `client/src/pages/Onboarding.tsx`.
- **AT-002:** Implementar um componente de `Stepper` com 4 etapas: Boas-vindas (com vídeo incorporado), Perfil (coleta de nome e foto), Negócio (nome da clínica, especialidade) e Tour (breve resumo das funcionalidades do dashboard).
- **AT-003:** Utilizar `framer-motion` para criar transições animadas e suaves entre cada etapa do `Stepper`.
- **AT-004:** No backend, adicionar um campo booleano `onboardingCompleted` ao schema do usuário no Drizzle (`drizzle/schema.ts`) e criar uma mutação tRPC em `server/routers/user.ts` para atualizar este campo para `true` ao final do fluxo.
- **AT-005:** No arquivo principal do cliente (`client/src/App.tsx` ou no gerenciador de rotas), adicionar uma lógica para verificar o status de `onboardingCompleted` do usuário e redirecioná-lo para a página `/onboarding` caso seja `false`.

#### Antigravity Prompt

```markdown
# ROLE: Fullstack Engineer
# CONTEXT: Projeto NeonDash (React + tRPC + Drizzle)
# TASK: Criar página e fluxo de Onboarding

1.  Crie o arquivo `client/src/pages/Onboarding.tsx`.
2.  Implemente um fluxo de 4 etapas: 1. Boas-vindas (Vídeo), 2. Perfil (Nome, Foto), 3. Negócio (Nome da Clínica, Especialidade), 4. Tour (Resumo das abas).
3.  Use `framer-motion` para transições suaves entre as etapas.
4.  No backend (`drizzle/schema.ts`), adicione um campo `onboardingCompleted` ao schema do usuário. Em `server/routers/user.ts`, crie uma mutação para atualizá-lo.
5.  Adicione lógica no `client/src/App.tsx` para redirecionar usuários que não completaram o onboarding para a nova página.
6.  Siga o Design System: Fundo `#0F172A`, Texto `#F8FAFC`, Botões `#F59E0B`.
7.  Execute `bun run build` e `bun run check` para validar a implementação.
```
