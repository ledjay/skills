# Contributing to ledjay-skills

Thanks for your interest in contributing to this repository of AI agent skills.

## How to Contribute

1. **Fork** the repository
2. **Create a branch** for your contribution
   ```bash
   git checkout -b feat/my-skill
   ```
3. **Commit** your changes
4. **Push** the branch
   ```bash
   git push origin feat/my-skill
   ```
5. Open a **Pull Request**

## Skill Structure

Use the `_template/` folder as reference.

```
my-skill/
├── SKILL.md        # Required: skill definition
├── README.md       # Optional: documentation
└── references/     # Optional: reference files
```

## Naming Conventions

- **Directory name**: `kebab-case` (e.g., `design-tokens`, `react-patterns`)
- **Main file**: `SKILL.md` (always this exact name)
- **Length**: 1-64 characters
- Allowed characters: lowercase letters, numbers, hyphens

## SKILL.md Format

```markdown
---
name: my-skill
description: One sentence describing when to use this skill.
  Include trigger keywords.
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

# Skill Title

Description of what the skill does.

## When to Use

- Condition 1
- Condition 2

## Instructions

Main skill content goes here.
```

## Testing

Before submitting, verify the skill works with:

- [ ] Letta Code
- [ ] Claude Code
- [ ] Codex

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
