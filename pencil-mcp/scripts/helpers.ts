/**
 * Pencil MCP Helpers
 *
 * High-level utilities built on top of PencilClient.
 * Use these in your scripts instead of raw MCP calls.
 *
 * @example
 * import { PencilClient } from './pencil.js'
 * import { batch, screenshot, getNodes, setTokens } from './helpers.js'
 *
 * const pencil = new PencilClient()
 * await pencil.connect()
 *
 * const ids = await batch(pencil, 'btn=I(document,{type:"frame",name:"Btn"})')
 * await screenshot(pencil, ids[0], './out/btn.png')
 *
 * await pencil.disconnect()
 */

import { writeFileSync } from "fs";
import { PencilClient, ToolResult } from "./pencil.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BatchResult {
  /** IDs of all inserted nodes (in order) */
  insertedIds: string[];
  /** IDs of all updated nodes */
  updatedIds: string[];
  /** Raw response text */
  text: string;
  /** Warnings/issues detected by Pencil */
  issues: string[];
}

export interface PencilNode {
  id: string;
  name?: string;
  type: string;
  x?: number;
  y?: number;
  width?: number | string;
  height?: number | string;
  fill?: string;
  reusable?: boolean;
  ref?: string;
  slot?: string[];
  descendants?: Record<string, unknown>;
  children?: PencilNode[];
  [key: string]: unknown;
}

export type DesignTokens = Record<string, { type: "color" | "number" | "string"; value: string | number }>;

/** A single conditional variable value, resolved when all theme conditions match. */
export interface ConditionalValue {
  value: string | number;
  /** Theme conditions — ALL keys must match for this value to apply (multi-axis confirmed working, March 2026). */
  theme: Record<string, string>;
}

/** A variable whose value depends on the active theme(s). */
export type ConditionalTokenValue = ConditionalValue[];

/** Extended token type supporting both static and conditional values. */
export type ExtendedTokens = Record<string, {
  type: "color" | "number" | "string";
  value: string | number | ConditionalTokenValue;
}>;

/** Theme axes: maps axis name → list of valid values. */
export type ThemeAxes = Record<string, string[]>;

// ─── Core Helpers ─────────────────────────────────────────────────────────────

/**
 * Execute batch_design operations and return inserted/updated node IDs.
 *
 * @example
 * const { insertedIds } = await batch(p, 'btn=I(document,{type:"frame",name:"Btn",x:0,y:0})')
 */
export async function batch(
  pencil: PencilClient,
  operations: string,
): Promise<BatchResult> {
  const result = await pencil.call("batch_design", { operations });
  const text = extractText(result);

  const insertedIds = [...text.matchAll(/Inserted node `(\w+)`/g)].map((m) => m[1]);
  const updatedIds = [...text.matchAll(/Updated properties of node `(\w+)`/g)].map((m) => m[1]);
  const issues = text
    .split("\n")
    .filter((l) => l.includes("- ") && (l.toLowerCase().includes("issue") || l.toLowerCase().includes("invalid") || l.toLowerCase().includes("warning")))
    .map((l) => l.trim());

  if (issues.length > 0) {
    console.warn(`[pencil] ${issues.length} issue(s):`, issues);
  }

  return { insertedIds, updatedIds, text, issues };
}

/**
 * Read nodes from the document.
 *
 * @example
 * const nodes = await getNodes(p)                          // all top-level
 * const nodes = await getNodes(p, { readDepth: 1 })        // with children
 * const nodes = await getNodes(p, { nodeIds: ['abc123'] }) // specific nodes
 */
export async function getNodes(
  pencil: PencilClient,
  options: { nodeIds?: string[]; readDepth?: number } = {},
): Promise<PencilNode[]> {
  const result = await pencil.call("batch_get", options);
  const text = extractText(result);
  return JSON.parse(text) as PencilNode[];
}

/**
 * Take a screenshot of a node and optionally save to disk.
 * Returns the raw base64 PNG data.
 *
 * OPTIMIZATION: Use `maxWidth` to reduce image size for LLM context.
 * Pencil returns full-resolution PNGs which can be large.
 *
 * @example
 * // Full resolution
 * await screenshot(p, 'abc123', './out.png')
 *
 * // Optimized for LLM (max 800px width)
 * await screenshot(p, 'abc123', './out.png', { maxWidth: 800 })
 *
 * // JPEG for smaller size (better for photos)
 * await screenshot(p, 'abc123', './out.jpg', { maxWidth: 800, format: 'jpeg' })
 */
export async function screenshot(
  pencil: PencilClient,
  nodeId: string,
  outputPath?: string,
  options?: { maxWidth?: number; format?: 'png' | 'jpeg'; quality?: number },
): Promise<Buffer> {
  const result = await pencil.call("get_screenshot", { nodeId });

  for (const item of result.content) {
    if (item.type === "image" && item.data) {
      let buffer = Buffer.from(item.data, "base64");

      // Optimization: resize if maxWidth specified
      // Note: This requires 'sharp' package: npm install sharp
      // If sharp not available, returns original buffer
      if (options?.maxWidth) {
        try {
          const sharp = await import('sharp');
          const metadata = await sharp.default(buffer).metadata();

          if (metadata.width && metadata.width > options.maxWidth) {
            const resizeOpts: sharp.ResizeOptions = { width: options.maxWidth };
            if (options.format === 'jpeg') {
              buffer = await sharp.default(buffer)
                .resize(resizeOpts)
                .jpeg({ quality: options.quality ?? 80 })
                .toBuffer();
            } else {
              buffer = await sharp.default(buffer)
                .resize(resizeOpts)
                .png()
                .toBuffer();
            }
          }
        } catch {
          // sharp not installed, use original
        }
      }

      if (outputPath) {
        writeFileSync(outputPath, buffer);
        console.log(`[pencil] 📸 ${outputPath} (${buffer.length} bytes)`);
      }
      return buffer;
    }
  }

  throw new Error(`No image returned for node ${nodeId}`);
}

/**
 * Set design tokens (variables) in the active document.
 * Automatically batches into groups of 10 to avoid timeouts.
 *
 * @example
 * await setTokens(pencil, {
 *   'primary-500': { type: 'color', value: '#3D7A4F' },
 *   'font-body':   { type: 'string', value: 'Inter' },
 *   'radius-md':   { type: 'number', value: 12 },
 * })
 */
export async function setTokens(
  pencil: PencilClient,
  tokens: DesignTokens,
  batchSize = 10,
): Promise<void> {
  const entries = Object.entries(tokens);
  const total = entries.length;
  let done = 0;

  for (let i = 0; i < entries.length; i += batchSize) {
    const chunk = Object.fromEntries(entries.slice(i, i + batchSize));
    await pencil.call("set_variables", { variables: chunk });
    done += Object.keys(chunk).length;
    console.log(`[pencil] tokens: ${done}/${total}`);
  }
}

/**
 * Set design tokens with support for conditional (theme-based) values.
 *
 * Use this instead of setTokens when variables depend on theme axes.
 * Multi-axis conditions confirmed working (tested March 2026):
 *   {"Color": "indigo", "Style": "fill"} resolves independently from
 *   {"Color": "indigo", "Style": "tint"} — full matrix supported.
 *
 * @example
 * await setConditionalTokens(pencil, {
 *   'badge-bg': {
 *     type: 'color',
 *     value: [
 *       { value: '#6a6af4', theme: { Color: 'indigo', Style: 'fill' } },
 *       { value: '#ebebff', theme: { Color: 'indigo', Style: 'tint' } },
 *       { value: '#e1000f', theme: { Color: 'red',    Style: 'fill' } },
 *       { value: '#ffe9e9', theme: { Color: 'red',    Style: 'tint' } },
 *     ],
 *   },
 * })
 */
export async function setConditionalTokens(
  pencil: PencilClient,
  tokens: ExtendedTokens,
  batchSize = 5, // smaller batches — conditional vars are more complex
): Promise<void> {
  const entries = Object.entries(tokens);
  const total = entries.length;
  let done = 0;

  for (let i = 0; i < entries.length; i += batchSize) {
    const chunk = Object.fromEntries(entries.slice(i, i + batchSize));
    await pencil.call("set_variables", { variables: chunk });
    done += Object.keys(chunk).length;
    console.log(`[pencil] conditional tokens: ${done}/${total}`);
  }
}

/**
 * Define theme axes on the active document.
 * Each axis name maps to its list of valid values.
 *
 * @example
 * await setThemeAxes(pencil, {
 *   Color: ['indigo', 'red', 'green'],
 *   Style: ['fill', 'tint', 'outline'],
 *   Size:  ['sm', 'md', 'lg'],
 * })
 */
export async function setThemeAxes(
  pencil: PencilClient,
  themes: ThemeAxes,
): Promise<void> {
  await pencil.call("set_variables", { themes });
}

/**
 * Get all current design tokens.
 *
 * @example
 * const tokens = await getTokens(pencil)
 * console.log(tokens['primary-500']) // { type: 'color', value: '#3D7A4F' }
 */
export async function getTokens(
  pencil: PencilClient,
): Promise<Record<string, unknown>> {
  const result = await pencil.call("get_variables", {});
  const text = extractText(result);
  const parsed = JSON.parse(text);
  return parsed.variables ?? parsed;
}

/**
 * Find a node by name in the document (depth-first search).
 *
 * OPTIMIZATION: Pass cached nodes to avoid re-reading.
 *
 * @example
 * // Naive (reads every time)
 * const btn = await findNode(pencil, 'Component/Button-Primary')
 *
 * // Optimized (use cached nodes)
 * const nodes = await getNodes(pencil)
 * const btn = findNode(nodes, 'Component/Button-Primary')  // note: sync!
 */
export async function findNode(
  pencil: PencilClient,
  name: string,
  readDepth = 0,
): Promise<PencilNode | null>;
export function findNode(
  cachedNodes: PencilNode[],
  name: string,
): PencilNode | null;
export async function findNode(
  pencilOrNodes: PencilClient | PencilNode[],
  name: string,
  readDepth = 0,
): Promise<PencilNode | null> {
  let nodes: PencilNode[];

  if (Array.isArray(pencilOrNodes)) {
    nodes = pencilOrNodes;
  } else {
    nodes = await getNodes(pencilOrNodes, { readDepth });
  }

  function search(nodes: PencilNode[]): PencilNode | null {
    for (const node of nodes) {
      if (node.name === name) return node;
      if (node.children) {
        const found = search(node.children);
        if (found) return found;
      }
    }
    return null;
  }

  return search(nodes);
}

/**
 * Open a .pen file.
 *
 * @example
 * await openFile(pencil, '/path/to/design.pen')
 * await openFile(pencil) // new empty file
 */
export async function openFile(
  pencil: PencilClient,
  filePath = "new",
): Promise<void> {
  await pencil.call("open_document", { filePathOrTemplate: filePath });
}

// ─── DSL Builders ─────────────────────────────────────────────────────────────

/**
 * Build a safe descendants object for slot overrides.
 * Use this instead of manually building DSL strings.
 *
 * @example
 * const ops = `U("${instanceId}", ${descendants({
 *   slotId: [
 *     { id: 'title', type: 'text', content: 'Hello', fontSize: 16 },
 *     { id: 'cta',   type: 'ref',  ref: btnId },
 *   ]
 * })})`
 */
export function descendants(
  slots: Record<string, object[]>,
): string {
  return JSON.stringify({ descendants: Object.fromEntries(
    Object.entries(slots).map(([slotId, children]) => [slotId, { children }])
  )}).slice(1, -1); // strip outer {}  — embeds cleanly in DSL object
}

// ─── Component Composition ────────────────────────────────────────────────────

/**
 * Shell Pattern: Create a component family with a shared shell and visual variants.
 *
 * Modifying the shell auto-updates all variants and their instances.
 * Uses the "Reusable Ref" pattern (tested March 2026).
 *
 * @example
 * const family = await createComponentFamily(pencil, {
 *   shell: {
 *     name: 'Card',
 *     width: 300,
 *     layout: 'vertical',
 *     gap: 12,
 *     padding: [20, 20],
 *     cornerRadius: 12,
 *     fill: '#FFFFFF',
 *     children: [
 *       { type: 'text', name: 'card-title', content: 'Title', fontSize: 16, fontWeight: '600', fill: '#1A2B1F' },
 *     ],
 *     slot: { name: 'card-content', height: 'fit_content(80)', layout: 'vertical', gap: 8 },
 *   },
 *   variants: [
 *     { name: 'Green', fill: '#F0F7F2' },
 *     { name: 'Promo', fill: '#FFF5F0', stroke: { fill: '#FF8C00', thickness: 2, align: 'inside' } },
 *   ],
 *   x: 2200, y: 0,
 * })
 *
 * // Use variants:
 * await batch(pencil, `I(parent, {type:"ref", ref:"${family.variants[0].id}"})`)
 */
export interface ShellConfig {
  /** Component base name (e.g. 'Card' → 'Component/Card-Shell') */
  name: string;
  width?: number | string;
  height?: number | string;
  layout?: 'vertical' | 'horizontal';
  gap?: number;
  padding?: number | number[];
  cornerRadius?: number | number[];
  fill?: string;
  stroke?: Record<string, unknown>;
  /** Children to add inside the shell (before the slot) */
  children?: Array<Record<string, unknown>>;
  /** Slot configuration (optional — creates an empty slot frame) */
  slot?: {
    name: string;
    height?: string | number;
    width?: string | number;
    layout?: 'vertical' | 'horizontal';
    gap?: number;
    /** IDs of suggested components for the slot */
    suggestions?: string[];
  };
}

export interface VariantConfig {
  /** Variant name (e.g. 'Green' → 'Component/Card-Green') */
  name: string;
  /** Override properties — typically fill, stroke, cornerRadius, opacity */
  [key: string]: unknown;
}

export interface ComponentFamily {
  /** The shell (base) component */
  shell: {
    id: string;
    slotId: string | null;
    childIds: string[];
  };
  /** All created variants */
  variants: Array<{ name: string; id: string }>;
}

export async function createComponentFamily(
  pencil: PencilClient,
  config: {
    shell: ShellConfig;
    variants: VariantConfig[];
    x?: number;
    y?: number;
    spacing?: number;
  },
): Promise<ComponentFamily> {
  const { shell, variants, x = 2200, y = 0, spacing = 250 } = config;

  // ── Step 1: Create Shell ──────────────────────────────────────────────────
  const shellProps: Record<string, unknown> = {
    type: 'frame',
    name: `Component/${shell.name}-Shell`,
    reusable: true,
    x,
    y,
  };

  // Copy layout properties
  for (const prop of ['width', 'height', 'layout', 'gap', 'padding', 'cornerRadius', 'fill', 'stroke']) {
    if ((shell as any)[prop] !== undefined) {
      shellProps[prop] = (shell as any)[prop];
    }
  }

  let dsl = `shell=I(document,${JSON.stringify(shellProps)})`;

  // Add children
  if (shell.children) {
    for (let i = 0; i < shell.children.length; i++) {
      dsl += `\nchild${i}=I(shell,${JSON.stringify(shell.children[i])})`;
    }
  }

  // Add slot
  if (shell.slot) {
    const slotProps: Record<string, unknown> = {
      type: 'frame',
      name: shell.slot.name,
      width: shell.slot.width ?? 'fill_container',
      height: shell.slot.height ?? 'fit_content(80)',
      layout: shell.slot.layout ?? 'vertical',
      gap: shell.slot.gap ?? 8,
      slot: shell.slot.suggestions ?? [],
    };
    dsl += `\nslot=I(shell,${JSON.stringify(slotProps)})`;
  }

  const shellResult = await batch(pencil, dsl);
  const shellId = shellResult.insertedIds[0];
  const childIds = shellResult.insertedIds.slice(1, shell.slot ? -1 : undefined);
  const slotId = shell.slot ? shellResult.insertedIds[shellResult.insertedIds.length - 1] : null;

  console.log(`[pencil] Shell "${shell.name}": ${shellId} (slot: ${slotId})`);

  // ── Step 2: Create Variants (separate batch — needs shellId!) ─────────────
  if (variants.length === 0) {
    return { shell: { id: shellId, slotId, childIds }, variants: [] };
  }

  let variantDsl = '';
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const { name, ...overrides } = v;
    const variantProps: Record<string, unknown> = {
      type: 'ref',
      ref: shellId,
      name: `Component/${shell.name}-${name}`,
      reusable: true,
      x,
      y: y + (i + 1) * spacing,
      ...overrides,
    };
    variantDsl += `${i > 0 ? '\n' : ''}v${i}=I(document,${JSON.stringify(variantProps)})`;
  }

  const variantResult = await batch(pencil, variantDsl);

  const createdVariants = variants.map((v, i) => ({
    name: v.name,
    id: variantResult.insertedIds[i],
  }));

  console.log(`[pencil] Variants: ${createdVariants.map(v => `${v.name}=${v.id}`).join(', ')}`);

  return {
    shell: { id: shellId, slotId, childIds },
    variants: createdVariants,
  };
}

// ─── Theme Pattern ────────────────────────────────────────────────────────────

/**
 * Theme Pattern: Create a single parametric component driven by theme axes.
 *
 * Use this when variants differ only visually along orthogonal axes
 * (e.g. color × style × size × shape). One component, infinite combinations.
 *
 * Contrast with Shell Pattern (createComponentFamily) which is better for
 * structurally different variants (different node trees).
 *
 * Decision guide:
 *   Structural differences      → createComponentFamily  (Shell Pattern)
 *   Visual axes (orthogonal)    → createParametricComponent (Theme Pattern)
 *   Content variation           → Slots
 *
 * Multi-axis conditions CONFIRMED WORKING (tested March 2026).
 * Evidence: variants-exploration/multiaxis-validated.png
 *
 * @example
 * const badge = await createParametricComponent(pencil, {
 *   name: 'Badge',
 *   axes: {
 *     Color: ['indigo', 'red', 'green'],
 *     Style: ['fill', 'tint', 'outline'],
 *     Size:  ['sm', 'md', 'lg'],
 *   },
 *   defaultTheme: { Color: 'indigo', Style: 'fill', Size: 'md' },
 *   variables: {
 *     'badge-bg': {
 *       type: 'color',
 *       value: [
 *         { value: '#6a6af4', theme: { Color: 'indigo', Style: 'fill' } },
 *         { value: '#ebebff', theme: { Color: 'indigo', Style: 'tint' } },
 *         { value: '#00000000', theme: { Style: 'outline' } },  // single-axis ok too
 *         { value: '#e1000f', theme: { Color: 'red', Style: 'fill' } },
 *       ],
 *     },
 *     'badge-text': {
 *       type: 'color',
 *       value: [
 *         { value: '#ffffff', theme: { Style: 'fill' } },
 *         { value: '#6a6af4', theme: { Color: 'indigo', Style: 'tint' } },
 *         { value: '#6a6af4', theme: { Color: 'indigo', Style: 'outline' } },
 *       ],
 *     },
 *     'badge-radius': {
 *       type: 'number',
 *       value: [
 *         { value: 4,    theme: { Size: 'sm' } },
 *         { value: 6,    theme: { Size: 'md' } },
 *         { value: 8,    theme: { Size: 'lg' } },
 *       ],
 *     },
 *   },
 *   fill: '$badge-bg',
 *   cornerRadius: '$badge-radius',
 *   layout: 'horizontal',
 *   padding: [4, 8],
 *   children: [
 *     { type: 'text', name: 'badge-label', content: 'Badge',
 *       fontFamily: 'Inter', fontSize: 12, fontWeight: 'bold', fill: '$badge-text' },
 *   ],
 * })
 *
 * // Create instances with specific theme combinations:
 * await batch(pencil, `
 *   I(parent, {type:"ref", ref:"${badge.id}", theme:{Color:"red",Style:"tint",Size:"sm"}})
 * `)
 */
export interface ParametricConfig {
  /** Component name (e.g. 'Badge' → 'Component/Badge') */
  name: string;
  /** Theme axes and their possible values */
  axes: ThemeAxes;
  /** Default theme — shown on the component canvas itself */
  defaultTheme: Record<string, string>;
  /** Component-level conditional variables (Level 3 in the 3-tier architecture) */
  variables: ExtendedTokens;
  width?: number | string;
  height?: number | string;
  layout?: 'vertical' | 'horizontal';
  gap?: number;
  padding?: number | number[];
  cornerRadius?: number | string;
  fill?: string;
  stroke?: Record<string, unknown>;
  clip?: boolean;
  justifyContent?: string;
  alignItems?: string;
  /** Children nodes — use variable refs for fill/stroke/fontSize etc. */
  children?: Array<Record<string, unknown>>;
  /** Optional slot for content injection */
  slot?: {
    name: string;
    height?: string | number;
    width?: string | number;
    layout?: 'vertical' | 'horizontal';
    gap?: number;
    suggestions?: string[];
  };
  x?: number;
  y?: number;
}

export interface ParametricComponent {
  /** Component node ID */
  id: string;
  /** Slot node ID (null if no slot) */
  slotId: string | null;
  /** IDs of direct children (excluding slot) */
  childIds: string[];
}

export async function createParametricComponent(
  pencil: PencilClient,
  config: ParametricConfig,
): Promise<ParametricComponent> {
  const { name, axes, defaultTheme, variables, x = 2200, y = 0 } = config;

  // ── Step 1: Define theme axes ──────────────────────────────────────────────
  console.log(`[pencil] Theme axes: ${Object.entries(axes).map(([k, v]) => `${k}(${v.length})`).join(', ')}`);
  await setThemeAxes(pencil, axes);

  // ── Step 2: Set conditional variables ─────────────────────────────────────
  console.log(`[pencil] Conditional variables: ${Object.keys(variables).length}`);
  await setConditionalTokens(pencil, variables);

  // ── Step 3: Create the component node ─────────────────────────────────────
  const componentProps: Record<string, unknown> = {
    type: 'frame',
    name: `Component/${name}`,
    reusable: true,
    theme: defaultTheme,
    x,
    y,
  };

  for (const prop of ['width', 'height', 'layout', 'gap', 'padding', 'cornerRadius',
                       'fill', 'stroke', 'clip', 'justifyContent', 'alignItems']) {
    if ((config as any)[prop] !== undefined) {
      componentProps[prop] = (config as any)[prop];
    }
  }

  let dsl = `comp=I(document,${JSON.stringify(componentProps)})`;

  if (config.children) {
    for (let i = 0; i < config.children.length; i++) {
      dsl += `\nchild${i}=I(comp,${JSON.stringify(config.children[i])})`;
    }
  }

  if (config.slot) {
    const slotProps: Record<string, unknown> = {
      type: 'frame',
      name: config.slot.name,
      width: config.slot.width ?? 'fill_container',
      height: config.slot.height ?? 'fit_content(80)',
      layout: config.slot.layout ?? 'vertical',
      gap: config.slot.gap ?? 8,
      slot: config.slot.suggestions ?? [],
    };
    dsl += `\nslot=I(comp,${JSON.stringify(slotProps)})`;
  }

  const result = await batch(pencil, dsl);
  const componentId = result.insertedIds[0];
  const childIds = result.insertedIds.slice(1, config.slot ? -1 : undefined);
  const slotId = config.slot ? result.insertedIds[result.insertedIds.length - 1] : null;

  console.log(`[pencil] Parametric "${name}": ${componentId}`);

  return { id: componentId, slotId, childIds };
}

/**
 * Create a single variant of an existing shell component.
 * Use when adding a new variant to an existing family.
 *
 * @example
 * const darkId = await createVariant(pencil, shellId, {
 *   name: 'Dark',
 *   fill: '#1A2B1F',
 *   x: 2200, y: 750,
 * })
 */
export async function createVariant(
  pencil: PencilClient,
  shellId: string,
  config: {
    name: string;
    x?: number;
    y?: number;
    [key: string]: unknown;
  },
): Promise<string> {
  const { name, x = 2200, y = 0, ...overrides } = config;
  const props: Record<string, unknown> = {
    type: 'ref',
    ref: shellId,
    name: `Component/${name}`,
    reusable: true,
    x,
    y,
    ...overrides,
  };

  const result = await batch(pencil, `v=I(document,${JSON.stringify(props)})`);
  const id = result.insertedIds[0];
  console.log(`[pencil] Variant "${name}": ${id}`);
  return id;
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function extractText(result: ToolResult): string {
  if (result.isError) {
    const msg = result.content[0]?.text ?? "Unknown error";
    throw new Error(`Pencil error: ${msg}`);
  }
  return result.content[0]?.text ?? "";
}
