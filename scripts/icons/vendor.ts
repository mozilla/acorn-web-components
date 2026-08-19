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

// Vendor the desktop icon SVGs from github.com/FirefoxUX/acorn-icons into
// vendor/icons/<size>/. Acorn ships semver releases, so we pin a tag (override
// with ACORN_ICONS_REF). Run `npm run generate` afterwards.

const REPO = resolve(import.meta.dirname, '..', '..');
const ICONS_DEST = join(REPO, 'vendor/icons');

// VENDOR.json (not this default) is what icons-sync compares to the latest release.
const REF = process.env.ACORN_ICONS_REF ?? 'v1.112.0';
const ACORN_REPO = 'github.com/FirefoxUX/acorn-icons';

// Desktop SVGs sit in size dirs (icons/desktop/<size>/); mobile ships PDF/XML
// we don't need.
const DESKTOP_SUBPATH = 'icons/desktop';

const tmp = join(REPO, '.acorn-icons-tmp');
rmSync(tmp, { recursive: true, force: true });
execSync(
  `git clone --depth 1 --branch "${REF}" "https://${ACORN_REPO}.git" "${tmp}"`,
  { stdio: 'inherit' },
);
const revision = execSync(`git -C "${tmp}" rev-parse HEAD`, {
  encoding: 'utf8',
}).trim();

// Replace the whole set so icons/sizes removed upstream don't linger.
rmSync(ICONS_DEST, { recursive: true, force: true });
mkdirSync(ICONS_DEST, { recursive: true });

const desktopSrc = join(tmp, DESKTOP_SUBPATH);
let iconCount = 0;
const sizes: string[] = [];
for (const size of readdirSync(desktopSrc).sort()) {
  const sizeSrc = join(desktopSrc, size);
  if (!statSync(sizeSrc).isDirectory()) continue;
  const svgs = readdirSync(sizeSrc).filter((f) => f.endsWith('.svg'));
  if (svgs.length === 0) continue;
  const sizeDest = join(ICONS_DEST, size);
  cpSync(sizeSrc, sizeDest, { recursive: true });
  sizes.push(size);
  iconCount += svgs.length;
}

writeFileSync(
  join(ICONS_DEST, 'VENDOR.json'),
  `${JSON.stringify(
    {
      source: `acorn-icons: ${DESKTOP_SUBPATH}/<size>/*.svg`,
      repo: ACORN_REPO,
      ref: REF,
      revision,
      vendored: new Date().toISOString().slice(0, 10),
      notes: `Desktop icon set (sizes: ${sizes.join(', ')}). Nova single-design SVGs; the build normalises context-fill to currentColor.`,
    },
    null,
    2,
  )}\n`,
);

rmSync(tmp, { recursive: true, force: true });

console.log(
  `vendored ${iconCount} icons across ${sizes.length} sizes from ${ACORN_REPO} @ ${REF} (${revision.slice(0, 12)})`,
);
