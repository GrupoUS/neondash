# Plano de Implementação: Fase 2 - Componentes UI Core

**Objetivo:** Refatorar componentes essenciais da interface do usuário para alinhá-los com a nova identidade visual Neon e melhorar a experiência de navegação.

**Tempo Total Estimado:** ~6 horas

**Complexidade Média:** L4

**Issues Envolvidos:** GPU-24, GPU-27

**Dependências:** Conclusão da Fase 1 (Fundação - Design System & Estilos).

---

## Tarefas Sequenciais

### 1. GPU-24: Mudar Componente de Seleção de Abas

**Objetivo:** Substituir o componente de abas padrão do shadcn/ui por uma versão customizada, mais moderna e alinhada ao estilo Neon.

#### Atomic Tasks

- **AT-001:** No arquivo `client/src/components/ui/tabs.tsx`, criar uma nova variante ou um novo componente (ex: `NeonTabs`) que herde a funcionalidade do `Tabs` original.
- **AT-002:** Estilizar o novo componente para que o fundo seja escuro (`#0F172A`) e o indicador da aba ativa tenha um gradiente animado (de `#F59E0B` para `#FBBF24`).
- **AT-003:** Utilizar a biblioteca `framer-motion` para adicionar uma animação de layout (`layoutId`) que mova suavemente o indicador entre as abas.
- **AT-004:** Substituir o `TabsList` padrão pelo novo componente `NeonTabs` no arquivo `client/src/pages/MyDashboard.tsx`.

#### Antigravity Prompt

```markdown
# ROLE: Senior Frontend Engineer
# CONTEXT: Projeto NeonDash (React + Tailwind + shadcn/ui)
# TASK: Implementar novo design de abas (Tabs) com animação

1.  Leia o arquivo `client/src/components/ui/tabs.tsx`.
2.  Crie uma nova variante ou componente `NeonTabs` que utilize um fundo escuro (`#0F172A`) e um indicador de seleção com gradiente (Primary: `#F59E0B` para Secondary: `#FBBF24`).
3.  Adicione uma animação suave de transição entre as abas usando `framer-motion` (já instalado), aplicando um `layoutId` ao indicador.
4.  Aplique o novo componente no arquivo `client/src/pages/MyDashboard.tsx`, substituindo o `TabsList` atual.
5.  Garanta que o contraste do texto seja WCAG AAA (Texto: `#F8FAFC` em fundo escuro).
6.  Execute `bun run build` para validar a implementação.
```

---

### 2. GPU-27: Trocar Seleção de Mentorado por Floating Dock

**Objetivo:** Substituir o seletor (`Select`) padrão de mentorados por uma experiência de usuário mais rica e interativa, inspirada no Dock do macOS.

#### Atomic Tasks

- **AT-001:** Criar um novo arquivo de componente em `client/src/components/ui/floating-dock.tsx`.
- **AT-002:** Implementar a lógica do Floating Dock utilizando `framer-motion` para criar o efeito de "escala magnética" nos ícones conforme o mouse se aproxima.
- **AT-003:** Popular o dock com os avatares dos mentorados. Caso um mentorado não tenha foto, gerar um avatar com suas iniciais e uma cor de fundo da paleta Neon.
- **AT-004:** No layout principal da aplicação (provavelmente `client/src/components/DashboardLayout.tsx`), substituir o componente `Select` de mentorados pelo novo `FloatingDock`.
- **AT-005:** Garantir que o clique em um avatar no dock atualize o estado global do mentorado selecionado, filtrando os dados do dashboard.

#### Antigravity Prompt

```markdown
# ROLE: Senior UI/UX Developer
# CONTEXT: Projeto NeonDash (React + Framer Motion)
# TASK: Implementar Floating Dock para seleção de mentorado

1.  Crie um novo arquivo `client/src/components/ui/floating-dock.tsx`.
2.  Implemente o componente Floating Dock (inspirado na Aceternity UI) usando `framer-motion` para animações de escala e posição baseadas na proximidade do mouse.
3.  O dock deve exibir os avatares dos mentorados. Se não houver foto, use as iniciais com um fundo colorido do projeto.
4.  No arquivo de layout principal (verifique `client/src/components/DashboardLayout.tsx` ou onde o seletor de mentorado estiver), substitua o `Select` atual pelo novo `FloatingDock`.
5.  Garanta que ao clicar em um item do dock, o estado global do mentorado selecionado seja atualizado.
6.  Adicione tooltips elegantes acima de cada ícone com o nome do mentorado ao passar o mouse.
7.  Execute `bun run check` para validar os tipos e `bun run build` para a compilação.
```
