# Developing acorn-web-components

How to build, test, and extend the library, and how the tokens and icons are compiled from Firefox.

## Prerequisites

- Node.js 24+ and npm.
- [Bun](https://bun.sh), used to run the token and icon build scripts (they are TypeScript, with no compile step).
- Playwright browsers for the tests — `npm run playwright:install` once (CI runs them from the pinned Playwright image instead).

## Setup

```sh
npm install
npm run generate   # compile tokens + icons into src/generated (see below)
npm run dev        # Storybook at http://localhost:6006
```

`src/generated/` is produced by `npm run generate`, so run it whenever the vendored token or icon sources change.
`npm run build` does not run it for you. That is deliberate: you can build the library without regenerating if you have not validated changes to the vendored sources.

> Note: npm here uses an allow-scripts guard. The `esbuild` and `rs-module-lexer` install scripts must be approved (`allowScripts` in `package.json`). They are dev-only and never reach consumers.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` / `npm run storybook` | Storybook dev server |
| `npm run generate` | Compile tokens (`build:tokens`) and icons (`build:icons`) into `src/generated/` |
| `npm run test` | Storybook-driven tests via Vitest (browser mode), watch |
| `npm run test:browsers` | One-shot cross-browser run (Chromium + Firefox + WebKit) |
| `npm run test:coverage` | Chromium-only run with v8 coverage + thresholds |
| `npm run playwright:install` | Install the Playwright browsers (Chromium, Firefox, WebKit) matching the pinned version |
| `npm run test:visual` | Compare visual snapshots locally (baselines are `-chromium-linux`, so pixels only match in the container — use `:docker`) |
| `npm run test:visual:docker` | Compare against the committed baselines in the pinned Playwright container (the reliable local check) |
| `npm run test:visual:update:docker` | Regenerate the committed baselines in the pinned Playwright container |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Full library build into `dist/` (clean, lib, react, types, assets, manifest) |
| `npm run build-storybook` | Static Storybook build |

## Project structure

```
src/
  base/moz-lit-element.ts        Base class: consumes theme/locale/contrast context
  context/                       @lit/context definitions (theme, locale, contrast)
  components/<name>/             One component: <name>.ts, <name>.css, <name>.stories.ts
  base.css                       Hand-authored document defaults (font, color-scheme)
  generated/                     GENERATED (git-ignored): tokens.css, tokens.ts,
                                 icon-options.ts, icons/*, icons.ts, component-tokens/*
vendor/                          Committed upstream copies (the build inputs)
  design-system/                 Vendored Firefox token JSON (+ VENDOR.json)
  icons/                         Vendored Firefox SVGs (+ VENDOR.json)
scripts/
  tokens/build.ts                Token pipeline (Style Dictionary)
  icons/build.ts                 Icon pipeline
  vendor.ts                      Refresh vendor/ from a Firefox checkout
  clean.ts / copy-assets.ts      Build helpers
```

## Tokens and icons come from Firefox

The source of truth is Firefox's Nova design system. We vendor a pinned snapshot and compile it ourselves rather than copying Firefox's generated CSS.

### Tokens (`scripts/tokens/build.ts`)

Input: `vendor/design-system/`, the `*.tokens.json` files from Firefox's `toolkit/themes/shared/design-system/src/tokens` (base primitives, Nova overlays, and components). The pinned revision is recorded in `vendor/design-system/VENDOR.json`.

The build replicates the essential parts of Firefox's Style Dictionary config:

1. Namespacing: each file's tokens are wrapped under a namespace taken from its filename, so `{color.gray.70}` references resolve.
2. Surface collapse: a token value keyed by rendering surface (`{ light, dark, forcedColors, ... }`) is collapsed to one web value. `light`+`dark` become `light-dark(...)`, otherwise `@base` or `default`. Chrome-only surfaces are dropped from the base value.
3. Nova wins: Nova overlays override the base tokens.
4. References preserved: foundation references stay as `var(...)`, which keeps the output DRY and themeable. References to another component's tokens are inlined to literals, since they live in a different `:host`.

Output:

- `tokens.css`: the foundation tokens on `:root` (primitives, semantic tokens, and the broadly used icon and opacity scales), with `@media (prefers-contrast)` and `@media (forced-colors)` layers plus an app-driven `[data-contrast='high']` layer (prefers-contrast only; see below).
- `tokens.ts`: a typed token map and `TokenName`.
- `component-tokens/<name>.css`: each component's `--<name>-*` tokens scoped to `:host` (including its own accessibility layers). The component imports it as a `CSSResult` via vite-plugin-lit-css, same as its `<name>.css`.
- `icon-options.ts`: the `IconSize` and `IconColor` scales, kept in sync with the tokens so `moz-icon`'s props cannot drift.

### Icons (`scripts/icons/build.ts`)

Input: `vendor/icons/<size>/`, the desktop SVGs from `github.com/FirefoxUX/acorn-icons` (Acorn/Nova). Each icon is normalized for the web: `context-fill` becomes `currentColor`, fixed sizes are stripped, a `viewBox` is ensured, and single-color icons become `currentColor`. Acorn draws each icon at several optical sizes, so each `(name, size)` is emitted as its own module (`icons/<name>-<size>.ts`) and the registry (`icons.ts`) maps name → available sizes → lazy loader; `moz-icon` picks the closest size and a consumer only bundles what it renders.

### Updating from upstream

The build scripts do not fetch anything; they compile the committed snapshot in `vendor/`. Two vendor scripts refresh it, each recording its source revision in the matching `VENDOR.json`:

- `npm run vendor:tokens` — Firefox design tokens from `github.com/mozilla-firefox/firefox`. Sparse-clones the source itself (set `FIREFOX_PATH` to reuse a local checkout, or `FIREFOX_REF` for a branch/tag).
- `npm run vendor:icons` — icons from `github.com/FirefoxUX/acorn-icons`, pinned to a release tag (override with `ACORN_ICONS_REF`).

`npm run vendor` runs both. Then run `npm run generate` and review the diff in Storybook.

Two workflows handle drift in CI (not the standard pipeline): the nightly `upstream-sync` for tokens, and `icons-sync`, which opens a bump PR when acorn-icons cuts a newer release.

## Theming (light and dark)

`color-scheme` is set at two levels, on purpose. `base.css` sets `color-scheme: light dark` on `:root` as the document default, so the tokens' `light-dark()` values follow the OS preference with no JavaScript (server-rendered pages and consumers without the provider are themed correctly). `<moz-provider>` then sets `color-scheme` on its own host from its `theme` prop (`auto` gives `light dark`, or `light` / `dark`), which inherits into its subtree and overrides the default there. So a subtree can be pinned to light or dark regardless of the OS, while anything outside a provider still follows the OS.

## Accessibility / high contrast

High contrast is available two ways:

- OS-driven, automatically, through the `@media (prefers-contrast: more)` and `@media (forced-colors: active)` layers (foundation `:root` and component `:host`).
- App-driven, through `<moz-provider contrast="high">`. The provider sets a `data-contrast` attribute, and `MozLitElement` reflects it onto each component host so the component's own `:host([data-contrast='high'])` overrides apply. The app trigger uses the prefers-contrast set only. forced-colors stays `@media`-only, because its system colors are meant to be controlled by the OS.

## Testing

Tests are Storybook-driven: every story runs as a test in a real browser via Vitest's browser mode (Playwright). A story's `play` function is an interaction test, and `@storybook/addon-a11y` runs axe in the same pass, failing on violations. There is no separate component test suite.

```sh
npm run test              # watch
npm run test:browsers     # one-shot, Chromium + Firefox + WebKit
npm run test:coverage     # Chromium-only, v8 coverage + thresholds
```

A plain run exercises Chromium and Firefox. Coverage uses the v8 provider, which only instruments Chromium, so the coverage run is Chromium-only.

### Visual snapshots

Visual regression is a separate run from the Storybook tests, defined in `vitest.visual.config.ts` with its specs in `tests/visual/`. It lives apart because Vitest anchors screenshot baselines to the test file's own directory; keeping the specs in `tests/visual/` is what puts the baselines there (`tests/visual/__screenshots__/`) instead of scattered beside each story under `src/`. The specs re-render the component matrices (they don't duplicate story logic beyond the markup) and assert with `toMatchScreenshot`.

There is one `<component>.visual.ts` spec per component, each importing the shared `snapshot` / `snapshotDark` / `snapshotContrast` helpers from `tests/visual/snapshot.ts` (which render the matrix in a themed `<moz-provider>` and own the shared tolerance). Every spec covers the component in the default light theme plus at least one dark (`snapshotDark`) and one high-contrast (`snapshotContrast`) variant — the two ambient modes the provider drives — usually by reusing one representative matrix across all three. Because baselines are keyed by the spec file's name, each component's PNGs live under its own `__screenshots__/<component>.visual.ts/` directory — so moving a test between files means moving its baselines too.

Pixel output depends on the browser build and fonts, so baselines are authoritative on one environment: the pinned Playwright Linux container. Only the `-chromium-linux` baselines are committed (local `-darwin` / `-win32` ones are git-ignored), and the `visual` CI job compares against them in that same container.

To add or refresh baselines, regenerate them in the container so they match CI, then review and commit the PNGs:

```sh
npm run test:visual:update:docker   # requires Docker running
```

The mismatch output (`*-actual.png` / `*-diff.png`) is git-ignored; CI uploads it as an artifact when the `visual` job fails.

## Build output (`dist/`)

`npm run build` produces:

- ES modules that mirror `src/` (per-component files, code-split icons); `lit` and `@lit/context` stay external.
- `.d.ts` type declarations and maps.
- `custom-elements.json` (Custom Elements Manifest).
- `tokens/tokens.css` and `base.css`, plus `tokens/<component>.css` (each component's raw `:host` token layer, extracted from the CSSResult modules; not the recommended consumption path, but available).
- `react/index.js`: the React wrappers, with `@lit/react` bundled and react and lit kept external.

## Conventions

- Elements use the `moz-` prefix, matching Firefox.
- Components extend `MozLitElement` (the shared base) to consume ambient context.
- Foundation tokens are global (`:root`); component tokens are scoped to `:host`.
- Never hardcode colors or spacing in a component; reference tokens instead.
- `type` vs `variant`. Use `type` when the value is a semantic category that carries meaning and maps to distinct affordances — an icon, a color, an ARIA/severity treatment — e.g. `moz-message-bar` (`info`/`warning`/`success`/`error`/`critical`), `moz-badge` (`beta`/`new`). Use `variant` when the value is an interchangeable presentational or structural style with no semantic payload — e.g. `moz-button` (`primary`/`destructive`/`ghost`/`muted`), `moz-card` (`accordion`), `moz-dialog` (`modal`/`inline`). Firefox packs button styles into `type`; we deliberately use `variant` there because those are styles, not categories.
- Leading/trailing icons are `icon-start` / `icon-end` (an `IconName` from the set); `icon-only` is the boolean for a square icon button. A slot (`icon`) is added only where arbitrary markup — an image, a logo — is also wanted (e.g. `moz-page-header`).
- Events are named `moz-<component>:<verb>` and dispatched `{ bubbles: true, composed: true }` (plus `cancelable` for a preventable action). Any payload gets an exported `<Name>Detail` interface. Present tense is the request (`:dismiss`), past tense the completed notification (`:dismissed`).
- Shared render/behavior helpers live in `src/base/`: `slots.ts` (`slotHasContent`), `roving.ts` (`rovingIndex` for arrow-key groups), and `icon-button.ts` (`iconButton` for close/back controls). Reuse them rather than re-implementing.
- A component's styles live in a sibling `<name>.css`, imported as a Lit `CSSResult` (`import styles from './<name>.css'`) via vite-plugin-lit-css, and composed with the token layer: `static styles = [<name>Tokens, styles]`. This matches Firefox and the enterprise-console frontend, and keeps the CSS diffable against Firefox's own component CSS. The document-level `base.css` / `tokens.css` are the exception: they load as global `:root` stylesheets and are excluded from the transform.
