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
