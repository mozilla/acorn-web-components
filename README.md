# acorn-web-components

Mozilla Nova-styled web components written in TypeScript with [Lit](https://lit.dev). The design tokens are compiled from Firefox's [Nova design system](https://searchfox.org/firefox-main/source/toolkit/themes/shared/design-system), and the icons and illustrations from [FirefoxUX/acorn-icons](https://github.com/FirefoxUX/acorn-icons), so the components match Firefox and can be kept up to date with it.

> Status: early proof of concept (see [AMOENG-2723](https://mozilla-hub.atlassian.net/browse/AMOENG-2723)).
> Published to npm under the `alpha` dist-tag; the API may change.

## What's inside

- `<moz-provider>` provides ambient theme, locale, and high-contrast state to its descendants.
- The Nova design tokens, as CSS custom properties and a typed map.
- A set of Nova-styled components:
  - Actions: `<moz-button>` (default / primary / destructive / ghost / muted, plus icon-only; `menu-id` points it at a panel list), `<moz-chip>`, `<moz-panel-list>` with `<moz-panel-item>` and `<moz-panel-row>` (an anchored action menu, with an optional header, subheadings, separators and submenus).
  - Surfaces & layout: `<moz-card>`, `<moz-details>`, `<moz-dialog>`, `<moz-box-group>` with `<moz-box-item>` / `<moz-box-button>` / `<moz-box-link>`.
  - Navigation & structure: `<moz-page-nav>`, `<moz-breadcrumb>`, `<moz-segmented-control>`, `<moz-page-header>`.
  - Forms: `<moz-input-text>` (text / email / url / tel), `<moz-input-search>` (debounced search field), `<moz-checkbox>` (with `<moz-checkbox-all>` for select-all and `<moz-checkbox-visual>` for display-only), `<moz-select>` (the platform popup, or a `<moz-panel-list>` one via `popup="panel"`), `<moz-radio-group>` with `<moz-radio>`, `<moz-toggle>` (a switch), `<moz-label>`, `<moz-fieldset>` — form-associated, with built-in labelling, description, and validation.
  - Status & feedback: `<moz-message-bar>`, `<moz-badge>`, `<moz-status-badge>` (a status-colored pill), `<moz-status-dot>` (a status dot), `<moz-five-star>` (a read-only or selectable star rating).
  - Primitives: `<moz-icon>` renders a named icon from the Nova set; `<moz-illustration>` renders a named illustration (kit pieces and pictograms), following the ambient theme for its light/dark variants.

These are standard custom elements, so they work in plain HTML and in any framework (React, Vue, Svelte, and so on). Typed React wrappers are included for a more idiomatic React API.

## Installation

Published to [npm](https://www.npmjs.com/package/acorn-web-components) as `acorn-web-components` — unscoped for now, so no registry configuration or token is needed:

```sh
npm install acorn-web-components@alpha
```

Releases publish under the `alpha` dist-tag, so `@alpha` always resolves the newest prerelease. Use it rather than a bare install: npm pins `latest` to whichever version lands first, so `latest` is currently an alpha too and won't track new ones.

`lit` and `@lit/context` are dependencies and install automatically. `react` and `react-dom` are optional peer dependencies, needed only if you use the `acorn-web-components/react` entry.

## Quick start

Load the token layer once at your app root, then import and use the components.

```js
// Once, at the app entry: the foundation (tokens + document defaults).
import 'acorn-web-components/foundation.css';

// Import the components you use (they self-register):
import 'acorn-web-components/components/moz-button';
import 'acorn-web-components/components/moz-icon';
```

`foundation.css` is everything you need, but you can also import style sheets individually if you need finer control over load order.

```html
<moz-button variant="primary" icon-start="edit">Edit</moz-button>
<moz-icon name="settings" size="large" label="Settings"></moz-icon>
```

Importing from the package root (`import 'acorn-web-components'`) registers every component. Importing a per-component subpath pulls in only what you use.

## Theming and ambient state

Most theming is pure CSS: the tokens use `light-dark()`, so light and dark follow `color-scheme`. Wrap a subtree in `<moz-provider>` to control that, plus locale and high contrast, from the app:

```html
<moz-provider theme="auto" locale="en-US" contrast="auto">
  <!-- your app -->
</moz-provider>
```

- `theme`: `light` | `dark` | `auto` (sets `color-scheme`).
- `contrast`: `auto` | `high`. `high` turns on the higher-contrast token set for everything inside. High contrast also responds to the OS automatically through `@media (prefers-contrast)` and `@media (forced-colors)`.
- `locale`: BCP-47 locale, broadcast for future internationalization.

Per-component appearance is set through the token scales rather than arbitrary values (see each component below).

## React

The React entry provides typed wrappers so props and events follow React conventions:

```jsx
import { MozButton, MozProvider } from 'acorn-web-components/react';
import 'acorn-web-components/foundation.css';

export function App() {
  return (
    <MozProvider theme="auto">
      <MozButton variant="primary" onClick={save}>Save</MozButton>
    </MozProvider>
  );
}
```

## Design tokens

The tokens ship as CSS custom properties in `tokens.css` (foundation, on `:root`), and also as a typed map:

```js
import { tokens, type TokenName } from 'acorn-web-components/tokens';
// tokens['--color-accent-primary'] === 'light-dark(var(--color-violet-50), var(--color-violet-30))'
```

Component-specific tokens (`--button-*`, and so on) are scoped to each component's shadow root, so they don't leak into the global surface by default.

### all-tokens.css
If, for example, you have an exisiting app in a previous design system, and want to attempt a blanket update without consuming these components. `all-tokens.css` re-exports the full set of tokens — foundation plus every component's tokens — on `:root`:

```js
import 'acorn-web-components/all-tokens.css';
```

It's larger than `tokens.css` and everything sits in the `@layer acorn.tokens` cascade layer, so your own unlayered CSS overrides it without a specificity fight. Set `color-scheme` on `:root` (or use `<moz-provider>`) so the `light-dark()` values resolve.

## Package exports

| Entry | Contents |
| --- | --- |
| `acorn-web-components` | All components + tokens/option maps + types |
| `acorn-web-components/components/<name>` | A single component (e.g. `moz-button`) |
| `acorn-web-components/foundation.css` | Tokens + base defaults (one import) |
| `acorn-web-components/tokens.css` | Foundation tokens as CSS custom properties |
| `acorn-web-components/all-tokens.css` | Every token (foundation + all component tokens) on `:root` (opt-in; larger than `tokens.css`) |
| `acorn-web-components/base.css` | Document defaults (font family/size, color-scheme) |
| `acorn-web-components/tokens/<name>.css` | Raw per-component `:host` token CSS (advanced; components already bundle these) |
| `acorn-web-components/tokens` | Typed token map + `TokenName` |
| `acorn-web-components/react` | Typed React wrappers |

A [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) (`custom-elements.json`) ships for editor autocomplete and tooling.

## Examples

A live example of the components in action can be found in the [pinguino DevHub AMO rebuild](https://github.com/mozilla/addons-server/blob/master/src/pinguino). Please note this is currently a work in progress.

Runnable usage examples live in [`examples/`](./examples), served against the library source (no build step):

```sh
npm run example
```

This opens a dev server whose landing page links to each example. See [examples/README.md](./examples/README.md) for the list.

## Contributing

See [DEVELOPMENT.md](./DEVELOPMENT.md) for how to build and work on the library, and how the tokens and icons are compiled from Firefox.

## License

Licensed under the [Mozilla Public License 2.0](https://www.mozilla.org/MPL/2.0/).
