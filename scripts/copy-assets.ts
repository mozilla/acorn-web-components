import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

// Copy the CSS the JS graph doesn't import (loaded as global stylesheets) into
// dist so the ./tokens.css and ./base.css package exports resolve.
const copies: Array<[string, string]> = [
  ['src/generated/tokens.css', 'dist/tokens/tokens.css'],
  ['src/base.css', 'dist/base.css'],
];

for (const [from, to] of copies) {
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  console.log(`copied ${from} -> ${to}`);
}

// Convenience barrel: one import that pulls in tokens + base defaults. The
// granular ./tokens.css and ./base.css entries remain for advanced use.
writeFileSync(
  'dist/foundation.css',
  "@import './tokens/tokens.css';\n@import './base.css';\n",
);
console.log('wrote dist/foundation.css');

// Each component's token layer as raw CSS at dist/tokens/<name>.css. Components
// bundle their own tokens, so this is a convenience, not the primary path.
const componentTokensDir = 'src/generated/component-tokens';
mkdirSync('dist/tokens', { recursive: true });
for (const file of readdirSync(componentTokensDir).filter((f) =>
  f.endsWith('.css'),
)) {
  copyFileSync(join(componentTokensDir, file), `dist/tokens/${file}`);
}
console.log('wrote dist/tokens/<component>.css');

// Drop the per-icon .d.ts (+ maps). Each icon module is an internal SVG-string
// chunk; the public types live in icons.d.ts. The lazy-imported .js are kept.
const iconsDist = 'dist/generated/icons';
if (existsSync(iconsDist)) {
  let pruned = 0;
  for (const f of readdirSync(iconsDist)) {
    if (f.endsWith('.d.ts') || f.endsWith('.d.ts.map')) {
      rmSync(join(iconsDist, f));
      pruned++;
    }
  }
  console.log(`pruned ${pruned} icon declaration files`);
}
