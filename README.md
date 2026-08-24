# acorn-web-components

Mozilla Nova-styled web components written in TypeScript with [Lit](https://lit.dev). The design tokens and icons are compiled from Firefox's [Nova design system](https://searchfox.org/firefox-main/source/toolkit/themes/shared/design-system), so the components match Firefox and can be kept up to date with it.

> Status: early proof of concept (see [AMOENG-2723](https://mozilla-hub.atlassian.net/browse/AMOENG-2723)).
> Not yet published to npm. The API may change.

## What's inside

- `<moz-provider>` provides ambient theme, locale, and high-contrast state to its descendants.
- The Nova design tokens, as CSS custom properties and a typed map.
- A small set of Nova-styled components, including:
  - `<moz-button>`: primary, secondary, tertiary, and icon-only buttons.
  - `<moz-icon>`: renders a named icon from the Nova icon set.

These are standard custom elements, so they work in plain HTML and in any framework (React, Vue, Svelte, and so on). Typed React wrappers are included for a more idiomatic React API.

## Installation

Not on npm yet, so install from git:

```sh
npm install <git-url-of-this-repo>
```

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
- `locale`: BCP-47 locale, broadcast for future internationalisation.

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

Component-specific tokens (`--button-*`, and so on) are scoped to each component's shadow root, so they cannot be used elsewhere by mistake.

## Package exports

| Entry | Contents |
| --- | --- |
| `acorn-web-components` | All components + tokens/option maps + types |
| `acorn-web-components/components/<name>` | A single component (e.g. `moz-button`) |
| `acorn-web-components/foundation.css` | Tokens + base defaults (one import) |
| `acorn-web-components/tokens.css` | Foundation tokens as CSS custom properties |
| `acorn-web-components/base.css` | Document defaults (font family/size, color-scheme) |
| `acorn-web-components/tokens/<name>.css` | Raw per-component `:host` token CSS (advanced; components already bundle these) |
| `acorn-web-components/tokens` | Typed token map + `TokenName` |
| `acorn-web-components/react` | Typed React wrappers |

A [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) (`custom-elements.json`) ships for editor autocomplete and tooling.

## Examples

Runnable usage examples live in [`examples/`](./examples), served against the library source (no build step):

```sh
npm run example
```

This opens a dev server whose landing page links to each example. See [examples/README.md](./examples/README.md) for the list.

## Contributing

See [DEVELOPMENT.md](./DEVELOPMENT.md) for how to build and work on the library, and how the tokens and icons are compiled from Firefox.

## License

Licensed under the [Mozilla Public License 2.0](https://www.mozilla.org/MPL/2.0/).
