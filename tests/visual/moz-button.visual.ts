import { html } from 'lit';
import { test } from 'vitest';
import type {
  ButtonSize,
  ButtonVariant,
} from '../../src/components/moz-button/moz-button';
import '../../src/components/moz-button/moz-button';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

const variants: ButtonVariant[] = [
  'default',
  'primary',
  'destructive',
  'ghost',
  'muted',
];
const sizes: ButtonSize[] = ['small', 'medium', 'large'];

const buttonVariants = html`<div
  style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;"
>
  ${variants.map((v) => html`<moz-button variant=${v}>${v}</moz-button>`)}
</div>`;

test('button variants', () => snapshot('button-variants', buttonVariants));

test('button dark', () => snapshotDark('button-dark', buttonVariants));

test('button high-contrast', () =>
  snapshotContrast('button-high-contrast', buttonVariants));

test('button sizes', () =>
  snapshot(
    'button-sizes',
    html`<div style="display:flex;gap:12px;align-items:center;">
      ${sizes.map((s) => html`<moz-button size=${s}>${s}</moz-button>`)}
    </div>`,
  ));

test('icon buttons', () =>
  snapshot(
    'icon-buttons',
    html`<div style="display:flex;gap:12px;align-items:center;">
      ${sizes.map(
        (s) =>
          html`<moz-button icon-only variant="ghost" size=${s} icon-start="close"
            ><span class="visually-hidden">Close</span></moz-button
          >`,
      )}
    </div>`,
  ));
