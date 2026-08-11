import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';
import StyleDictionary from 'style-dictionary';
import { formattedVariables } from 'style-dictionary/utils';

// Compile the vendored Firefox Nova token JSON into web-ready artifacts, tiered
// so the global surface stays small and component internals can't be misused:
//   tokens.css               - FOUNDATION only (primitives + semantics + the
//                              icon/opacity scales), on :root. Load once.
//   tokens.ts                - typed foundation token map + union.
//   component-tokens/<c>.ts  - one Lit CSSResult per component, scoped to :host
//                              and added to that component's static styles.
//
// The essentials of Firefox's own Style Dictionary config are replicated:
//   1. A parser namespaces tokens by filename (`{color.gray.70}` refs resolve).
//   2. A preprocessor collapses surface-keyed values: light+dark -> light-dark(),
//      else @base/default. forcedColors/prefersContrast are captured as a11y
//      layers (below); nativeTheme and platform-only values are dropped.
//   3. A trailing `@base` is dropped from names (color.white.@base -> --color-white).
//   4. References stay as var() (outputReferences) so output is DRY/re-themeable.

interface Token {
  name: string;
  value?: unknown;
  path: string[];
}
type Node = Record<string, unknown>;

const OUT = 'src/generated';
const UPSTREAM = 'vendor/design-system';
const BASE_DIR = join(UPSTREAM, 'base');
const COMPONENTS_DIR = join(UPSTREAM, 'components');
mkdirSync(OUT, { recursive: true });
rmSync(join(OUT, 'component-tokens'), { recursive: true, force: true });
mkdirSync(join(OUT, 'component-tokens'), { recursive: true });

const tokenFiles = (dir: string) =>
  readdirSync(dir).filter((f) => f.endsWith('.tokens.json'));
const namespaces = (dir: string) => [
  ...new Set(
    tokenFiles(dir).map((f) => f.replace(/(\.nova)?\.tokens\.json$/, '')),
  ),
];

// Foundation = base primitives/semantics + a couple of broadly-used scales.
const FOUNDATION_EXTRA = new Set(['icon', 'opacity']);
const BASE_NS = new Set(namespaces(BASE_DIR));
const COMPONENT_NS = namespaces(COMPONENTS_DIR)
  .filter((ns) => !FOUNDATION_EXTRA.has(ns))
  .sort();
const isFoundation = (t: Token) =>
  BASE_NS.has(t.path[0]) || FOUNDATION_EXTRA.has(t.path[0]);
const isFoundationNs = (ns: string) =>
  BASE_NS.has(ns) || FOUNDATION_EXTRA.has(ns);

// Shared kebab-casing (also used by the name transform) and {ref} -> var().
const kebabName = (path: string[]) =>
  path
    .filter((p) => p !== '@base')
    .join('-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
const toVarRefs = (value: string) =>
  value.replace(
    /\{([^}]+)\}/g,
    (_, ref: string) => `var(--${kebabName(ref.split('.'))})`,
  );

// Captured forced-colors / prefers-contrast values per token, for both
// foundation and component tokens. Re-emitted below as @media
// (prefers-contrast / forced-colors) layers plus an app-driven [data-contrast]
// block.
const surfaces = new Map<
  string,
  { ns: string; base?: string; forced?: string; contrast?: string }
>();

// Fully-resolved literal value of every token (--name -> value), captured
// during the build. Used to inline references to tokens that live in a
// different scope (e.g. one component referencing another's tokens).
const resolvedAll = new Map<string, string>();

// Load base + components. Order: all non-Nova first, then all Nova overlays.
const files = [BASE_DIR, COMPONENTS_DIR].flatMap((dir) =>
  tokenFiles(dir).map((f) => join(dir, f)),
);
const nonNova = files.filter((f) => !f.includes('.nova.')).sort();
const nova = files.filter((f) => f.includes('.nova.')).sort();
const source = [...nonNova, ...nova];

// Collapse a surface-keyed value object to a single web value, or undefined
// when it only carries chrome-only surfaces we drop for now.
function collapse(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v !== 'object') return String(v);
  const obj = v as Node;
  const platform = (obj.platform ?? {}) as Node;
  const light = obj.light ?? platform.light;
  const dark = obj.dark ?? platform.dark;
  if (light !== undefined && dark !== undefined) {
    const l = collapse(light);
    const d = collapse(dark);
    if (l !== undefined && d !== undefined) return `light-dark(${l}, ${d})`;
  }
  if ('@base' in obj) return collapse(obj['@base']);
  if ('default' in obj) return collapse(obj.default);
  if ('brand' in obj) {
    const b = obj.brand;
    if (b && typeof b === 'object' && 'default' in (b as Node)) {
      return collapse((b as Node).default);
    }
    return collapse(b);
  }
  return undefined;
}

function walk(node: Node, path: string[] = []): void {
  for (const key of Object.keys(node)) {
    const child = node[key];
    if (!child || typeof child !== 'object') continue;
    const c = child as Node;
    const childPath = [...path, key];
    if ('value' in c) {
      if (c.value !== null && typeof c.value === 'object') {
        const orig = c.value as Node;
        const collapsed = collapse(orig);
        // Capture a11y surface overrides (foundation + components) so both the
        // foundation :root layers and the component :host modules get them.
        const entry: {
          ns: string;
          base?: string;
          forced?: string;
          contrast?: string;
        } = { ns: childPath[0], base: collapsed };
        if (typeof orig.forcedColors !== 'undefined') {
          entry.forced = collapse(orig.forcedColors);
        }
        if (typeof orig.prefersContrast !== 'undefined') {
          entry.contrast = collapse(orig.prefersContrast);
        }
        if (entry.forced || entry.contrast) {
          surfaces.set(kebabName(childPath), entry);
        }
        c.value = collapsed === undefined ? 'unset' : collapsed;
      }
    } else {
      walk(c, childPath);
    }
  }
}

StyleDictionary.registerParser({
  name: 'nova-namespace',
  pattern: /\.tokens\.json$/,
  parser: ({ filePath, contents }) => {
    const ns = basename(filePath ?? '').replace(/(\.nova)?\.tokens\.json$/, '');
    return { [ns]: JSON.parse(contents ?? '{}') };
  },
});

StyleDictionary.registerPreprocessor({
  name: 'nova-surfaces',
  preprocessor: (dictionary) => {
    walk(dictionary as Node);
    return dictionary;
  },
});

StyleDictionary.registerTransform({
  name: 'name/acorn',
  type: 'name',
  transform: (token: Token) => kebabName(token.path),
});

const HEADER =
  '/* Generated from vendored Firefox Nova tokens. Do not edit. */';

StyleDictionary.registerFormat({
  name: 'acorn/css',
  format: ({ dictionary, options }: { dictionary: any; options: any }) => {
    const vars = formattedVariables({
      format: 'css',
      dictionary,
      outputReferences: true,
    });
    return `${HEADER}\n@layer ${options.layer} {\n  ${options.selector} {\n${vars}\n  }\n}\n`;
  },
});

StyleDictionary.registerFormat({
  name: 'acorn/ts',
  format: ({ dictionary }: { dictionary: { allTokens: Token[] } }) => {
    const entries = dictionary.allTokens
      .map((t) => `  '--${t.name}': ${JSON.stringify(String(t.value))},`)
      .join('\n');
    const names = dictionary.allTokens
      .map((t) => `'--${t.name}'`)
      .join('\n  | ');
    return `${HEADER}\nexport const tokens = {\n${entries}\n} as const;\n\nexport type TokenName =\n  | ${names || 'never'};\n`;
  },
});

// Component tokens as a Lit CSSResult module, for the component to add to its
// own `static styles` (scopes the --component-* vars to its shadow :host).
StyleDictionary.registerFormat({
  name: 'acorn/lit-css',
  format: ({ dictionary, options }: { dictionary: any; options: any }) => {
    const vars = formattedVariables({
      format: 'css',
      dictionary,
      outputReferences: true,
    });
    return `${HEADER}\nimport { css } from 'lit';\n\nexport default css\`\n  ${options.selector} {\n${vars}\n  }\n\`;\n`;
  },
});

// Side-effect format: capture every token's resolved literal value. Written to
// a throwaway file that is deleted after the build.
StyleDictionary.registerFormat({
  name: 'acorn/capture',
  format: ({ dictionary }: { dictionary: { allTokens: Token[] } }) => {
    for (const t of dictionary.allTokens) {
      resolvedAll.set(`--${t.name}`, String(t.value));
    }
    return '/* internal capture, deleted after build */\n';
  },
});

// Skip override placeholders, uncollapsed objects, and unresolved references.
const valueOk = (t: Token) =>
  t.value !== 'unset' &&
  typeof t.value !== 'object' &&
  !String(t.value).includes('{');

const componentFiles = COMPONENT_NS.map((ns) => ({
  destination: `component-tokens/${ns}.ts`,
  format: 'acorn/lit-css',
  filter: (t: Token) => valueOk(t) && t.path[0] === ns,
  options: { selector: ':host' },
}));

const sd = new StyleDictionary({
  source,
  parsers: ['nova-namespace'],
  preprocessors: ['nova-surfaces'],
  log: { warnings: 'disabled', errors: { brokenReferences: 'console' } },
  platforms: {
    css: {
      transforms: ['name/acorn'],
      buildPath: `${OUT}/`,
      files: [
        {
          destination: 'tokens.css',
          format: 'acorn/css',
          filter: (t: Token) => valueOk(t) && isFoundation(t),
          options: { selector: ':root', layer: 'acorn.tokens' },
        },
        {
          destination: '.resolved.css',
          format: 'acorn/capture',
          filter: (t: Token) => valueOk(t),
        },
        ...componentFiles,
      ],
    },
    ts: {
      transforms: ['name/acorn'],
      buildPath: `${OUT}/`,
      files: [
        {
          destination: 'tokens.ts',
          format: 'acorn/ts',
          filter: (t: Token) => valueOk(t) && isFoundation(t),
        },
      ],
    },
  },
});

await sd.buildAllPlatforms();

// Append prefers-contrast / forced-colors override layers to the foundation
// file. Only foundation tokens that (a) are actually emitted, (b) differ from
// their base value, and (c) reference only defined vars are included, so no
// dangling references leak into high-contrast / forced-colors modes.
const cssFile = join(OUT, 'tokens.css');
const css = readFileSync(cssFile, 'utf8');
const defined = new Set(
  [...css.matchAll(/^\s*(--[\w-]+):/gm)].map((m) => m[1]),
);

// Emit the icon size/colour scales (typed) so moz-icon's customization stays
// tied to the tokens rather than accepting free-form values.
const SIZE_ORDER = ['xsmall', 'small', 'medium', 'large', 'xlarge', 'xxlarge'];
const COLOR_ORDER = [
  'default',
  'information',
  'success',
  'warning',
  'critical',
  'accent-primary-desaturated',
];
const iconSizeOptions = SIZE_ORDER.filter((s) =>
  defined.has(`--icon-size-${s}`),
);
const iconColorOptions = COLOR_ORDER.filter(
  (c) => c === 'default' || defined.has(`--icon-color-${c}`),
);
writeFileSync(
  join(OUT, 'icon-options.ts'),
  `${HEADER}
export const iconSizes = [
${iconSizeOptions.map((s) => `  ${JSON.stringify(s)},`).join('\n')}
] as const;
export type IconSize = (typeof iconSizes)[number];

export const iconColors = [
${iconColorOptions.map((c) => `  ${JSON.stringify(c)},`).join('\n')}
] as const;
export type IconColor = (typeof iconColors)[number];
`,
);

// Replace var() references to tokens not in `definedSet` (e.g. another
// component's tokens, out of scope here) with their resolved literal value.
function inlineForeign(text: string, definedSet: Set<string>): string {
  return text.replace(/var\((--[\w-]+)\)/g, (whole, name: string) => {
    if (definedSet.has(name)) return whole;
    const resolved = resolvedAll.get(name);
    return resolved !== undefined ? resolved : whole;
  });
}

// Override lines for tokens whose namespace matches, guarded so only emitted,
// changed, and fully-resolvable overrides are included (no dangling vars).
function overrideLines(
  kind: 'forced' | 'contrast',
  nsMatch: (ns: string) => boolean,
  definedSet: Set<string>,
  indent: string,
): string[] {
  const out: string[] = [];
  for (const [name, entry] of surfaces) {
    if (!nsMatch(entry.ns)) continue;
    if (!definedSet.has(`--${name}`)) continue;
    const raw = kind === 'forced' ? entry.forced : entry.contrast;
    if (raw === undefined) continue;
    const value = inlineForeign(toVarRefs(raw), definedSet);
    const base =
      entry.base === undefined
        ? ''
        : inlineForeign(toVarRefs(entry.base), definedSet);
    if (value === base) continue;
    const refs = [...value.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]);
    if (refs.some((r) => !definedSet.has(r))) continue;
    out.push(`${indent}--${name}: ${value};`);
  }
  return out.sort();
}

function mediaBlocks(
  selector: string,
  indent: string,
  contrast: string[],
  forced: string[],
): string {
  let out = '';
  if (contrast.length) {
    out += `${indent}@media (prefers-contrast: more) {\n${indent}  ${selector} {\n${contrast.join('\n')}\n${indent}  }\n${indent}}\n`;
  }
  if (forced.length) {
    out += `${indent}@media (forced-colors: active) {\n${indent}  ${selector} {\n${forced.join('\n')}\n${indent}  }\n${indent}}\n`;
  }
  return out;
}

// A plain selector block (used for the app-driven [data-contrast='high'] /
// :host([data-contrast='high']) overrides the provider activates).
function selectorBlock(
  selector: string,
  indent: string,
  lines: string[],
): string {
  if (!lines.length) return '';
  return `${indent}${selector} {\n${lines.join('\n')}\n${indent}}\n`;
}

// Foundation (:root) a11y layers, appended inside @layer acorn.tokens:
// OS-driven @media (prefers-contrast + forced-colors), plus an app-driven
// [data-contrast='high'] block that <moz-provider> activates. The app trigger
// uses prefers-contrast only; forced-colors stays @media-only because its
// system colours are meant to be OS-controlled, not forced from an app.
const fContrast = overrideLines('contrast', isFoundationNs, defined, '      ');
const fForced = overrideLines('forced', isFoundationNs, defined, '      ');
const foundationInject =
  mediaBlocks(':root', '  ', fContrast, fForced) +
  selectorBlock("[data-contrast='high']", '  ', fContrast);
if (foundationInject) {
  writeFileSync(cssFile, css.replace(/\n\}\s*$/, `\n${foundationInject}}\n`));
}

// Component (:host) a11y layers, injected into each component's CSSResult so
// e.g. --button-* colours also flip in high-contrast / forced-colors modes.
let componentsWithA11y = 0;
for (const ns of COMPONENT_NS) {
  const file = join(OUT, 'component-tokens', `${ns}.ts`);
  let src = readFileSync(file, 'utf8');
  const componentDefined = new Set([
    ...defined,
    ...[...src.matchAll(/(--[\w-]+):/g)].map((m) => m[1]),
  ]);
  const only = (n: string) => n === ns;
  const cContrast = overrideLines('contrast', only, componentDefined, '    ');
  const cForced = overrideLines('forced', only, componentDefined, '    ');
  const blocks =
    mediaBlocks(':host', '  ', cContrast, cForced) +
    selectorBlock(":host([data-contrast='high'])", '  ', cContrast);
  if (blocks) {
    src = src.replace(/`;\s*$/, `${blocks}\`;\n`);
    componentsWithA11y++;
  }
  // Inline references to other components' tokens (out of this :host scope) so
  // no dangling vars remain; foundation (:root) and own (:host) refs are kept.
  src = inlineForeign(src, componentDefined);
  writeFileSync(file, src);
}

rmSync(join(OUT, '.resolved.css'), { force: true });

console.log(
  `tokens built -> ${OUT}/tokens.{css,ts} (foundation + a11y) + ${COMPONENT_NS.length} component files (${componentsWithA11y} with a11y layers)`,
);
