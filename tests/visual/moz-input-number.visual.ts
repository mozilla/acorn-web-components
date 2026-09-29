import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-input-number/moz-input-number';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// One column covering: default width, range, step, hidden spinner, required,
// description, error, and disabled.
const inputs = html`<div style="display:flex;flex-direction:column;gap:16px;">
  <moz-input-number label="Quantity" value="1"></moz-input-number>
  <moz-input-number label="Rating" min="1" max="5" value="3"></moz-input-number>
  <moz-input-number label="Price" min="0" step="0.5" value="2.5"></moz-input-number>
  <moz-input-number
    label="Version code"
    value="42"
    hide-spinner
  ></moz-input-number>
  <moz-input-number label="Count" required></moz-input-number>
  <moz-input-number
    label="Downloads"
    value="1200"
    description="Rounded to the nearest hundred."
  ></moz-input-number>
  <moz-input-number
    label="Rating"
    value="99"
    max="5"
    error="Pick a number from 1 to 5."
  ></moz-input-number>
  <moz-input-number label="Quantity" value="1" disabled></moz-input-number>
</div>`;

test('number states', () => snapshot('number-states', inputs));

test('number dark', () => snapshotDark('number-dark', inputs));

test('number high-contrast', () =>
  snapshotContrast('number-high-contrast', inputs));

// Width: the shared 320px default, full-width, and a custom inline-size —
// same contract as every other block field.
const widths = html`<div
  style="display:flex;flex-direction:column;gap:16px;inline-size:600px;"
>
  <moz-input-number label="Default (320px)"></moz-input-number>
  <moz-input-number label="Full width" full-width></moz-input-number>
  <moz-input-number label="Custom (480px)" style="inline-size:480px"></moz-input-number>
</div>`;

test('number widths', () => snapshot('number-widths', widths));
