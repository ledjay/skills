# Pencil Gotchas — Complete List

<!-- last_verified: 2026-03-26 -->
<!-- sources: Pencil Sensei agent + fresh agent feedback (2026-03-26) -->
<!-- stability: HIGH (practical experience) — gotchas only invalidated when Pencil ships fixes -->

Hard-won lessons from real-world usage.

## ⚠️ Critical: .pen JSON Format

| Gotcha | Detail |
|--------|--------|
| **NEVER write .pen JSON directly** | The `.pen` format is internal. Writing JSON manually opens in Pencil but shows an **empty canvas**. Always use MCP tools (`batch_design`, `set_variables`, etc.). |

## CLI Mode Specific Gotchas

> These apply when using `pencil.cjs` for one-off calls.

| Gotcha | Detail |
|--------|--------|
| **Connection is ephemeral** | Each `pencil.cjs` invocation opens a NEW MCP connection. Context is LOST between calls. |
| **filePath context lost** | After `open_document`, subsequent calls may "forget" the active file. Add `filePath` if you get "wrong .pen file" error. |
| **Bindings are ephemeral** | `batch_design` returns bindings (`{card: "ZwNEy"}`) but they're NO LONGER AVAILABLE in the next call. Capture and reuse the `insertedIds` instead. |
| **WebSocket reconnection is normal** | Logs like `[MCP] WebSocket disconnected, attempting to reconnect (attempt 1/3)` are NORMAL in CLI mode. Don't worry. |
| **get_screenshot needs filePath** | In CLI mode, `get_screenshot` often fails without explicit `filePath` parameter. |
| **Recommended timeout: 30-60s** | Not 15-20s. WebSocket reconnection adds delay. |

## Colors

| Gotcha | Detail |
|--------|--------|
| **OKLCH = invisible** | Pencil accepts OKLCH values in `set_variables` silently but renders **white/nothing**. Always use hex. |
| **Alpha in hex** | `#RRGGBBAA` format works. `#DF685A20` = corail at ~12% opacity. Last 2 chars = alpha (00→FF). |
| **Variables chain** | `$surface-punch → $corail-500 → #DF685A` resolves correctly. Use for 2-level token architecture. |
| **Can't delete variables** | Sending `null` as value causes JSON error. Orphan variables stay forever — just ignore them. |

## Layout & Positioning

| Gotcha | Detail |
|--------|--------|
| **Flex children ignore x/y** | In `layout: "vertical"` or `"horizontal"`, `x` and `y` are ignored unless `layoutPosition: "absolute"`. |
| **layoutPosition: "absolute"** | Required to escape flex flow. Use for overlays, packshots that overflow. |
| **clip: false on PARENT** | Default is clipped. Set `clip: false` on the **parent** frame for child overflow effects. |
| **fill_container** | Child takes full width/height of parent. Only works when parent has layout. |

## Images

| Gotcha | Detail |
|--------|--------|
| **No "image" node type** | Images are fills on frames: `{fill: {type: "image", url: "..."}}` |
| **Relative paths** | URLs relative to the `.pen` file location |
| **G() for AI/stock** | `G(nodeId, "ai", "prompt")` or `G(nodeId, "stock", "keywords")` — applies image fill |
| **File menu import broken (macOS)** | Use drag-and-drop for image import in the UI |

## Components

| Gotcha | Detail |
|--------|--------|
| **No Figma-style variants** | No Size: sm/md/lg, no State: default/hover. **Workaround**: Shell Pattern — create Shell, then variants as `reusable:true` refs with fill overrides. See `references/components.md`. |
| **Shell Pattern works** | `Ref extends Entity` → Ref can be `reusable:true`. Create variants as reusable refs! Modify Shell → all variants auto-update. **Tested & confirmed (March 2026).** |
| **Multi-level propagation works** | Button → Card → Wrapper → Instance. Changes propagate through 3+ levels! **Tested 2026-03-22.** |
| **Nested refs = separate batch** | Creating a component with a ref inside another component requires 2 batches: first create outer, then add nested ref. |
| **descendants limited** | Overrides via `descendants` are not discoverable, not documentable, not exportable. |
| **Slots ≠ variants** | Slots = composition (what goes inside). Variants = configuration (how it looks). Different concepts. |
| **Place components outside board** | Convention: put at x=2000+ so they don't clutter the main design |
| **reusable: true is permanent** | Once a component, always a component. Same for `.lib.pen` files. |
| **Variants = separate batch** | Shell Pattern: create Shell in batch 1, get its ID, then create variants in batch 2 (need real ID, not binding name). |

## Slots

| Gotcha | Detail |
|--------|--------|
| **Slot descendants key = node ID** | `descendants` uses the slot's **node ID** (`"VQkBS"`), NOT the node name (`"card-body"`). Always `batch_get` the component first to find the slot's ID. |
| **Slot ID from Shell** | When using Shell Pattern, the slot ID comes from the **Shell**, not the variant. Use the Shell's slot ID for `descendants`. |
| **Multi-suggest slots work** | `slot: ["${btn1}", "${btn2}"]` auto-populates with ALL suggested components. **Tested 2026-03-22.** |
| **Refs to slotted components auto-populate** | Creating a `type:"ref"` to a component with slots → Pencil auto-fills the slot with the suggested components. Then `U()` with `descendants` to override. |
| **Deep slot injection works** | Can inject content into slots nested inside components via `U()` + `descendants`. **Tested 2026-03-22.** |

## Performance & MCP

| Gotcha | Detail |
|--------|--------|
| **Omit filePath for active file** | If the file is already open in Pencil, omitting `filePath` is more reliable and faster than passing the absolute path. Absolute paths can cause timeouts. |
| **Always use pencil.cjs** | Compiled bundle. `npx tsx pencil.ts` = 1.3s startup penalty every call. |
| **Max 25 ops per batch_design** | Beyond = instability and potential corruption |
| **Max 5-10 vars per set_variables** | Beyond = timeout (15-20s) — but in CLI mode, use 30-60s timeout |
| **Always get_screenshot after batch_design** | No preview without it. You're designing blind otherwise. |
| **`$var` in fontFamily doesn't resolve** | Variables work for colors/numbers, NOT for `fontFamily`. Pencil warns "Font family '$font-body' is invalid". Use literal strings: `"Inter"`, `"DM Sans"`. |
| **Complex descendants → string concat** | Don't embed deeply nested JSON in shell DSL strings. Build the DSL string in Python/JS via string concatenation for reliable escaping. |
| **Retry on timeout** | Usually works on second attempt |

## Text

| Gotcha | Detail |
|--------|--------|
| **textGrowth required for sizing** | Never set `width`/`height` on text without setting `textGrowth` first |
| **"auto"** = grows to fit, no wrap. **"fixed-width"** = wraps, height grows. **"fixed-width-height"** = wraps, may overflow. |

## File Management

| Gotcha | Detail |
|--------|--------|
| **No auto-save** | Save frequently with Cmd+S. Use Git commits. |
| **Limited undo/redo** | More limited than standard editors. Git = your safety net. |
| **No real-time collab** | Git workflow only (branch, commit, PR) |
| **lib.pen irreversible** | Once marked as library, cannot be undone |

## What Pencil Does NOT Do (vs Figma)

- ❌ Property-based variants (component switching)
- ❌ Interactive states (hover, active, focus)
- ❌ Prototyping (screen transitions)
- ❌ Auto-save
- ❌ Real-time collaboration
- ❌ OKLCH color rendering
- ❌ Variable deletion
- ❌ Figma-style auto-layout with min/max constraints

## What Pencil Does BETTER Than Figma

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
