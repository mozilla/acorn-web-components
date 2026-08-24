// Foundation tokens + base styles, then the components this page uses. Importing
// a component runs its customElements.define, which upgrades the elements
// already in the document synchronously — so their properties are live below.
import '../../src/generated/tokens.css';
import '../../src/base.css';
import '../../src/components/moz-card/moz-card';
import '../../src/components/moz-segmented-control/moz-segmented-control';

const control = document.querySelector('moz-segmented-control');
if (control) {
  const valid = new Set(
    [...control.querySelectorAll('moz-segmented-control-item')].map(
      (item) => item.value,
    ),
  );
  const fromUrl = () => new URLSearchParams(location.search).get('tab') ?? '';

  // Show the tab named in the URL. Setting `value` drives the deck and is
  // silent (no change event), so restoring on load and reacting to
  // back/forward never loops back into a history write.
  const applyUrl = () => {
    const value = fromUrl();
    if (valid.has(value)) control.value = value;
  };
  applyUrl();
  window.addEventListener('popstate', applyUrl);

  // A tab click is a discrete navigation, so pushState — back/forward step
  // through the tabs you visited. (The table-of-contents example uses
  // replaceState instead, because continuous scrolling would flood history.)
  control.addEventListener('moz-segmented-control:change', (event) => {
    const { value } = (event as CustomEvent<{ value: string }>).detail;
    if (value !== fromUrl()) history.pushState(null, '', `?tab=${value}`);
  });
}
