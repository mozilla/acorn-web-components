# acorn-web-components

Mozilla Nova-styled web components written in TypeScript with [Lit](https://lit.dev). The design tokens and icons are compiled from Firefox's [Nova design system](https://searchfox.org/firefox-main/source/toolkit/themes/shared/design-system), so the components match Firefox and can be kept up to date with it.

> Status: early proof of concept (see [AMOENG-2723](https://mozilla-hub.atlassian.net/browse/AMOENG-2723)).
> Published to GitHub Packages under the `alpha` dist-tag; the API may change.

## What's inside

- `<moz-provider>` provides ambient theme, locale, and high-contrast state to its descendants.
- The Nova design tokens, as CSS custom properties and a typed map.
- A set of Nova-styled components:
  - Actions: `<moz-button>` (default / primary / destructive / ghost / muted, plus icon-only), `<moz-chip>`.
  - Surfaces & layout: `<moz-card>`, `<moz-details>`, `<moz-dialog>`, `<moz-box-group>` with `<moz-box-item>` / `<moz-box-button>` / `<moz-box-link>`.
  - Navigation & structure: `<moz-page-nav>`, `<moz-breadcrumb>`, `<moz-segmented-control>`, `<moz-page-header>`.
  - Forms: `<moz-input-text>` (text / email / url / tel), `<moz-checkbox>`, `<moz-label>`, `<moz-fieldset>` — form-associated, with built-in labelling, description, and validation.
  - Status & feedback: `<moz-message-bar>`, `<moz-badge>`, `<moz-five-star>` (a read-only or selectable star rating).
  - Primitive: `<moz-icon>` renders a named icon from the Nova set.

These are standard custom elements, so they work in plain HTML and in any framework (React, Vue, Svelte, and so on). Typed React wrappers are included for a more idiomatic React API.

## Installation

Published to [GitHub Packages](https://github.com/mozilla/acorn-web-components/packages) under the `@mozilla` scope. GitHub Packages requires a token for every install, [public packages included](https://github.com/orgs/community/discussions/33875), so point the `@mozilla` scope at the GitHub npm registry and authenticate.

Add to an `.npmrc` (in the project, or `~/.npmrc`):

```
@mozilla:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` must be a [classic personal access token](https://github.com/settings/tokens/new?scopes=read:packages) with the `read:packages` scope; fine-grained tokens don't work with the npm registry. Keep it in the environment rather than committing it. Then:

```sh
npm install @mozilla/acorn-web-components
```

While acorn is in alpha, releases publish under the `alpha` dist-tag, so `@mozilla/acorn-web-components@alpha` tracks the latest.

`lit` and `@lit/context` are dependencies and install automatically. `react` and `react-dom` are optional peer dependencies, needed only if you use the `@mozilla/acorn-web-components/react` entry.

## Quick start

Load the token layer once at your app root, then import and use the components.

```js
// Once, at the app entry: the foundation (tokens + document defaults).
import '@mozilla/acorn-web-components/foundation.css';

// Import the components you use (they self-register):
import '@mozilla/acorn-web-components/components/moz-button';
import '@mozilla/acorn-web-components/components/moz-icon';
```

`foundation.css` is everything you need, but you can also import style sheets individually if you need finer control over load order.

```html
<moz-button variant="primary" icon-start="edit">Edit</moz-button>
<moz-icon name="settings" size="large" label="Settings"></moz-icon>
```

Importing from the package root (`import '@mozilla/acorn-web-components'`) registers every component. Importing a per-component subpath pulls in only what you use.

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
import { MozButton, MozProvider } from '@mozilla/acorn-web-components/react';
import '@mozilla/acorn-web-components/foundation.css';

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
import { tokens, type TokenName } from '@mozilla/acorn-web-components/tokens';
// tokens['--color-accent-primary'] === 'light-dark(var(--color-violet-50), var(--color-violet-30))'
```

Component-specific tokens (`--button-*`, and so on) are scoped to each component's shadow root, so they cannot be used elsewhere by mistake.

## Package exports

| Entry | Contents |
| --- | --- |
| `@mozilla/acorn-web-components` | All components + tokens/option maps + types |
| `@mozilla/acorn-web-components/components/<name>` | A single component (e.g. `moz-button`) |
| `@mozilla/acorn-web-components/foundation.css` | Tokens + base defaults (one import) |
| `@mozilla/acorn-web-components/tokens.css` | Foundation tokens as CSS custom properties |
| `@mozilla/acorn-web-components/base.css` | Document defaults (font family/size, color-scheme) |
| `@mozilla/acorn-web-components/tokens/<name>.css` | Raw per-component `:host` token CSS (advanced; components already bundle these) |
| `@mozilla/acorn-web-components/tokens` | Typed token map + `TokenName` |
| `@mozilla/acorn-web-components/react` | Typed React wrappers |

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
