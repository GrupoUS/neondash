# Algorithmic Art Guide

> Creating generative art using p5.js with seeded randomness and interactive parameter exploration.

---

## When to Use

Use this guide when creating:
- Generative art and algorithmic compositions
- Flow fields and particle systems
- Interactive p5.js visualizations
- Parametric visual experiments
- Code-based art with seeded randomness

---

## Two-Step Process

### Step 1: Algorithmic Philosophy Creation

Create an ALGORITHMIC PHILOSOPHY (not static images) that will be interpreted through:
- Computational processes, emergent behavior, mathematical beauty
- Seeded randomness, noise fields, organic systems
- Particles, flows, fields, forces
- Parametric variation and controlled chaos

**Philosophy Structure:**
1. **Name the movement** (1-2 words): "Organic Turbulence" / "Quantum Harmonics"
2. **Articulate the philosophy** (4-6 paragraphs) emphasizing:
   - Computational processes and mathematical relationships
   - Noise functions and randomness patterns
   - Particle behaviors and field dynamics
   - Temporal evolution and system states
   - Expert craftsmanship (meticulously crafted, master-level)

### Step 2: P5.js Implementation

Express the philosophy through code using the templates in `assets/p5-templates/`.

---

## Technical Requirements

### Seeded Randomness (Art Blocks Pattern)

```javascript
let seed = 12345;
randomSeed(seed);
noiseSeed(seed);
```

### Parameter Structure

```javascript
let params = {
  seed: 12345,
  // Quantities, Scales, Probabilities
  // Ratios, Angles, Thresholds
};
```

### Canvas Setup

```javascript
function setup() {
  createCanvas(1200, 1200);
}

function draw() {
  // Your generative algorithm
}
```

---

## Craftsmanship Requirements

- **Balance**: Complexity without visual noise
- **Color Harmony**: Thoughtful palettes, not random RGB
- **Composition**: Maintain visual hierarchy
- **Performance**: Smooth execution
- **Reproducibility**: Same seed = identical output

---

## Templates

### Viewer Template

Use `assets/p5-templates/viewer.html` as the starting point for interactive artifacts.

**Fixed elements (keep unchanged):**
- Layout structure (header, sidebar, main canvas)
- Seed section (display, prev/next/random buttons, jump input)
- Actions section (regenerate, reset, download)

**Variable elements (customize):**
- The p5.js algorithm
- The parameters object
- Parameter controls in sidebar

### Generator Template

Reference `assets/p5-templates/generator_template.js` for:
- Parameter organization
- Seeded randomness patterns
- Class structure best practices

---

## Philosophy Examples

**"Organic Turbulence"**
Flow fields driven by layered Perlin noise. Thousands of particles following vector forces, their trails accumulating into organic density maps.

**"Quantum Harmonics"**
Particles with phase values exhibiting wave-like interference patterns. Constructive interference creates bright nodes, destructive creates voids.

**"Recursive Whispers"**
Branching structures subdividing recursively with golden ratio constraints. L-systems generating tree-like forms.

**"Field Dynamics"**
Vector fields from mathematical functions. Particles flowing along field lines, showing ghost-like evidence of invisible forces.

---

## Essential Principles

- **ALGORITHMIC PHILOSOPHY**: Create a computational worldview
- **PROCESS OVER PRODUCT**: Beauty emerges from algorithm execution
- **PARAMETRIC EXPRESSION**: Ideas through mathematical relationships
- **ARTISTIC FREEDOM**: Interpret visually with creative room
- **PURE GENERATIVE ART**: Living algorithms, not static images
- **EXPERT CRAFTSMANSHIP**: Meticulously crafted, refined implementation
