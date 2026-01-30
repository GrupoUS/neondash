# Plano de Implementação: Fase 3 - Estrutura de Dados (Módulos)

**Objetivo:** Popular o sistema de atividades com o conteúdo real dos programas Neon, estabelecendo a base para o acompanhamento de progresso do mentorado.

**Tempo Total Estimado:** ~6 horas+

**Complexidade Média:** L4

**Issues Envolvidos:** GPU-9, GPU-10, GPU-50, GPU-51

---

## ⚡ Tarefas Paralelas (com dependências internas)

As tarefas de criação dos módulos base (GPU-9 e GPU-10) podem ser feitas em paralelo. As tarefas de detalhamento (GPU-50 e GPU-51) dependem da conclusão de seus respectivos módulos base.

### 1. GPU-9 e GPU-50: Implementar Módulo 1 (Comece Aqui) e Atividades Neon Estrutura

**Objetivo:** Criar a estrutura e o conteúdo do Módulo 1, que serve como a fundação da jornada do mentorado.

#### Atomic Tasks

- **AT-001 (GPU-9):** No arquivo `client/src/data/atividades-data.ts`, adicionar um novo conjunto de objetos ao array `ATIVIDADES` para o "Módulo 1".
- **AT-002 (GPU-9):** Definir a estrutura principal do módulo, incluindo seções como Boas-vindas, Diagnóstico, Jurídico, Financeiro e Precificação, cada uma com um ícone e título.
- **AT-003 (GPU-50):** Detalhar cada seção com os `steps` específicos do programa Neon Estrutura, garantindo que cada `step` tenha um `codigo` único e um `label` descritivo.
- **AT-004:** Validar a renderização correta das novas atividades e steps no componente `client/src/components/dashboard/AtividadesContent.tsx`.

#### Antigravity Prompt

```markdown
# ROLE: Fullstack Developer
# CONTEXT: Projeto NeonDash (React + TypeScript)
# TASK: Popular Módulo 1 com Atividades do Neon Estrutura

1.  Abra o arquivo `client/src/data/atividades-data.ts`.
2.  Adicione um novo conjunto de objetos ao array `ATIVIDADES` para o "Módulo 1".
3.  O conteúdo deve incluir: Boas-vindas (vídeo, guia), Diagnóstico (formulário, faturamento), Jurídico (CNPJ, alvará), Financeiro (contas, fluxo) e Precificação.
4.  Para cada atividade, detalhe os `steps` conforme a documentação do Neon Estrutura, garantindo `codigo` e `label` únicos para cada um.
5.  Verifique se o componente `client/src/components/dashboard/AtividadesContent.tsx` renderiza corretamente as novas atividades.
6.  Execute `bun run check` para validar os tipos do TypeScript.
```

---

### 2. GPU-10 e GPU-51: Implementar Módulo 2 (Administrativo da Gestão) e Atividades Neon Escala

**Objetivo:** Criar a estrutura e o conteúdo do Módulo 2, focado na gestão avançada e escala do negócio do mentorado.

#### Atomic Tasks

- **AT-001 (GPU-10):** No arquivo `client/src/data/atividades-data.ts`, adicionar um novo conjunto de objetos ao array `ATIVIDADES` para o "Módulo 2".
- **AT-002 (GPU-10):** Definir a estrutura principal do módulo, incluindo seções como Gestão de Equipe, Processos/SOPs, KPIs, Automação e Financeiro Avançado.
- **AT-003 (GPU-51):** Detalhar cada seção com os `steps` específicos do programa Neon Escala, garantindo `codigo` e `label` únicos.
- **AT-004:** Validar a renderização correta na aba de Atividades do dashboard.

#### Antigravity Prompt

```markdown
# ROLE: Fullstack Developer
# CONTEXT: Projeto NeonDash (React + TypeScript)
# TASK: Popular Módulo 2 com Atividades do Neon Escala

1.  Abra o arquivo `client/src/data/atividades-data.ts`.
2.  Adicione um novo conjunto de objetos ao array `ATIVIDADES` para o "Módulo 2".
3.  O conteúdo deve incluir: Gestão de Equipe (mapeamento, recrutamento), Processos/SOPs (documentação), KPIs (faturamento, marketing), Automação (agendamento, CRM) e Financeiro Avançado (DRE, fluxo).
4.  Para cada atividade, detalhe os `steps` conforme a documentação do Neon Escala, garantindo `codigo` e `label` únicos.
5.  Verifique se o componente `client/src/components/dashboard/AtividadesContent.tsx` renderiza corretamente as novas atividades.
6.  Execute `bun run check` para validar os tipos do TypeScript.
```
