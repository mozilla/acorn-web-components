// Component styles are authored in sibling `.css` files and imported into the
// element. vite-plugin-lit-css turns each into a Lit CSSResult at build time;
// this ambient declaration gives the import its type. (Document-level globals
// like base.css / tokens.css are side-effect imports and don't use this.)
declare module '*.css' {
  import type { CSSResult } from 'lit';
  const styles: CSSResult;
  export default styles;
}
