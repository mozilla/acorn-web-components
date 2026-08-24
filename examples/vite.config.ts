import { defineConfig } from 'vite';
import { litCssPlugin } from '../litcss';

// Serve the examples against the library source, so editing a component
// live-reloads the example. litCssPlugin turns component `*.css` imports into
// Lit CSSResults (same as the lib build); lit is de-duped to one copy.
export default defineConfig({
  root: import.meta.dirname,
  plugins: [litCssPlugin()],
  resolve: { dedupe: ['lit', '@lit/context'] },
});
