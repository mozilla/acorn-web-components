import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-five-star/moz-five-star';
import { iconSizes } from '../../src/generated/icon-options';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// Ratings covering empty, half, and full stars (halves exercise the clip-path).
const fiveStars = html`<div style="display:flex;flex-direction:column;gap:8px;">
  ${[0, 2.5, 3.5, 4, 5].map(
    (r) => html`<moz-five-star rating=${r}></moz-five-star>`,
  )}
</div>`;

test('five-star', () => snapshot('five-star', fiveStars));

test('five-star dark', () => snapshotDark('five-star-dark', fiveStars));

test('five-star high-contrast', () =>
  snapshotContrast('five-star-high-contrast', fiveStars));

// Stars scale with the shared Nova icon-size steps.
test('five-star sizes', () =>
  snapshot(
    'five-star-sizes',
    html`<div style="display:flex;flex-direction:column;gap:12px;align-items:start;">
      ${iconSizes.map(
        (s) => html`<moz-five-star rating="3.5" size=${s}></moz-five-star>`,
      )}
    </div>`,
  ));
