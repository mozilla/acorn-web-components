import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

// Fail the build on a `var(--x)` whose custom property nothing defines.
//
// A dangling var() is silent: the declaration is thrown away at computed-value
// time and the property falls back to its initial value, so there's no error,
// no type break, and often no visible change until someone looks at the right
// state. An upstream token rename (--input-text-* -> --input-*) took out 25
// references across six components this way, and the one state that wasn't
// snapshotted — a drag-over wash — would have shipped.
//
// Only no-fallback references count. `var(--x, <fallback>)` is the deliberate
// consumer-override hook used across these components, so an undefined name
// there is the documented default, not a fault.

const SRC = 'src';
const GENERATED = join('src', 'generated');

// Upstream's token build emits these referencing names it doesn't itself
// define. They're inert here (nothing we ship composes the sidebar layer), but
// a NEW one appearing means a sync dropped something, so the list stays short
// and explicit rather than skipping the generated tree wholesale.
const UPSTREAM_DANGLING = new Set(['--chrome-content-separator-color']);

const DEFINITION = /(--[a-z0-9-]+)\s*:/g;
// \s matches newlines, so a wrapped var( --token ) is still one reference.
const REFERENCE = /var\(\s*(--[a-z0-9-]+)\s*\)/g;

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return cssFiles(path);
    return entry.name.endsWith('.css') ? [path] : [];
  });
}

const files = cssFiles(SRC).map((path) => ({
  path,
  text: readFileSync(path, 'utf8'),
}));

const defined = new Set<string>();
for (const { text } of files) {
  for (const [, name] of text.matchAll(DEFINITION)) defined.add(name);
}

interface Finding {
  name: string;
  location: string;
  generated: boolean;
}

const findings: Finding[] = [];
for (const { path, text } of files) {
  for (const match of text.matchAll(REFERENCE)) {
    const name = match[1];
    if (defined.has(name) || UPSTREAM_DANGLING.has(name)) continue;
    const line = text.slice(0, match.index).split('\n').length;
    findings.push({
      name,
      location: `${relative('.', path)}:${line}`,
      generated: path.startsWith(GENERATED),
    });
  }
}

if (findings.length === 0) {
  console.log(`checked ${files.length} stylesheets, no dangling var() found`);
  process.exit(0);
}

const byName = new Map<string, Finding[]>();
for (const finding of findings) {
  const group = byName.get(finding.name) ?? [];
  group.push(finding);
  byName.set(finding.name, group);
}

for (const [name, group] of byName) {
  const scope = group.every((f) => f.generated)
    ? ' (generated — upstream dropped it; add to UPSTREAM_DANGLING if nothing we ship uses that layer)'
    : '';
  console.error(`${name} is referenced but never defined${scope}`);
  for (const { location } of group) console.error(`    ${location}`);
}
console.error(
  `\n${findings.length} dangling reference(s) across ${byName.size} custom propert${byName.size === 1 ? 'y' : 'ies'}.`,
);
console.error(
  'If a token sync renamed them, update the references; if it dropped them, pick a replacement.',
);
process.exit(1);
