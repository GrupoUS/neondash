---
name: frontend-design
description: "Unified frontend design skill covering UI/UX design, Tailwind CSS v4, generative art (p5.js), canvas art (PDF/PNG), image generation (Nano Banana/Gemini), and design system intelligence. Use when designing components, layouts, color schemes, typography, creating visual assets, fixing frontend errors, or building aesthetic interfaces."
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Frontend Design System

> [!IMPORTANT]
> **Dual Skill Architecture:** This skill works in partnership with `ui-ux-pro-max`:
> - **ui-ux-pro-max** → Design System Generation (what design to use)
> - **frontend-design** → Assets + Validation (how to implement)
>
> For design system searches, use `ui-ux-pro-max/scripts/search.py`.

> **Philosophy:** Every pixel has purpose. Restraint is luxury. User psychology drives decisions.
> **Core Principle:** THINK, don't memorize. ASK, don't assume.
> **Default Theme:** GPUS Navy/Gold palette from `gpus-theme` skill.

---

## 🎯 Selective Reading Rule (MANDATORY)

**Read REQUIRED files always, OPTIONAL only when needed:**

| File | Status | When to Read |
| ---- | ------ | ------------ |
| [../gpus-theme/SKILL.md](../gpus-theme/SKILL.md) | 🔴 **REQUIRED** | Always! Default theme |
| [ux-psychology.md](ux-psychology.md) | 🔴 **REQUIRED** | Always read first! |
| [color-system.md](color-system.md) | ⚪ Optional | Non-GPUS color decisions |
| [typography-system.md](typography-system.md) | ⚪ Optional | Font selection/pairing |
| [visual-effects.md](visual-effects.md) | ⚪ Optional | Glassmorphism, shadows, gradients |
| [animation-guide.md](animation-guide.md) | ⚪ Optional | Animation needed |
| [motion-graphics.md](motion-graphics.md) | ⚪ Optional | Lottie, GSAP, 3D |
| [decision-trees.md](decision-trees.md) | ⚪ Optional | Context templates |
| [tailwind-v4-patterns.md](tailwind-v4-patterns.md) | ⚪ Optional | Tailwind CSS v4, container queries |
| [algorithmic-art-guide.md](algorithmic-art-guide.md) | ⚪ Optional | p5.js, generative art |
| [canvas-design-guide.md](canvas-design-guide.md) | ⚪ Optional | PDF/PNG visual art |
| [design-system-search.md](design-system-search.md) | ⚪ Optional | Search 50+ styles, palettes |
| [nanobananaskill.md](nanobananaskill.md) | ⚪ Optional | AI image generation |

---

## 🔧 Runtime Scripts (Unique to frontend-design)

| Script | Purpose | Usage |
| ------ | ------- | ----- |
| `scripts/ux_audit.py` | UX & Accessibility Audit | `python scripts/ux_audit.py <project_path>` |
| `scripts/accessibility_checker.py` | WCAG Compliance Check | `python scripts/accessibility_checker.py <file>` |
| `scripts/generate_images.py` | Nano Banana Image Gen | `python scripts/generate_images.py "prompt" "filename"` |

> **Note:** For design system generation, use `ui-ux-pro-max/scripts/search.py --design-system`. See [ui-ux-pro-max SKILL.md](../ui-ux-pro-max/SKILL.md).

---

## ⚠️ ASK BEFORE ASSUMING (MANDATORY)

**Color not specified?** Ask: "What color palette do you prefer?"
**Style not specified?** Ask: "What style are you going for?"
**Layout not specified?** Ask: "Do you have a layout preference?"

### Anti-Patterns to Avoid

| AI Default Tendency | Think Instead |
| ------------------- | ------------- |
| Bento Grids | Why does this content NEED a grid? |
| Hero Split (Left/Right) | Massive Typography or Vertical Narrative? |
| Mesh/Aurora Gradients | What's a radical color pairing? |
| Glassmorphism | Solid, high-contrast flat? |
| Deep Cyan / Fintech Blue | Red, Black, or Neon Green? |
| Dark + neon glow | What does the BRAND need? |
| Purple/violet everything | **PURPLE BAN ✅** |

---

## 1. Core UX Principles

### Constraint Analysis (ALWAYS FIRST)

| Constraint | Question | Why It Matters |
| ---------- | -------- | -------------- |
| **Timeline** | How much time? | Determines complexity |
| **Content** | Ready or placeholder? | Affects layout flexibility |
| **Brand** | Existing guidelines? | May dictate colors/fonts |
| **Tech** | What stack? | Affects capabilities |
| **Audience** | Who exactly? | Drives all visual decisions |

### Core Laws

| Law | Principle | Application |
| --- | --------- | ----------- |
| **Hick's** | More choices = slower decisions | Limit options |
| **Fitts'** | Bigger + closer = easier to click | Size CTAs appropriately |
| **Miller's** | ~7 items in working memory | Chunk content |
| **Von Restorff** | Different = memorable | Make CTAs visually distinct |

---

## 2. Design Execution

### Color: GPUS Navy/Gold Palette (DEFAULT)

**Use the GPUS theme by default:**

| Mode | Background | Text | Primary/CTA |
|------|------------|------|-------------|
| Light | White `#fff` | Dark Blue | Gold `38 60% 45%` |
| Dark | Navy `211 49% 10%` | Gold `39 44% 65%` | Gold |

**60-30-10 Rule:**
- 60% → Background (Navy/White)
- 30% → Foreground (Gold/Dark Blue)
- 10% → Accent/CTA (Gold)

**Theme Assets:**
- CSS: `.agent/skills/gpus-theme/assets/theme-tokens.css`
- Tailwind: `.agent/skills/gpus-theme/assets/tailwind-theme.ts`
- shadcn: `.agent/skills/gpus-theme/assets/components.json`

### Typography

- Line length: 45-75 characters
- Line height: 1.4-1.6 for body
- Size: 16px+ for body on web

### Layout (8-Point Grid)

- Tight: 4px → Small: 8px → Medium: 16px → Large: 24-32px → XL: 48-80px

---

## 3. Visual Asset Generation

### Image Generation (Nano Banana)

```bash
python .agent/skills/frontend-design/scripts/generate_images.py "Your prompt" "output_filename"
```

Models:
- **gemini-3-flash-preview**: Speed/bulk placeholders
- **gemini-3-pro-preview**: Hero/marketing assets

### Generative Art (p5.js)

Use templates in `assets/p5-templates/`:
- `viewer.html` - Interactive artifact template
- `generator_template.js` - Code patterns

Read [algorithmic-art-guide.md](algorithmic-art-guide.md) for philosophy creation process.

### Canvas Art (PDF/PNG)

Use fonts in `assets/canvas-fonts/` (81 fonts).

Read [canvas-design-guide.md](canvas-design-guide.md) for visual philosophy process.

---

## 4. Design System Intelligence

### Search for Recommendations

```bash
# Full design system
python .agent/skills/frontend-design/scripts/search.py "saas dashboard" --design-system

# Domain-specific
python .agent/skills/frontend-design/scripts/search.py "minimalism" --domain style
python .agent/skills/frontend-design/scripts/search.py "elegant" --domain typography
python .agent/skills/frontend-design/scripts/search.py "animation" --domain ux
```

Domains: `style`, `color`, `typography`, `product`, `landing`, `chart`, `ux`, `react`, `web`

Data in `assets/ui-ux-data/` (12 CSVs + 11 stack files).

---

## 5. CSS/Tailwind Patterns

### GPUS Theme Integration (DEFAULT)

Always use the GPUS theme tokens from `gpus-theme` skill:

```css
/* Import GPUS theme */
@import "tailwindcss";

/* Use semantic tokens */
.card {
  background: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
}

/* Custom utilities available */
.premium-card {
  @apply glass-card bg-mesh;
}
```

### Tailwind v4 Quick Reference

- Container queries: `@sm:`, `@md:`, `@lg:`
- CSS variables: All tokens as `--*` vars
- Read [tailwind-v4-patterns.md](tailwind-v4-patterns.md) for full guide
- **Theme reference:** [../gpus-theme/references/css-variables.md](../gpus-theme/references/css-variables.md)

---

## 6. Animation Principles

| Action | Easing | Duration |
| ------ | ------ | -------- |
| Entering | Ease-out | 150-300ms |
| Leaving | Ease-in | 150-300ms |
| Emphasis | Ease-in-out | 200-400ms |

- Animate only `transform` and `opacity`
- Respect `prefers-reduced-motion`

---

## 7. "Wow Factor" Checklist

- [ ] Generous whitespace
- [ ] Subtle depth and dimension
- [ ] Smooth, purposeful animations
- [ ] Cohesive visual rhythm
- [ ] Custom elements (not all defaults)

---

## 8. Decision Process

```
1. CONSTRAINTS → What's the timeline, brand, tech, audience?
2. CONTENT → What exists? What's the hierarchy?
3. STYLE DIRECTION → If unclear → ASK (don't default!)
4. EXECUTION → Apply principles, check anti-patterns
5. REVIEW → "Does this serve the user?" "Is this different from my defaults?"
```

---

## Assets

| Folder | Contents |
| ------ | -------- |
| `../gpus-theme/assets/` | **GPUS theme tokens, CSS, shadcn config** |
| `../gpus-theme/references/` | CSS variables, component inventory |
| `assets/canvas-fonts/` | 81 fonts for canvas design |
| `assets/p5-templates/` | p5.js viewer + generator |
| `assets/ui-ux-data/` | 12 CSVs + 11 stack guides |
| `scripts/` | 4 Python automation scripts |

---

> **Remember:** Design is THINKING, not copying. Every project deserves fresh consideration. **Avoid the Modern SaaS Safe Harbor!**
