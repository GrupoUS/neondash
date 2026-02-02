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

---

## Phase 0: Requirement Analysis (MANDATORY)

**⛔ Complete before designing!**

### Constraints
| Constraint | Question |
|------------|----------|
| Timeline | How much time? |
| Content | Ready or placeholder? |
| Brand | Existing guidelines? |
| Audience | Who exactly? |

### Extract
- **Product type**: SaaS, dashboard, landing, etc.
- **Style**: minimal, professional, dark mode, etc.
- **Stack**: Default `shadcn`

### Socratic Gate
If unclear, ASK: "What color palette?", "What style?", "Layout preference?"

---

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

---

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

---

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

---

## Phase 4: Validation (MANDATORY)

```bash
python3 .agent/skills/frontend-design/scripts/ux_audit.py <path>
python3 .agent/skills/frontend-design/scripts/accessibility_checker.py <file>
bun run check && bun run lint && bun test
```

---

## Anti-Patterns (FORBIDDEN)

| ❌ Forbidden | ✅ Alternative |
|-------------|----------------|
| Left/Right Split Hero | Massive Typography, Vertical Narrative |
| Bento Grids | Asymmetric layouts |
| Mesh/Aurora Gradients | Solid colors, Grain textures |
| Glassmorphism everywhere | High-contrast flat |
| Purple/Violet | **PURPLE BAN ✅** |
| Emoji as icons | SVG (Heroicons/Lucide) |

---

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

---

## Skill References

| Skill | Key Files |
|-------|-----------|
| planning | `SKILL.md` (APEX methodology) |
| ui-ux-pro-max | `SKILL.md`, `data/*.csv` (styles, colors, typography) |
| frontend-design | `SKILL.md`, `ux-psychology.md`, `tailwind-v4-patterns.md` |
| gpus-theme | `assets/theme-tokens.css`, `assets/tailwind-theme.ts` |

---

## Usage
```bash
/design "Dashboard brutalista para métricas"
/design "Landing minimalista para clínica"
/design  # interactive mode
```

---

> 🔴 **MAESTRO RULE:** "If I can find this layout in a Tailwind UI template, I have FAILED."
