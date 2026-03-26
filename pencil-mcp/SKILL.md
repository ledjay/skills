---
name: pencil-mcp
description: Control Pencil.dev design tool via MCP to create, inspect, and export UI designs programmatically. Covers batch_design DSL, design tokens, components, and code sync. Use when working with .pen files, Pencil MCP, design systems, or mockups.
version: 2.1.0
compatible-agents:
  - letta-code
  - codex
  - claude-code
  - cursor
tags:
  - pencil
  - mcp
  - design
  - tokens
  - batch_design
  - components
author:
  name: Jérémie Gisserot
  url: https://jeremie-gisserot.net
license: MIT
---

# Using Pencil

Control **Pencil** (pencil.dev) via its MCP server. Create designs, manage tokens, build components, and export assets — all from the CLI.

## When to Use

**DO use this skill when:**
- Working with `.pen` files (Pencil's native format)
- Creating designs programmatically via MCP
- Building design systems (tokens, components, variants)
- Exporting assets (PNG, JPEG, PDF)
- Debugging Pencil MCP issues (gotchas, token costs)

**DON'T use for:**
- General design tasks (use Pencil desktop app directly)
- Non-Pencil design tools (Figma, Sketch, etc.)

## ⚠️ Critical Warning

> **NEVER write `.pen` JSON files directly.**
> 
> The `.pen` format is an internal schema. Writing JSON manually will open in Pencil but show an **empty canvas**.
> 
> **Always use MCP tools** (`batch_design`, `set_variables`, etc.) to create content.

## Prerequisites

- Pencil desktop app running (`/Applications/Pencil.app`)
- Dependencies: `cd <skill-path>/scripts && npm install && npm run build`

## Core Concepts

| Concept | Description |
|---------|-------------|
| **MCP Client** | Two modes: CLI (one-off calls) vs Library (complex workflows) |
| **batch_design DSL** | Custom DSL for insert/update/delete operations (max 25 per call) |
| **Design Tokens** | 2-level architecture: primitives (hex) → semantics (refs) |
| **Shell Pattern** | Pencil doesn't have Figma variants. Shell Pattern = workaround for component variants |
| **Theme Pattern** | For orthogonal visual axes (Color × Style × State) |
| **Schema Tax** | `get_editor_state` returns ~9,500 tokens of static schema every call |

## Quick Start

### CLI Mode (one-off calls)

> ⚠️ **Important for CLI mode**: Each `pencil.cjs` invocation opens a **new MCP connection**. This means:
> - `filePath` context is LOST between calls
> - Bindings from `batch_design` are NOT available in subsequent calls
> - You MUST capture and reuse node IDs between invocations
> - WebSocket reconnection messages (`attempt 1/3`) are **normal**

```bash
# Recommended timeout: 30-60s (not 15-20s)
# Always use the compiled bundle (10x faster: 0.15s vs 1.5s)

# 1. Open document (use RELATIVE path to avoid timeout)
node <skill-path>/scripts/pencil.cjs call open_document '{
  "filePath": "design.pen"
}'

# 2. Create tokens (filePath optional if file just opened)
node <skill-path>/scripts/pencil.cjs call set_variables '{
  "variables": {
    "primary-500": {"type": "color", "value": "#3D7A4F"}
  }
}'
# → Returns: {"success": true}

# 3. Create design (CAPTURE the returned IDs!)
node <skill-path>/scripts/pencil.cjs call batch_design '{
  "operations": "card=I(document,{type:\"frame\",name:\"Card\",width:300,layout:\"vertical\",gap:8,padding:[16,16],fill:\"#FFFFFF\",cornerRadius:12})"
}'
# → Returns: {"insertedIds": ["ZwNEy", ...], "bindings": {"card": "ZwNEy"}}
# ⚠️ Bindings are NO LONGER AVAILABLE in next call!
# Use the insertedIds in subsequent operations.

# 4. Add children to the card (use the ID from step 3)
node <skill-path>/scripts/pencil.cjs call batch_design '{
  "operations": "I(\"ZwNEy\",{type:\"text\",content:\"Hello\",fontSize:16})"
}'
# Note: filePath may be needed here since context was lost

# 5. Get screenshot (MUST specify filePath in CLI mode)
node <skill-path>/scripts/pencil.cjs call get_screenshot '{
  "nodeId": "ZwNEy",
  "filePath": "design.pen",
  "outputPath": "./screenshot.png"
}'
```

**Rebuild after editing pencil.ts:**
```bash
cd <skill-path>/scripts && npm run build
```

### Library Mode (complex workflows)

> 🏆 **Recommended for multi-step operations** — single connection, no context loss.

```typescript
import { PencilClient } from './pencil.ts'
import { batch, screenshot, getNodes, setTokens } from './helpers.ts'

const pencil = new PencilClient()
await pencil.connect()

// Create tokens
await setTokens(pencil, {
  'primary-500': { type: 'color', value: '#3D7A4F' },
})

// Create design
const { insertedIds } = await batch(pencil, `
  card=I(document,{type:"frame",name:"Card",width:300,layout:"vertical",gap:8,padding:[16,16],fill:"#FFFFFF",cornerRadius:12})
  I(card,{type:"text",content:"Hello",fontSize:16})
`)

// Visual verification
await screenshot(pencil, insertedIds[0], './card.png')

await pencil.disconnect()
```

## CLI vs Library Mode

| Aspect | CLI Mode | Library Mode |
|--------|----------|--------------|
| **Connection** | New per call | Persistent |
| **filePath context** | LOST between calls | Preserved |
| **Bindings** | Ephemeral | Available |
| **Speed** | Slower (reconnection) | 5-10x faster |
| **Use case** | One-off operations | Multi-step workflows |

## Gotchas Checklist

Before any Pencil MCP call, check:

- [ ] **Pencil desktop app is running**
- [ ] **Using hex colors** (OKLCH renders invisible)
- [ ] **Relative paths** for `filePath` (absolute = timeout)
- [ ] **Max 25 ops** per `batch_design`
- [ ] **Max 5-10 tokens** per `set_variables`
- [ ] **Timeout set to 30-60s** (not 15-20s)
- [ ] **No variables in `fontFamily`** (use literal strings)
- [ ] **Always call `get_screenshot`** after design changes

See `references/gotchas.md` for complete list.

## Tool Reference

| Tool | Use for |
|------|---------|
| `open_document` | Open/create `.pen` file |
| `batch_design` | Insert/update/delete nodes (max 25 ops) |
| `batch_get` | Read nodes by ID or pattern |
| `get_screenshot` | Visual verification — ALWAYS call after design |
| `set_variables` | Create design tokens |
| `get_variables` | Read existing tokens |
| `export_nodes` | Export PNG/JPEG/PDF |

## Reference Files

| File | Content |
|------|---------|
| `references/dsl.md` | Complete batch_design DSL syntax |
| `references/components.md` | Shell Pattern, slots, variants, compositions |
| `references/tokens.md` | 2-level token architecture, theming |
| `references/gotchas.md` | Critical pitfalls and workarounds |
| `references/mcp-optimization.md` | Token cost audit, caching strategies |
| `references/pen-schema.md` | `.pen` JSON schema (read-only!) |

## Examples

### Create a design system

```typescript
// See references/components.md for Shell Pattern
const family = await createComponentFamily(pencil, {
  shell: {
    name: 'Button',
    width: 160,
    layout: 'horizontal',
    gap: 8,
    padding: [12, 24],
    cornerRadius: 8,
    fill: '#3D7A4F',
    children: [
      { type: 'text', name: 'btn-label', content: 'Label', fontSize: 14 },
    ],
  },
  variants: [
    { name: 'Primary', fill: '#3D7A4F' },
    { name: 'Danger', fill: '#DC2626' },
  ],
})
```

### Export assets

```typescript
await exportNodes(pencil, [cardId], {
  format: 'PNG',
  scale: 2,
  outputDir: './exports',
})
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Empty canvas | You wrote `.pen` JSON directly — use MCP tools |
| "wrong .pen file" | Add `filePath` to the call (context lost in CLI mode) |
| Timeout | Use relative path, increase timeout to 60s |
| Invisible colors | You used OKLCH — use hex only |
| Screenshot fails | Add `filePath` parameter in CLI mode |
| Bindings not found | They're ephemeral in CLI — use returned IDs |
| WebSocket reconnection | Normal behavior in CLI mode — ignore |
