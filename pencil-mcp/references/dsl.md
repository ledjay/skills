# batch_design DSL — Complete Reference

<!-- last_verified: 2026-03-21 -->
<!-- sources: docs.pencil.dev/for-developers/the-pen-format (2026-03-10), BioFS agent (2026-03-20) -->
<!-- stability: MEDIUM — DSL could gain new operations, limits may change -->

## Operations

| Op | Syntax | Description |
|----|--------|-------------|
| **Insert** | `name=I(parent, {nodeData})` | Insert new node under parent |
| **Update** | `U("nodeId", {updateData})` | Update existing node properties |
| **Copy** | `name=C("sourceId", parent, {overrides})` | Copy node to new parent |
| **Replace** | `name=R("nodeId", {nodeData})` | Replace node entirely |
| **Move** | `M("nodeId", parent, index?)` | Move node to new parent (optional index) |
| **Delete** | `D("nodeId")` | Delete a node |
| **Image** | `G("nodeId", "ai"\|"stock", "prompt")` | Generate image fill on frame |

## Critical Rules

1. Every `I()`, `C()`, `R()` **MUST** have a binding name (left side of `=`)
2. Bindings are usable as parents in subsequent operations
3. `document` = predefined root binding
4. **Max 25 operations per call** — beyond = instability
5. Operations are **sequential** — error in any = full rollback
6. Separate operations with `\n` in the string
7. **Never set `id` property** on new nodes (auto-generated)
8. **No "image" node type** — images are fills on frames

## Node Types

```
frame       — Container with optional flex layout, cornerRadius, clip
rectangle   — Shape with fill, stroke, cornerRadius
ellipse     — Circle/oval shape
text        — Text content with typography
line        — Simple line
polygon     — Regular polygon
path        — SVG path
icon_font   — Icon from font library (lucide, feather, Material Symbols, phosphor)
ref         — Instance of a reusable component
group       — Logical grouping
note        — Sticky note (non-rendering)
prompt      — AI prompt node
context     — Context annotation
```

## Layout Properties

```javascript
{
  layout: "horizontal" | "vertical" | "none",
  gap: 8,                           // Space between children
  padding: 16,                      // Uniform
  padding: [16, 24],                // [vertical, horizontal]
  padding: [8, 16, 8, 16],         // [top, right, bottom, left]
  justifyContent: "start" | "center" | "end" | "space_between" | "space_around",
  alignItems: "start" | "center" | "end",
}
```

## Sizing

```javascript
{
  width: 300,                       // Fixed
  width: "fill_container",          // Fill parent
  width: "fit_content",             // Fit children
  width: "fit_content(300)",        // Fit children, fallback 300
  height: "fill_container",
}
```

## Text Properties

```javascript
{
  type: "text",
  content: "Hello World",
  fontFamily: "$font-body",         // Can use variables
  fontSize: 16,
  fontWeight: "Bold",               // or "400", "500", "600", "700"
  textAlign: "left" | "center" | "right" | "justify",
  textAlignVertical: "top" | "middle" | "bottom",
  lineHeight: 1.5,                  // Multiplier of fontSize
  letterSpacing: 0.5,
  textGrowth: "auto" | "fixed-width" | "fixed-width-height",
  // IMPORTANT: Set textGrowth BEFORE width/height on text nodes
}
```

## Graphics

```javascript
// Solid color fill
{ fill: "#FF8C00" }
{ fill: "$primary-500" }

// Image fill (relative path from .pen file)
{ fill: { type: "image", url: "../images/photo.png", mode: "fill" } }

// Gradient
{ fill: { type: "gradient", gradientType: "linear", rotation: 180,
          colors: [
            { color: "#FF8C00", position: 0 },
            { color: "#E67E00", position: 1 }
          ] } }

// Stroke
{ stroke: { fill: "#000000", thickness: 2, align: "inside" } }

// Effects
{ effect: { type: "shadow", shadowType: "outer", blur: 16, spread: 0,
            offset: { x: 0, y: 4 }, color: "#00000020" } }
{ effect: { type: "blur", radius: 10 } }
{ effect: { type: "background_blur", radius: 20 } }
```

## Positioning (absolute within flex)

```javascript
{
  layoutPosition: "absolute",   // Escape flex flow
  x: -20,                       // Relative to parent top-left
  y: -30,
}
// Parent must have: { clip: false } for overflow effects
```

## Icon Fonts

```javascript
{
  type: "icon_font",
  iconFontFamily: "lucide",
  iconFontName: "arrow-right",    // Lucide icon name
  width: 16,
  height: 16,
  fill: "$text-primary"
}
// Available families: lucide, feather, Material Symbols Outlined/Rounded/Sharp, phosphor
```

## Complete Example

```bash
node pencil.cjs call batch_design '{
  "filePath": "/path/to/design.pen",
  "operations": "card=I(document,{type:\"frame\",name:\"ProductCard\",width:300,height:400,layout:\"vertical\",gap:0,fill:\"$surface-card\",cornerRadius:16,clip:true,effect:{type:\"shadow\",shadowType:\"outer\",blur:16,color:\"#00000010\",offset:{x:0,y:4}}})\nimg=I(card,{type:\"frame\",name:\"Image\",width:\"fill_container\",height:200,fill:{type:\"image\",url:\"../products/vitamin-c.png\",mode:\"fill\"}})\nbody=I(card,{type:\"frame\",name:\"Body\",width:\"fill_container\",height:\"fill_container\",layout:\"vertical\",gap:8,padding:[16,16]})\ntitle=I(body,{type:\"text\",content:\"Vitamine C BIO\",fontFamily:\"$font-display\",fontSize:18,fontWeight:\"600\",fill:\"$text-primary\"})\nprice=I(body,{type:\"text\",content:\"24,90 €\",fontFamily:\"$font-body\",fontSize:16,fontWeight:\"Bold\",fill:\"$text-accent\"})"
}'
```

## Timeouts

| Operation | Timeout |
|-----------|---------|
| batch_design (< 10 ops) | 15s |
| batch_design (10-25 ops) | 25s |
| set_variables (< 5 vars) | 15s |
| set_variables (5-10 vars) | 20s |
| get_screenshot | 25-30s |
| get_variables | 20s |
| replace_all_matching_properties | 30s |
| search_all_unique_properties | 25s |

**Anti-timeout**: Split large batches. Retry usually works on timeout.
