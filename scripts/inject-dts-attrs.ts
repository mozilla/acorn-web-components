import { readFileSync, writeFileSync } from 'node:fs';

// tsc strips Lit's `@property({ attribute: '...' })` mapping from the emitted
// .d.ts, so consumer tooling that reads types (lit-plugin / web-component-
// analyzer) can't see custom attribute names and falls back to the camelCase
// property (e.g. suggests `iconStart` when the attribute is `icon-start`).
// The custom-elements manifest still has the correct names, so mirror them
// back into each element's class JSDoc as `@attr` tags, which those tools read.
// Runs after `analyze`, over the built .d.ts.

interface CemAttribute {
  name: string;
  fieldName?: string;
}
interface CemDeclaration {
  kind: string;
  name: string;
  tagName?: string;
  customElement?: boolean;
  attributes?: CemAttribute[];
}
interface CemModule {
  path: string;
  declarations?: CemDeclaration[];
}

const manifest = JSON.parse(
  readFileSync('dist/custom-elements.json', 'utf8'),
) as { modules: CemModule[] };

// dist mirrors src: src/components/x/x.ts -> dist/components/x/x.d.ts
const dtsPathFor = (modulePath: string): string =>
  modulePath.replace(/^src\//, 'dist/').replace(/\.ts$/, '.d.ts');

// Elements to annotate, grouped by the .d.ts file that declares them.
const byFile = new Map<string, Array<{ className: string; attrs: string[] }>>();
for (const mod of manifest.modules) {
  for (const decl of mod.declarations ?? []) {
    if (!decl.customElement || !decl.tagName || !decl.attributes?.length) {
      continue;
    }
    const dts = dtsPathFor(mod.path);
    const entry = byFile.get(dts) ?? [];
    entry.push({
      className: decl.name,
      attrs: decl.attributes.map((a) => a.name),
    });
    byFile.set(dts, entry);
  }
}

let annotated = 0;
for (const [dts, classes] of byFile) {
  let text = readFileSync(dts, 'utf8');
  // Apply per class from last match to first so earlier offsets stay valid.
  const edits: Array<{ index: number; insert: string }> = [];
  for (const { className, attrs } of classes) {
    const classRe = new RegExp(
      `(?:export )?declare (?:abstract )?class ${className}\\b`,
    );
    const match = classRe.exec(text);
    if (!match) {
      console.warn(`inject-dts-attrs: ${className} not found in ${dts}`);
      continue;
    }
    const before = text.slice(0, match.index);
    const attrLines = attrs.map((a) => ` * @attr ${a}`).join('\n');
    // A JSDoc block sits directly above the class when the text before it ends
    // with `*/` (ignoring whitespace); insert the tags before that closer.
    const closer = before.trimEnd().endsWith('*/')
      ? before.lastIndexOf('*/')
      : -1;
    if (closer !== -1) {
      edits.push({ index: closer, insert: `${attrLines}\n ` });
    } else {
      edits.push({ index: match.index, insert: `/**\n${attrLines}\n */\n` });
    }
  }
  for (const { index, insert } of edits.sort((a, b) => b.index - a.index)) {
    text = text.slice(0, index) + insert + text.slice(index);
  }
  writeFileSync(dts, text);
  annotated += classes.length;
  console.log(
    `inject-dts-attrs: annotated ${classes.length} element(s) in ${dts}`,
  );
}
console.log(`inject-dts-attrs: done (${annotated} elements)`);
