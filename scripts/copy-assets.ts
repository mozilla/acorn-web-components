import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';

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

// Emit each component's token layer as raw CSS at dist/tokens/<name>.css,
// extracted from the generated Lit CSSResult modules. Components bundle their
// own tokens, so this is not the recommended consumption path, but the raw
// :host token layer is useful for some consumers.
const componentTokensDir = 'src/generated/component-tokens';
mkdirSync('dist/tokens', { recursive: true });
for (const file of readdirSync(componentTokensDir).filter((f) =>
  f.endsWith('.ts'),
)) {
  const contents = readFileSync(join(componentTokensDir, file), 'utf8');
  const cssBody = contents.match(/css`([\s\S]*)`;/)?.[1]?.trim();
  if (!cssBody) continue;
  const name = basename(file, '.ts');
  writeFileSync(
    `dist/tokens/${name}.css`,
    `/* ${name} component tokens. Generated from a vendored Firefox source. */\n${cssBody}\n`,
  );
}
console.log('wrote dist/tokens/<component>.css');
