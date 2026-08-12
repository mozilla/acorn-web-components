import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { litCssPlugin } from './litcss';

// React wrappers entry. `@lit/react` is bundled in; react/react-dom stay
// external (optional peer deps) and lit stays external for dedupe.
export default defineConfig({
  plugins: [litCssPlugin()],
  resolve: {
    dedupe: ['lit', '@lit/context'],
  },
  build: {
    outDir: 'dist/react',
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, 'src/react/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      // Externalise react/lit and the library's own modules (they ship in the
      // main build); the react entry bundles only @lit/react + the wrappers.
      external: (id: string) =>
        id === 'react' ||
        id === 'react-dom' ||
        id === 'lit' ||
        id.startsWith('lit/') ||
        id === '@lit/context' ||
        /[\\/]src[\\/](components|generated|context|base)[\\/]/.test(id) ||
        /\.\.[\\/](components|generated|context|base)[\\/]/.test(id),
    },
  },
});
