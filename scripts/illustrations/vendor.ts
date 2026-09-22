import { execSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

// Vendor the desktop illustration SVGs from github.com/FirefoxUX/acorn-icons
// into vendor/illustrations/. Same repo and release as the icons, so the sync
// workflow re-vendors both at one tag (override with ACORN_ICONS_REF). Run
// `npm run generate` afterwards.

const REPO = resolve(import.meta.dirname, '..', '..');
const DEST = join(REPO, 'vendor/illustrations');

const REF = process.env.ACORN_ICONS_REF ?? 'v1.120.0';
const ACORN_REPO = 'github.com/FirefoxUX/acorn-icons';

// The reusable illustration vocabulary: `kit/` building blocks and `pictograms/`
// spot illustrations. The sibling `exports/` dir holds one-off product
// compositions and `mobile/` ships PDF/XML/WebP — neither is vendored here.
const SUBPATHS = [
  'illustrations/desktop/kit',
  'illustrations/desktop/pictograms',
];

const tmp = join(REPO, '.acorn-illustrations-tmp');
rmSync(tmp, { recursive: true, force: true });
execSync(
  `git clone --depth 1 --branch "${REF}" "https://${ACORN_REPO}.git" "${tmp}"`,
  { stdio: 'inherit' },
);
const revision = execSync(`git -C "${tmp}" rev-parse HEAD`, {
  encoding: 'utf8',
}).trim();

// Replace the whole set so illustrations removed upstream don't linger.
rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });

let count = 0;
for (const subpath of SUBPATHS) {
  const src = join(tmp, subpath);
  for (const file of readdirSync(src).sort()) {
    if (!file.endsWith('.svg')) continue;
    const from = join(src, file);
    if (!statSync(from).isFile()) continue;
    // kit-* and pic-* names don't collide, so both dirs flatten into one.
    cpSync(from, join(DEST, file));
    count++;
  }
}

writeFileSync(
  join(DEST, 'VENDOR.json'),
  `${JSON.stringify(
    {
      source: SUBPATHS.map((p) => `acorn-icons: ${p}/*.svg`),
      repo: ACORN_REPO,
      ref: REF,
      revision,
      vendored: new Date().toISOString().slice(0, 10),
      notes:
        'Desktop illustration kit pieces and pictograms. Full-colour SVGs; -light/-dark suffixes are theme variants the build pairs by base name.',
    },
    null,
    2,
  )}\n`,
);

rmSync(tmp, { recursive: true, force: true });

console.log(
  `vendored ${count} illustrations from ${ACORN_REPO} @ ${REF} (${revision.slice(0, 12)})`,
);
