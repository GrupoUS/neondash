# Planos de Implementação - NeonDash

Este diretório contém os planos de implementação detalhados para o desenvolvimento do projeto **NeonDash**, organizados em fases sequenciais e otimizados para execução no Antigravity IDE.

---

## Estrutura de Fases

A implementação do NeonDash foi dividida em **6 fases principais**, cada uma com objetivos claros, atomic tasks e prompts prontos para uso.

### Fase 1: Fundação (Design System & Estilos)

**Arquivo:** [`PLAN-fase-1-fundacao.md`](./PLAN-fase-1-fundacao.md)

**Objetivo:** Estabelecer a identidade visual consistente do projeto, ajustando cores, contraste e limpando elementos desnecessários da UI.

**Tempo Estimado:** ~3 horas

**Issues:** GPU-25, GPU-29, GPU-26

**Status:** ⚡ Todas as tarefas são paralelas

---

### Fase 2: Componentes UI Core

**Arquivo:** [`PLAN-fase-2-componentes-ui.md`](./PLAN-fase-2-componentes-ui.md)

**Objetivo:** Refatorar componentes essenciais da interface (Tabs e Floating Dock) para alinhá-los com a nova identidade visual Neon.

**Tempo Estimado:** ~6 horas

**Issues:** GPU-24, GPU-27

**Dependências:** Conclusão da Fase 1

---

### Fase 3: Estrutura de Dados (Módulos)

**Arquivo:** [`PLAN-fase-3-estrutura-dados.md`](./PLAN-fase-3-estrutura-dados.md)

**Objetivo:** Popular o sistema de atividades com o conteúdo real dos programas Neon Estrutura e Neon Escala.

**Tempo Estimado:** ~6 horas+

**Issues:** GPU-9, GPU-10, GPU-50, GPU-51

**Status:** ⚡ GPU-9 e GPU-10 podem ser executados em paralelo

---

### Fase 4: Lógica de Progresso

**Arquivo:** [`PLAN-fase-4-logica-progresso.md`](./PLAN-fase-4-logica-progresso.md)

**Objetivo:** Sincronizar o estado real das atividades concluídas com a UI, fornecendo feedback visual preciso.

**Tempo Estimado:** ~3 horas

**Issues:** GPU-52

**Dependências:** Conclusão da Fase 3

---

### Fase 5: Onboarding

**Arquivo:** [`PLAN-fase-5-onboarding.md`](./PLAN-fase-5-onboarding.md)

**Objetivo:** Criar uma experiência de primeiro acesso guiada e envolvente para novos mentorados.

**Tempo Estimado:** ~6 horas

**Issues:** GPU-12

**Dependências:** Conclusão da Fase 1 e Fase 2

---

### Fase 6: Funcionalidades Avançadas

**Arquivo:** [`PLAN-fase-6-funcionalidades-avancadas.md`](./PLAN-fase-6-funcionalidades-avancadas.md)

**Objetivo:** Aprimorar a produtividade do mentorado com ferramentas robustas de gestão de tarefas e integração com Google Calendar.

**Tempo Estimado:** ~12 horas

**Issues:** GPU-43, GPU-18

**Dependências:** GPU-43 depende da Fase 1 e Fase 2. GPU-18 é independente (baixa prioridade).

---

## Como Utilizar os Planos

Cada arquivo de plano contém:

1.  **Objetivo da Fase:** Descrição clara do que será alcançado.
2.  **Atomic Tasks:** Tarefas granulares e sequenciais para implementação.
3.  **Antigravity Prompts:** Blocos de texto prontos para copiar e colar no Antigravity IDE, garantindo execução precisa.
4.  **Dependências:** Indicação de quais fases ou tarefas devem ser concluídas antes de iniciar.

### Fluxo de Trabalho Recomendado

1.  Abra o arquivo de plano da fase que deseja implementar.
2.  Leia o objetivo e as atomic tasks para entender o escopo.
3.  Copie o **Antigravity Prompt** correspondente.
4.  Cole o prompt no Antigravity IDE e execute.
5.  Valide a implementação conforme as instruções de cada atomic task.
6.  Avance para a próxima fase após a conclusão.

---

## Tempo Total de Implementação

**~36 horas** de desenvolvimento distribuídas em 6 fases.

---

## Design System

O projeto segue o **Design System Master** definido em [`DESIGN_SYSTEM_MASTER.md`](./DESIGN_SYSTEM_MASTER.md), que inclui:

- **Paleta de Cores:** Ouro (`#F59E0B`), Roxo (`#8B5CF6`), Azul Claro (`#0ea5e9`), Azul Petróleo (`#0d4f5a`), Fundo Escuro (`#0F172A`), Texto Claro (`#F8FAFC`).
- **Tipografia:** Plus Jakarta Sans (Heading e Body).
- **Efeitos:** Minimal glow, transições suaves, foco visível.
- **Acessibilidade:** Contraste WCAG AAA para elementos críticos.

---

## Suporte

Para dúvidas ou suporte durante a implementação, consulte os issues correspondentes no Linear ou entre em contato com a equipe de desenvolvimento.

**Projeto:** NEONDASH  
**Organização:** Grupo US  
**Última Atualização:** 30 de Janeiro de 2026
