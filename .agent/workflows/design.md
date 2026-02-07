---
description: Unified frontend design workflow using planning, ui-ux-pro-max, and frontend-design skills. Triggers on /design command.
---

# Command: /design

Comprehensive design workflow combining **research/planning** → **design system** → **implementation** → **validation**.

## Trigger
- `/design` or `/design "description"`
- Design-related requests: create UI, build component, design page, improve UX

---

## Skill Architecture

| Priority | Skill | Role | Phase |
|----------|-------|------|-------|
| P0 | `planning` | Research & Plan | Pre-Phase (L4+) |
| P1 | `ui-ux-pro-max` | Design Intelligence | Phase 1 |
| P2 | `frontend-design` | Assets + Validation | Phase 2-4 |

---

## 🔴 Pre-Phase: Research (L4+ Tasks Only)

> [!CAUTION]
> For L4+ complexity (new page/feature/redesign), execute `/plan` workflow first.

| Complexity | Action |
|------------|--------|
| L1-L3 | Skip to Phase 0 |
| L4+ | **Execute APEX Research → Create `docs/PLAN-design-{slug}.md`** |

### APEX Research (if L4+)
1. **LOCAL**: `grep_search` existing components, colors, similar pages
2. **CONTEXT7**: shadcn/ui, Tailwind v4, React 19 docs
3. **TAVILY**: Industry UX patterns (if needed)
4. **SYNTHESIS**: Sequential thinking → define approach

### Design Plan Output (`docs/PLAN-design-{slug}.md`)
```markdown
# PLAN-design-{slug}: {Title}
> **Goal:** {One-line objective}

## Skill Loading Protocol (MANDATORY DURING EXECUTION)
> [!CAUTION]
> Before executing ANY Atomic Task, the agent MUST:
> 1. **READ** `.agent/skills/frontend-design/SKILL.md` → Apply React 19 patterns, Tailwind v4, A11y, animation, and form standards
> 2. **READ** `.agent/skills/ui-ux-pro-max/SKILL.md` → Generate design system, query domains, apply anti-patterns checklist
> 3. **FOLLOW** the skill integration map below to use the right skill at each phase

### Skill Integration Map
| Phase | Skill | What to Use |
|-------|-------|-------------|
| Design System | `ui-ux-pro-max` | `--design-system` command, domain searches (`style`, `color`, `typography`, `ux`) |
| Component Design | `ui-ux-pro-max` | Stack guidelines (`--stack shadcn`), chart recommendations, anti-patterns |
| Component Build | `frontend-design` | React performance patterns, bundle optimization, component boundaries |
| Styling | `frontend-design` | Tailwind v4 patterns, Web Design Standards (A11y, animation, forms, typography) |
| Assets | `frontend-design` | AI prototyping (Stitch), image generation (Nano Banana Pro) |
| Validation | Both | `ui-ux-pro-max` Pre-Delivery Checklist + `frontend-design` Component Checklist |

## Research Findings
| # | Finding | Confidence | Source |
|---|---------|------------|--------|

## Design Specs
- **Hierarchy:** Primary/Secondary/Tertiary elements
- **Colors (60-30-10):** Background/Foreground/Accent
- **Typography:** Heading/Body/Caption

## Atomic Tasks
### AT-001: {Task}
- [ ] ST-001.1: {Subtask} → File: `path` → Validation: {check}
```

### Skill Integration During Execution (MANDATORY)

> [!IMPORTANT]
> When `/implement` executes a design plan, the agent MUST integrate skills efficiently:

#### `ui-ux-pro-max` — Design Intelligence (use BEFORE writing code)

| When | Action |
|------|--------|
| Starting a new component/page | Run `--design-system` to get style, typography, colors, effects |
| Choosing chart type | Run `--domain chart "..."` for data visualization recommendations |
| Defining interactions | Run `--domain ux "..."` for animation/accessibility best practices |
| Selecting fonts | Run `--domain typography "..."` for font pairing recommendations |
| Before delivery | Run Pre-Delivery Checklist (icons, cursor, contrast, layout) |

#### `frontend-design` — Implementation Standards (use WHILE writing code)

| When | Action |
|------|--------|
| Fetching data | Apply `async-parallel` pattern (Promise.all for independent ops) |
| Importing components | Apply `bundle-barrel-imports` rule (direct imports, no barrels) |
| Adding client interactivity | Apply `client-boundary` rule (keep "use client" at leaf level) |
| Building forms | Apply Forms standards (autocomplete, inputmode, labels, errors) |
| Adding animations | Apply Animation standards (only transform/opacity, prefers-reduced-motion) |
| Styling text | Apply Typography standards (ellipsis, curly quotes, tabular-nums) |
| Final review | Run Component Checklist (shadcn primitives, focus states, a11y) |

#### Efficient Skill Usage Pattern

```
┌─────────────────────────────────────────────────────────────┐
│  FOR EACH ATOMIC TASK:                                      │
├─────────────────────────────────────────────────────────────┤
│  1. DESIGN PHASE (ui-ux-pro-max)                           │
│     └─→ Query design system / domain for the component     │
│     └─→ Define: colors, typography, layout, interactions   │
│                                                              │
│  2. BUILD PHASE (frontend-design)                           │
│     └─→ Apply React 19 performance patterns                │
│     └─→ Apply Tailwind v4 + shadcn/ui standards            │
│     └─→ Apply A11y, animation, form standards              │
│                                                              │
│  3. VALIDATE PHASE (both skills)                            │
│     └─→ ui-ux-pro-max: visual quality + interaction check  │
│     └─→ frontend-design: component + accessibility check   │
└─────────────────────────────────────────────────────────────┘
```

## Phase 0: Requirement Analysis (MANDATORY)

**⛔ Complete before designing!**

### Extract
- **Product type**: SaaS, dashboard, landing, etc.
- **Style**: minimal, professional, dark mode, etc.
- **Stack**: Default `shadcn`

### Socratic Gate
If unclear, ASK: "What color palette?", "What style?", "Layout preference?"

## Phase 1: Design System (ui-ux-pro-max)

### Generate Design System (REQUIRED)
```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<product> <industry> <keywords>" --design-system -p "Project"
```

### Persist (Multi-page)
```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project" --page "dashboard"
```

### Supplementary Searches
```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "query" --domain ux|style|typography|color
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "query" --stack shadcn|react|nextjs
```

**Domains:** `product`, `style`, `typography`, `color`, `landing`, `chart`, `ux`, `react`, `web`
**Stacks:** `html-tailwind`, `react`, `nextjs`, `vue`, `svelte`, `swiftui`, `shadcn`

## Phase 1.5: AI Prototyping (Stitch)

> **Goal:** Generate high-fidelity UI prototypes and code using Gemini 3.0.

### 1. Create Design File
Create `docs/DESIGN-{slug}.md` to store all outputs.

### 2. Generate Prototype (Stitch)
```bash
# 1. Create Project
stitch_create_project(title="{slug}")

# 2. Generate Screen (Iterate until satisfied)
stitch_generate_screen_from_text(
  project_id="...",
  prompt="High-fidelity dashboard for [User], [Style] aesthetics (Navy/Gold), using Tailwind v4 and shadcn/ui. [Specific Features]. Use gemini-3-pro."
)

# 3. Capture Code
# Copy full `output_components` from the tool response into docs/DESIGN-{slug}.md
```

### 3. Generate Assets (Nano Banana Pro)
For hero images or specific visuals needed in the design:
```bash
# REQUIRED: Use --model gemini-3-pro for high fidelity
python3 .agent/skills/frontend-design/scripts/generate_images.py "Prompt" "filename" --model gemini-3-pro
```

## Phase 1.3: shadcn Registry Search (MANDATORY)

> [!IMPORTANT]
> **Before building any component**, search the 6 configured registries for existing solutions.

### Registry Reference (`components.json`)

| Registry | URL Pattern | Specialty |
|----------|-------------|-----------|
| `@kokonutui` | `kokonutui.com/r/{name}.json` | Modern animated components |
| `@tailark` | `tailark.com/r/{name}.json` | Premium Tailwind blocks |
| `@cult-ui` | `cult-ui.com/r/{name}.json` | Cult-favorite UI patterns |
| `@reui` | `reui.io/r/{name}.json` | Minimalist React UI |
| `@react-bits` | `reactbits.dev/r/{name}.json` | Micro-interactions & bits |
| `@aceternity` | `ui.aceternity.com/registry/{name}.json` | Animated premium components |

### Search Protocol

**Step 1: Identify Component Need**
```
Component needed: [card, button, modal, hero, pricing, testimonial, etc.]
```

**Step 2: Query Registry JSONs**
```bash
# Check if component exists in registry (use read_url_content or curl)
# Pattern: {registry_url}/{component_name}.json

# Example: Search for "hero" component
curl -s https://kokonutui.com/r/hero.json
curl -s https://tailark.com/r/hero.json
curl -s https://cult-ui.com/r/hero.json
curl -s https://reui.io/r/hero.json
curl -s https://reactbits.dev/r/hero.json
curl -s https://ui.aceternity.com/registry/hero.json
```

**Step 3: Install from Registry**
```bash
# Install from specific registry
bunx shadcn@latest add @kokonutui/animated-card
bunx shadcn@latest add @tailark/hero-section
bunx shadcn@latest add @cult-ui/dock
bunx shadcn@latest add @reui/button
bunx shadcn@latest add @react-bits/animated-tooltip
bunx shadcn@latest add @aceternity/sparkles
```

### Component Category Mapping

| Need | Priority Registries | Common Names |
|------|---------------------|--------------|
| **Cards** | `@kokonutui`, `@aceternity` | `card`, `bento-grid`, `hover-card` |
| **Buttons** | `@reui`, `@cult-ui` | `button`, `shiny-button`, `magnetic-button` |
| **Heroes** | `@tailark`, `@aceternity` | `hero`, `hero-section`, `lamp` |
| **Navigation** | `@kokonutui`, `@cult-ui` | `navbar`, `dock`, `sidebar` |
| **Charts** | `@kokonutui` | `chart-card`, `stats` |
| **Modals** | `@cult-ui`, `@reui` | `modal`, `dialog`, `drawer` |
| **Forms** | `@reui`, `@tailark` | `input`, `form`, `select` |
| **Animations** | `@aceternity`, `@react-bits` | `sparkles`, `background-beams`, `spotlight` |
| **Testimonials** | `@tailark`, `@aceternity` | `testimonial`, `marquee`, `infinite-moving-cards` |
| **Pricing** | `@tailark`, `@kokonutui` | `pricing`, `pricing-card` |

### Decision Flow

```
┌─────────────────────────────────────────────────────────────┐
│  COMPONENT NEEDED: [name]                                   │
├─────────────────────────────────────────────────────────────┤
│  1. CHECK LOCAL: client/src/components/ui/                  │
│     └─→ Exists? → USE IT (extend if needed)                 │
│                                                              │
│  2. CHECK REGISTRIES (priority order):                      │
│     └─→ @aceternity (animations)                            │
│     └─→ @kokonutui (modern)                                 │
│     └─→ @tailark (blocks)                                   │
│     └─→ @cult-ui (patterns)                                 │
│     └─→ @reui (minimal)                                     │
│     └─→ @react-bits (micro)                                 │
│                                                              │
│  3. FOUND? → bunx shadcn@latest add @{registry}/{name}      │
│                                                              │
│  4. NOT FOUND? → Build custom (Phase 3)                     │
└─────────────────────────────────────────────────────────────┘
```

### Quick Search Commands

```bash
# List installed components
ls client/src/components/ui/

# Search shadcn docs for component
# Use context7 MCP for official docs
mcp_context7_query-docs libraryId="/shadcn-ui/ui" query="[component_name]"

# Search registry websites for available components
# @kokonutui: https://kokonutui.com/docs/components
# @tailark: https://tailark.com/components
# @cult-ui: https://cult-ui.com/docs/components
# @aceternity: https://ui.aceternity.com/components
```

## Phase 2: Asset Generation (Optional)

### Image Generation
```bash
python3 .agent/skills/frontend-design/scripts/generate_images.py "prompt" "filename"
```

### Generative Art (p5.js)
Templates: `.agent/skills/frontend-design/assets/p5-templates/`
Guide: `algorithmic-art-guide.md`

### Canvas Art (PDF/PNG)
Fonts: `.agent/skills/frontend-design/assets/canvas-fonts/`
Guide: `canvas-design-guide.md`

## Phase 3: Implementation

### Theme (GPUS)
```
60% → Background (Navy/White)
30% → Foreground (Gold/Dark Blue)
10% → Accent/CTA (Gold)
```

Assets: `.agent/skills/gpus-theme/assets/`

### Component Usage (shadcn/ui)
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FeatureCard({ ...props }) {
  return (
    <Card className="border-primary/20 hover:shadow-lg transition-shadow">
      <CardHeader><CardTitle>Title</CardTitle></CardHeader>
      <CardContent>{/* content */}</CardContent>
    </Card>
  );
}
```

### Build Order
1. HTML structure (semantic, accessible)
2. CSS/Tailwind (8-point grid, tokens)
3. Interactivity (states, transitions)

### Requirements
- React 19 + Tailwind v4 + shadcn/ui
- Mobile-first, 44px+ touch targets
- WCAG 2.1 AA (contrast 4.5:1, keyboard nav)
- `prefers-reduced-motion` respected

## Phase 4: Validation (MANDATORY)

```bash
python3 .agent/skills/frontend-design/scripts/ux_audit.py <path>
python3 .agent/skills/frontend-design/scripts/accessibility_checker.py <file>
bun run check && bun run lint && bun test
```

## Phase 5: Store Design Patterns (Evolution Core)

> [!NOTE]
> **Evolution Core Integration** - Store implemented patterns for future reference

**EXECUTE AFTER COMPLETING DESIGN:**

```bash
# turbo
python3 .agent/skills/evolution-core/scripts/memory_manager.py capture "Implemented: [COMPONENT_TYPE] with [STYLE] pattern in [FILE]" -t "design_pattern"
```

### Pattern Examples

```bash
# Component patterns
python3 memory_manager.py capture "Implemented: Dashboard card grid with Navy/Gold GPUS theme in client/src/pages/Dashboard.tsx" -t "design_pattern"

# Animation patterns
python3 memory_manager.py capture "Implemented: Micro-animation on hover with framer-motion scale(1.02) in FeatureCard.tsx" -t "design_pattern"

# Layout patterns
python3 memory_manager.py capture "Implemented: Asymmetric hero layout breaking bento anti-pattern in LandingPage.tsx" -t "design_pattern"
```

### Pattern Retrieval for Future Designs

```bash
# Query past design patterns
python3 .agent/skills/evolution-core/scripts/memory_manager.py query --text "dashboard layout pattern"
```

## Anti-Patterns (FORBIDDEN)

| ❌ Forbidden | ✅ Alternative |
|-------------|----------------|
| Left/Right Split Hero | Massive Typography, Vertical Narrative |
| Bento Grids | Asymmetric layouts |
| Mesh/Aurora Gradients | Solid colors, Grain textures |
| Glassmorphism everywhere | High-contrast flat |
| Purple/Violet | **PURPLE BAN ✅** |
| Emoji as icons | SVG (Heroicons/Lucide) |

## Pre-Delivery Checklist

### Research (L4+)
- [ ] Plan file: `docs/PLAN-design-{slug}.md`

### Visual
- [ ] No emojis as icons
- [ ] `cursor-pointer` on clickables
- [ ] Hover transitions 150-300ms
- [ ] Theme colors (`bg-primary` not `var()`)

### Accessibility
- [ ] Contrast 4.5:1
- [ ] Focus states visible
- [ ] Touch targets 44px+

### Responsive
- [ ] Tested: 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll mobile

### Code
- [ ] `bun run check` ✓
- [ ] `bun run lint` ✓
- [ ] UX audit script ✓

## Skill References

| Skill | Key Files |
|-------|-----------|
| planning | `SKILL.md` (APEX methodology) |
| ui-ux-pro-max | `SKILL.md`, `data/*.csv` (styles, colors, typography) |
| frontend-design | `SKILL.md`, `ux-psychology.md`, `tailwind-v4-patterns.md` |
| gpus-theme | `assets/theme-tokens.css`, `assets/tailwind-theme.ts` |

---