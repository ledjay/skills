# Skill Templates

Templates for creating new skills. Each template is optimized for a specific skill type.

## Available Templates

| Template | Type | Use For |
|----------|------|---------|
| `SKILL.md` | Rules | Best practices, patterns, guidelines |
| `SKILL-TOOL.md` | Tool | API documentation, tool usage, gotchas |
| `SKILL-WORKFLOW.md` | Workflow | Guided questionnaires, onboarding, configuration |

## Template Details

### `SKILL.md` — Rules Template

**Purpose:** Define best practices, coding patterns, guidelines

**Structure:**
- Rule categories with priority levels
- Quick reference table
- Rule IDs with prefixes (e.g., `async-`, `bundle-`)

**Example:** `react-best-practices`, `vercel-deploy-claimable`

---

### `SKILL-TOOL.md` — Tool Template

**Purpose:** Document how to use a tool, API, or MCP server

**Structure:**
- Prerequisites
- Quick start (CLI + Library modes)
- Tools/API reference
- Gotchas

**Example:** `using-pencil`, `agent-browser`

---

### `SKILL-WORKFLOW.md` — Workflow Template

**Purpose:** Guide users through structured questionnaires

**Structure:**
- Questions with predefined options
- Multi-select support
- Progress tracking checklist
- Synthesis and validation

**Example:** `project-onboarding`, user configuration wizards

---

## Quick Start

```bash
# Copy the appropriate template
cp _template/SKILL-WORKFLOW.md my-skill/SKILL.md

# Edit the frontmatter and content
# - Replace "skill-name" with your skill name
# - Update description with trigger phrases
# - Customize questions and options
```

## Naming Rules

- Directory name must match `name` in frontmatter
- Lowercase letters, numbers, hyphens only
- 1-64 characters
- No leading/trailing/consecutive hyphens

## Frontmatter Reference

```yaml
---
name: skill-name
description: One-line description with trigger phrases. Use when...
version: 1.0.0
compatible-agents:
  - letta-code
  - codex
  - claude-code
  - cursor
tags:
  - tag1
  - tag2
author:
  name: Your Name
  url: https://your-website.com
license: MIT
---
```

## Best Practices

1. **Keep SKILL.md under 500 lines** — Put detailed content in `references/`
2. **Write clear descriptions** — This is the primary trigger mechanism
3. **Use progressive disclosure** — Reference files, don't inline everything
4. **Match template to purpose** — Use the right template for your skill type

## Examples

See `examples/` for concrete implementations of each template:

| Example | Template | Description |
|---------|----------|-------------|
| `absurd-breakfast/` | WORKFLOW | Questionnaire absurde de test |
| `design-system-onboarding/` | WORKFLOW | Configuration guidée d'un DS avec mémorisation |
