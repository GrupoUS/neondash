# Plan: Integrate Notion "Start Here" Content into Landing Page

> **Goal**: Migrate the "HEY NEON, COMECE AQUI" Notion page content into a high-converting, aesthetic section on the Neon Dash landing page.

## 🔍 Context & Research
- **Source**: Notion Page `2f64d8c589888155b9b0fd476e35b51a`
- **Sections Identified**:
  1. **Como funciona a mentoria na prática?** (Process/Steps)
  2. **O que espero de você?** (Expectations/Rules)
  3. **Apresente-se** (Onboarding/Form)
  4. **Gerencie seu tempo** (Productivity/Tools)
  5. **FAQ** (Questions & Answers)
  6. **Apresentação do Time** (Team Grid)

## 🎨 Design Vision (Avant-Garde UI)
- **Style**: Intentional Minimalism, Dark Mode, High Contrast.
- **Components**:
  - **Process**: Vertical Timeline or Horizontal Glass Cards.
  - **FAQ**: Radix/Shadcn Accordion with smooth open/close.
  - **Team**: Bento Grid layout with hover effects.
  - **Expectations**: Icon-driven feature grid.

## 📝 Implementation Plan

### Phase 1: Structure & Routing
- [ ] **Create Route**: Add `/comece-aqui` or integrate into main Landing Page (`/`).
  - *Recommendation*: Create a dedicated "Onboarding/Start" page if it's for mentors, or a "Sobre a Mentoria" section if it's for marketing. Assuming **Marketing/Sales** context based on "Landing Page".
- [ ] **Component Shell**: Create `client/src/components/landing/MentorshipSection.tsx`.

### Phase 2: Content Sections Implementation
- [ ] **Section 1: "Como Funciona"**
  - Design: 4-Step Timeline (Visual flow).
  - Content: Steps from Notion (Video Aulas, Ferramentas, Caderno, Encontros).
  - Verify: Responsive layout on mobile.
- [ ] **Section 2: "O Que Espero de Você"**
  - Design: Grid of 3-4 Cards (Commitment, Execution, etc.).
  - Content: "Execução é mais importante", "Não maratonar", etc.
- [ ] **Section 3: "Gerencie Seu Tempo" & "Apresente-se"**
  - Design: Split layout (Text + CTA Button).
  - Action: Link "Apresente-se" to the Onboarding Form (existing or new).
- [ ] **Section 4: FAQ**
  - Design: `Accordion` component from shadcn/ui.
  - Content:
    - "Para que serve este Notion?"
    - "Como usar este Notion?"
    - (Add others found in research).
- [ ] **Section 5: Team**
  - Design: Circular Avatars or Bento Grid.
  - Content: Sacha Gualberto, Maurício Magalhães, etc.

### Phase 3: Content Migration (Manual/Assisted)
- [ ] **Extract Text**: Since automated scraping had limits, manually verify text against the Notion screenshot/page during implementation.
- [ ] **Assets**: Use `generate_image` or placeholder icons for visual elements.

### Phase 4: Polish & Navigation
- [ ] **Menu Link**: Add "Mentoria" to the Navbar.
- [ ] **Animations**: Add Framer Motion entrance animations (fade-up).
- [ ] **Mobile Optimization**: Ensure timeline stacks vertically.

### Phase 5: Onboarding Guide (Crucial Enhancement)
- [ ] **Create Step-by-Step Guide**:
  - Add a dedicated subsection in "Comece Aqui" specifically for "Primeiros Passos no Sistema".
- [ ] **Content**:
  1. **Login**: "Clique no botão 'Entrar' no canto superior direito. Use seu e-mail cadastrado."
  2. **Perfil**: "Ao acessar, verifique seus dados básicos."
  3. **Preencher Métricas**: "Vá até a aba 'Lançar Métricas' para registrar seus dados atuais. Isso é vital para o acompanhamento."
  4. **Feedback**: "Acompanhe os feedbacks mensais na aba 'Visão Geral'."
- [ ] **UI Implementation**:
  - Use a `Stepper` or `Checklist` component to make it interactive.
  - "Passo 1: Login" -> Screenshot or Icon.
  - "Passo 2: Cadastro" -> Link to the Profile/Metrics form.

## ✅ Done When
- [ ] Landing page has a cohesive "Mentorship" section.
- [ ] All 6 identified Notion sections are represented.
- [ ] Onboarding Steps are clear and lead user to action (Login/Forms).
- [ ] FAQ is interactive.
- [ ] Navigation flows correctly.
- [ ] Design matches the "Neon" aesthetic (Dark/Vibrant).
