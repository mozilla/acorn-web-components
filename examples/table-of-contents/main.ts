// Foundation tokens + base styles (loaded as document-level stylesheets), then
// the components this page uses (they self-register on import).
import '../../src/generated/tokens.css';
import '../../src/base.css';
import '../../src/components/moz-card/moz-card';
import '../../src/components/moz-page-nav/moz-page-nav';

// Sync the URL to the active section. moz-page-nav fires `moz-page-nav:change`
// on scrollspy (and on click/keyboard), so the app owns the routing: here we
// replaceState — updating the hash without flooding the history stack or
// re-triggering a scroll. On load the browser honours an existing #hash
// natively, and the nav highlights it.
const nav = document.querySelector('moz-page-nav');
nav?.addEventListener('moz-page-nav:change', (event) => {
  const id = (event as CustomEvent<{ value?: string }>).detail.value;
  if (id) history.replaceState(null, '', `#${id}`);
});
