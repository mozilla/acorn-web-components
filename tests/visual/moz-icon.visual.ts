import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-icon/moz-icon';
import { iconColors, iconSizes } from '../../src/generated/icon-options';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

const iconColorRow = html`<div style="display:flex;gap:16px;align-items:center;">
  ${iconColors.map(
    (c) =>
      html`<moz-icon name="information" size="large" color=${c}></moz-icon>`,
  )}
</div>`;

test('icon sizes', () =>
  snapshot(
    'icon-sizes',
    html`<div style="display:flex;gap:16px;align-items:flex-end;">
      ${iconSizes.map((s) => html`<moz-icon name="edit" size=${s}></moz-icon>`)}
    </div>`,
  ));

test('icon colors', () => snapshot('icon-colors', iconColorRow));

test('icon dark', () => snapshotDark('icon-dark', iconColorRow));

test('icon high-contrast', () =>
  snapshotContrast('icon-high-contrast', iconColorRow));

// Side by side on purpose: the logos reuse gradient/clip ids, so this also
// covers those staying scoped to each shadow root.
const logos = [
  'logo-firefox',
  'logo-firefox-beta',
  'logo-firefox-nightly',
  'logo-thunderbird',
  'logo-thunderbird-beta',
  'logo-thunderbird-nightly',
] as const;

test('icon logos', () =>
  snapshot(
    'icon-logos',
    html`<div style="display:flex;gap:16px;align-items:center;">
      ${logos.map(
        (n) => html`<moz-icon name=${n} style="--icon-size:40px;"></moz-icon>`,
      )}
    </div>`,
  ));
