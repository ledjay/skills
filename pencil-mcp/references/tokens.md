# Design Tokens & Code Sync

<!-- last_verified: 2026-03-21 -->
<!-- sources: docs.pencil.dev/core-concepts (2026-03-10), BioFS agent (2026-03-20) -->
<!-- stability: MEDIUM — sync workflows likely to improve, variable types may expand -->

## Variable Types

| Type | Example | Notes |
|------|---------|-------|
| `color` | `#FF8C00`, `$primary-500` | Hex only! No OKLCH. |
| `string` | `"DM Sans"`, `"Inter"` | Font families, etc. |
| `number` | `16`, `1.5` | Sizes, radii, spacing |

## 2-Level Architecture (Best Practice)

### Level 1 — Primitives (raw hex values)

```json
{
  "primary-50":    {"type": "color", "value": "#FFF8F0"},
  "primary-500":   {"type": "color", "value": "#FF8C00"},
  "primary-600":   {"type": "color", "value": "#E67E00"},
  "corail-500":    {"type": "color", "value": "#DF685A"},
  "corail-600":    {"type": "color", "value": "#C45A4E"},
  "secondary-500": {"type": "color", "value": "#4F8528"},
  "neutral-50":    {"type": "color", "value": "#FFFBF6"},
  "neutral-800":   {"type": "color", "value": "#3D2B1F"}
}
```

### Level 2 — Semantics (refs to primitives)

```json
{
  "surface-body":  {"type": "color", "value": "$neutral-50"},
  "surface-punch": {"type": "color", "value": "$corail-500"},
  "surface-card":  {"type": "color", "value": "#FFFFFF"},
  "text-primary":  {"type": "color", "value": "$neutral-800"},
  "text-accent":   {"type": "color", "value": "$corail-500"},
  "text-muted":    {"type": "color", "value": "$neutral-500"}
}
```

**Advantage**: Change `corail-500` → auto-updates `surface-punch`, `text-accent`, etc.

## set_variables Call

```bash
node pencil.cjs call set_variables '{
  "filePath": "design.pen",
  "variables": {
    "primary-500": {"type": "color", "value": "#FF8C00"},
    "surface-body": {"type": "color", "value": "$neutral-50"},
    "font-body": {"type": "string", "value": "DM Sans"},
    "radius-md": {"type": "number", "value": 16}
  }
}'
```

**Max ~5-10 variables per call** to avoid timeouts.

## Theming (Multi-Axis)

Define theme axes at document level:

```json
{
  "themes": {
    "Mode": ["Light", "Dark"],
    "Spacing": ["Regular", "Condensed"]
  }
}
```

Variables with conditional values:

```json
{
  "surface-body": {
    "type": "color",
    "value": [
      {"value": "$neutral-50",  "theme": {"Mode": "Light"}},
      {"value": "$neutral-900", "theme": {"Mode": "Dark"}}
    ]
  },
  "text-title-size": {
    "type": "number",
    "value": [
      {"value": 72, "theme": {"Spacing": "Regular"}},
      {"value": 36, "theme": {"Spacing": "Condensed"}}
    ]
  }
}
```

Apply theme to frames: `"theme": {"Mode": "Dark"}` — all children inherit.
**Last matching theme wins** when evaluating variable values.

### Multi-Axis Conditions — CONFIRMED WORKING ✅

A single variable value can match on **multiple axes simultaneously**.
Tested March 2026 (`variants-exploration/multiaxis-validated.png`).

```json
{
  "badge-bg": {
    "type": "color",
    "value": [
      {"value": "#6a6af4",   "theme": {"Color": "indigo", "Style": "fill"}},
      {"value": "#ebebff",   "theme": {"Color": "indigo", "Style": "tint"}},
      {"value": "#00000000", "theme": {"Color": "indigo", "Style": "outline"}},
      {"value": "#e1000f",   "theme": {"Color": "red",    "Style": "fill"}},
      {"value": "#ffe9e9",   "theme": {"Color": "red",    "Style": "tint"}},
      {"value": "#00000000", "theme": {"Color": "red",    "Style": "outline"}}
    ]
  }
}
```

This means a component with `Color=indigo, Style=fill` resolves `$badge-bg` to `#6a6af4`,
while `Color=indigo, Style=tint` resolves it to `#ebebff`. Full matrix, no combinatorial nodes.

**Single-axis conditions still work** — useful for axes that are truly independent:
```json
{"value": "#ffffff", "theme": {"Style": "fill"}}  // matches any Color when Style=fill
```

Use multi-axis when the same axis value means something different depending on another axis (e.g. "indigo fill" ≠ "red fill"). Use single-axis when an axis has a universal effect (e.g. "fill always means white text, regardless of color").

---

## 3-Tier Variable Architecture (for parametric components)

For design kits with parametric components, extend the standard 2-level approach to 3 levels:

```
Tier 1 — Primitives      Raw hex values, never referenced by components directly
                         $indigo-425: #6a6af4
                         $red-425: #e1000f

Tier 2 — Semantics       Static refs to primitives — stable brand layer
                         $indigo-main: $indigo-425
                         $red-main: $red-425

Tier 3 — Component       Conditional variables — variation logic per component
                         $badge-bg: [#6a6af4 when {Color:indigo, Style:fill}, ...]
```

**Why this separation matters:**
- Tier 1→2: Change brand color (`$indigo-425`) → all semantics update automatically
- Tier 2→3: Component logic (`$badge-bg`) references semantics, never raw hex
- Tier 3: The only layer that uses theme conditions

**Key rule**: Tier 3 variables reference Tier 2 (`$indigo-main`), never Tier 1 directly.
This way changing a palette color propagates through all 3 tiers automatically.

```json
{
  "badge-bg": {
    "type": "color",
    "value": [
      {"value": "$indigo-main", "theme": {"Color": "indigo", "Style": "fill"}},
      {"value": "$indigo-950",  "theme": {"Color": "indigo", "Style": "tint"}},
      {"value": "$red-main",    "theme": {"Color": "red",    "Style": "fill"}}
    ]
  }
}
```

### MCP helpers for 3-tier architecture

```typescript
import { setTokens, setConditionalTokens, setThemeAxes } from './helpers.ts'

// Tier 1 + 2: static (use setTokens)
await setTokens(pencil, {
  'indigo-425': { type: 'color', value: '#6a6af4' },
  'indigo-main': { type: 'color', value: '$indigo-425' },
})

// Define axes
await setThemeAxes(pencil, {
  Color: ['indigo', 'red', 'green'],
  Style: ['fill', 'tint', 'outline'],
})

// Tier 3: conditional (use setConditionalTokens)
await setConditionalTokens(pencil, {
  'badge-bg': {
    type: 'color',
    value: [
      { value: '$indigo-main', theme: { Color: 'indigo', Style: 'fill' } },
      { value: '#ebebff',      theme: { Color: 'indigo', Style: 'tint' } },
    ],
  },
})
```

## Bulk Color Operations

### Audit unique colors in a frame

```bash
node pencil.cjs call search_all_unique_properties '{
  "filePath": "design.pen",
  "parents": ["frameId"],
  "properties": ["fillColor"]
}'
```

### Replace all hex → variable refs

```bash
node pencil.cjs call replace_all_matching_properties '{
  "filePath": "design.pen",
  "parents": ["frameId"],
  "properties": {
    "fillColor": [
      {"from": "#DF685A", "to": "$corail-500"},
      {"from": "#FFFFFF", "to": "$surface-card"}
    ]
  }
}'
```

---

## Design ↔ Code Sync Strategies

### Pencil → CSS/Tailwind

**Manual via AI prompt**:
```
"Generate CSS custom properties from these Pencil variables"
"Create a Tailwind config from my design tokens"
```

**Programmatic** (script idea):
1. `get_variables` → parse response
2. Map `$primary-500` → `--color-primary-500: #FF8C00`
3. Output to `tokens.css` or `tailwind.config.ts`

### CSS → Pencil

**Via AI prompt**:
```
"Create Pencil variables from my globals.css"
"Import design tokens from src/styles/tokens.css"
```

**Programmatic** (script idea):
1. Parse CSS file for `:root { --var: value }` patterns
2. Map `--color-primary-500: #FF8C00` → `{"primary-500": {"type": "color", "value": "#FF8C00"}}`
3. Call `set_variables` in batches of 5

### Naming Convention Alignment

| Pencil Variable | CSS Custom Property | Tailwind Class |
|----------------|---------------------|----------------|
| `$primary-500` | `--color-primary-500` | `text-primary-500` |
| `$surface-body` | `--color-surface-body` | `bg-surface-body` |
| `$font-body` | `--font-body` | `font-body` |
| `$radius-md` | `--radius-md` | `rounded-md` |

### Shared Alignment Points

- **Icons**: Lucide in both Pencil (`iconFontFamily: "lucide"`) and code (`lucide-react`)
- **Token architecture**: Same 2-level (primitive → semantic) in both
- **Naming**: Consistent kebab-case across both systems

### File Organization in Repo

```
project/
├── design/
│   ├── components.pen       # Component library
│   ├── components.lib.pen   # Shared library (if needed)
│   ├── pages/
│   │   ├── homepage.pen
│   │   └── dashboard.pen
│   └── tokens.pen           # Token definitions
├── src/
│   ├── styles/
│   │   ├── tokens.css       # Synced from Pencil
│   │   └── app.css
│   └── components/          # Code components
└── scripts/
    ├── pencil-to-css.ts     # Sync script (TODO)
    └── css-to-pencil.ts     # Sync script (TODO)
```
