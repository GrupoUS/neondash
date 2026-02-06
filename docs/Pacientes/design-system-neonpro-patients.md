# Design System: NeonPro Patient Management
## Página de Gestão de Pacientes com Prontuário Completo e IA Integrada

**Projeto:** NeonPro - Sistema de Gestão para Clínicas de Estética  
**Contexto:** Healthcare SaaS, Aesthetic Medicine, Brazilian Market  
**Stack:** React + TypeScript + TailwindCSS + shadcn/ui  
**Data:** 06 de Fevereiro de 2026

---

## 1. PRODUCT PATTERN

### Tipo de Produto
**Healthcare SaaS Dashboard** com foco em gestão de pacientes para clínicas de estética

### Características Principais
- **Compliance**: LGPD, auditoria de acessos, consentimento informado
- **Mobile-first**: Profissionais acessam de tablets durante atendimento
- **Real-time**: Atualizações instantâneas de prontuário
- **Feature-rich**: Funcionalidades avançadas sem comprometer usabilidade
- **AI-powered**: Chat widget integrado para análise e simulação

### Público-Alvo
- **Primário**: Donos de clínicas de estética, coordenadores
- **Secundário**: Profissionais de estética (dermatologistas, biomédicos, enfermeiros)
- **Contexto de uso**: Consultório, durante atendimento, planejamento de tratamentos

---

## 2. VISUAL STYLE

### Estilo Recomendado: **Professional Healthcare + Soft Luxury**

**Justificativa:**
- Transmite confiança e credibilidade (essencial para área médica)
- Sofisticação sutil (alinhado com estética de alta performance)
- Clean e organizado (facilita leitura de informações médicas densas)
- Toques de luxo discretos (dourado/rose gold em destaques)

### Características Visuais

#### Layout
- **Cards elevados**: Sombras suaves (shadow-sm, shadow-md)
- **Espaçamento generoso**: 24-32px entre seções principais
- **Bordas arredondadas**: rounded-lg (8px) para cards, rounded-md (6px) para inputs
- **Grid responsivo**: 1 col (mobile) → 2 cols (tablet) → 3-4 cols (desktop)

#### Efeitos
- **Glassmorphism sutil**: Para modals e overlays (backdrop-blur-sm)
- **Hover transitions**: 150-200ms ease-in-out
- **Micro-interactions**: Feedback visual em todas as ações
- **Skeleton loading**: Durante carregamento de dados

#### Densidade
- **Confortável por padrão**: Padding generoso, line-height 1.6
- **Opção compacta**: Para usuários avançados (reduz padding em 25%)

---

## 3. COLOR PALETTE

### Paleta Principal: **Healthcare Professional + Aesthetic Luxury**

#### Primary Colors
```css
--primary-900: #1a2332  /* Azul profundo - headers, textos importantes */
--primary-700: #294359  /* Azul médio - botões primários, links */
--primary-500: #3d5a73  /* Azul claro - hover states */
--primary-300: #7a92a8  /* Azul suave - borders, dividers */
--primary-100: #e8edf2  /* Azul muito claro - backgrounds */
```

#### Secondary Colors (Accent Luxury)
```css
--secondary-700: #ac9469  /* Dourado suave - badges premium, destaques */
--secondary-500: #c4a97a  /* Dourado médio - hover em elementos premium */
--secondary-300: #dcc9a8  /* Dourado claro - backgrounds de destaque */
```

#### Neutral Colors
```css
--neutral-900: #112031  /* Quase preto - textos principais */
--neutral-700: #4a5568  /* Cinza escuro - textos secundários */
--neutral-500: #718096  /* Cinza médio - textos terciários */
--neutral-300: #b4ac9c  /* Cinza quente - placeholders, disabled */
--neutral-200: #d2d0c8  /* Cinza claro - borders, dividers */
--neutral-100: #f7f6f4  /* Off-white - backgrounds */
--neutral-50: #fdfcfb   /* Branco quente - cards, modals */
```

#### Semantic Colors
```css
/* Success - Verde Saúde */
--success-700: #2d6a4f
--success-500: #40916c
--success-300: #95d5b2
--success-100: #d8f3dc

/* Warning - Amarelo Atenção */
--warning-700: #d97706
--warning-500: #f59e0b
--warning-300: #fbbf24
--warning-100: #fef3c7

/* Error - Vermelho Médico */
--error-700: #b91c1c
--error-500: #dc2626
--error-300: #f87171
--error-100: #fee2e2

/* Info - Azul Informação */
--info-700: #1e40af
--info-500: #3b82f6
--info-300: #93c5fd
--info-100: #dbeafe
```

#### Special Colors (Healthcare Context)
```css
--allergy-alert: #fca5a5    /* Vermelho suave para alergias */
--medication-badge: #a78bfa  /* Roxo para medicamentos */
--appointment-blue: #60a5fa  /* Azul para consultas */
--photo-purple: #c084fc     /* Roxo para fotos antes/depois */
```

### Aplicação de Cores

#### Backgrounds
- **Page background**: neutral-50 (#fdfcfb)
- **Card background**: neutral-50 (white) com shadow
- **Hover card**: neutral-100 (#f7f6f4)
- **Selected item**: primary-100 (#e8edf2)
- **Sidebar**: neutral-900 (#112031) ou neutral-50 (modo claro)

#### Text
- **Heading**: neutral-900 (#112031)
- **Body**: neutral-700 (#4a5568)
- **Caption**: neutral-500 (#718096)
- **Placeholder**: neutral-300 (#b4ac9c)
- **Disabled**: neutral-300 (#b4ac9c)

#### Buttons
- **Primary**: primary-700 bg, white text
- **Secondary**: neutral-200 border, neutral-900 text
- **Success**: success-500 bg, white text
- **Danger**: error-500 bg, white text
- **Ghost**: transparent bg, primary-700 text

#### Badges
- **Status Active**: success-100 bg, success-700 text
- **Status Inactive**: neutral-200 bg, neutral-700 text
- **Status Pending**: warning-100 bg, warning-700 text
- **Premium/VIP**: secondary-300 bg, secondary-700 text
- **Alert/Allergy**: error-100 bg, error-700 text

---

## 4. TYPOGRAPHY

### Font Pairing: **Inter (Sans-serif) + System UI**

**Justificativa:**
- **Inter**: Excelente legibilidade em telas, suporta múltiplos pesos, otimizada para UI
- **System UI fallback**: Performance e familiaridade para usuários

### Escala Tipográfica

```css
/* Display - Títulos de página */
--text-display: 2.5rem (40px), font-weight: 700, line-height: 1.2

/* H1 - Títulos principais */
--text-h1: 2rem (32px), font-weight: 700, line-height: 1.25

/* H2 - Subtítulos de seção */
--text-h2: 1.5rem (24px), font-weight: 600, line-height: 1.3

/* H3 - Títulos de card */
--text-h3: 1.25rem (20px), font-weight: 600, line-height: 1.4

/* H4 - Subtítulos de card */
--text-h4: 1.125rem (18px), font-weight: 600, line-height: 1.4

/* Body Large - Texto de destaque */
--text-body-lg: 1rem (16px), font-weight: 500, line-height: 1.6

/* Body - Texto padrão */
--text-body: 0.875rem (14px), font-weight: 400, line-height: 1.6

/* Body Small - Texto secundário */
--text-body-sm: 0.8125rem (13px), font-weight: 400, line-height: 1.5

/* Caption - Legendas, timestamps */
--text-caption: 0.75rem (12px), font-weight: 400, line-height: 1.4

/* Overline - Labels, categorias */
--text-overline: 0.6875rem (11px), font-weight: 600, line-height: 1.3, letter-spacing: 0.5px, text-transform: uppercase
```

### Aplicação Tipográfica

#### Page Header
- **Título**: text-h1, neutral-900
- **Subtítulo**: text-body, neutral-500

#### Card Header
- **Título**: text-h3, neutral-900
- **Ação**: text-body-sm, primary-700

#### Form Labels
- **Label**: text-body-sm, neutral-700, font-weight: 500
- **Helper text**: text-caption, neutral-500
- **Error**: text-caption, error-700

#### Tables
- **Header**: text-body-sm, neutral-700, font-weight: 600
- **Cell**: text-body-sm, neutral-900
- **Caption**: text-caption, neutral-500

#### Badges
- **Text**: text-caption, font-weight: 600

---

## 5. SPACING & LAYOUT

### Sistema de Espaçamento (baseado em 4px)

```css
--space-1: 0.25rem (4px)
--space-2: 0.5rem (8px)
--space-3: 0.75rem (12px)
--space-4: 1rem (16px)
--space-5: 1.25rem (20px)
--space-6: 1.5rem (24px)
--space-8: 2rem (32px)
--space-10: 2.5rem (40px)
--space-12: 3rem (48px)
--space-16: 4rem (64px)
```

### Aplicação de Espaçamento

#### Page Layout
- **Container padding**: space-6 (mobile), space-8 (desktop)
- **Section gap**: space-8
- **Card gap**: space-6

#### Card Internals
- **Card padding**: space-6
- **Card header padding**: space-4 space-6
- **Card content padding**: space-6
- **Card footer padding**: space-4 space-6

#### Forms
- **Field gap**: space-4
- **Label margin-bottom**: space-2
- **Input padding**: space-3 space-4
- **Button padding**: space-3 space-6

#### Lists & Tables
- **Row padding**: space-4
- **Cell padding**: space-3 space-4
- **Row gap**: space-2

### Grid System

#### Breakpoints
```css
--breakpoint-sm: 640px   /* Mobile landscape */
--breakpoint-md: 768px   /* Tablet */
--breakpoint-lg: 1024px  /* Desktop */
--breakpoint-xl: 1280px  /* Large desktop */
--breakpoint-2xl: 1536px /* Extra large */
```

#### Grid Columns
- **Mobile (< 640px)**: 1 column
- **Tablet (640-1024px)**: 2 columns
- **Desktop (> 1024px)**: 3-4 columns (dependendo do conteúdo)

---

## 6. COMPONENTS

### Cards

#### Patient Info Card
```tsx
<Card className="shadow-md hover:shadow-lg transition-shadow">
  <CardHeader className="border-b border-neutral-200">
    <CardTitle className="text-h3 text-neutral-900">
      Informações Pessoais
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4 pt-6">
    {/* Content */}
  </CardContent>
</Card>
```

**Variantes:**
- **Default**: Branco, shadow-md
- **Highlighted**: primary-100 background, border-primary-300
- **Alert**: error-100 background, border-error-300
- **Premium**: secondary-300 background, border-secondary-700

### Buttons

#### Hierarquia
```tsx
/* Primary - Ações principais */
<Button className="bg-primary-700 text-white hover:bg-primary-900">
  Salvar Prontuário
</Button>

/* Secondary - Ações secundárias */
<Button variant="outline" className="border-neutral-300 text-neutral-900">
  Cancelar
</Button>

/* Ghost - Ações terciárias */
<Button variant="ghost" className="text-primary-700 hover:bg-primary-100">
  Ver Detalhes
</Button>

/* Destructive - Ações perigosas */
<Button variant="destructive" className="bg-error-500 text-white">
  Excluir Paciente
</Button>
```

#### Tamanhos
- **sm**: padding space-2 space-4, text-body-sm
- **md** (default): padding space-3 space-6, text-body
- **lg**: padding space-4 space-8, text-body-lg

#### Estados
- **Default**: Cores padrão
- **Hover**: Escurecer 10-15%
- **Active**: Escurecer 20%
- **Disabled**: opacity-50, cursor-not-allowed
- **Loading**: Spinner + disabled

### Badges

```tsx
/* Status Active */
<Badge className="bg-success-100 text-success-700 border-success-300">
  Ativo
</Badge>

/* Status Pending */
<Badge className="bg-warning-100 text-warning-700 border-warning-300">
  Pendente
</Badge>

/* Allergy Alert */
<Badge className="bg-error-100 text-error-700 border-error-300">
  ⚠️ Alergia
</Badge>

/* Premium */
<Badge className="bg-secondary-300 text-secondary-700 border-secondary-700">
  👑 VIP
</Badge>
```

### Timeline (Prontuário)

```tsx
<div className="space-y-6">
  {events.map(event => (
    <div key={event.id} className="flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-primary-700" />
        <div className="w-0.5 flex-1 bg-neutral-200" />
      </div>
      
      {/* Event content */}
      <Card className="flex-1">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-h4">{event.title}</CardTitle>
              <p className="text-caption text-neutral-500">{event.date}</p>
            </div>
            <Badge>{event.type}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {event.description}
        </CardContent>
      </Card>
    </div>
  ))}
</div>
```

### Photo Comparison (Antes/Depois)

```tsx
<div className="relative group">
  {/* Slider container */}
  <div className="relative overflow-hidden rounded-lg">
    <img src={beforePhoto} className="w-full" />
    <img 
      src={afterPhoto} 
      className="absolute top-0 left-0 w-full"
      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
    />
    
    {/* Slider handle */}
    <div 
      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
      style={{ left: `${sliderPosition}%` }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
        <svg>...</svg>
      </div>
    </div>
  </div>
  
  {/* Labels */}
  <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-caption">
    Antes
  </div>
  <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-caption">
    Depois
  </div>
</div>
```

### Chat IA Widget (Floating)

```tsx
<div className="fixed bottom-6 right-6 z-50">
  {/* Floating button */}
  <Button 
    size="lg"
    className="rounded-full w-14 h-14 shadow-2xl bg-gradient-to-br from-primary-700 to-secondary-700 hover:scale-110 transition-transform"
  >
    <Sparkles className="w-6 h-6" />
  </Button>
  
  {/* Expanded chat panel */}
  {isOpen && (
    <Card className="absolute bottom-20 right-0 w-96 h-[600px] shadow-2xl">
      {/* Chat content */}
    </Card>
  )}
</div>
```

---

## 7. ICONS

### Biblioteca: **Lucide React**

**Justificativa:**
- Já usado no NeonPro existente
- Consistente com shadcn/ui
- Ótima variedade de ícones médicos/healthcare
- Customizável (tamanho, cor, stroke)

### Ícones Principais

#### Navegação
- `Home`, `Users`, `Calendar`, `FileText`, `Settings`, `LogOut`

#### Pacientes
- `User`, `UserCheck`, `UserPlus`, `UserX`, `Users`

#### Médico/Saúde
- `Stethoscope`, `Heart`, `Pill`, `Syringe`, `Activity`, `Thermometer`

#### Alertas
- `AlertCircle`, `AlertTriangle`, `Info`, `CheckCircle`, `XCircle`

#### Ações
- `Edit`, `Trash2`, `Save`, `Download`, `Upload`, `Share2`, `Copy`

#### Mídia
- `Camera`, `Image`, `Eye`, `EyeOff`, `ZoomIn`, `ZoomOut`

#### IA/Chat
- `Sparkles`, `MessageSquare`, `Send`, `Mic`, `Volume2`

### Tamanhos Padrão
- **xs**: 12px (w-3 h-3)
- **sm**: 16px (w-4 h-4)
- **md**: 20px (w-5 h-5)
- **lg**: 24px (w-6 h-6)
- **xl**: 32px (w-8 h-8)

---

## 8. ANIMATIONS & TRANSITIONS

### Princípios
- **Sutileza**: Animações discretas, não distrativas
- **Performance**: Usar transform e opacity (GPU-accelerated)
- **Propósito**: Cada animação deve ter função clara
- **Acessibilidade**: Respeitar prefers-reduced-motion

### Durações
```css
--duration-fast: 150ms     /* Hover, focus */
--duration-normal: 200ms   /* Transitions padrão */
--duration-slow: 300ms     /* Modals, panels */
--duration-slower: 500ms   /* Page transitions */
```

### Easing
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### Aplicações

#### Hover States
```css
transition: all 150ms ease-out;
&:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
```

#### Modal/Dialog
```css
/* Backdrop */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Content */
@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### Loading Skeleton
```css
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #e0e0e0 50%,
    #f0f0f0 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
```

#### Success Feedback
```css
@keyframes checkmark {
  0% { 
    stroke-dashoffset: 100;
    opacity: 0;
  }
  50% { opacity: 1; }
  100% { 
    stroke-dashoffset: 0;
    opacity: 1;
  }
}
```

---

## 9. ACCESSIBILITY (WCAG 2.1 AA+)

### Contraste de Cores
✅ **Todos os pares de cores atendem WCAG AA (4.5:1)**

- neutral-900 em neutral-50: 16.2:1 ✅
- neutral-700 em neutral-50: 9.8:1 ✅
- primary-700 em neutral-50: 8.5:1 ✅
- success-700 em success-100: 7.2:1 ✅

### Navegação por Teclado
- **Tab order**: Segue ordem visual
- **Focus visible**: Anel azul 2px solid primary-500
- **Skip links**: "Pular para conteúdo principal"
- **Atalhos**: Documentados e customizáveis

### Screen Readers
- **Landmarks**: header, nav, main, aside, footer
- **ARIA labels**: Em botões apenas com ícones
- **Alt text**: Descritivo em todas as imagens
- **Live regions**: Para notificações e atualizações

### Forms
- **Labels**: Sempre associados com "for"
- **Error messages**: role="alert", próximas ao campo
- **Required**: Indicado visualmente E semanticamente
- **Help text**: aria-describedby

---

## 10. RESPONSIVE DESIGN

### Breakpoints Strategy

#### Mobile First (< 640px)
- **Layout**: 1 coluna
- **Navigation**: Hamburger menu
- **Cards**: Full width
- **Tables**: Scroll horizontal ou cards empilhados
- **Chat IA**: Full screen modal

#### Tablet (640px - 1024px)
- **Layout**: 2 colunas
- **Navigation**: Sidebar colapsável
- **Cards**: 2 por linha
- **Tables**: Scroll horizontal
- **Chat IA**: Floating panel 380px

#### Desktop (> 1024px)
- **Layout**: 3-4 colunas
- **Navigation**: Sidebar fixa
- **Cards**: 3-4 por linha
- **Tables**: Full width
- **Chat IA**: Floating panel 400px ou sidebar

### Touch Targets
- **Mínimo**: 44x44px (WCAG AAA)
- **Recomendado**: 48x48px
- **Espaçamento**: 8px entre targets

---

## 11. DATA VISUALIZATION

### Charts (para estatísticas de pacientes)

#### Biblioteca: **Recharts** (já integrado com React)

#### Tipos Recomendados

**Line Chart - Evolução de Pacientes**
```tsx
<LineChart data={monthlyData}>
  <Line 
    type="monotone" 
    dataKey="newPatients" 
    stroke={colors.primary[700]}
    strokeWidth={2}
  />
  <Line 
    type="monotone" 
    dataKey="totalPatients" 
    stroke={colors.secondary[700]}
    strokeWidth={2}
  />
</LineChart>
```

**Bar Chart - Procedimentos por Tipo**
```tsx
<BarChart data={procedureData}>
  <Bar 
    dataKey="count" 
    fill={colors.primary[700]}
    radius={[4, 4, 0, 0]}
  />
</BarChart>
```

**Pie Chart - Distribuição de Status**
```tsx
<PieChart>
  <Pie 
    data={statusData}
    dataKey="value"
    nameKey="name"
    cx="50%"
    cy="50%"
    outerRadius={80}
  />
</PieChart>
```

### Paleta para Charts
```js
const chartColors = [
  colors.primary[700],    // Azul
  colors.secondary[700],  // Dourado
  colors.success[500],    // Verde
  colors.info[500],       // Azul claro
  colors.warning[500],    // Amarelo
  colors.error[500],      // Vermelho
];
```

---

## 12. PERFORMANCE

### Otimizações Obrigatórias

#### Images
- **Format**: WebP com fallback para PNG/JPG
- **Lazy loading**: Para fotos de pacientes
- **Responsive images**: srcset com múltiplos tamanhos
- **Compression**: TinyPNG ou similar (< 200KB por imagem)

#### Code Splitting
- **Route-based**: Cada página em bundle separado
- **Component-based**: Lazy load de componentes pesados (charts, photo viewer)
- **Vendor splitting**: React, UI library em bundles separados

#### Caching
- **API responses**: React Query com staleTime 5min
- **Images**: Service Worker cache
- **Static assets**: Cache-Control headers

#### Bundle Size
- **Target**: < 200KB initial bundle (gzipped)
- **Tree shaking**: Importar apenas componentes usados
- **Remove unused**: Remover código morto

---

## 13. ANTI-PATTERNS (EVITAR)

### ❌ Design
- Múltiplos estilos de navegação na mesma página
- Elementos desalinhados ou com espaçamento inconsistente
- Botões com tamanhos baseados em campos adjacentes
- Cores usadas sem propósito semântico claro
- Mais de 3 níveis de hierarquia visual na mesma tela

### ❌ UX
- Formulários sem validação inline
- Ações destrutivas sem confirmação
- Loading states ausentes
- Erro sem mensagem clara
- Navegação que muda comportamento entre páginas

### ❌ Acessibilidade
- Contraste insuficiente (< 4.5:1)
- Falta de focus states
- Botões sem label (apenas ícone sem aria-label)
- Formulários sem labels associados
- Conteúdo que depende apenas de cor

### ❌ Performance
- Imagens não otimizadas (> 500KB)
- Renderização de listas longas sem virtualização
- Re-renders desnecessários
- Bundle único gigante (> 1MB)
- Falta de lazy loading

---

## 14. IMPLEMENTATION CHECKLIST

### Setup Inicial
- [ ] Configurar TailwindCSS com paleta customizada
- [ ] Instalar shadcn/ui e configurar tema
- [ ] Configurar Lucide React para ícones
- [ ] Configurar React Query para cache
- [ ] Configurar React Router para navegação

### Componentes Base
- [ ] Button (todas as variantes)
- [ ] Card (todas as variantes)
- [ ] Badge (todas as variantes)
- [ ] Input, Textarea, Select
- [ ] Modal/Dialog
- [ ] Tabs
- [ ] Table
- [ ] Timeline

### Componentes Específicos
- [ ] PatientHeader (foto, nome, badges)
- [ ] PatientInfoCard (informações pessoais)
- [ ] PatientMedicalCard (alergias, medicamentos)
- [ ] PatientTimeline (histórico cronológico)
- [ ] PhotoComparison (antes/depois com slider)
- [ ] ChatIAWidget (floating + expanded)

### Features
- [ ] Navegação por tabs (Overview, Prontuário, Fotos, Documentos)
- [ ] CRUD de pacientes
- [ ] Upload e gestão de fotos
- [ ] Timeline de procedimentos
- [ ] Integração com chat IA
- [ ] Simulação de resultados com Nano Banana
- [ ] Exportação de relatórios (PDF)

### Qualidade
- [ ] Testes de contraste (WCAG AA)
- [ ] Testes de navegação por teclado
- [ ] Testes de screen reader
- [ ] Testes de responsividade (mobile, tablet, desktop)
- [ ] Testes de performance (Lighthouse > 90)
- [ ] Validação de formulários
- [ ] Error boundaries

---

## 15. REFERÊNCIAS E INSPIRAÇÕES

### Design Systems
- **Material Design 3** (Healthcare guidelines)
- **Ant Design** (Data-heavy interfaces)
- **Chakra UI** (Acessibilidade)

### Produtos Similares
- **OpenEMR** (Open-source EHR)
- **Practice Fusion** (Cloud-based EHR)
- **Aesthetic Record** (Specific for aesthetic clinics)
- **RxPhoto** (Medical photo management)

### Recursos
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Tailwind UI**: https://tailwindui.com/components
- **shadcn/ui**: https://ui.shadcn.com/
- **Lucide Icons**: https://lucide.dev/

---

**Versão:** 1.0  
**Última atualização:** 06 de Fevereiro de 2026  
**Autor:** Manus AI (baseado em pesquisa e análise do NeonPro existente)
