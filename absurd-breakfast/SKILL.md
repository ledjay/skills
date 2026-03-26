---
name: absurd-breakfast
description: Questionnaire existentiel absurde sur le petit-déjeuner. Use when user says "petit-déjeuner", "breakfast", "matin", "œufs", or needs to make meaningless breakfast decisions.
version: 1.0.0
compatible-agents:
  - letta-code
  - codex
  - claude-code
  - cursor
tags:
  - absurd
  - workflow
  - questionnaire
  - breakfast
author:
  name: Skills Guardian
  url: https://github.com/jeremiegisserot/ledjay-skills
license: MIT
---

# Absurd Breakfast

Questionnaire existentiel et complètement absurde sur le petit-déjeuner. Aucune valeur nutritive garantie.

## When to Use

**DO use this skill when:**
- User says "petit-déjeuner", "breakfast", "matin"
- User needs to make meaningless breakfast decisions
- User asks for absurd entertainment

**DON'T use for:**
- Actual nutrition advice
- Serious meal planning
- Anything remotely useful

## Workflow

Copy this checklist and track your progress:

```
Absurd Breakfast Progress:
- [ ] Question 1: Philosophie matinale
- [ ] Question 2: Position sur les œufs
- [ ] Question 3: Niveau de caféine requis
- [ ] Question 4: Controverses breakfast (multi-select)
- [ ] Synthèse et diagnostic
```

## Questions

### Q1: Philosophie matinale

**Question:** "Le matin, tu es plutôt..."

**Options:**
- `zombie` — Je communique par grognements jusqu'au café
- `perky` — Je suis déjà en train de chanter Disney à 7h
- `denial` — Le matin n'existe pas, c'est une construction sociale
- `survivor` — Je vis la nuit, le matin c'est pour les faibles

---

### Q2: Position sur les œufs

**Question:** "Comment préfères-tu tes œufs ? (Cette question définira toute ta personnalité)"

**Options:**
- `brouilles` — Chaos organisé, comme ma vie
- `coque` — Fragile mais élégant, je tape le petit bout
- `poches` — Sophistiqué, mais personne ne sait les faire
- `au-plat` — Je regarde le soleil se coucher sur le jaune
- `omelette` — Je ne peux pas décider, je mélange tout
- `pas-oeufs` — TRAHISON. Je refuse de répondre.

**Follow-up if `pas-oeufs`:** "Es-tu sûr de vouloir continuer ce questionnaire ?"

---

### Q3: Niveau de caféine

**Question:** "Combien de cafés avant de pouvoir parler aux humains ?"

**Options:**
- `zero` — Je suis un être évolué, pas besoin de stimulants
- `un` — Le strict minimum pour la civilité
- `deux-trois` — Quantité normale de fonctionnement
- `quatre-plus` — Je tremble légèrement, c'est normal
- `onlyfuel` — Le café coule dans mes veines, je suis 40% caféine

---

### Q4: Controverses breakfast (multi-select)

**Question:** "Quelles hérésies acceptes-tu ? (Select all that apply)"

**Options:**
- `ananas-pizza` — L'ananas sur la pizza AU PETIT-DÉJEUNER
- `nutella-socialiste` — Le Nutella est un droit social
- `cereal-first` — Je mets les céréales AVANT le lait
- `toast-cold` — Je mange mes toasts froides, sans beurre
- `orange-juice-sip` — Je bois le jus d'orange à la paille, comme un smoothie
- `breakfast-for-dinner` — Le petit-déjeuner le soir, c'est légitime

**Note:** Aucune réponse n'est correcte. Toutes sont des crimes.

---

## Synthesis

After all questions, provide a completely absurd diagnosis:

```
🥞 DIAGNOSTIC PETIT-DÉJEUNATOIRE 🥞

Profil détecté :
- Type matinal : [User's choice]
- Philosophie œufesque : [User's choice]
- Dépendance caféine : [User's choice]
- Crimes acceptés : [User's choices]

Prescription absurde :
- [Completely nonsensical recommendation]
- [Unrelated breakfast "fact"]

⚠️ Ce diagnostic n'a aucune valeur médicale, nutritionnelle ou existentielle.
```

## Guardrails

1. **Always use AskUserQuestion tool** — Don't ask questions in plain text
2. **One question at a time** — Don't overwhelm the user with absurdity
3. **Provide clear options** — Even absurd choices should be understandable
4. **Allow "Other" for flexibility** — User can always provide custom absurdity
5. **Validate before proceeding** — Show synthesis, get confirmation that this was pointless

## Quick Reference

| Question | Type | Absurdity Level |
|----------|------|-----------------|
| Q1 | Single | 🌙 Matinal philosophy |
| Q2 | Single | 🥚 Egg-based personality test |
| Q3 | Single | ☕ Caffeine dependency |
| Q4 | Multi | 🍕 Breakfast heresies |

**Deliverable:** Useless breakfast diagnosis
