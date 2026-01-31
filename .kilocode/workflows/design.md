---
description: Orchestrates high-quality frontend design using the unified frontend-design skill. Triggers on /design command.
---

# Command: /design

Comprehensive design workflow for web/mobile applications. Combines UI/UX design principles, design system search (50+ styles, 97 palettes), and implementation best practices.

## Trigger

- `/design` or `/design "description"`
- Design-related requests: create UI, build component, design page, improve UX

---

## Prerequisites

```bash
# Verify Python for design system search
python3 --version || python --version
```

---

## Workflow

### Phase 1: Deep Design Thinking (MANDATORY)

**⛔ DO NOT start designing until you complete this analysis!**

#### 1.1 Self-Questioning (Internal)

```
🔍 CONTEXT ANALYSIS:
├── What is the sector? → What emotions should it evoke?
├── Who is the target audience? → Age, tech-savviness, expectations?
├── What do competitors look like? → What should I NOT do?
└── What is the soul of this site/app? → In one word?

🎨 DESIGN IDENTITY:
├── What will make this design UNFORGETTABLE?
├── What unexpected element can I use?
├── 🚫 MODERN CLICHÉ CHECK: Am I using Bento Grid or Mesh Gradient? (IF YES → CHANGE!)
└── Will I remember this design in a year?
```

#### 1.2 Generate Design System (REQUIRED)

```bash
python3 .agent/skills/frontend-design/scripts/search.py "<product_type> <industry> <keywords>" --design-system -p "Project Name"
```

**Example:**
```bash
python3 .agent/skills/frontend-design/scripts/search.py "beauty spa wellness service" --design-system -p "Serenity Spa"
```

#### 1.3 Anti-Safe Harbor Check

**These are FORBIDDEN as defaults:**

| ❌ Forbidden Default | ✅ Alternative |
|---------------------|----------------|
| Left/Right Split Hero | Massive Typography, Vertical Narrative |
| Bento Grids | Asymmetric layouts, Overlapping layers |
| Mesh/Aurora Gradients | Solid colors, Grain textures |
| Glassmorphism | High-contrast flat |
| Deep Cyan/Fintech Blue | Red, Black, Neon Green |
| Purple/Violet anything | **PURPLE BAN ✅** |

---

### Phase 2: Design Commitment

**You must declare before coding:**

```markdown
🎨 DESIGN COMMITMENT:
- **Style:** [Brutalist / Neo-Retro / Swiss Punk / Liquid Digital]
- **Why this style?** → How does it break sector clichés?
- **Geometry:** [Sharp 0-2px / Extreme rounded 16-32px]
- **Palette:** [e.g., High Contrast Red/Black - NOT Cyan/Blue]
- **Layout uniqueness:** [e.g., 90/10 asymmetry, NOT 50/50 split]
```

---

### Phase 3: Supplementary Searches (as needed)

```bash
# Domain-specific details
python3 .agent/skills/frontend-design/scripts/search.py "animation accessibility" --domain ux
python3 .agent/skills/frontend-design/scripts/search.py "elegant luxury" --domain typography
python3 .agent/skills/frontend-design/scripts/search.py "dark mode dashboard" --domain style

# Stack-specific guidelines (default: html-tailwind)
python3 .agent/skills/frontend-design/scripts/search.py "responsive form" --stack html-tailwind
```

**Available Domains:** `product`, `style`, `typography`, `color`, `landing`, `chart`, `ux`, `react`, `web`

**Available Stacks:** `html-tailwind`, `react`, `nextjs`, `shadcn`, `vue`, `svelte`, `react-native`

---

### Phase 4: Asset Generation (Parallel)

| Asset Type | Method | Reference |
|------------|--------|-----------|
| **Placeholder Images** | `python3 .agent/skills/frontend-design/scripts/generate_images.py "prompt" "filename"` | `nanobananaskill.md` |
| **Generative Art** | p5.js with `assets/p5-templates/` | `algorithmic-art-guide.md` |
| **Static Visuals** | PDF/PNG with `assets/canvas-fonts/` | `canvas-design-guide.md` |

---

### Phase 5: Implementation

**Build order:**

1. **HTML structure** (semantic, accessible)
2. **CSS/Tailwind** (8-point grid, design system tokens)
3. **Interactivity** (states, transitions, animations)

**Requirements:**

- React 19 + Tailwind v4 + shadcn/ui (or pure Tailwind if preferred)
- Mobile-first, 44px+ touch targets
- WCAG 2.1 AA compliance (contrast 4.5:1, keyboard nav, screen reader)
- `prefers-reduced-motion` respected
- Portuguese interface when applicable

---

### Phase 6: Reality Check (ANTI-SELF-DECEPTION)

**Verify HONESTLY before delivering:**

| Question | FAIL | PASS |
|----------|------|------|
| "Could this be a Vercel/Stripe template?" | "Well, it's clean..." | "No way, this is unique." |
| "Would I scroll past this on Dribbble?" | "It's professional..." | "I'd stop and think 'how?'" |
| "Can I describe it without 'clean' or 'minimal'?" | "It's clean corporate." | "It's brutalist with staggered reveals." |

**Rejection Triggers (delete and restart if any are true):**

| Trigger | Fix |
|---------|-----|
| "Safe Split" (50/50, 60/40) | Switch to 90/10 or Overlapping |
| "Glass Trap" (backdrop-blur without solid borders) | Use solid colors and raw borders |
| "Bento Trap" (safe rounded grid boxes) | Break alignment intentionally |
| "Blue Trap" (default blue/teal primary) | Use Acid Green, Signal Orange, Deep Red |

---

## Pre-Delivery Checklist

### Visual Quality
- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)

### Contrast & Accessibility
- [ ] Light mode text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected

### Responsive
- [ ] Tested at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile

---

## Skill References

All design knowledge is in the unified `frontend-design` skill:

| Reference File | When to Read |
|----------------|--------------|
| `SKILL.md` | Always (master index) |
| `ux-psychology.md` | Always (core UX principles) |
| `tailwind-v4-patterns.md` | Tailwind CSS v4, container queries |
| `color-system.md` | Color/palette decisions |
| `typography-system.md` | Font selection |
| `visual-effects.md` | Shadows, gradients, glassmorphism |
| `animation-guide.md` | Animation needed |
| `design-system-search.md` | Using search scripts |
| `algorithmic-art-guide.md` | p5.js generative art |
| `canvas-design-guide.md` | PDF/PNG visual art |
| `nanobananaskill.md` | AI image generation |

---

## Usage Examples

```bash
/design "Dashboard brutalista para métricas de vendas"
/design "Landing page minimalista para clínica de estética"
/design "Background generativo de partículas para a landing"
/design  # (interactive mode - will ask questions)
```

---

> 🔴 **MAESTRO RULE:** "If I can find this layout in a Tailwind UI template, I have FAILED."
