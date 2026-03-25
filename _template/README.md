# Skill Template

This is a template for creating new skills.

## Required Files

- `SKILL.md` — Main skill file with YAML frontmatter

## Optional Files

- `references/` — Supporting documentation
- `scripts/` — Helper scripts
- `examples/` — Example files

## Naming Rules

- Directory name must match `name` in frontmatter
- Lowercase letters, numbers, hyphens only
- 1-64 characters
- No leading/trailing/consecutive hyphens

## Frontmatter

```yaml
---
name: skill-name
description: One-line description with trigger phrases. Use when...
license: MIT
---
```

**Key points:**
- `name` — Unique identifier (kebab-case)
- `description` — Include trigger phrases for when to use
- `license` — MIT by default

## Best Practices

1. **Keep SKILL.md under 500 lines** — Put detailed content in `references/`
2. **Write clear descriptions** — This is the primary trigger mechanism
3. **Use progressive disclosure** — Reference files, don't inline everything
4. **Include examples** — Show concrete usage patterns
