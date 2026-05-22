---
name: SorsorRank
description: A sharp, glassmorphic civic research app
colors:
  surface-page: "oklch(12% 0 0)"
  surface-panel: "oklch(22% 0 0 / 0.6)"
  surface-raised: "oklch(28% 0 0 / 0.7)"
  text-primary: "oklch(96% 0 0)"
  text-secondary: "oklch(76% 0 0)"
  text-muted: "oklch(55% 0 0)"
  accent-research: "oklch(85% 0 0)"
  accent-skip: "oklch(40% 0 0)"
  accent-cool: "oklch(65% 0 0)"
  border-subtle: "oklch(100% 0 0 / 0.12)"
typography:
  display:
    fontFamily: "\"Chakra Petch\", \"Inter\", system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 5vw, 3.5rem)"
    fontWeight: 800
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "\"Chakra Petch\", \"Inter\", system-ui, sans-serif"
    fontSize: "clamp(1.8rem, 4vw, 2.5rem)"
    fontWeight: 800
    letterSpacing: "-0.04em"
  title:
    fontFamily: "\"Chakra Petch\", \"Inter\", system-ui, sans-serif"
    fontSize: "clamp(1.4rem, 3vw, 2.2rem)"
    fontWeight: 800
    letterSpacing: "-0.04em"
  body:
    fontFamily: "\"Chakra Petch\", \"Inter\", system-ui, sans-serif"
    fontWeight: 400
  label:
    fontFamily: "\"Chakra Petch\", \"Inter\", system-ui, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 700
    letterSpacing: "0.14em"
rounded:
  sm: "0px"
  md: "0px"
  lg: "0px"
  pill: "0px"
spacing:
  sm: "12px"
  md: "22px"
  lg: "40px"
components:
  button-primary:
    backgroundColor: "linear-gradient(135deg, oklch(35% 0 0 / 0.8), oklch(25% 0 0 / 0.6))"
    textColor: "oklch(96% 0 0)"
    rounded: "{rounded.pill}"
    padding: "0 22px"
  button-ghost:
    backgroundColor: "oklch(100% 0 0 / 0.05)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
---

# Design System: SorsorRank

## 1. Overview

**Creative North Star: "Architectural Glass & Steel"**

SorsorRank's interface is sharp, restrained, and highly sophisticated. It rejects playful shapes and vibrant colors in favor of a brutalist, edge-focused aesthetic. The design relies entirely on layered opacities (`backdrop-filter: blur`), pure grayscale monochromatic tones, and zero border radius. 

**Key Characteristics:**
- Absolute sharp edges (0px border-radius).
- Monochromatic grey palette.
- Layering opacities: glassmorphic panels layered over deep charcoal backgrounds.
- High-contrast, sharp 1px borders to define all surfaces.

## 2. Colors

The palette is intentionally desaturated, relying on lightness contrast and opacity rather than hue.

### Primary
- **Research Silver** (oklch(85% 0 0)): The primary positive action. Bright, metallic, clean.
- **Cool Grey** (oklch(65% 0 0)): Used for intermediate gradients and subtle active states.

### Secondary
- **Deep Skip** (oklch(40% 0 0)): The neutral dismissal action. Dark, recedes into the background.

### Neutral
- **Page Background** (oklch(12% 0 0)): Deep charcoal, almost black.
- **Glass Panel** (oklch(22% 0 0 / 0.6)): Translucent surface for all cards.
- **Primary Text** (oklch(96% 0 0)): Crisp white.
- **Secondary Text** (oklch(76% 0 0)): Light grey metadata.
- **Subtle Edge** (oklch(100% 0 0 / 0.12)): 1px sharp borders defining every element.

## 3. Typography

**Display Font:** Chakra Petch (with Inter)
**Body Font:** Chakra Petch (with Inter)

**Character:** Architectural, structural, grid-aligned. 

## 4. Elevation & Materials

The system relies on glassmorphism and sharp borders instead of drop shadows.

### Glass Vocabulary
- **Panel Base**: `background: oklch(22% 0 0 / 0.6); backdrop-filter: blur(16px);`
- **Edges**: Every panel and button must have a 1px solid border of `oklch(100% 0 0 / 0.12)`.

**The Sharp Edge Rule.** No element may have rounded corners. `border-radius: 0` is globally enforced.

## 5. Components

### Buttons
- **Shape:** Perfectly rectangular (0px radius).
- **Primary:** Subtle gradient `linear-gradient(135deg, oklch(35% 0 0 / 0.8), oklch(25% 0 0 / 0.6))` with crisp white text and a sharp 1px border.
- **Hover / Focus:** Slight background lightening; no bouncy scaling. 

### Cards / Containers
- **Corner Style:** 0px radius.
- **Background:** Translucent glassmorphism (`backdrop-filter: blur(16px)`).
- **Border:** 1px sharp edge.

## 6. Do's and Don'ts

### Do:
- **Do** enforce 0px border-radius globally.
- **Do** use `backdrop-filter: blur()` for depth.
- **Do** use pure greys.

### Don't:
- **Don't** use any colors outside of grayscale (no mint, no amber, no teal).
- **Don't** use rounded corners.
- **Don't** use bouncy, cartoonish animations.
