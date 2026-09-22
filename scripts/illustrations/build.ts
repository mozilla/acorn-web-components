import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';

// Normalise the vendored Acorn illustration SVGs for the web and emit:
//   src/generated/illustrations/<name>[-<theme>].ts - `export default "<svg>"`
//   src/generated/illustrations.ts                  - a registry of lazy loaders
//                                                     keyed name -> variant
//
// Unlike icons, illustrations are full-colour artwork: we keep their palette and
// intrinsic width/height (so they render at natural size and scale down via CSS)
// and only tidy the markup. A trailing `-light`/`-dark` marks a theme variant we
// pair under one base name; everything else is a single theme-agnostic variant.
// Each illustration is its own `import()` chunk, so a consumer only bundles what
// it renders.

const OUT = 'src/generated';
const ILLUS_OUT = join(OUT, 'illustrations');
const SRC = 'vendor/illustrations';

rmSync(ILLUS_OUT, { recursive: true, force: true });
mkdirSync(ILLUS_OUT, { recursive: true });

function normalise(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

type Variant = 'light' | 'dark' | 'default';

const byName = new Map<string, Set<Variant>>();

for (const file of readdirSync(SRC).sort()) {
  if (!file.endsWith('.svg')) continue;
  const stem = basename(file, '.svg');
  const match = stem.match(/-(light|dark)$/);
  const name = match ? stem.slice(0, -match[0].length) : stem;
  const variant: Variant = (match?.[1] as 'light' | 'dark') ?? 'default';

  const svg = normalise(readFileSync(join(SRC, file), 'utf8'));
  writeFileSync(
    join(ILLUS_OUT, `${stem}.ts`),
    `/* Generated from a vendored Acorn illustration. Do not edit. */\nexport default ${JSON.stringify(svg)};\n`,
  );

  let variants = byName.get(name);
  if (!variants) {
    variants = new Set();
    byName.set(name, variants);
  }
  variants.add(variant);
}

const order: Variant[] = ['default', 'light', 'dark'];
const sorted = [...byName.entries()].sort(([a], [b]) => a.localeCompare(b));
const entries = sorted
  .map(([name, variants]) => {
    const loaders = order
      .filter((v) => variants.has(v))
      .map((v) => {
        const stem = v === 'default' ? name : `${name}-${v}`;
        return `    ${v}: () => import(${JSON.stringify(`./illustrations/${stem}.js`)}),`;
      })
      .join('\n');
    return `  ${JSON.stringify(name)}: {\n${loaders}\n  },`;
  })
  .join('\n');

const registry = `/* Generated from vendored Acorn illustrations. Do not edit. */
export const illustrationLoaders = {
${entries}
} as const;

export type IllustrationName = keyof typeof illustrationLoaders;

export const illustrationNames = Object.keys(
  illustrationLoaders,
) as IllustrationName[];
`;
writeFileSync(join(OUT, 'illustrations.ts'), registry);

const themed = sorted.filter(([, v]) => !v.has('default')).length;
console.log(
  `illustrations built: ${byName.size} names (${themed} themed), ${readdirSync(ILLUS_OUT).length} modules -> ${ILLUS_OUT}/, registry -> ${OUT}/illustrations.ts`,
);
