import { execSync } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

// Widgets whose design tokens live beside the widget (toolkit/content/widgets/
// moz-<name>/) rather than in the design-system token tree. We vendor those for
// the components we ship. Keep in sync with src/components/.
const WIDGET_TOKEN_COMPONENTS = ['message-bar'];

// Refresh the vendored Firefox token JSON + icon SVGs from a local Firefox
// checkout: github.com/mozilla-firefox/firefox (the source we reference). Point
// FIREFOX_PATH at a checkout, or it defaults to ../firefox next to this repo.
// After running, run `npm run generate` and review the diff in Storybook.
//
// This is the LOCAL vendoring step (`npm run vendor`). The build scripts do not
// fetch; they only compile the committed vendor/ snapshot. The nightly
// upstream-sync workflow does the CI equivalent by sparse-cloning the Firefox
// repo and running this with FIREFOX_PATH set.

const REPO = resolve(import.meta.dirname, '..');
const FIREFOX = process.env.FIREFOX_PATH ?? resolve(REPO, '..', 'firefox');
const TOKENS_SRC = join(
  FIREFOX,
  'toolkit/themes/shared/design-system/src/tokens',
);
const ICONS_SRC = join(FIREFOX, 'toolkit/themes/shared/icons');
const TOKENS_DEST = join(REPO, 'vendor/design-system');
const ICONS_DEST = join(REPO, 'vendor/icons');

const revision = execSync(`git -C "${FIREFOX}" rev-parse HEAD`, {
  encoding: 'utf8',
}).trim();
const vendored = new Date().toISOString().slice(0, 10);

function writeVendorJson(dest: string, source: string, notes: string): void {
  const meta = {
    source,
    repo: 'github.com/mozilla-firefox/firefox',
    revision,
    vendored,
    notes,
  };
  writeFileSync(
    join(dest, 'VENDOR.json'),
    `${JSON.stringify(meta, null, 2)}\n`,
  );
}

// Tokens: mirror the base/ and components/ subdirs.
for (const sub of ['base', 'components']) {
  const dest = join(TOKENS_DEST, sub);
  rmSync(dest, { recursive: true, force: true });
  cpSync(join(TOKENS_SRC, sub), dest, { recursive: true });
}

// Widget-colocated tokens: copy into components/ under the bare widget name
// (moz-message-bar.tokens.json -> message-bar.tokens.json) so the token build's
// namespace matches the tokens' own `{message-bar.*}` self-references.
const widgetsSrc = join(FIREFOX, 'toolkit/content/widgets');
const componentsDest = join(TOKENS_DEST, 'components');
for (const name of WIDGET_TOKEN_COMPONENTS) {
  // The base tokens file is required. Fail loud rather than silently skip:
  // a missing source (e.g. a CI checkout that didn't fetch this widget dir)
  // would otherwise wipe the previously vendored tokens.
  const base = join(widgetsSrc, `moz-${name}`, `moz-${name}.tokens.json`);
  if (!existsSync(base)) {
    throw new Error(
      `Widget token source not found: ${base}\n` +
        `'${name}' is listed in WIDGET_TOKEN_COMPONENTS. In CI, ensure the ` +
        `sparse-checkout includes toolkit/content/widgets/moz-${name}.`,
    );
  }
  copyFileSync(base, join(componentsDest, `${name}.tokens.json`));

  const nova = join(widgetsSrc, `moz-${name}`, `moz-${name}.nova.tokens.json`);
  if (existsSync(nova)) {
    copyFileSync(nova, join(componentsDest, `${name}.nova.tokens.json`));
  }
}

writeVendorJson(
  TOKENS_DEST,
  'firefox: toolkit/themes/shared/design-system/src/tokens',
  'Full snapshot: base primitives + Nova overlays + components. The build compiles base + components.',
);

// Icons: top-level *.svg only.
mkdirSync(ICONS_DEST, { recursive: true });
for (const f of readdirSync(ICONS_DEST)) {
  if (f.endsWith('.svg')) rmSync(join(ICONS_DEST, f));
}
let iconCount = 0;
for (const f of readdirSync(ICONS_SRC)) {
  if (f.endsWith('.svg')) {
    copyFileSync(join(ICONS_SRC, f), join(ICONS_DEST, f));
    iconCount++;
  }
}
writeVendorJson(
  ICONS_DEST,
  'firefox: toolkit/themes/shared/icons/*.svg',
  'The chrome://global/skin/icons set. browser/themes/shared/icons is not included.',
);

console.log(
  `vendored tokens (base + components) + ${iconCount} icons from ${FIREFOX} @ ${revision.slice(0, 12)}`,
);
