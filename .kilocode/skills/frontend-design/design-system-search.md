# Design System Search

> Search-based design intelligence with styles, palettes, typography, and UX guidelines.

---

## Overview

This system provides BM25-powered search across comprehensive design databases including:
- 50+ UI styles
- 97 color palettes
- 57 font pairings
- 99 UX guidelines
- 25 chart types
- 9 technology stacks

---

## Usage

### Generate Design System (Recommended)

Always start with `--design-system` to get comprehensive recommendations:

```bash
python .agent/skills/frontend-design/scripts/search.py "<query>" --design-system
```

Example:
```bash
python .agent/skills/frontend-design/scripts/search.py "beauty spa wellness service" --design-system -p "Serenity Spa"
```

### Domain-Specific Search

Search specific domains for detailed information:

```bash
python .agent/skills/frontend-design/scripts/search.py "<keyword>" --domain <domain>
```

---

## Available Domains

| Domain       | Use For                              | Example Keywords                          |
| ------------ | ------------------------------------ | ----------------------------------------- |
| `product`    | Product type recommendations         | SaaS, e-commerce, fintech, healthcare     |
| `style`      | UI styles, colors, effects           | glassmorphism, minimalism, brutalism      |
| `typography` | Font pairings, Google Fonts          | elegant, playful, professional            |
| `color`      | Color palettes by product type       | saas, ecommerce, beauty, fintech          |
| `landing`    | Page structure, CTA strategies       | hero, testimonial, pricing, social-proof  |
| `chart`      | Chart types, library recommendations | trend, comparison, timeline, funnel       |
| `ux`         | Best practices, anti-patterns        | animation, accessibility, z-index         |
| `react`      | React/Next.js performance            | waterfall, bundle, suspense, memo         |
| `web`        | Web interface guidelines             | aria, focus, keyboard, semantic           |
| `prompt`     | AI prompts, CSS keywords             | (style name)                              |

---

## Available Stacks

```bash
python .agent/skills/frontend-design/scripts/search.py "<keyword>" --stack <stack>
```

| Stack           | Focus                            |
| --------------- | -------------------------------- |
| `html-tailwind` | Tailwind utilities (DEFAULT)     |
| `react`         | State, hooks, performance        |
| `nextjs`        | SSR, routing, images             |
| `vue`           | Composition API, Pinia           |
| `svelte`        | Runes, stores, SvelteKit         |
| `swiftui`       | Views, State, Navigation         |
| `react-native`  | Components, Navigation           |
| `flutter`       | Widgets, State, Layout           |
| `shadcn`        | shadcn/ui components, theming    |

---

## Data Files

Located in `assets/ui-ux-data/`:

| File                   | Contents                        |
| ---------------------- | ------------------------------- |
| `styles.csv`           | 50+ UI style definitions        |
| `colors.csv`           | 97 color palettes               |
| `typography.csv`       | 57 font pairings                |
| `products.csv`         | Product type recommendations    |
| `landing.csv`          | Landing page patterns           |
| `charts.csv`           | Chart type guidance             |
| `ux-guidelines.csv`    | UX best practices               |
| `prompts.csv`          | AI prompt templates             |
| `icons.csv`            | Icon recommendations            |
| `react-performance.csv`| React optimization tips         |
| `web-interface.csv`    | Web accessibility guidelines    |
| `ui-reasoning.csv`     | Design reasoning rules          |
| `stacks/`              | Stack-specific guidelines       |

---

## Output Formats

```bash
# ASCII box (default)
python .agent/skills/frontend-design/scripts/search.py "fintech crypto" --design-system

# Markdown
python .agent/skills/frontend-design/scripts/search.py "fintech crypto" --design-system -f markdown
```

---

## Tips

1. **Be specific** - "healthcare SaaS dashboard" > "app"
2. **Search multiple times** - Different keywords reveal different insights
3. **Combine domains** - Style + Typography + Color = Complete design
4. **Check UX** - Search "animation", "z-index", "accessibility"
5. **Use stack flag** - Get implementation-specific best practices
