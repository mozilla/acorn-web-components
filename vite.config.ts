import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import browserslist from 'browserslist';
import { browserslistToTargets, Features } from 'lightningcss';
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
  // Minify CSS with LightningCSS, but keep `light-dark()` intact: its default
  // lowering emits a `prefers-color-scheme` polyfill keyed off the OS, which
  // breaks `moz-provider`'s per-subtree theming (it drives `color-scheme`, not
  // the media query). Storybook's Vite builder inherits this config too.
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: browserslistToTargets(
        browserslist('>0.25%, not dead, not op_mini all'),
      ),
      exclude: Features.LightDark,
    },
  },
  resolve: {
    dedupe: ['lit', '@lit/context'],
  },
  build: {
    cssMinify: 'lightningcss',
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
