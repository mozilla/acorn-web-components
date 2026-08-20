import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';

// Normalise the vendored Acorn icon SVGs for the web and emit:
//   src/generated/icons/<name>-<size>.ts  - `export default "<svg>"` (per icon)
//   src/generated/icons.ts                - a registry of lazy loaders keyed
//                                            name -> optical size -> loader
//
// Acorn ships optically-tuned SVGs per size (icons/desktop/<size>/). We key the
// registry by base name and expose every size that name is drawn at, so the
// component can pick the closest optical variant and fall back across sizes.
// Each icon is a separate `import()` chunk, so a consumer only bundles what it
// renders.
//
// Acorn icons use the browser `context-fill` model, which doesn't exist on the
// web: we rewrite it to currentColor (so moz-icon colours via text colour) and
// strip fixed width/height so CSS controls size.

const OUT = 'src/generated';
const ICONS_OUT = join(OUT, 'icons');
const SRC = 'vendor/icons';

// Rebuild cleanly so removed upstream icons do not linger.
rmSync(ICONS_OUT, { recursive: true, force: true });
mkdirSync(ICONS_OUT, { recursive: true });

function normalise(raw: string): string {
  let svg = raw.replace(/<!--[\s\S]*?-->/g, '').trim();

  // Some Firefox-sourced icons toggle proton/nova via a chrome-only @media
  // -moz-pref <style> that never matches on the web; drop it and, when a nova
  // group exists, the proton group(s). Acorn ships single-design SVGs, so these
  // are no-ops there, but keep them so the pipeline stays source-agnostic.
  svg = svg.replace(/<style>[\s\S]*?<\/style>\s*/g, '');
  if (/<g class="nova">/.test(svg)) {
    svg = svg.replace(/<g class="proton">[\s\S]*?<\/g>\s*/g, '');
  }

  // Capture dimensions and existing state before we rewrite anything.
  const width = svg.match(/<svg[^>]*\bwidth="([\d.]+)/i)?.[1];
  const height = svg.match(/<svg[^>]*\bheight="([\d.]+)/i)?.[1];
  const hasViewBox = /\bviewBox=/i.test(svg);
  const usesContext = /context-(fill|stroke)/.test(svg);

  // Firefox's `context-*` model -> currentColor.
  svg = svg
    .replace(/context-fill-opacity/g, '1') // must run before context-fill
    .replace(/context-stroke-opacity/g, '1')
    .replace(/context-fill/g, 'currentColor')
    .replace(/context-stroke/g, 'currentColor');

  // context-fill is sometimes paired with a light-dark() fallback; the two
  // values are invalid together on the web, so keep just currentColor.
  svg = svg.replace(/currentColor\s+light-dark\([^)]*\)/g, 'currentColor');

  // Solid-colour (monochrome) icons hardcode a single fill. Only when the icon
  // isn't already themeable via context-fill and uses exactly one hardcoded
  // colour do we swap it for currentColor, so genuinely multi-colour icons keep
  // their palette.
  if (!usesContext) {
    const fills = [...svg.matchAll(/fill="([^"]+)"/g)].map((m) => m[1]);
    const hardcoded = [
      ...new Set(fills.filter((f) => f !== 'none' && f !== 'currentColor')),
    ];
    if (hardcoded.length === 1) {
      svg = svg.replaceAll(`fill="${hardcoded[0]}"`, 'fill="currentColor"');
    }
  }

  // Every icon must carry a viewBox so it scales with CSS once width/height go.
  if (!hasViewBox && width && height) {
    svg = svg.replace(/<svg\b/i, `<svg viewBox="0 0 ${width} ${height}"`);
  }

  return svg
    .replace(/\s(width|height)="[^"]*"/g, '') // let CSS size it
    .replace(/\s+/g, ' ')
    .trim();
}

// Collect name -> sorted list of optical sizes present, emitting a module per
// (name, size). vendor/icons/<size>/<name>-<size>.svg — the dir is the
// authoritative size, so strip a trailing `-<size>` from the file name.
const sizeDirs = readdirSync(SRC)
  .filter((d) => statSync(join(SRC, d)).isDirectory())
  .map(Number)
  .filter((n) => !Number.isNaN(n))
  .sort((a, b) => a - b);

const byName = new Map<string, number[]>();
const allSizes = new Set<number>();

for (const size of sizeDirs) {
  const dir = join(SRC, String(size));
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith('.svg')) continue;
    const stem = basename(file, '.svg');
    const name = stem.replace(new RegExp(`-${size}$`), '');
    const svg = normalise(readFileSync(join(dir, file), 'utf8'));
    writeFileSync(
      join(ICONS_OUT, `${name}-${size}.ts`),
      `/* Generated from a vendored Acorn icon. Do not edit. */\nexport default ${JSON.stringify(svg)};\n`,
    );
    let forName = byName.get(name);
    if (!forName) {
      forName = [];
      byName.set(name, forName);
    }
    forName.push(size);
    allSizes.add(size);
  }
}

const sorted = [...byName.entries()].sort(([a], [b]) => a.localeCompare(b));
const entries = sorted
  .map(([name, sizes]) => {
    const loaders = sizes
      .sort((a, b) => a - b)
      .map(
        (size) =>
          `    ${size}: () => import(${JSON.stringify(`./icons/${name}-${size}.js`)}),`,
      )
      .join('\n');
    return `  ${JSON.stringify(name)}: {\n${loaders}\n  },`;
  })
  .join('\n');

const opticalSizes = [...allSizes].sort((a, b) => a - b);

const registry = `/* Generated from vendored Acorn icons. Do not edit. */
export const iconLoaders = {
${entries}
} as const;

export type IconName = keyof typeof iconLoaders;

export const iconNames = Object.keys(iconLoaders) as IconName[];

/** Optical sizes (px) present in the catalogue, ascending. */
export const opticalSizes = [${opticalSizes.join(', ')}] as const;
export type OpticalSize = (typeof opticalSizes)[number];
`;
writeFileSync(join(OUT, 'icons.ts'), registry);

const moduleCount = [...byName.values()].reduce((n, s) => n + s.length, 0);
console.log(
  `icons built: ${byName.size} names, ${moduleCount} modules across sizes [${opticalSizes.join(', ')}] -> ${ICONS_OUT}/, registry -> ${OUT}/icons.ts`,
);
