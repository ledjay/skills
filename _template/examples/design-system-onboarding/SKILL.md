---
name: design-system-onboarding
description: Configuration guidée d'un design system. Use when user says "design system", "tokens", "créer DS", "setup design system", or needs to initialize a design system project.
version: 1.0.0
compatible-agents:
  - letta-code
  - codex
  - claude-code
  - cursor
tags:
  - workflow
  - design-system
  - onboarding
  - configuration
author:
  name: Skills Guardian
  url: https://github.com/jeremiegisserot/ledjay-skills
license: MIT
---

# Design System Onboarding

Configure un design system de manière guidée. Collecte les choix de l'utilisateur et les mémorise pour les sessions futures.

## When to Use

**DO use this skill when:**
- User says "design system", "créer un DS", "setup design system"
- Starting a new design system project
- User wants to configure design tokens, components

**DON'T use for:**
- One-off component creation
- Quick design tweaks

## Workflow

```
Design System Onboarding Progress:
- [ ] Question 1: Approche du design system
- [ ] Question 2: Niveau de complexité
- [ ] Question 3: Base d'inspiration
- [ ] Question 4: Périmètre des tokens
- [ ] Question 5: Périmètre des composants
- [ ] Mémorisation et création du brief
```

## Questions

### Q1: Approche du design system

**Question:** "Comment veux-tu aborder ton design system ?"

**Options:**
- `from-scratch` — Créer un DS entièrement custom, partir de zéro
- `extend-existing` — Étendre un DS existant (Radix, Shadcn, etc.)
- `inspired-by` — S'inspirer d'un DS existant mais refaire à ta sauce
- `minimal` — Juste les tokens, pas de composants

---

### Q2: Niveau de complexité

**Question:** "Quel niveau de complexité pour ton DS ?"

**Options:**
- `simple` — Tokens basiques + 5-10 composants essentiels
- `medium` — Tokens complets + 15-25 composants + variants
- `complex` — Full system : tokens, composants, patterns, documentation, theming

---

### Q3: Base d'inspiration

**Question:** "Tu veux partir de quelle base ?"

**Options:**
- `none` — Aucune, full custom
- `shadcn` — shadcn/ui (Tailwind + Radix)
- `radix` — Radix Primitives
- `material` — Material Design
- `custom` — Autre (préciser)

**Follow-up if `custom`:** "Quel design system t'inspire ?"

---

### Q4: Périmètre des tokens (multi-select)

**Question:** "Quels types de tokens veux-tu inclure ?"

**Options:**
- `colors` — Palette de couleurs (primitives + semantics)
- `typography` — Typographie (fonts, sizes, weights, line-heights)
- `spacing` — Espacements (padding, margin, gap)
- `radius` — Border radius
- `shadows` — Ombres
- `motion` — Animation tokens (duration, easing)

---

### Q5: Périmètre des composants (multi-select)

**Question:** "Quels composants veux-tu inclure ?"

**Options:**
- `essentials` — Button, Input, Label, Select
- `feedback` — Alert, Toast, Spinner, Skeleton
- `overlay` — Modal, Popover, Tooltip, Dropdown
- `layout` — Container, Grid, Stack, Divider
- `data` — Table, Card, List, Tabs
- `forms` — Checkbox, Radio, Switch, Slider

---

## Mémorisation

### Étape 1 : Synthèse

Montre le récapitulatif :

```
📋 Design System Configuration

- Approche: [Q1 choice]
- Complexité: [Q2 choice]
- Base: [Q3 choice]
- Tokens: [Q4 choices]
- Composants: [Q5 choices]

Est-ce correct ?
```

### Étape 2 : Mémorisation

Après validation, tu DOIS mémoriser les choix :

#### 2a. Mémoire de l'agent (résumé)

Utilise `memory_apply_patch` pour créer/mettre à jour :

```markdown
# memory/system/human/project/design-system.md

## Design System

- **Approach**: from-scratch
- **Complexity**: medium
- **Base**: none
- **Status**: configured
- **Brief file**: `.design-system/BRIEF.md`
```

#### 2b. Fichier projet (détails)

Crée le fichier `.design-system/BRIEF.md` dans le projet :

```markdown
# Design System Brief

## Configuration

- **Approach**: from-scratch
- **Complexity**: medium
- **Base**: none
- **Created**: 2026-03-26

## Tokens

- [x] Colors
- [x] Typography
- [x] Spacing
- [ ] Radius
- [ ] Shadows
- [ ] Motion

## Components

- [x] Essentials (Button, Input, Label, Select)
- [ ] Feedback
- [ ] Overlay
- [ ] Layout
- [ ] Data
- [ ] Forms

## Next Steps

1. Create token primitives
2. Create semantic tokens
3. Build components
```

### Étape 3 : Confirmation

```
✅ Configuration mémorisée !

J'ai stocké ta configuration :
- Dans ma mémoire : Les choix principaux
- Dans le projet : `.design-system/BRIEF.md`

Je pourrai utiliser ces infos dans toutes nos futures conversations sur ce projet.
```

---

## Guardrails

1. **Toujours mémoriser** — Ne pas laisser les réponses dans le vide
2. **Double stockage** — Mémoire agent (résumé) + fichier projet (détails)
3. **Valider avant** — Montrer la synthèse, demander confirmation
4. **Chemins relatifs** — Utiliser `$MEMORY_DIR` pour la mémoire agent

---

## Quick Reference

| Question | Type | Output |
|----------|------|--------|
| Q1 | Single | `approach` |
| Q2 | Single | `complexity` |
| Q3 | Single | `base` |
| Q4 | Multi | `tokens[]` |
| Q5 | Multi | `components[]` |

**Deliverable:** 
- Fichier `.design-system/BRIEF.md`
- Mémoire agent mise à jour
