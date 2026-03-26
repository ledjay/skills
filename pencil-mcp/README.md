# pencil-mcp

Control [Pencil.dev](https://pencil.dev) design tool via MCP to create, inspect, and export UI designs programmatically.

## What it does

- **Design via code** — Create designs using batch_design DSL
- **Design tokens** — 2-level architecture (primitives → semantics)
- **Components** — Shell Pattern, Theme Pattern, Hybrid variants
- **Export** — PNG, JPEG, PDF assets

## Platform Support

| Platform | Architecture | Status |
|----------|--------------|--------|
| macOS | ARM64 (Apple Silicon) | ✅ Supported |
| macOS | x64 (Intel) | ✅ Supported |
| Windows | x64 | ⚠️ Untested (should work) |
| Linux | x64 | ⚠️ Untested (should work) |
| Linux | ARM64 | ⚠️ Untested (should work) |

### Custom MCP Path

If Pencil is installed in a non-standard location, set the `PENCIL_MCP_PATH` environment variable:

```bash
export PENCIL_MCP_PATH="/path/to/pencil/mcp-server"
```

## Prerequisites

- Pencil desktop app running
- Node.js (v18+)

## Quick Start

```bash
# Install dependencies
cd pencil-mcp/scripts && npm install && npm run build

# Use CLI mode
node pencil.cjs call batch_design '{
  "filePath": "design.pen",
  "operations": "card=I(document,{type:\"frame\",name:\"Card\",width:300})"
}'
```

## Skill Structure

```
pencil-mcp/
├── SKILL.md              ← Full documentation
├── README.md             ← This file
├── references/           ← Detailed references
│   ├── dsl.md            ← Complete DSL syntax
│   ├── gotchas.md        ← All pitfalls
│   ├── tokens.md         ← Design tokens guide
│   ├── components.md     ← Component patterns
│   ├── pen-schema.md     ← .pen format schema
│   └── mcp-optimization.md ← Token cost audit
└── scripts/              ← Executable scripts
    ├── pencil.cjs        ← CLI (compiled, 10x faster)
    ├── pencil.ts         ← PencilClient source
    └── helpers.ts        ← High-level API
```

## Rebuilding

After modifying `pencil.ts` or `helpers.ts`, rebuild the bundle:

```bash
cd scripts && npm run build
```

**Note:** Always commit the updated `pencil.cjs` after rebuilding.

## Author

**Jérémie Gisserot** — [jeremie-gisserot.net](https://jeremie-gisserot.net)

## License

MIT
