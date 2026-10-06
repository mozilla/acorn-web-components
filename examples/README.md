# Examples

Runnable usage examples for `acorn-web-components`, served against the library **source** (edit a component and the example live-reloads).

## Running

```sh
npm run example
```

Opens a Vite dev server; the landing page links to each example. No build step — the examples import the components straight from `src/`.

## Examples

- **[Table of contents](table-of-contents/)** — a sticky `moz-page-nav` with `scrollspy` and `href="#section"` items. The nav highlights the section in view; the app listens for `moz-page-nav:change` and calls `history.replaceState` so the URL hash tracks scrolling (shareable, and restored on reload). Shows the intended split: the component owns selection/highlighting, the app owns routing.
- **[Segmented control + deck](segmented-control/)** — a `moz-segmented-control` bound to a `moz-segmented-control-deck` (the tabs pattern). Selecting a tab switches the deck panel; the app listens for `moz-segmented-control:change` and calls `history.pushState` so tabs are shareable and back/forward navigate them, and restores the tab from the URL on load. Same split, using `pushState` for discrete clicks rather than `replaceState` for continuous scroll.
- **[Form](form/)** — a full submission form built from the input components. a real `<form>` plus the controls' own `ElementInternals` association gives `requestSubmit()`, `FormData`, `reportValidity()`, native reset and Enter-to-submit, so the app is left owning only what's app-shaped — the error summary, the busy state, and where results surface. Shows the two cases that aren't obvious: `moz-input-file` submits nothing (its `File` objects can't be a string `value`, so they're read off the element), and `novalidate` suppresses the browser's bubbles so the summary is the single place errors appear.
