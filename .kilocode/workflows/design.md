---
description: Unified frontend design workflow using planning, ui-ux-pro-max, and frontend-design skills. Triggers on /design command.
---

# /design - Frontend Design Workflow

Research → Design System → Build → Validate → Evolve

## Trigger
- `/design` or `/design "description"`
- Design requests: create UI, build component, design page, improve UX

---

## 🔴 RULES

1. **SKILLS**: Load `ui-ux-pro-max` (BEFORE code) + `frontend-design` (WHILE coding)
2. **REGISTRIES**: Search shadcn registries BEFORE building custom components
3. **THEME**: 60/30/10 rule — use `gpus-theme` skill for project tokens
4. **A11Y**: WCAG 2.1 AA mandatory (contrast 4.5:1, keyboard, touch 44px+)
5. **EVOLVE**: Capture design patterns after completion

---

## Skills Architecture

| Skill | Role | When |
|-------|------|------|
| `planning` | Research & Plan | Pre-Phase (L4+ only) |
| `ui-ux-pro-max` | Design intelligence | BEFORE writing code |
| `frontend-design` | Build standards | WHILE writing code |
| `gpus-theme` | Project theme tokens | During styling |

---

## Pre-Phase: Research (L4+ Only)

> [!CAUTION]
> For L4+ complexity (new page/feature/redesign), execute `/plan` first.

| Complexity | Action |
|------------|--------|
| L1-L3 | Skip to Phase 0 |
| L4+ | APEX Research → `docs/PLAN-design-{slug}.md` |

APEX: Local → Context7 (shadcn, Tailwind v4, React 19) → Tavily → Sequential Thinking

---

## Phase 0: Requirement Analysis

**Extract**: Product type · Style (minimal, dark, etc.) · Stack (`shadcn` default)

**Socratic Gate**: If unclear, ASK: palette? style? layout preference?

---

## Phase 1: Design System (ui-ux-pro-max)

```bash
# Generate design system (REQUIRED)
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<product> <industry>" --design-system -p "Project"

# Supplementary queries
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "query" --domain ux|style|typography|color|chart
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "query" --stack shadcn
```

**Domains**: `product`, `style`, `typography`, `color`, `landing`, `chart`, `ux`, `react`, `web`

---

## Phase 1.5: shadcn Registry Search (MANDATORY)

> [!IMPORTANT]
> Search registries BEFORE building any custom component.

### Decision Flow

```
1. CHECK LOCAL: client/src/components/ui/ → Exists? USE IT
2. CHECK REGISTRIES → Found? → bunx shadcn@latest add @{registry}/{name}
3. NOT FOUND? → Build custom
```

### Registries

| Registry | Specialty | Install |
|----------|-----------|---------|
| `@aceternity` | Animated premium | `bunx shadcn@latest add @aceternity/{name}` |
| `@kokonutui` | Modern animated | `bunx shadcn@latest add @kokonutui/{name}` |
| `@tailark` | Premium blocks | `bunx shadcn@latest add @tailark/{name}` |
| `@cult-ui` | UI patterns | `bunx shadcn@latest add @cult-ui/{name}` |
| `@reui` | Minimalist | `bunx shadcn@latest add @reui/{name}` |
| `@react-bits` | Micro-interactions | `bunx shadcn@latest add @react-bits/{name}` |

### Category → Registry

| Need | Priority Registries |
|------|---------------------|
| Cards/Grids | `@kokonutui`, `@aceternity` |
| Heroes/Landing | `@tailark`, `@aceternity` |
| Navigation/Sidebar | `@kokonutui`, `@cult-ui` |
| Buttons | `@reui`, `@cult-ui` |
| Animations | `@aceternity`, `@react-bits` |
| Forms/Inputs | `@reui`, `@tailark` |
| Charts | `@kokonutui` |

---

## Phase 2: Asset Generation (Optional)

```bash
# Images
python3 .agent/skills/frontend-design/scripts/generate_images.py "prompt" "filename" --model gemini-3-pro

# Generative art: .agent/skills/frontend-design/assets/p5-templates/
# Canvas art: .agent/skills/frontend-design/assets/canvas-fonts/
```

---

## Phase 3: Implementation

### Per-Task Skill Flow

```
FOR EACH COMPONENT:
  1. DESIGN (ui-ux-pro-max) → colors, typography, layout, interactions
  2. BUILD (frontend-design) → React 19 + Tailwind v4 + shadcn/ui + A11y
  3. VALIDATE (both) → visual quality + component checklist
```

### Build Order
1. Semantic HTML structure
2. Tailwind CSS (8-point grid, tokens)
3. Interactivity (states, transitions, animations)

### Theme (GPUS)
- 60% Background (Navy/White)
- 30% Foreground (Gold/Dark Blue)
- 10% Accent/CTA (Gold)
- Assets: `.agent/skills/gpus-theme/assets/`

### Requirements
- React 19 + Tailwind v4 + shadcn/ui
- Mobile-first, 44px+ touch targets
- `prefers-reduced-motion` respected
- Animations: only `transform`/`opacity`, 150-300ms

---

## Phase 4: Validation (MANDATORY)

```bash
python3 .agent/skills/frontend-design/scripts/ux_audit.py <path>
python3 .agent/skills/frontend-design/scripts/accessibility_checker.py <file>
bun run check && bun run lint && bun test
```

---

## Phase 5: Capture Patterns (evolution-core)

```bash
# turbo
python3 .agent/skills/evolution-core/scripts/memory_manager.py capture "Implemented: [COMPONENT] with [STYLE] in [FILE]" -t "design_pattern"
```

---

## Anti-Patterns (FORBIDDEN)

| ❌ Forbidden | ✅ Alternative |
|-------------|----------------|
| Left/Right Split Hero | Massive Typography, Vertical Narrative |
| Bento Grids | Asymmetric layouts |
| Mesh/Aurora Gradients | Solid colors, Grain textures |
| Glassmorphism everywhere | High-contrast flat |
| Purple/Violet | **PURPLE BAN** |
| Emoji as icons | SVG (Lucide) |

---

## Pre-Delivery Checklist

```yaml
visual:       [ ] No emojis as icons? cursor-pointer on clickables? Transitions 150-300ms?
accessibility:[ ] Contrast 4.5:1? Focus states? Touch 44px+?
responsive:   [ ] Tested 375/768/1024/1440px? No horizontal scroll?
code:         [ ] bun run check ✓ | bun run lint ✓ | UX audit ✓
evolution:    [ ] Pattern captured?
```

---

## References

| Skill | Key Files |
|-------|-----------|
| ui-ux-pro-max | `SKILL.md`, `data/*.csv` |
| frontend-design | `SKILL.md`, `tailwind-v4-patterns.md` |
| gpus-theme | `assets/theme-tokens.css` |
| evolution-core | `scripts/memory_manager.py` |