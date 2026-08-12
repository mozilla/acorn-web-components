import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { litCssPlugin } from './litcss';

// Library build. `preserveModules` mirrors src/ into dist/ so each component is
// its own file and the icons stay code-split. Each component module is an
// explicit entry, emitting dist/components/<name>/<name>.js for the
// `./components/*` export (no barrel needed). `lit` / `@lit/context` are external.
const root = import.meta.dirname;
const componentsDir = resolve(root, 'src/components');
const entry: Record<string, string> = {
  index: resolve(root, 'src/index.ts'),
};
for (const name of readdirSync(componentsDir, { withFileTypes: true })) {
  if (name.isDirectory()) {
    entry[`components/${name.name}/${name.name}`] = resolve(
      componentsDir,
      name.name,
      `${name.name}.ts`,
    );
  }
}

export default defineConfig({
  plugins: [litCssPlugin()],
  resolve: {
    dedupe: ['lit', '@lit/context'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry,
      formats: ['es'],
    },
    rollupOptions: {
      external: ['lit', /^lit\//, '@lit/context'],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
  },
});
