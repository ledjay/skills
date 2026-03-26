# MCP Token Optimization

<!-- last_verified: 2026-03-21 -->
<!-- sources: Live testing on pencil-demo.pen (14 frames), Pencil v1.1.37 -->
<!-- stability: MEDIUM — Pencil may optimize schema delivery in future versions -->

## The Schema Tax Problem

`get_editor_state` includes the **full .pen TypeScript schema** in EVERY response.

On an **empty file**: 269 bytes useful data + 36,605 bytes schema = **99.3% bloat**.
On a **demo file** (14 frames): ~1,600 bytes useful + 36,600 bytes schema = **96% bloat**.

**Cost**: ~9,150 tokens of STATIC content repeated on every `get_editor_state` call.

## Token Cost Table (measured on Pencil v1.1.37)

| Tool | Bytes | ~Tokens | Scaling |
|------|-------|---------|---------|
| `get_editor_state` | 38,214 | ~9,500 | Fixed (schema) + linear (nodes) |
| `batch_get` depth 0 | 2,805 | ~700 | IDs + names only |
| `batch_get` depth 1 | 11,653 | ~2,900 | + direct children |
| `batch_get` depth 2 | 40,227 | ~10,000 | + grandchildren |
| `batch_get` depth 3 | 103,788 | ~26,000 | **~3.5x per depth level** |
| `get_variables` | 92+ | ~23+ | Linear with var count |
| `set_variables` response | ~100 | ~25 | Tiny (success msg) |
| `batch_design` response | ~200 | ~50 | Tiny (success/binding IDs) |
| `get_guidelines` (1 topic) | 5,086 | ~1,270 | Per topic |
| `get_style_guide_tags` | 2,118 | ~530 | Fixed |
| `get_screenshot` | IMAGE | 0 text | Base64 image (separate) |
| `open_document` | 106 | ~27 | Tiny |

## Optimization Strategies

### 1. Skip get_editor_state when possible

If you already know the file and its structure (from a previous call or from reading the .pen file directly), skip `get_editor_state` entirely. Use `batch_get` depth 0 instead (~700 tokens vs ~9,500).

### 2. Use batch_get with minimal depth

- **depth 0**: Just IDs and names (~700 tokens) — use for navigation
- **depth 1**: Direct children (~2,900 tokens) — use for inspection
- **depth 2+**: Only when you need to read nested structure

**Rule**: Never use depth 3+ unless targeting a specific subtree with `nodeIds`.

### 3. Target specific nodes with nodeIds

Instead of reading the entire document:
```bash
# BAD: reads everything at depth 2 (~10,000 tokens)
batch_get '{"readDepth":2}'

# GOOD: reads only what you need (~500 tokens)
batch_get '{"nodeIds":["specificFrameId"],"readDepth":2}'
```

### 4. Cache the schema

Since the schema is static, an agent that already has the .pen schema in its skill/memory doesn't need it from `get_editor_state`. Potential workaround:
- Call `get_editor_state` once at session start
- For subsequent checks, use `batch_get` depth 0 (which does NOT include the schema)

### 5. Batch variable operations carefully

- `set_variables`: Max 5-10 per call (timeout risk)
- `get_variables`: Scales linearly — small files cheap, large token files expensive

### 6. get_guidelines is affordable but static

~1,270 tokens per topic. Content doesn't change between calls.
Load once and cache for the session.

## Typical Workflow Cost

| Step | Tokens | Optimization |
|------|--------|-------------|
| get_editor_state | ~9,500 | Replace with batch_get depth 0 after first call |
| get_variables | ~100 | Cheap, call freely |
| set_variables (5 vars) | ~25 | Response is tiny |
| batch_design (10 ops) | ~50 | Response is tiny |
| get_screenshot | 0 text | Image data separate |
| **Optimized total** | **~875** | vs ~10,100 naive |
| **Savings** | **~91%** | |

## For the Formation

Key teaching point: "The #1 token optimization with Pencil MCP is knowing that `get_editor_state` includes ~9,000 tokens of static schema. Use `batch_get` depth 0 instead for subsequent checks."

## Screenshot Token Counting — Clarification

When measuring MCP response sizes, `get_screenshot` appears to dominate (67% of output). This is misleading:

**What's measured**: Raw MCP response size (base64 PNG in JSON)

**What actually matters for LLM context**:
- Images are NOT tokenized as text
- Multimodal models (GPT-4V, Claude Vision) process images separately
- The "4300 tokens" from a screenshot is NOT equivalent to 4300 text tokens

**Practical implication**:
- Don't avoid screenshots based on "token cost"
- The visual verification is valuable
- The real cost depends on the specific LLM's image handling

**Accurate comparisons**:
- Text operations (batch_get, batch_design) → true token costs
- Screenshot → MCP response size, but LLM cost is model-dependent

## Screenshot Optimization (Client-Side)

Pencil's `get_screenshot` returns full-resolution PNG with no options. However, you can optimize **after receiving**.

### ⚠️ Important: LLM Vision Models Already Downsample

GPT-4V, Claude Vision, and other multimodal models don't see full-resolution pixels. They:
- Process images at ~512-768px effective resolution
- Tile large images into smaller chunks
- Lose fine detail regardless of input size

**Implication**: For most verification tasks, `maxWidth: 800` is **sufficient and lossless** from the LLM's perspective.

### Decision Rules (For LLMs)

```
DEFAULT: Use { maxWidth: 800 } for all screenshots

EXCEPTIONS — use full resolution (no options) when:
  1. User explicitly asks for "high quality" or "full resolution"
  2. Checking typography details (font rendering, kerning)
  3. Checking small UI elements (< 24px icons, badges)
  4. Final export for production/delivery
  5. Node is < 400px wide (no point downsampling)

EXCEPTION — use { maxWidth: 400 } when:
  1. Rapid iteration (multiple screenshots in quick succession)
  2. Just checking "does it look right?" (layout, colors, spacing)
  3. Context window is limited (< 20K tokens remaining)

EXCEPTION — use { format: 'jpeg', quality: 85 } when:
  1. Image contains photos or complex gradients
  2. PNG is > 20KB (check file size after first screenshot)
  3. Not checking pixel-perfect edges (JPEG has artifacts)
```

### Recommended Workflow

```typescript
// ITERATIVE DESIGN (default)
await screenshot(p, id, './check.png', { maxWidth: 800 })   // Good for 90% of checks

// RAPID ITERATION
await screenshot(p, id, './quick.png', { maxWidth: 400 })   // 3x faster, 75% smaller

// FINAL VALIDATION
await screenshot(p, id, './final.png')                        // Full res before delivery

// COMPLEX VISUALS (photos, gradients)
await screenshot(p, id, './hero.jpg', { maxWidth: 800, format: 'jpeg', quality: 85 })
```

### Size Comparison (1200px hero)

| Options | File size | LLM tokens | Quality loss |
|---------|-----------|------------|--------------|
| (none) | ~5 KB | ~1700 | None |
| `{ maxWidth: 800 }` | ~2.5 KB | ~850 | None (LLM sees same) |
| `{ maxWidth: 400 }` | ~800 B | ~300 | Minimal for layout checks |
| `{ maxWidth: 800, format: 'jpeg' }` | ~1 KB | ~350 | Slight (edges) |

**Note**: Requires `npm install sharp` in scripts/ directory.
