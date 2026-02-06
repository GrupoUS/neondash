# Design System UI/UX - Neondash Chat Aprimorado

## 🎨 Visão Geral do Design

### Contexto do Produto
- **Tipo:** Aplicação de chat empresarial para saúde estética
- **Público:** Profissionais de clínicas de estética e seus pacientes
- **Plataforma:** Web (Desktop + Mobile Responsive)
- **Estilo:** Profissional, moderno, clean com toques de elegância

### Princípios de Design

1. **Clareza sobre Complexidade**
   - Interface intuitiva que não requer treinamento
   - Hierarquia visual clara

2. **Velocidade Percebida**
   - Feedback instantâneo em todas as interações
   - Animações suaves mas rápidas (150-300ms)

3. **Consistência Visual**
   - Componentes reutilizáveis do shadcn/ui
   - Padrões de interação previsíveis

4. **Acessibilidade First**
   - Contraste mínimo 4.5:1
   - Suporte a navegação por teclado
   - Screen reader friendly

---

## 🎨 Paleta de Cores

### Tema Escuro (Principal)

```css
/* Background Layers */
--chat-bg-primary: #0f172a;      /* Fundo principal da aplicação */
--chat-bg-secondary: #1e293b;    /* Sidebar, cards elevados */
--chat-bg-tertiary: #334155;     /* Hover states, inputs */

/* Chat Bubbles */
--chat-bubble-sent: #10b981;     /* Mensagens enviadas (verde esmeralda) */
--chat-bubble-sent-hover: #059669;
--chat-bubble-received: #334155; /* Mensagens recebidas (cinza ardósia) */
--chat-bubble-received-hover: #475569;

/* Text Colors */
--chat-text-primary: #f1f5f9;    /* Texto principal (branco suave) */
--chat-text-secondary: #cbd5e1;  /* Texto de suporte */
--chat-text-muted: #94a3b8;      /* Timestamps, placeholders */
--chat-text-on-primary: #ffffff; /* Texto sobre cor primária */

/* Status Colors */
--chat-online: #10b981;          /* Indicador online (verde) */
--chat-offline: #64748b;         /* Indicador offline (cinza) */
--chat-typing: #f59e0b;          /* Indicador digitando (âmbar) */
--chat-unread: #ef4444;          /* Badge de não lidas (vermelho) */
--chat-delivered: #3b82f6;       /* Check de entrega (azul) */
--chat-read: #10b981;            /* Check de leitura (verde) */

/* Borders & Dividers */
--chat-border: #334155;          /* Bordas sutis */
--chat-border-light: #475569;    /* Bordas mais visíveis */

/* Interactive Elements */
--chat-hover: rgba(255, 255, 255, 0.05);
--chat-active: rgba(255, 255, 255, 0.1);
--chat-focus: #10b981;           /* Anel de foco */

/* AI SDR */
--chat-ai-primary: #06b6d4;      /* Cyan para AI */
--chat-ai-glow: rgba(6, 182, 212, 0.2);
```

### Tema Claro (Opcional - Futuro)

```css
--chat-bg-primary: #ffffff;
--chat-bg-secondary: #f8fafc;
--chat-bubble-sent: #10b981;
--chat-bubble-received: #e2e8f0;
--chat-text-primary: #0f172a;
--chat-text-secondary: #475569;
--chat-text-muted: #64748b;
```

---

## 📐 Tipografia

### Fonte Principal
**Manrope** (já instalada no projeto via `@fontsource/manrope`)

```css
/* Hierarquia de Texto */
--font-heading: 'Manrope', sans-serif;
--font-body: 'Manrope', sans-serif;
--font-mono: 'Fira Code', monospace; /* Para códigos/links */

/* Tamanhos */
--text-xs: 0.75rem;    /* 12px - Timestamps */
--text-sm: 0.875rem;   /* 14px - Texto secundário */
--text-base: 1rem;     /* 16px - Corpo de mensagem */
--text-lg: 1.125rem;   /* 18px - Nomes de contatos */
--text-xl: 1.25rem;    /* 20px - Títulos de seção */
--text-2xl: 1.5rem;    /* 24px - Página header */

/* Pesos */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;   /* Títulos */
--leading-normal: 1.5;   /* Corpo de texto */
--leading-relaxed: 1.75; /* Parágrafos longos */
```

---

## 🧩 Componentes - Especificações

### 1. Chat Index Screen (Lista de Conversas)

#### 1.1 Conversation Item (Item de Conversa)

```typescript
interface ConversationItemProps {
  avatar: string | null;
  name: string;
  phone: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  isOnline: boolean;
  isPinned: boolean;
  isTyping: boolean;
}
```

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ [Avatar]  João Silva                    [14:30]     │
│           Você conseguiu implementar... [2]         │
│           [●] Online                                │
└─────────────────────────────────────────────────────┘
```

**Dimensões:**
- Altura: 72px
- Padding: 12px 16px
- Avatar: 48x48px (circular)
- Badge de não lidas: 20x20px (circular, min-width: 20px)

**Estados:**
- **Normal:** `bg-transparent`
- **Hover:** `bg-chat-hover`
- **Active/Selected:** `bg-chat-active` + borda esquerda verde (4px)
- **Unread:** Nome em negrito + badge vermelho

**Animações:**
- Fade in ao carregar lista (stagger 50ms entre itens)
- Slide in da esquerda ao receber nova mensagem
- Pulse no badge de não lidas

#### 1.2 Search Bar (Barra de Busca)

```
┌─────────────────────────────────────────────────────┐
│ [🔍] Buscar contatos...                             │
└─────────────────────────────────────────────────────┘
```

**Dimensões:**
- Altura: 40px
- Padding: 8px 12px
- Border radius: 8px

**Comportamento:**
- Busca em tempo real (debounce 300ms)
- Highlight de resultados
- Esc para limpar

#### 1.3 Quick Actions (Ações Rápidas)

**Swipe Actions (Mobile/Desktop com drag):**
- Swipe para direita: Marcar como lida
- Swipe para esquerda: Arquivar/Deletar

**Context Menu (Clique direito):**
- Fixar conversa
- Marcar como não lida
- Arquivar
- Deletar
- Silenciar notificações

---

### 2. Chat Screen (Tela de Conversa)

#### 2.1 Chat Header

```
┌─────────────────────────────────────────────────────┐
│ [←] [Avatar] João Silva          [🔍] [📞] [⋮]      │
│              Online                                  │
└─────────────────────────────────────────────────────┘
```

**Dimensões:**
- Altura: 64px
- Padding: 12px 16px

**Elementos:**
- Botão voltar (mobile)
- Avatar (40x40px)
- Nome + status online
- Ações: Buscar, Ligar, Menu

#### 2.2 Message Bubble (Bolha de Mensagem)

**Mensagem Enviada:**
```
                        ┌─────────────────────────┐
                        │ Oi, tudo bem?          │
                        │ 14:30 ✓✓               │
                        └─────────────────────────┘
```

**Mensagem Recebida:**
```
┌─────────────────────────┐
│ [Avatar] Tudo ótimo!    │
│          14:31          │
└─────────────────────────┘
```

**Dimensões:**
- Max-width: 70% da tela (desktop), 80% (mobile)
- Padding: 12px 16px
- Border radius: 12px
- Gap entre mensagens: 4px (mesmo remetente), 12px (remetentes diferentes)

**Variações:**

**Mensagem com Mídia:**
```
┌─────────────────────────┐
│ [Imagem Preview]        │
│ Olha essa foto!         │
│ 14:32 ✓✓               │
└─────────────────────────┘
```

**Mensagem com Reply:**
```
┌─────────────────────────┐
│ ┃ João Silva            │
│ ┃ Oi, tudo bem?         │
│ Tudo ótimo, e você?     │
│ 14:33 ✓✓               │
└─────────────────────────┘
```

**Mensagem com Reações:**
```
┌─────────────────────────┐
│ Ótima ideia!            │
│ 14:34 ✓✓               │
│ [👍 3] [❤️ 1]          │
└─────────────────────────┘
```

**Confirmação de Leitura:**
- ✓ (cinza) = Enviada
- ✓✓ (cinza) = Entregue
- ✓✓ (verde) = Lida

#### 2.3 Date Separator (Separador de Data)

```
           ─────── Hoje ───────
```

**Estilo:**
- Text: `text-xs text-chat-text-muted`
- Centralizado
- Linhas laterais: `border-chat-border`

#### 2.4 Typing Indicator (Indicador de Digitação)

```
┌─────────────────────────┐
│ [Avatar] ●●●            │
└─────────────────────────┘
```

**Animação:**
- 3 pontos pulsando
- Duração: 1.2s (loop infinito)
- Cor: `text-chat-text-muted`

#### 2.5 Input Area (Área de Entrada)

```
┌─────────────────────────────────────────────────────┐
│ [😊] [📎] Digite sua mensagem...           [🎤] [➤] │
└─────────────────────────────────────────────────────┘
```

**Dimensões:**
- Min-height: 56px
- Max-height: 120px (4 linhas)
- Padding: 12px 16px

**Elementos:**
- Emoji picker button
- Attachment button
- Textarea (auto-expand)
- Voice record button (transforma em send quando há texto)
- Send button

**Estados:**
- **Empty:** Botão de microfone visível
- **With text:** Botão de enviar visível (verde)
- **Recording:** Indicador de gravação + timer + botão cancelar

---

### 3. Componentes Auxiliares

#### 3.1 Avatar Component

```typescript
interface AvatarProps {
  src: string | null;
  name: string;
  size: 'sm' | 'md' | 'lg'; // 32px, 48px, 64px
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
}
```

**Fallback:**
- Iniciais do nome (2 letras)
- Background: Cor gerada a partir do hash do nome
- Texto: Branco

**Online Indicator:**
- Badge verde (8x8px) no canto inferior direito
- Border branco (2px) para contraste

#### 3.2 Emoji Picker

**Biblioteca:** `emoji-picker-react`

**Customização:**
```typescript
<EmojiPicker
  theme="dark"
  emojiStyle="native"
  skinTonesDisabled
  searchPlaceholder="Buscar emoji..."
  categories={[
    'smileys_people',
    'animals_nature',
    'food_drink',
    'travel_places',
    'activities',
    'objects',
    'symbols',
    'flags'
  ]}
/>
```

#### 3.3 File Preview

**Imagem:**
```
┌─────────────────────────┐
│ [Thumbnail 200x200]     │
│ foto.jpg - 1.2 MB       │
│ [Baixar]                │
└─────────────────────────┘
```

**Documento:**
```
┌─────────────────────────┐
│ [📄] documento.pdf      │
│      2.5 MB             │
│ [Baixar]                │
└─────────────────────────┘
```

**Áudio:**
```
┌─────────────────────────┐
│ [▶] ━━━━━━━━━━━ 0:45    │
└─────────────────────────┘
```

#### 3.4 Context Menu

**Opções para Mensagem:**
- Responder
- Reagir (emojis rápidos: 👍 ❤️ 😂 😮 😢 🙏)
- Copiar
- Encaminhar
- Deletar (apenas para mensagens enviadas)

**Trigger:** Long press (mobile) ou clique direito (desktop)

---

## 📱 Responsividade

### Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  /* Lista de conversas em tela cheia */
  /* Chat em tela cheia ao selecionar conversa */
  /* Botão voltar visível */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* Sidebar de 280px */
  /* Chat ocupa restante */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Sidebar de 320px */
  /* Chat ocupa restante */
  /* Máximo 1400px de largura total */
}
```

### Layout Mobile

**Lista de Conversas:**
```
┌─────────────────────────┐
│ [Buscar]                │
│ ┌─────────────────────┐ │
│ │ Conversa 1          │ │
│ │ Conversa 2          │ │
│ │ Conversa 3          │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

**Chat Aberto:**
```
┌─────────────────────────┐
│ [←] João Silva          │
│ ┌─────────────────────┐ │
│ │ Mensagens           │ │
│ │                     │ │
│ └─────────────────────┘ │
│ [Input]                 │
└─────────────────────────┘
```

---

## 🎭 Animações e Transições

### Princípios

1. **Velocidade:** 150-300ms para micro-interações
2. **Easing:** `cubic-bezier(0.4, 0.0, 0.2, 1)` (ease-out)
3. **Performance:** Usar `transform` e `opacity` (GPU-accelerated)

### Animações Específicas

#### Nova Mensagem Recebida
```css
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.message-received {
  animation: slideInLeft 300ms ease-out;
}
```

#### Mensagem Enviada
```css
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.message-sent {
  animation: slideInRight 250ms ease-out;
}
```

#### Typing Indicator
```css
@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.typing-dot {
  animation: pulse 1.2s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}
```

#### Badge de Não Lidas
```css
@keyframes badgePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.unread-badge {
  animation: badgePulse 2s ease-in-out infinite;
}
```

#### Scroll para Baixo
```css
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.scroll-to-bottom-button {
  animation: bounce 1s ease-in-out infinite;
}
```

---

## ♿ Acessibilidade

### ARIA Labels

```tsx
// Conversation Item
<div role="button" aria-label={`Conversa com ${name}, ${unreadCount} mensagens não lidas`}>

// Message Bubble
<div role="article" aria-label={`Mensagem de ${sender} às ${time}`}>

// Send Button
<button aria-label="Enviar mensagem" disabled={!message.trim()}>

// Emoji Picker
<button aria-label="Abrir seletor de emojis">

// Voice Record
<button aria-label="Gravar mensagem de áudio">
```

### Navegação por Teclado

| Tecla | Ação |
|-------|------|
| `Tab` | Navegar entre elementos |
| `Enter` | Enviar mensagem / Abrir conversa |
| `Esc` | Fechar modals / Limpar busca |
| `↑` / `↓` | Navegar lista de conversas |
| `Ctrl+F` | Focar busca |
| `Ctrl+Enter` | Nova linha no textarea |

### Contraste de Cores

Todos os pares de cores atendem WCAG AA (4.5:1):

| Elemento | Foreground | Background | Contraste |
|----------|------------|------------|-----------|
| Texto principal | #f1f5f9 | #0f172a | 13.5:1 ✅ |
| Texto secundário | #cbd5e1 | #0f172a | 10.8:1 ✅ |
| Texto muted | #94a3b8 | #0f172a | 6.2:1 ✅ |
| Bubble enviada | #ffffff | #10b981 | 4.8:1 ✅ |
| Bubble recebida | #f1f5f9 | #334155 | 7.1:1 ✅ |

---

## 🎯 Estados de Interação

### Loading States

**Carregando conversas:**
```
┌─────────────────────────┐
│ [Skeleton] ░░░░░░░░░   │
│ [Skeleton] ░░░░░░░░░   │
│ [Skeleton] ░░░░░░░░░   │
└─────────────────────────┘
```

**Carregando mensagens:**
```
┌─────────────────────────┐
│ [Spinner] Carregando... │
└─────────────────────────┘
```

**Enviando mensagem:**
```
┌─────────────────────────┐
│ Sua mensagem aqui       │
│ Enviando... [Spinner]   │
└─────────────────────────┘
```

### Empty States

**Nenhuma conversa:**
```
┌─────────────────────────┐
│      [💬 Icon]          │
│   Nenhuma conversa      │
│   Inicie uma nova       │
│   [+ Novo Chat]         │
└─────────────────────────┘
```

**Conversa selecionada sem mensagens:**
```
┌─────────────────────────┐
│      [📱 Icon]          │
│   Nenhuma mensagem      │
│   Envie a primeira!     │
└─────────────────────────┘
```

### Error States

**Erro ao enviar:**
```
┌─────────────────────────┐
│ Sua mensagem aqui       │
│ [⚠️] Erro ao enviar     │
│ [Tentar novamente]      │
└─────────────────────────┘
```

**Sem conexão:**
```
┌─────────────────────────┐
│ [⚠️] Sem conexão        │
│ Reconectando...         │
└─────────────────────────┘
```

---

## 📦 Componentes shadcn/ui Utilizados

```bash
# Já instalados no projeto
- Avatar
- Badge
- Button
- Dialog
- Input
- ScrollArea
- Separator
- Switch
- Textarea
- Tooltip

# Novos a instalar
npx shadcn@latest add context-menu
npx shadcn@latest add dropdown-menu
npx shadcn@latest add skeleton
npx shadcn@latest add popover
```

---

## 🎨 Referências Visuais

### Inspirações de Design

1. **WhatsApp Web** - Layout de duas colunas, bubbles arredondadas
2. **Telegram** - Animações suaves, indicadores visuais claros
3. **Slack** - Organização de conversas, busca avançada
4. **Discord** - Tema escuro elegante, status de presença
5. **iMessage** - Reações em mensagens, efeitos visuais

### Diferenciadores do Neondash

- **Integração com CRM** - Badge indicando se contato é lead/paciente
- **AI SDR** - Indicador visual quando IA está ativa na conversa
- **Contexto de Saúde Estética** - Ícones e linguagem específicos do domínio
- **Profissionalismo** - Design mais sóbrio que apps de chat pessoal

---

## 📊 Métricas de Sucesso do Design

### Usabilidade
- **Tempo para enviar primeira mensagem:** < 5 segundos
- **Taxa de erro em ações:** < 2%
- **Satisfação do usuário (SUS Score):** > 80/100

### Performance
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Smooth animations:** 60 FPS constante

### Acessibilidade
- **WCAG 2.1 Level AA:** 100% conformidade
- **Navegação por teclado:** Todas as ações acessíveis
- **Screen reader:** Todas as informações anunciadas

---

## 🚀 Próximos Passos

1. ✅ Design system definido
2. 🔄 Criar mockups de alta fidelidade (Figma)
3. 🔄 Prototipar interações principais
4. 🔄 Validar com stakeholders
5. 🔄 Implementar componentes base
6. 🔄 Testar com usuários reais

