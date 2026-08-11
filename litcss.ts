import litCss from 'vite-plugin-lit-css';

// Import component `*.css` as Lit CSSResults; exclude the document-level globals
// (base.css, tokens.css), which load as plain :root stylesheets. Every pipeline
// that loads a component (lib, react, storybook, vitest) needs this, once each.
export const litCssPlugin = () =>
  litCss({ exclude: ['**/base.css', '**/generated/tokens.css'] });
