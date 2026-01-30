# Plano de Implementação: Fase 1 - Fundação (Design System & Estilos)

**Objetivo:** Estabelecer a identidade visual consistente do NeonDash, ajustando cores, contraste e limpando a UI de elementos desnecessários. Esta fase é a base para todas as outras e garante que os componentes futuros sigam o mesmo padrão.

**Tempo Total Estimado:** ~3 horas

**Complexidade Média:** L1.6

**Issues Envolvidos:** GPU-25, GPU-29, GPU-26

---

## ⚡ Tarefas Paralelas

Todas as tarefas desta fase são independentes e podem ser executadas em paralelo.

### 1. GPU-25: Trocar Cores da Escrita no Modo Claro

**Objetivo:** Melhorar o contraste e alinhar o modo claro com a identidade visual do projeto (azul petróleo).

#### Atomic Tasks

- **AT-001:** Identificar as variáveis de cor de texto para o modo claro no arquivo `client/src/index.css` (dentro do seletor `:root`).
- **AT-002:** Atualizar a variável `--foreground` para o tom principal de azul petróleo (`#0d4f5a`) e ajustar variáveis secundárias (`--muted-foreground`, etc.) para tons complementares que garantam a hierarquia visual.
- **AT-003:** Validar o contraste de todas as alterações com uma ferramenta de acessibilidade para garantir a conformidade com o padrão WCAG AA (mínimo 4.5:1).

#### Antigravity Prompt

```markdown
# ROLE: UI Developer

# CONTEXT: Projeto NeonDash (React + Tailwind CSS)

# TASK: Atualizar cores de texto do modo claro para Azul Petróleo

1.  Abra o arquivo `client/src/index.css`.
2.  No seletor `:root`, localize as variáveis de cor de texto (`--foreground`, `--muted-foreground`, etc.).
3.  Altere a cor principal de texto para o Azul Petróleo do projeto: `#0d4f5a`.
4.  Ajuste as cores secundárias para garantir uma hierarquia visual clara e legível.
5.  Verifique se o contraste de todos os textos sobre o fundo claro atende ao padrão WCAG AA (mínimo 4.5:1).
6.  Navegue por todas as páginas no modo claro para confirmar a consistência visual.
```

---

### 2. GPU-29: Trocar Letra do Modo Escuro

**Objetivo:** Melhorar a legibilidade e o apelo visual do modo escuro, utilizando cores mais vibrantes para textos e elementos de destaque.

#### Atomic Tasks

- **AT-001:** Localizar as variáveis de cor de texto para o modo escuro no arquivo `client/src/index.css` (dentro do seletor `.dark`).
- **AT-002:** Atualizar a variável `--foreground` para um branco suave (`#F8FAFC`) para textos corridos, garantindo conforto visual.
- **AT-003:** Aplicar as cores de destaque Neon (Dourado: `#F59E0B` ou Azul Claro: `#0ea5e9`) em títulos, links e elementos interativos para criar contraste e hierarquia.

#### Antigravity Prompt

```markdown
# ROLE: UI Engineer

# CONTEXT: Projeto NeonDash (React + Tailwind CSS)

# TASK: Otimizar contraste e cores do modo escuro

1.  Abra o arquivo `client/src/index.css`.
2.  No seletor `.dark`, atualize a variável de cor de primeiro plano (`--foreground`) para `#F8FAFC`.
3.  Para títulos e elementos de destaque (links, botões secundários), utilize a cor Dourado Neon: `#F59E0B`.
4.  Garanta que o contraste em relação ao fundo escuro (`#0F172A`) seja de pelo menos 7:1 (WCAG AAA) para textos importantes.
5.  Revise todos os componentes de texto no modo escuro para garantir consistência.
```

---

### 3. GPU-26: Tirar Card de Sistema Online

**Objetivo:** Simplificar a interface do dashboard, removendo um elemento visualmente redundante.

#### Atomic Tasks

- **AT-001:** Localizar o componente ou trecho de código JSX que renderiza o indicador "Sistema Online" no arquivo `client/src/pages/MyDashboard.tsx`.
- **AT-002:** Remover completamente o código JSX do indicador.
- **AT-003:** Verificar se existem estados (`useState`) ou efeitos (`useEffect`) associados exclusivamente a este indicador e removê-los para limpar o código.

#### Antigravity Prompt

```markdown
# ROLE: Frontend Developer

# CONTEXT: Projeto NeonDash (React)

# TASK: Remover indicador "Sistema Online" do MyDashboard

1.  Abra o arquivo `client/src/pages/MyDashboard.tsx`.
2.  Localize e remova o elemento JSX que renderiza o indicador de status "Sistema Online" (provavelmente um `div` com texto e uma animação de pulso).
3.  Inspecione o componente em busca de qualquer estado ou lógica que era usada apenas por esse indicador e remova-os.
4.  Execute `bun run build` para garantir que a remoção não introduziu erros.
```
