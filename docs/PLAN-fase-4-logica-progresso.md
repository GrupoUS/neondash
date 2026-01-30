# Plano de Implementação: Fase 4 - Lógica de Progresso

**Objetivo:** Sincronizar o estado real das atividades concluídas com a interface do usuário, fornecendo feedback visual preciso e em tempo real sobre a evolução do mentorado.

**Tempo Total Estimado:** ~3 horas

**Complexidade:** L4

**Issues Envolvidos:** GPU-52

**Dependências:** Conclusão da Fase 3 (Estrutura de Dados - Módulos).

---

## Tarefa Sequencial

### 1. GPU-52: Sincronizar Card de Progresso de Atividades

**Objetivo:** Garantir que o card de progresso na página principal do dashboard reflita com precisão a porcentagem de atividades concluídas.

#### Atomic Tasks

- **AT-001:** No backend (provavelmente em `server/routers/atividades.ts`), criar uma nova query tRPC, `getProgress`, que calcula o total de `steps` de atividades para um usuário e quantos deles estão marcados como concluídos no banco de dados.
- **AT-002:** No frontend, no componente `client/src/components/dashboard/AtividadesCard.tsx`, chamar a nova query `getProgress` para buscar os dados reais de progresso.
- **AT-003:** Substituir quaisquer valores estáticos (hardcoded) pela lógica dinâmica: `const percentage = (completedSteps / totalSteps) * 100;`.
- **AT-004:** Utilizar o componente `<Progress />` do shadcn/ui para exibir a barra de progresso, passando o `percentage` calculado.
- **AT-005:** Implementar a invalidação automática da query de progresso (`utils.atividades.getProgress.invalidate()`) sempre que uma atividade for marcada como concluída, garantindo a reatividade da UI.

#### Antigravity Prompt

```markdown
# ROLE: Fullstack Developer
# CONTEXT: Projeto NeonDash (React + tRPC + Drizzle)
# TASK: Sincronizar progresso de atividades com o backend

1.  No backend (verifique `server/routers/atividades.ts`), implemente uma query tRPC `getProgress` que conte o total de `steps` de atividades e quantos estão marcados como concluídos para o usuário logado.
2.  No frontend, dentro do componente `client/src/components/dashboard/AtividadesCard.tsx`, utilize o hook da query `getProgress` para obter os dados reais de progresso.
3.  Substitua os valores estáticos pela lógica de cálculo de porcentagem: `(concluidas / total) * 100`.
4.  Passe o valor calculado para o componente `<Progress />` do shadcn/ui.
5.  Na função que marca uma atividade como concluída, adicione uma chamada para invalidar a query de progresso (`utils.atividades.getProgress.invalidate()`) para que o card seja atualizado automaticamente.
6.  Execute `bun run build` e `bun run check` para validar a implementação.
```
