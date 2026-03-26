---
name: skill-name
description: One-line description with trigger phrases. Use when user says "...", "setup", "onboarding", or needs guided configuration.
version: 1.0.0
compatible-agents:
  - letta-code
  - codex
  - claude-code
  - cursor
tags:
  - workflow
  - questionnaire
  - guided
author:
  name: Your Name
  url: https://your-website.com
license: MIT
---

# Skill Name

Brief description of what this skill does and when to use it.

## When to Use

**DO use this skill when:**
- User says "..." or "..."
- Setting up a new [something]
- Need to gather structured information

**DON'T use for:**
- Simple one-off questions
- Non-structured conversations

## Workflow

Copy this checklist and track your progress:

```
[Skill Name] Progress:
- [ ] Question 1: [First question category]
- [ ] Question 2: [Second question category]
- [ ] Question 3: [Third question category]
- [ ] Synthesis and validation
```

## Questions

### Q1: [Question Category]

**Question:** "[The actual question to ask]"

**Options:**
- `option-id` — Description of what this option means
- `option-id` — Description of what this option means
- `other` — Let user specify custom answer

**Follow-up if `other`:** Ask clarifying question

---

### Q2: [Question Category]

**Question:** "[The actual question to ask]"

**Options:**
- `option-a` — Description
- `option-b` — Description

---

### Q3: [Question Category] (multi-select)

**Question:** "[The actual question to ask] (select all that apply)"

**Options:**
- `option-1` — Description
- `option-2` — Description
- `option-3` — Description

**Note:** Multiple selections allowed

---

## Synthesis

After all questions, provide a summary:

```
📋 Récapitulatif :
- [Category 1]: [User's choice]
- [Category 2]: [User's choice]
- [Category 3]: [User's choices]

Proposed configuration:
- [Specific recommendation based on choices]
- [Additional setup based on choices]

Does this look correct?
```

## Guardrails

1. **Always use AskUserQuestion tool** — Don't ask questions in plain text
2. **One question at a time** — Don't overwhelm the user
3. **Provide clear options** — User should understand each choice
4. **Allow "Other" for flexibility** — User can always provide custom input
5. **Validate before proceeding** — Show synthesis, get confirmation

## Quick Reference

| Question | Type | Purpose |
|----------|------|---------|
| Q1 | Single | Primary categorization |
| Q2 | Single | Secondary configuration |
| Q3 | Multi | Priorities/preferences |

**Deliverable:** Structured configuration based on user's answers