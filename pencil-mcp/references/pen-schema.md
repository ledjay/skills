# .pen Format — TypeScript Schema

<!-- last_verified: 2026-03-21 -->
<!-- sources: docs.pencil.dev/for-developers/the-pen-format (2026-03-10) -->
<!-- stability: LOW — schema actively evolving, "we reserve the right to introduce breaking changes" -->

Authoritative reference from https://docs.pencil.dev/for-developers/the-pen-format

## Overview

- `.pen` files = JSON describing an object tree (like HTML/SVG)
- Each object has unique `id` (no slashes) and `type` field
- Top-level objects on infinite 2D canvas (need `x`, `y`)
- Nested objects positioned relative to parent's top-left

## Document Structure

```typescript
interface Document {
  version: string;
  themes?: { [axis: string]: string[] };
  imports?: { [alias: string]: string };  // path to imported .pen files
  variables?: { [name: string]: VariableDef };
  children: (Frame | Group | Rectangle | Ellipse | Line | Polygon |
             Path | Text | Note | Context | Prompt | IconFont | Ref)[];
}
```

## Variable Definition

```typescript
// Single value
{ type: "color", value: "#FF8C00" }
{ type: "color", value: "$other-var" }

// Themed values (last matching theme wins)
{ type: "color", value: [
  { value: "#FFFFFF", theme: { Mode: "Light" } },
  { value: "#000000", theme: { Mode: "Dark" } }
]}

// Types: "boolean" | "color" | "number" | "string"
```

**Binding**: Use `$variableName` in any compatible property.

## Core Types

### Entity (base for all)

```typescript
interface Entity {
  id: string;               // Unique, no slashes
  name?: string;            // Display name
  context?: string;         // Context annotation
  reusable?: boolean;       // true = component
  theme?: Theme;            // { axis: value }
  enabled?: boolean;
  opacity?: number;         // 0-1
  rotation?: number;        // Degrees, counter-clockwise
  flipX?: boolean;
  flipY?: boolean;
  x?: number;               // Ignored in flex layout
  y?: number;               // Ignored in flex layout
  metadata?: { type: string; [key: string]: any };
}
```

### Frame (main container)

```typescript
interface Frame extends Entity {
  type: "frame";
  width?: number | SizingBehavior;   // "fill_container", "fit_content", "fit_content(300)"
  height?: number | SizingBehavior;
  cornerRadius?: number | [tl, tr, br, bl];
  clip?: boolean;                     // Default false
  fill?: Fill | Fill[];
  stroke?: Stroke;
  effect?: Effect | Effect[];
  layout?: "none" | "vertical" | "horizontal";
  gap?: number;
  padding?: number | [v, h] | [t, r, b, l];
  justifyContent?: "start" | "center" | "end" | "space_between" | "space_around";
  alignItems?: "start" | "center" | "end";
  placeholder?: boolean;
  slot?: string[];                    // IDs of suggested components
  children?: Child[];
}
```

### Text

```typescript
interface Text extends Entity {
  type: "text";
  content?: string | TextStyle[];
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  letterSpacing?: number;
  fontStyle?: string;
  underline?: boolean;
  lineHeight?: number;          // Multiplier on fontSize
  textAlign?: "left" | "center" | "right" | "justify";
  textAlignVertical?: "top" | "middle" | "bottom";
  strikethrough?: boolean;
  href?: string;
  textGrowth?: "auto" | "fixed-width" | "fixed-width-height";
  // ⚠️ MUST set textGrowth before width/height!
  width?: number | SizingBehavior;
  height?: number | SizingBehavior;
  fill?: Fill | Fill[];
}
```

### Ref (component instance)

```typescript
interface Ref extends Entity {
  type: "ref";
  ref: string;                  // ID of source component
  descendants?: {
    [idPath: string]:
      | {}                      // Property overrides (no type/id/children)
      | { type: ..., ... }      // Full object replacement (has type)
      | { children: Child[] }   // Children replacement
  };
  [key: string]: any;           // Additional overrides on root
}
```

### IconFont

```typescript
interface IconFont extends Entity {
  type: "icon_font";
  iconFontName?: string;
  iconFontFamily?: string;      // "lucide" | "feather" | "Material Symbols *" | "phosphor"
  weight?: number;              // 100-700 (variable fonts only)
  width?: number;
  height?: number;
  fill?: Fill | Fill[];
}
```

### Other types

- **Rectangle**: Entity + Size + fill/stroke/cornerRadius
- **Ellipse**: Entity + Size + fill/stroke + innerRadius/startAngle/sweepAngle
- **Line**: Entity + Size + stroke
- **Polygon**: Entity + Size + polygonCount/cornerRadius
- **Path**: Entity + geometry (SVG path) + fillRule
- **Group**: Entity + children + optional layout
- **Note**: Entity + content (non-rendering)
- **Prompt**: Entity + content + model
- **Context**: Entity + content

## Fill Types

```typescript
type Fill =
  | string                          // Color: "#FF8C00" or "$var"
  | { type: "color", color: string, enabled?: boolean, blendMode?: BlendMode }
  | { type: "gradient", gradientType: "linear"|"radial"|"angular",
      colors: {color: string, position: number}[],
      rotation?: number, center?: {x,y}, size?: {width,height} }
  | { type: "image", url: string, mode?: "stretch"|"fill"|"fit",
      opacity?: number }
  | { type: "mesh_gradient", columns?: number, rows?: number,
      colors?: string[], points?: [...] }
```

## Effect Types

```typescript
type Effect =
  | { type: "blur", radius: number }
  | { type: "background_blur", radius: number }
  | { type: "shadow", shadowType: "inner"|"outer",
      offset?: {x,y}, spread?: number, blur?: number,
      color?: string, blendMode?: BlendMode }
```

## Stroke

```typescript
interface Stroke {
  align?: "inside" | "center" | "outside";
  thickness?: number | { top, right, bottom, left };
  join?: "miter" | "bevel" | "round";
  cap?: "none" | "round" | "square";
  dashPattern?: number[];
  fill?: Fill | Fill[];
}
```

## SizingBehavior

```typescript
// Fixed
width: 300

// Dynamic
width: "fill_container"           // Use parent size
width: "fit_content"              // Use children size
width: "fit_content(300)"         // Children size, fallback 300
```

## BlendModes

`"normal"` | `"darken"` | `"multiply"` | `"linearBurn"` | `"colorBurn"` |
`"light"` | `"screen"` | `"linearDodge"` | `"colorDodge"` | `"overlay"` |
`"softLight"` | `"hardLight"` | `"difference"` | `"exclusion"` |
`"hue"` | `"saturation"` | `"color"` | `"luminosity"`
