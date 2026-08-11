import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';

// Normalise the vendored Firefox SVG icons for the web and emit:
//   src/generated/icons/<name>.ts  - `export default "<svg>"` (one per icon)
//   src/generated/icons.ts         - a registry of lazy loaders + IconName union
//
// The registry maps each name to a static `import()` thunk, so every icon is a
// separate code-split chunk and a consumer only bundles what it renders.
//
// Firefox icons use the browser `context-fill` model, which doesn't exist on
// the web: we rewrite it to currentColor (so moz-icon colours via text colour)
// and strip fixed width/height so CSS controls size.

const OUT = 'src/generated';
const ICONS_OUT = join(OUT, 'icons');
const SRC = 'vendor/icons';

// Rebuild cleanly so removed upstream icons do not linger.
rmSync(ICONS_OUT, { recursive: true, force: true });
mkdirSync(ICONS_OUT, { recursive: true });

function normalise(raw: string): string {
  let svg = raw.replace(/<!--[\s\S]*?-->/g, '').trim();

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

  // Solid-colour (monochrome) icons hardcode a single fill (e.g. autoscroll's
  // #0c0c0d). Only when the icon isn't already themeable via context-fill and
  // uses exactly one hardcoded colour do we swap it for currentColor, so
  // genuinely multi-colour icons (mdn, badge-blue, ...) keep their palette.
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

const files = readdirSync(SRC)
  .filter((f) => f.endsWith('.svg'))
  .sort();

const names: string[] = [];
for (const file of files) {
  const name = basename(file, '.svg');
  const svg = normalise(readFileSync(join(SRC, file), 'utf8'));
  writeFileSync(
    join(ICONS_OUT, `${name}.ts`),
    `/* Generated from a vendored Firefox icon. Do not edit. */\nexport default ${JSON.stringify(svg)};\n`,
  );
  names.push(name);
}

const loaders = names
  .map(
    (n) =>
      `  ${JSON.stringify(n)}: () => import(${JSON.stringify(`./icons/${n}.js`)}),`,
  )
  .join('\n');

const registry = `/* Generated from vendored Firefox icons. Do not edit. */
export const iconLoaders = {
${loaders}
} as const;

export type IconName = keyof typeof iconLoaders;

export const iconNames = Object.keys(iconLoaders) as IconName[];
`;
writeFileSync(join(OUT, 'icons.ts'), registry);

console.log(
  `icons built: ${names.length} modules -> ${ICONS_OUT}/, registry -> ${OUT}/icons.ts`,
);
