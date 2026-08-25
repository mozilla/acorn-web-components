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
