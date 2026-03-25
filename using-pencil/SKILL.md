---
name: using-pencil
description: Control Pencil.dev design tool via MCP to create, inspect, and export UI designs programmatically. Covers batch_design DSL, design tokens, components, and code sync. Use when working with .pen files, Pencil MCP, design systems, or mockups.
version: 2.0.0
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

```bash
# Always use the compiled bundle (10x faster: 0.15s vs 1.5s)
node <skill-path>/scripts/pencil.cjs call batch_design '{
  "filePath": "design.pen",
  "operations": "card=I(document,{type:\"frame\",name:\"Card\",width:300,layout:\"vertical\",gap:8,padding:[16,16],fill:\"#FFFFFF\",cornerRadius:12})"
}'

# Rebuild after editing pencil.ts:
cd <skill-path>/scripts && npm run build
```

### Library Mode (complex workflows)

```typescript
import { PencilClient } from './pencil.ts'
import { batch, screenshot, getNodes, setTokens } from './helpers.ts'

const pencil = new PencilClient()
await pencil.connect()

// Create tokens
await setTokens(pencil, {
  'primary-500': { type: 'color', value: '#3D7A4F' },
  'radius-md':   { type: 'number', value: 12 },
})

// Build design
const { insertedIds } = await batch(pencil, `
  card=I(document,{type:"frame",name:"Component/Card",reusable:true,width:300,layout:"vertical",gap:8,padding:[16,16],fill:"#FFFFFF",cornerRadius:12})
  title=I(card,{type:"text",content:"Hello",fontSize:16,fontWeight:"700",fill:"$primary-500"})
`)

// Verify visually
await screenshot(pencil, insertedIds[0], './out/card.png')

await pencil.disconnect()
```

Run with: `npx tsx your-script.ts`

## Tools (15)

| Tool | Use for | ~Tokens |
|------|---------|---------|
| `batch_design` | Insert/update/delete nodes (max 25 ops) | ~50 response |
| `batch_get` | Read nodes by ID or pattern | 700→26K (depth 0→3) |
| `get_editor_state` | Current file, selection, components | **~9,500** (schema tax!) |
| `get_screenshot` | Visual verification | 0 text (image) |
| `get_variables` / `set_variables` | Read/write design tokens | ~100 / ~25 |
| `snapshot_layout` | Debug layout (overflow, positioning) | varies |
| `replace_all_matching_properties` | Bulk property swap (hex → variable refs) | ~100 |
| `search_all_unique_properties` | Audit unique values (colors, fonts) | varies |
| `export_nodes` | Export PNG/JPEG/PDF | 0 text |
| `get_guidelines` | Design rules by topic | ~1,270 per topic |
| `get_style_guide` / `get_style_guide_tags` | Style inspiration by tags | ~530 |
| `open_document` | Open/create `.pen` file | ~27 |
| `find_empty_space_on_canvas` | Find free canvas space | ~100 |

## Recommended Workflow

```
1. get_editor_state       → ONCE per session (~9,500 tokens)
2. get_variables          → Read existing tokens (~100 tokens)
3. set_variables          → Create/modify tokens (batches of 5-10)
4. batch_design           → Build layout (max 25 ops per call)
5. get_screenshot         → ALWAYS verify visually
6. batch_design           → Fix/iterate based on screenshot
7. export_nodes           → Export when ready
```

**After step 1**: Use `batch_get` depth 0 instead of `get_editor_state` for subsequent state checks (saves ~9K tokens).

## Gotchas by Severity

### 🔴 Critical (will break your design)

| Gotcha | Detail |
|--------|--------|
| **OKLCH = invisible** | Pencil accepts OKLCH values silently but renders **white/nothing**. Always use hex: `#RRGGBB` or `#RRGGBBAA`. |
| **Max 25 ops per batch_design** | Beyond = instability and potential corruption. |
| **Always get_screenshot** | `batch_design` returns no visual preview. You're designing blind without it. |
| **Variables in fontFamily errors** | `$font-body` in `fontFamily` doesn't resolve. Use literal strings: `"Inter"`, `"DM Sans"`. |

### 🟡 Warning (may cause unexpected behavior)

| Gotcha | Detail |
|--------|--------|
| **Schema tax** | `get_editor_state` returns ~9,500 tokens of static schema every call. Use `batch_get` depth 0 instead (~700 tokens). |
| **batch_get depth explodes** | depth 0: ~700 → depth 1: ~2,900 → depth 2: ~10,000 → depth 3: ~26,000 tokens. |
| **Max 5-10 vars per set_variables** | Beyond = timeout (15-20s). |
| **flex children ignore x/y** | In `layout: "vertical"` or `"horizontal"`, `x` and `y` are ignored unless `layoutPosition: "absolute"`. |
| **Shell Pattern = 2 batches** | Create Shell in batch 1, get its ID, then create variants in batch 2 (binding name not accessible). |
| **descendants uses node ID** | NOT node name! Always `batch_get` first to find the slot's ID. |
| **Omit filePath for active file** | Absolute paths can cause timeouts. |

### ℹ️ Info (good to know)

| Gotcha | Detail |
|--------|--------|
| **Variables chain works** | `$surface-punch → $corail-500 → #DF685A` resolves correctly. Use for 2-level token architecture. |
| **Alpha in hex works** | `#DF685A20` = corail at ~12% opacity. Last 2 chars = alpha (00→FF). |
| **Can't delete variables** | Sending `null` as value causes JSON error. Orphan variables stay forever — just ignore them. |
| **No "image" node type** | Images are fills: `{fill: {type: "image", url: "..."}}`. |
| **Place components at x=2000+** | Convention: avoid cluttering main design. |
| **No auto-save** | Save frequently with Cmd+S. Use Git commits. |
| **Limited undo/redo** | More limited than standard editors. Git = your safety net. |

## batch_design DSL (Quick Ref)

```
name=I(parent, {nodeData})         # Insert (MUST have binding name)
U("nodeId", {updateData})          # Update
name=C("sourceId", parent, {})     # Copy
name=R("nodeId", {nodeData})       # Replace
M("nodeId", parent, index?)        # Move
D("nodeId")                        # Delete
G("nodeId", "ai"|"stock", "prompt") # Image fill
```

`document` = root binding. Separate operations with `\n`. No `id` property on new nodes.

## Component Patterns

### Decision Tree

| Use Case | Pattern |
|----------|---------|
| Single component, no variants | Direct `reusable: true` |
| Named presets (Button/Primary, Button/Secondary) | **Shell Pattern** |
| Visual axes (Color × Style) | **Theme Pattern** |
| Structural + visual (Button with icon variants × colors) | **Hybrid Shell+Theme** ⭐ |

### Shell Pattern (color variants)

```typescript
import { createComponentFamily, batch, screenshot } from './helpers.ts'

const family = await createComponentFamily(pencil, {
  shell: {
    name: 'Card',
    width: 300, layout: 'vertical', gap: 12, padding: [20, 20],
    cornerRadius: 12, fill: '#FFFFFF',
    children: [
      { type: 'text', name: 'card-title', content: 'Title', fontSize: 16, fill: '#1A2B1F' },
    ],
    slot: { name: 'card-content', height: 'fit_content(80)', layout: 'vertical', gap: 8 },
  },
  variants: [
    { name: 'Green', fill: '#F0F7F2' },
    { name: 'Promo', fill: '#FFF5F0', stroke: { fill: '#FF8C00', thickness: 2 } },
  ],
})

// Modify the shell → ALL variants auto-update!
await batch(pencil, `U("${family.shell.id}", {padding:[24,24], gap:16})`)
```

### Theme Pattern (orthogonal axes)

```typescript
// One component, all combinations — no need to pre-create variants
const badge = await createParametricComponent(pencil, {
  name: 'Badge',
  axes: { Color: ['indigo', 'red'], Style: ['fill', 'tint', 'outline'] },
  defaultTheme: { Color: 'indigo', Style: 'fill' },
  variables: {
    'badge-bg': {
      type: 'color',
      value: [
        { value: '#6a6af4',   theme: { Color: 'indigo', Style: 'fill'    } },
        { value: '#ebebff',   theme: { Color: 'indigo', Style: 'tint'    } },
        { value: '#00000000', theme: {                  Style: 'outline' } },
        { value: '#e1000f',   theme: { Color: 'red',    Style: 'fill'    } },
        { value: '#ffe9e9',   theme: { Color: 'red',    Style: 'tint'    } },
      ],
    },
  },
  fill: '$badge-bg',
  children: [{ type: 'text', content: 'Badge', fill: '$badge-text' }],
})

// Instances pick their combination on the fly:
await batch(pencil, `
  I(frame,{type:"ref",ref:"${badge.id}",theme:{Color:"red",Style:"tint"}})
`)
```

## Detailed References

Load as needed — each file is self-contained:

- **`references/dsl.md`** — Complete DSL syntax, node types, layout, graphics, text, icons, examples
- **`references/gotchas.md`** — All pitfalls: colors, layout, images, components, performance, MCP output
- **`references/tokens.md`** — Design tokens (2-level architecture), theming, bulk swap, Pencil ↔ code sync
- **`references/pen-schema.md`** — .pen format TypeScript schema (authoritative, from official docs)
- **`references/components.md`** — Components, instances, descendants, slots, Shell Pattern, composition
- **`references/mcp-optimization.md`** — Token audit results, cost per tool, optimization strategies

## Examples

### Parametric component with Theme Pattern

```typescript
import { PencilClient } from './pencil.ts'
import { createParametricComponent, batch } from './helpers.ts'

const pencil = new PencilClient()
await pencil.connect()

// One component, all combinations — no need to pre-create variants
const badge = await createParametricComponent(pencil, {
  name: 'Badge',
  axes: { Color: ['indigo', 'red'], Style: ['fill', 'tint', 'outline'] },
  defaultTheme: { Color: 'indigo', Style: 'fill' },
  variables: {
    'badge-bg': {
      type: 'color',
      value: [
        { value: '#6a6af4',   theme: { Color: 'indigo', Style: 'fill'    } },
        { value: '#ebebff',   theme: { Color: 'indigo', Style: 'tint'    } },
        { value: '#00000000', theme: {                  Style: 'outline' } },
        { value: '#e1000f',   theme: { Color: 'red',    Style: 'fill'    } },
        { value: '#ffe9e9',   theme: { Color: 'red',    Style: 'tint'    } },
      ],
    },
    'badge-text': {
      type: 'color',
      value: [
        { value: '#ffffff', theme: { Style: 'fill'    } },
        { value: '#6a6af4', theme: { Color: 'indigo', Style: 'tint'    } },
        { value: '#6a6af4', theme: { Color: 'indigo', Style: 'outline' } },
        { value: '#e1000f', theme: { Color: 'red',    Style: 'tint'    } },
        { value: '#e1000f', theme: { Color: 'red',    Style: 'outline' } },
      ],
    },
  },
  fill: '$badge-bg',
  layout: 'horizontal', padding: [4, 8], clip: true,
  justifyContent: 'center', alignItems: 'center',
  children: [
    { type: 'text', name: 'badge-label', content: 'Badge',
      fontFamily: 'Inter', fontSize: 12, fontWeight: 'bold', fill: '$badge-text' },
  ],
})

// Instances pick their combination on the fly:
await batch(pencil, `
  I(frame,{type:"ref",ref:"${badge.id}",theme:{Color:"red",Style:"tint"},descendants:{"badge-label":{content:"Error"}}})
  I(frame,{type:"ref",ref:"${badge.id}",theme:{Color:"indigo",Style:"fill"},descendants:{"badge-label":{content:"Info"}}})
`)

await pencil.disconnect()
```

### Hybrid Shell+Theme (structural + visual)

```typescript
// Direct .pen JSON generation — no MCP needed for file creation
import { writeFileSync } from 'fs'

// Shell = chrome (shared structure), Variants = different slot content
const doc = {
  version: '2.8',
  // Scoped axes: "Btn-" prefix prevents Badge-Color from clashing with Btn-Color
  themes: {
    'Btn-Color': ['brand', 'neutral', 'danger'],
    'Btn-Variant': ['primary', 'secondary', 'tertiary'],
    'Btn-State': ['default', 'hover', 'pressed', 'loading', 'disabled'],
  },
  variables: {
    'btn-bg':   { type: 'color', value: [
      { value: '#2563eb', theme: { 'Btn-Color': 'brand', 'Btn-Variant': 'primary', 'Btn-State': 'default' } },
      { value: '#1d4ed8', theme: { 'Btn-Color': 'brand', 'Btn-Variant': 'primary', 'Btn-State': 'hover' } },
      // ... one entry per combination
    ]},
    'btn-text':   { type: 'color', value: [/* ... */] },
    'btn-border': { type: 'color', value: [/* ... */] },
  },
  children: [
    // Shell: defines chrome (bg, border, radius, padding) + slot + spinner
    { type: 'frame', id: 'btn-shell', name: 'Component/Btn-Shell', reusable: true,
      fill: '$btn-bg', stroke: { align: 'inside', thickness: 1.5, fill: '$btn-border' },
      layout: 'horizontal', padding: [10, 16], cornerRadius: 8,
      children: [
        { type: 'frame', id: 'btn-slot', slot: [], layout: 'horizontal', gap: 6 },
        { type: 'icon_font', id: 'btn-spinner', iconFontFamily: 'lucide',
          iconFontName: 'loader-circle', fill: '$btn-text', opacity: '$btn-spinner-opacity',
          layoutPosition: 'absolute' },
      ],
    },
    // Structural variant: no icon (ref → Shell, injects label into slot)
    { type: 'ref', id: 'btn-default', name: 'Component/Btn', ref: 'btn-shell', reusable: true,
      descendants: { 'btn-slot': { children: [
        { id: 'btn-lbl', type: 'text', content: 'Button', fill: '$btn-text' },
      ]}},
    },
    // Structural variant: icon left
    { type: 'ref', id: 'btn-iconl', name: 'Component/Btn-IconL', ref: 'btn-shell', reusable: true,
      descendants: { 'btn-slot': { children: [
        { id: 'il-icon', type: 'icon_font', iconFontFamily: 'lucide', iconFontName: 'arrow-left', fill: '$btn-text' },
        { id: 'il-lbl', type: 'text', content: 'Button', fill: '$btn-text' },
      ]}},
    },
    // Instance: picks structure AND visuals independently
    { type: 'ref', ref: 'btn-iconl',
      theme: { 'Btn-Color': 'danger', 'Btn-Variant': 'secondary', 'Btn-State': 'hover' },
      descendants: { 'il-lbl': { content: 'Delete' } },
    },
  ],
}
writeFileSync('button.pen', JSON.stringify(doc, null, 2))
// Then open in Pencil via MCP: open_document({filePathOrTemplate: "button.pen"})
```

### CLI (one-off calls)

#### Create a card component

```bash
node pencil.cjs call batch_design '{
  "filePath": "design.pen",
  "operations": "card=I(document,{type:\"frame\",name:\"Component/Card\",reusable:true,width:300,height:200,x:2000,y:0,layout:\"vertical\",gap:8,padding:[16,16],fill:\"$surface-card\",cornerRadius:16})\\ntitle=I(card,{type:\"text\",content:\"Title\",fontFamily:\"$font-display\",fontSize:18,fontWeight:\"600\",fill:\"$text-primary\"})\\ndesc=I(card,{type:\"text\",content:\"Description text\",fontFamily:\"$font-body\",fontSize:14,fill:\"$text-secondary\",textGrowth:\"fixed-width\",width:\"fill_container\"})"
}'
```

#### Set up design tokens (2-level)

```bash
# Primitives first
node pencil.cjs call set_variables '{
  "filePath": "design.pen",
  "variables": {
    "primary-500": {"type": "color", "value": "#FF8C00"},
    "neutral-50": {"type": "color", "value": "#FFFBF6"},
    "neutral-800": {"type": "color", "value": "#3D2B1F"},
    "font-body": {"type": "string", "value": "Inter"},
    "radius-md": {"type": "number", "value": 12}
  }
}'

# Then semantics (referencing primitives)
node pencil.cjs call set_variables '{
  "filePath": "design.pen",
  "variables": {
    "surface-card": {"type": "color", "value": "#FFFFFF"},
    "text-primary": {"type": "color", "value": "$neutral-800"},
    "text-secondary": {"type": "color", "value": "$neutral-500"},
    "surface-body": {"type": "color", "value": "$neutral-50"}
  }
}'
```

#### Swap hardcoded colors → variables

```bash
# Audit
node pencil.cjs call search_all_unique_properties '{
  "filePath": "design.pen",
  "parents": ["frameId"],
  "properties": ["fillColor"]
}'

# Replace
node pencil.cjs call replace_all_matching_properties '{
  "filePath": "design.pen",
  "parents": ["frameId"],
  "properties": {"fillColor": [{"from": "#3D2B1F", "to": "$text-primary"}]}
}'
```

## Pencil vs Figma

### What Pencil Does NOT Do

- ❌ Property-based variants (component switching)
- ❌ Interactive states (hover, active, focus)
- ❌ Prototyping (screen transitions)
- ❌ Auto-save
- ❌ Real-time collaboration
- ❌ OKLCH color rendering
- ❌ Variable deletion

### What Pencil Does BETTER

- ✅ JSON files (.pen) — readable, Git-versionable
- ✅ MCP with full read/write (Figma MCP = read-only)
- ✅ IDE integration (VS Code, Cursor)
- ✅ Code export (React, HTML, Tailwind)
- ✅ Variable chaining ($semantic → $primitive → #hex)
- ✅ Theming native (multi-axis: light/dark, condensed/regular)
- ✅ Lucide icons native
- ✅ AI built-in for design generation
- ✅ CLI batch mode (experimental)
- ✅ **Multi-level propagation** (tested 3+ levels)
