import { execSync } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  existsSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

// Widgets whose tokens live beside the widget (toolkit/content/widgets/) rather
// than in the design-system token tree. An entry is the bare component name
// (moz-<name>/moz-<name>.tokens.json), or { name, dir } when the path differs
// ('.' = directly in the widgets root). Keep in sync with src/components/.
type WidgetTokenComponent = string | { name: string; dir: string };

const WIDGET_TOKEN_COMPONENTS: WidgetTokenComponent[] = [
  'message-bar',
  'badge',
  'page-nav',
  'segmented-control',
  'toggle',
  // moz-breadcrumb ships under the moz-breadcrumb-group widget dir.
  { name: 'breadcrumb', dir: 'moz-breadcrumb-group' },
  // moz-box's tokens sit directly in the widgets root, not a moz-box/ subdir.
  { name: 'box', dir: '.' },
];

// Vendor the Firefox design-system token JSON from
// github.com/mozilla-firefox/firefox into vendor/design-system/. Sparse-clones
// the source itself; set FIREFOX_PATH to reuse a local checkout, or FIREFOX_REF
// for a branch/tag. Run `npm run generate` afterwards.

const REPO = resolve(import.meta.dirname, '..', '..');
const FIREFOX_REPO = 'github.com/mozilla-firefox/firefox';

const TOKENS_SUBPATH = 'toolkit/themes/shared/design-system/src/tokens';
const WIDGETS_SUBPATH = 'toolkit/content/widgets';

// Firefox is huge, so sparse-clone only the two trees we read — unless a local
// FIREFOX_PATH is given.
const tmp = join(REPO, '.firefox-tmp');
let firefox: string;
let cloned = false;
if (process.env.FIREFOX_PATH) {
  firefox = resolve(process.env.FIREFOX_PATH);
} else {
  const ref = process.env.FIREFOX_REF;
  rmSync(tmp, { recursive: true, force: true });
  execSync(
    `git clone --depth 1 --filter=blob:none --sparse ${
      ref ? `--branch "${ref}" ` : ''
    }"https://${FIREFOX_REPO}.git" "${tmp}"`,
    { stdio: 'inherit' },
  );
  execSync(
    `git -C "${tmp}" sparse-checkout set "${TOKENS_SUBPATH}" "${WIDGETS_SUBPATH}"`,
    { stdio: 'inherit' },
  );
  firefox = tmp;
  cloned = true;
}

const revision = execSync(`git -C "${firefox}" rev-parse HEAD`, {
  encoding: 'utf8',
}).trim();
const vendored = new Date().toISOString().slice(0, 10);

const TOKENS_SRC = join(firefox, TOKENS_SUBPATH);
const TOKENS_DEST = join(REPO, 'vendor/design-system');

function writeVendorJson(dest: string, source: string, notes: string): void {
  const meta = {
    source,
    repo: FIREFOX_REPO,
    revision,
    vendored,
    notes,
  };
  writeFileSync(
    join(dest, 'VENDOR.json'),
    `${JSON.stringify(meta, null, 2)}\n`,
  );
}

for (const sub of ['base', 'components']) {
  const dest = join(TOKENS_DEST, sub);
  rmSync(dest, { recursive: true, force: true });
  cpSync(join(TOKENS_SRC, sub), dest, { recursive: true });
}

// Widget-colocated tokens: copy into components/ under the bare widget name
// (moz-message-bar.tokens.json -> message-bar.tokens.json) so the token build's
// namespace matches the tokens' own `{message-bar.*}` self-references.
const widgetsSrc = join(firefox, WIDGETS_SUBPATH);
const componentsDest = join(TOKENS_DEST, 'components');
for (const entry of WIDGET_TOKEN_COMPONENTS) {
  const name = typeof entry === 'string' ? entry : entry.name;
  const srcDir = join(
    widgetsSrc,
    typeof entry === 'string' ? `moz-${name}` : entry.dir,
  );

  // The base tokens file is required. Fail loud rather than silently skip:
  // a missing source would otherwise wipe the previously vendored tokens.
  const base = join(srcDir, `moz-${name}.tokens.json`);
  if (!existsSync(base)) {
    throw new Error(
      `Widget token source not found: ${base}\n` +
        `'${name}' is listed in WIDGET_TOKEN_COMPONENTS.`,
    );
  }
  copyFileSync(base, join(componentsDest, `${name}.tokens.json`));

  const nova = join(srcDir, `moz-${name}.nova.tokens.json`);
  if (existsSync(nova)) {
    copyFileSync(nova, join(componentsDest, `${name}.nova.tokens.json`));
  }
}

writeVendorJson(
  TOKENS_DEST,
  `firefox: ${TOKENS_SUBPATH}`,
  'Full snapshot: base primitives + Nova overlays + components. The build compiles base + components.',
);

if (cloned) rmSync(tmp, { recursive: true, force: true });

console.log(
  `vendored tokens (base + components) from ${FIREFOX_REPO} @ ${revision.slice(0, 12)}`,
);
