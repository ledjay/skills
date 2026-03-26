# Components, Instances, Slots & Patterns

<!-- last_verified: 2026-03-22 -->
<!-- sources: docs.pencil.dev/core-concepts/slots (2026-03-17), Pencil Sensei agent (2026-03-21/22) -->
<!-- stability: HIGH — all patterns tested and validated -->

## Creating a Reusable Component

Mark any element with `reusable: true`:

```javascript
// In batch_design
btn=I(document, {
  type: "frame",
  name: "Component/Button",
  reusable: true,          // ← This makes it a component
  width: 120, height: 44,
  x: 2000, y: 0,           // Place outside main board
  layout: "horizontal",
  gap: 8,
  padding: [12, 24],
  justifyContent: "center",
  alignItems: "center",
  cornerRadius: "$radius-md",
  fill: "$surface-punch"
})
I(btn, {type: "text", content: "Label", fontFamily: "$font-body", fontSize: 16, fontWeight: "Bold", fill: "#FFFFFF"})
```

**Visual indicator**: Magenta/purple bounding box (vs blue for regular elements).

**Naming convention**: `Component/Button`, `Component/ProductCard`, etc.

## Creating Instances

```javascript
I(parent, {type: "ref", ref: "componentId"})
```

Instances auto-update when the source component changes.

## Overrides via descendants

Override nested element properties in instances:

```json
{
  "type": "ref",
  "ref": "round-button",
  "fill": "#FF0000",
  "descendants": {
    "label": {
      "content": "Cancel",
      "fill": "#FFFFFF"
    }
  }
}
```

### Deep nesting pattern

For nested instances, prefix with parent ID + slash:

```json
{
  "descendants": {
    "ok-button/label": { "content": "Save" },
    "cancel-button/label": { "content": "Discard", "fill": "#FF0000" }
  }
}
```

### Object replacement

Include `type` in descendant to fully replace (not just override):

```json
{
  "descendants": {
    "label": {
      "id": "icon",
      "type": "icon_font",
      "iconFontFamily": "lucide",
      "iconFontName": "check"
    }
  }
}
```

### Children replacement (for containers)

**KEY**: `descendants` key = **SLOT NODE ID** (not slot name). Get the ID from `batch_get`.

Replace all children of a slot:

```json
{
  "descendants": {
    "VQkBS": {
      "children": [
        {"id": "item1", "type": "ref", "ref": "list-item", ...},
        {"id": "item2", "type": "ref", "ref": "list-item", ...}
      ]
    }
  }
}
```

## Slots

Slots are frames designated for content injection. **Tested & confirmed working (March 2026).**

### Creating a slot

```javascript
// In batch_design DSL — slot value = array of suggested component IDs
body=I(card, {type:"frame", name:"card-body", width:"fill_container",
  height:"fit_content(80)", layout:"vertical", gap:8, padding:[16,16],
  slot:["btn-primary-id", "btn-outline-id"]})
```

- Visual: Diagonal hatch lines on canvas (magenta/purple)
- `slot` value = array of **component IDs** (not names) used as suggestions
- Only empty frames in component origins can be slots
- Once marked, cannot be unmarked

### Multi-Suggest Slots (NEW! 2026-03-22)

Slots can suggest multiple components:

```javascript
// Slot with multiple suggestions
I(parent,{type:"frame",name:"actions",slot:["${btnPrimary.id}","${btnSecondary.id}"]})
```

**Behavior**: When creating an instance, Pencil auto-populates the slot with instances of ALL suggested components.

**Test evidence**: `fresh-multi-suggest.png` (shows both Primary and Secondary buttons auto-populated)

### Auto-population behavior

**When you create a ref** to a component with a slot, Pencil **auto-populates** the slot with instances of the suggested components. This means:
- Creating a bare ref: slot is filled automatically with suggested components
- You can then override with `descendants` via `U()`

### Slot ID vs Slot Name

The `descendants` key uses **node IDs**, not names:
```javascript
// Get the slot's actual node ID first:
batch_get({"nodeIds":["card-component-id"],"readDepth":2})
// → find child with name:"card-body" → its "id" is the descendants key

// Then override:
U("instance-id", {descendants:{"VQkBS":{children:[...]}}})
//                                ↑ slot node ID, not "card-body"!
```

### Slot Access Through Variants (NEW! 2026-03-22)

When using Shell Pattern, the slot ID comes from the **Shell**, not the variant:

```javascript
// Shell has slot with ID "abc123"
// Variant-Green is a ref to Shell
// Instance is a ref to Variant-Green

// To override slot content, use the SHELL's slot ID:
U("INSTANCE_ID", {descendants: {"SHELL_SLOT_ID": {children: [...]}}})
```

**Key**: Use the slot ID from the Shell component, not any variant.

### Deep Slot Injection (NEW! 2026-03-22)

You can inject content into slots nested inside components:

```javascript
// Component with nested slot
outer=I(document,{type:"frame",name:"Outer",reusable:true,...})
slot=I(outer,{type:"frame",name:"outer-slot",slot:[...]})

// Inject into nested slot via U() + descendants
U("INSTANCE_ID",{descendants:{"SLOT_ID":{children:[{type:"text",content:"Injected!"}]}}})
```

**Test evidence**: `edge-deep-slot.png`

### Populating slots via U() — Proven Pattern

```javascript
// Step 1: Create instance (auto-populates with suggestions)
ids = batch('c1=I(document,{type:"ref",ref:"CARD_ID",x:0,y:120})')
// → Pencil auto-fills slot with suggested components

// Step 2: Override with custom content using U() + descendants
dsl = 'U("' + c1 + '", {descendants:{"SLOT_ID":{children:[' +
  '{id:"title",type:"text",content:"My Title",fontSize:16,...},' +
  '{id:"cta",type:"ref",ref:"BTN_ID"}' +
']}}})'
batch(dsl)
```

**Note**: For complex descendants, build the DSL string in Python/JS (string concatenation) — don't try to put deeply nested JSON directly in shell commands.

### Slot use cases

| Good for | Bad for |
|----------|---------|
| Card content areas | Style variants (sm/md/lg) |
| Table rows | State changes (hover/active) |
| Navigation items | Icon swapping |
| Modal content | Color themes |

## Variant Patterns

Pencil has NO Figma-style property variants. Use these patterns instead.

### Decision Tree — Which pattern to use?

```
The variation is structural (different node trees)?
│
├── YES → ONLY structural?
│         │
│         ├── YES → Shell Pattern (Pattern 1)
│         │         e.g. Card Simple / Card Media / Card Action
│         │
│         └── NO (structural + visual) → Hybrid Shell+Theme (Pattern 5) ⭐
│                   e.g. Button (icon position × color × variant × state)
│
└── NO  → The axes are orthogonal (color × size × style × shape)?
          │
          ├── YES → Theme Pattern (Pattern 4) ← more scalable for design kits
          │         e.g. Badge, Tag (all variations visual)
          │
          └── Content varies inside?
              │
              ├── YES → Slots (Pattern 3)
              │         e.g. Card with product vs card with article
              │
              └── Both (visual + content) → Theme Pattern + Slots
```

**Quick rule**: Structure → Shell. Visual axes → Theme. Both → Hybrid. Content → Slots.

---

### Pattern 1: Shell Pattern — Reusable Ref (⭐ RECOMMENDED for color/style variants)

**Tested & confirmed working (March 2026).** This is the killer pattern for design systems.

Create a "Shell" component (structure), then create variants as **reusable refs** with color overrides. Modifying the Shell auto-updates all variants.

```javascript
// Step 1: Create Shell (structure + slot) — single source of truth
shell=I(document, {type:"frame", name:"Component/Card-Shell", reusable:true,
  x:2200, y:0, width:300, layout:"vertical", gap:12, padding:[20,20],
  cornerRadius:12, fill:"#FFFFFF"})
I(shell, {type:"text", name:"card-title", content:"Title", fontSize:16, fontWeight:"600"})
I(shell, {type:"frame", name:"card-content", height:"fit_content(80)",
  width:"fill_container", layout:"vertical", gap:8, slot:[]})
// → Shell ID = "abc123"

// Step 2: Create variants as reusable refs (SEPARATE batch — need shell ID!)
I(document, {type:"ref", ref:"abc123", name:"Component/Card-Green",
  reusable:true, x:2200, y:250, fill:"#F0F7F2"})
I(document, {type:"ref", ref:"abc123", name:"Component/Card-Promo",
  reusable:true, x:2200, y:500, fill:"#FFF5F0",
  stroke:{fill:"#FF8C00", thickness:2, align:"inside"}})

// Step 3: Create instances of variants
I(parent, {type:"ref", ref:"GREEN_ID"})
I(parent, {type:"ref", ref:"PROMO_ID"})
```

**Why it works**: `Ref extends Entity`, and Entity has `reusable?: boolean`. A ref marked `reusable:true` becomes a component itself, while inheriting structure from its source.

**Key behaviors**:
- ✅ Modify Shell → all variants auto-update
- ✅ Slots accessible through variant instances
- ✅ Each variant appears in Reusable Components panel
- ✅ Instances of variants inherit both structure AND color
- ✅ `descendants` works with slot IDs from the Shell

**⚠️ CRITICAL**: Variants must be created in a **separate batch** from the Shell, because you need the Shell's actual node ID (not the binding name).

**When to use**: Color variants, theme variants, border variants — anything where the structure is identical but visual style differs.

### Pattern 2: Separate Components (for structural variants)

```
Component/Button-Primary      (different structure/behavior)
Component/Button-Outline       (different structure)
Component/Button-Ghost         (different structure)
```

**When to use**: When variants have different internal structure (e.g. icon-only button vs text button), not just color changes.

### Pattern 3: Slots for Composition (for content variants)

Use slots for variable content (icons, actions) inside a fixed shell:

```javascript
btn=I(document, {type: "frame", name: "Component/ButtonWithIcon", reusable: true, ...})
I(btn, {type: "frame", name: "icon-slot", width: 20, height: 20, slot: ["icon-check", "icon-arrow"]})
I(btn, {type: "text", content: "Label", ...})
```

**When to use**: Same visual style, different content (card with product vs card with article).

### Decision Guide

| What varies? | Pattern | Example |
|-------------|---------|---------|
| **Color/fill/stroke** | Shell Pattern (reusable ref) | Card-Green, Card-Promo |
| **Internal structure** | Separate Components | Button-Primary vs Button-Icon |
| **Content inside** | Slots | Card with product vs article |
| **Size (sm/md/lg)** | Shell Pattern (override width/padding) | Card-Compact, Card-Full |
| **State (hover/active)** | Visual doc frame (not interactive) | States/Button |
| **Color × style × size (orthogonal axes)** | **Theme Pattern** | Badge (any combination) |

### Pattern 4: Theme Pattern — Parametric Component (⭐ RECOMMENDED for design kits)

**Tested & confirmed working (March 2026).** Multi-axis conditions validated.
Evidence: `variants-exploration/multiaxis-validated.png`

Create **one component** + theme axes + conditional variables. Instances set their own theme combination — no need to pre-create every variant.

**Why it's better for design kits**:
- 1 node vs N×M×P×Q nodes — doesn't explode combinatorially
- Adding a new color = 1 new set of variable entries, not N new nodes
- Structurally mirrors how code components work (`<Badge color="red" style="fill" />`)
- Each instance self-describes its combination via `theme` property

```typescript
import { createParametricComponent } from './helpers.ts'

const badge = await createParametricComponent(pencil, {
  name: 'Badge',
  axes: {
    Color: ['indigo', 'red', 'green'],
    Style: ['fill', 'tint', 'outline'],
    Size:  ['sm', 'md', 'lg'],
  },
  defaultTheme: { Color: 'indigo', Style: 'fill', Size: 'md' },
  variables: {
    'badge-bg': {
      type: 'color',
      value: [
        { value: '$indigo-main', theme: { Color: 'indigo', Style: 'fill'    } },
        { value: '#ebebff',      theme: { Color: 'indigo', Style: 'tint'    } },
        { value: '#00000000',    theme: {                  Style: 'outline' } }, // single-axis ok
        { value: '$red-main',    theme: { Color: 'red',    Style: 'fill'    } },
        { value: '#ffe9e9',      theme: { Color: 'red',    Style: 'tint'    } },
      ],
    },
    'badge-text': {
      type: 'color',
      value: [
        { value: '#ffffff',   theme: {                  Style: 'fill'    } },
        { value: '$indigo-main', theme: { Color: 'indigo', Style: 'tint'    } },
        { value: '$indigo-main', theme: { Color: 'indigo', Style: 'outline' } },
        { value: '$red-main',    theme: { Color: 'red',    Style: 'tint'    } },
      ],
    },
    'badge-padding-x': {
      type: 'number',
      value: [
        { value: 6,  theme: { Size: 'sm' } },
        { value: 8,  theme: { Size: 'md' } },
        { value: 12, theme: { Size: 'lg' } },
      ],
    },
  },
  fill: '$badge-bg',
  layout: 'horizontal',
  padding: [4, 8],
  clip: true,
  justifyContent: 'center',
  alignItems: 'center',
  children: [
    { type: 'text', name: 'badge-label', content: 'Badge',
      fontFamily: 'Inter', fontSize: 12, fontWeight: 'bold', fill: '$badge-text' },
  ],
})

// Instances — each specifies its own combination:
await batch(pencil, `
  i1=I(frame, {type:"ref", ref:"${badge.id}", theme:{Color:"red",    Style:"tint",    Size:"sm"}})
  i2=I(frame, {type:"ref", ref:"${badge.id}", theme:{Color:"indigo", Style:"fill",    Size:"lg"}})
  i3=I(frame, {type:"ref", ref:"${badge.id}", theme:{Color:"green",  Style:"outline", Size:"md"}})
`)
```

**When to use**:
- ✅ Multiple independent visual axes (color, size, style, shape)
- ✅ Many combinations (5+ axes or 10+ values)
- ✅ Design kit where users pick their own combinations
- ✅ Aligning design system with code component API

**Don't use when**:
- ❌ Variants have different internal structure → Shell Pattern
- ❌ Only 2-3 fixed named presets → Shell Pattern is simpler
- ❌ About content, not style → Slots

---

### Pattern 5: Hybrid Shell+Theme — Structure × Visual (⭐ RECOMMENDED for complex components)

**Tested & confirmed working (March 2026).** Evidence: `variants-exploration/button-hybrid.png`

Split concerns: **Shell Pattern** for structural variants (different DOM trees), **Theme Pattern** for visual axes (colors, states). Best of both worlds.

**When to use**:
- Component has BOTH structural differences AND visual axes
- e.g. Button: icon position (structural) × color × variant × state (visual)
- e.g. Input: with/without label (structural) × color × state (visual)

**Architecture**:
```
Theme Axes:    Btn-Color(brand/neutral/danger) × Btn-Variant(primary/secondary/tertiary) × Btn-State(5)
Variables:     btn-bg, btn-text, btn-border (conditional on axes)

Component/Btn-Shell (reusable)          ← Chrome: fill, stroke, padding, radius
  ├── btn-slot (slot)                   ← Content injection point
  └── btn-spinner (absolute, opacity)   ← Loading overlay

Component/Btn (ref → Shell, reusable)        ← Slot: [label]
Component/Btn-IconL (ref → Shell, reusable)  ← Slot: [icon, label]
Component/Btn-IconR (ref → Shell, reusable)  ← Slot: [label, icon]
```

**Key benefit over pure Theme Pattern**: No opacity hacks for icons. Icons are structurally present or absent — no phantom gaps in layout.

**Scoping strategy — CRITICAL for multi-component systems**:

All axes and variables MUST be prefixed with the component name:
```
Btn-Color   ≠  Badge-Color   ≠  Tag-Color     (axes are independent)
btn-bg      ≠  badge-bg      ≠  tag-bg         (variables are isolated)
```

Without prefixes, a parent frame with `theme: {Color: "danger"}` would contaminate ALL child components that have a `Color` axis. Prefixing makes themes component-scoped.

**Implementation** (direct .pen JSON):

```typescript
// 1. Shell defines chrome + slot + spinner
const shell = {
  type: 'frame', id: 'btn-shell', name: 'Component/Btn-Shell',
  reusable: true,
  fill: '$btn-bg',
  stroke: { align: 'inside', thickness: 1.5, fill: '$btn-border' },
  layout: 'horizontal', padding: [10, 16], cornerRadius: 8,
  justifyContent: 'center', alignItems: 'center', clip: true,
  theme: { 'Btn-Color': 'brand', 'Btn-Variant': 'primary', 'Btn-State': 'default' },
  children: [
    { type: 'frame', id: 'btn-slot', name: 'btn-content',
      slot: [], layout: 'horizontal', gap: 6,
      width: 'fit_content', height: 'fit_content', alignItems: 'center' },
    { type: 'icon_font', id: 'btn-spinner', name: 'btn-spinner',
      iconFontFamily: 'lucide', iconFontName: 'loader-circle',
      fill: '$btn-text', width: 16, height: 16,
      opacity: '$btn-spinner-opacity', layoutPosition: 'absolute' },
  ],
}

// 2. Structural variants inject different slot content
const btnDefault = {
  type: 'ref', id: 'btn-default', name: 'Component/Btn',
  ref: 'btn-shell', reusable: true,
  descendants: {
    'btn-slot': { children: [
      { id: 'btn-lbl', type: 'text', name: 'btn-label', content: 'Button',
        fontFamily: 'Inter', fontSize: 13, fontWeight: '500', fill: '$btn-text' },
    ]},
  },
}

const btnIconLeft = {
  type: 'ref', id: 'btn-iconl', name: 'Component/Btn-IconL',
  ref: 'btn-shell', reusable: true,
  descendants: {
    'btn-slot': { children: [
      { id: 'il-icon', type: 'icon_font', iconFontFamily: 'lucide',
        iconFontName: 'arrow-left', fill: '$btn-text', width: 14, height: 14 },
      { id: 'il-lbl', type: 'text', name: 'btn-label', content: 'Button',
        fontFamily: 'Inter', fontSize: 13, fontWeight: '500', fill: '$btn-text' },
    ]},
  },
}

// 3. Instances pick structure AND visuals independently
const instance = {
  type: 'ref', ref: 'btn-iconl',
  theme: { 'Btn-Color': 'danger', 'Btn-Variant': 'secondary', 'Btn-State': 'hover' },
  descendants: { 'il-lbl': { content: 'Delete' } },
}
```

**Comparison**:

| | Pure Theme | Hybrid Shell+Theme |
|---|---|---|
| Axes | 4 (incl. icon) | 3 (visual only) |
| Variables | 7 (incl. opacity hacks) | 5 (clean) |
| Components | 1 | 4 (1 shell + 3 variants) |
| Icon handling | opacity:0 (phantom gap) | Absent from DOM |
| Shell propagation | N/A | Modify shell → all variants update |

---

## Component Composition

Advanced patterns for building scalable design systems in Pencil. **All patterns tested & validated (March 2026).**

### Overview: 3 Composition Primitives

Pencil provides 3 ways to compose components:

| Primitive | What it does | Use for |
|-----------|-------------|---------|
| **Reusable Ref** | Instance of component, itself a component | Visual variants (color, border, size) |
| **Slot** | Content injection point | Variable content (product vs article) |
| **Nested Ref** | Component containing another component | Wrapper patterns (card inside modal) |

These can be **combined**. A Shell Pattern = Reusable Ref + Slot.

### Multi-Level Propagation (NEW! 2026-03-22)

**Tested**: Button change propagates through 3+ levels of nesting!

```
Component/Btn-Primary (fill: green)
    ↓ ref inside
Component/Card-Shell (contains ref to Button)
    ↓ reusable ref
Component/Card-Green (variant of Shell)
    ↓ instance
Instance/Card-Green-1
    ↓ ref inside
Composition/Wrapper-Card (contains ref to Card)
    ↓ instance
Instance/Wrapper-1
```

**Result**: Modifying Button fill propagates to ALL levels!

**Test evidence**: `deep-3level-before.png` vs `deep-3level-after.png`

### Nested Refs (NEW! 2026-03-22)

You can nest components inside other components:

```javascript
// Create Button
btn=I(document,{type:"frame",name:"Component/Btn-Primary",reusable:true,...})

// Create Card with a ref to Button inside (MUST be separate batch!)
card=I(document,{type:"frame",name:"Component/Card-Shell",reusable:true,...})
cta=I(card,{type:"frame",name:"card-cta",...})

// Batch 2: Add Button as nested ref
I(cta,{type:"ref",ref:"${btnId}",name:"cta-btn"})
```

**Key**: Nested refs require a separate batch to use the actual component ID.

### Wrapper Pattern (NEW! 2026-03-22)

A frame containing a ref to another component:

```javascript
wrapper=I(document,{type:"frame",name:"Composition/Wrapper",reusable:true,...})
I(wrapper,{type:"text",content:"Label"})
I(wrapper,{type:"ref",ref:"${cardId}",width:"fill_container"})
```

**Use case**: Add chrome/branding around base components.

**Test evidence**: `composition-wrapper.png`

### Multi-Variant Container (NEW! 2026-03-22)

Multiple variants in one container:

```javascript
row=I(document,{type:"frame",name:"Demo",layout:"horizontal",gap:24,...})
I(row,{type:"ref",ref:"${cardGreenId}"})
I(row,{type:"ref",ref:"${cardBlueId}"})
```

**Use case**: Design system showcase, variant comparison.

**Test evidence**: `edge-multi-variants.png`

### Shell Pattern (Reusable Ref + Slot)

The most powerful pattern for design systems. Centralizes structure, enables visual variants with auto-propagation.

**Architecture**:
```
Component/Card-Shell (reusable)     ← Single source of truth
  ├── title (text)
  ├── content-slot (frame, slot)
  └── [any structural elements]

Component/Card-Green (ref → Shell, reusable, fill: green)    ← Variant
Component/Card-Promo (ref → Shell, reusable, fill: orange)   ← Variant

Instance (ref → Card-Green)         ← Usage
  └── slot content injected via descendants
```

**Propagation chain**: Modify Shell → Green/Promo auto-update → all instances auto-update.

**Implementation** (use `createComponentFamily()` helper):

```typescript
import { createComponentFamily } from './helpers.ts'

const family = await createComponentFamily(pencil, {
  shell: {
    name: 'Card',
    width: 300,
    layout: 'vertical',
    gap: 12,
    padding: [20, 20],
    cornerRadius: 12,
    fill: '#FFFFFF',
    children: [
      { type: 'text', name: 'card-title', content: 'Title', fontSize: 16, fontWeight: '600' },
    ],
    slot: { name: 'card-content', height: 'fit_content(80)', layout: 'vertical', gap: 8 },
  },
  variants: [
    { name: 'Green', fill: '#F0F7F2' },
    { name: 'Promo', fill: '#FFF5F0', stroke: { fill: '#FF8C00', thickness: 2, align: 'inside' } },
    { name: 'Dark',  fill: '#1A2B1F' },
  ],
  x: 2200, y: 0,   // Canvas position (outside main design)
})

// family.shell.id     → Shell component ID
// family.shell.slotId → Slot frame ID
// family.variants     → [{ name: 'Green', id: '...' }, ...]
```

**Manual implementation** (2 batches required):

```javascript
// Batch 1: Create Shell
shell=I(document, {type:"frame", name:"Component/Card-Shell", reusable:true,
  x:2200, y:0, width:300, layout:"vertical", gap:12, padding:[20,20],
  cornerRadius:12, fill:"#FFFFFF"})
I(shell, {type:"text", name:"card-title", content:"Title", fontSize:16})
I(shell, {type:"frame", name:"card-content", height:"fit_content(80)",
  width:"fill_container", layout:"vertical", gap:8, slot:[]})
// → Get Shell ID (e.g. "abc123") and Slot ID (e.g. "def456")

// Batch 2: Create Variants (MUST be separate — needs Shell's real ID)
I(document, {type:"ref", ref:"abc123", name:"Component/Card-Green",
  reusable:true, x:2200, y:250, fill:"#F0F7F2"})
I(document, {type:"ref", ref:"abc123", name:"Component/Card-Promo",
  reusable:true, x:2200, y:500, fill:"#FFF5F0"})
```

### When to Use Shell Pattern

✅ **Use when**:
- Multiple components share identical structure
- Variants differ only in visual style (color, border, size, opacity)
- You want modifications to propagate automatically
- Building a design system with consistent components

❌ **Don't use when**:
- Variants have different internal structure (use separate components)
- It's about content, not style (use slots directly)
- All instances should change at once (use theming/variables)

### Combining Shell + Slots

The Shell Pattern and Slots work together naturally:

```
Card-Shell (structure + slot)
  ├── title
  └── content-slot ← Slots handle WHAT goes inside

Card-Green (ref → Shell, fill: green) ← Shell Pattern handles HOW it looks
Card-Promo (ref → Shell, fill: orange)

Instance of Card-Green:
  └── slot filled with product info  ← Each instance has unique content
```

This gives you TWO axes of variation:
1. **Visual** (Shell Pattern): Green, Promo, Dark
2. **Content** (Slots): Product, Article, Promo content

### Multi-Level Descendants

When accessing children through nested components:

```javascript
// Instance of Card-Green (which is a ref to Shell)
// To access the slot in Shell, use the slot's original ID:
U("INSTANCE_ID", { descendants: { "SLOT_ID": { children: [...] } } })

// The slot ID comes from the Shell, NOT the variant.
// Always batch_get the Shell to find slot IDs.
```

### Decision Matrix

| What varies? | Pattern | Auto-propagation? | Scales to N combos? |
|-------------|---------|-------------------|---------------------|
| Color/border (named presets) | **Shell Pattern** (reusable ref) | ✅ Yes | ⚠️ Linear |
| Internal structure | **Separate Components** | ❌ No | ✅ Yes |
| Content inside | **Slots** | N/A (per-instance) | ✅ Yes |
| Color + Content | **Shell Pattern + Slots** | ✅ Structure propagates | ⚠️ Linear |
| Orthogonal visual axes (color × style × size) | **Theme Pattern** | ✅ All at once | ✅ Constant |
| Structure + visual axes (icon pos × color × state) | **Hybrid Shell+Theme** ⭐ | ✅ Both | ✅ Constant |
| Global theme (dark/light) | **Variables + Theming** | ✅ All at once | ✅ Yes |
| States (hover/active) | **Visual doc frame** | ❌ Not interactive | N/A |

---

## Design Libraries (.lib.pen)

Shared component collections importable across files.

### Creating a library

1. Create a `.pen` file
2. Mark as library (Layers panel → Libraries → "Turn into library")
3. File becomes `.lib.pen`
4. Populate with components

### Using a library

1. Import in target file (Layers → Libraries → select)
2. Drag components from Assets panel

### Limitations

- Once marked as library, **cannot be undone**
- Built-in kits: Nitro, Lunaris, Halo, Shadcn UI
- Cross-file component updates propagate automatically

### MCP considerations (to explore)

- Can `batch_get` read components from imported libraries?
- Can `batch_design` insert instances of library components?
- How does `get_variables` handle library-defined variables?
