import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-label/moz-label';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

const labels = html`<div
  style="display:flex;flex-direction:column;gap:12px;align-items:start;"
>
  <moz-label label="Accept terms"><input type="checkbox" /></moz-label>
  <moz-label label="Email address" required
    ><input type="checkbox" /></moz-label
  >
  <moz-label label="Private key" label-icon="shield"
    ><input type="checkbox" /></moz-label
  >
  <moz-label label="Share usage data" description="Helps us prioritize."
    ><input type="checkbox" /></moz-label
  >
  <moz-label label="Unavailable" disabled
    ><input type="checkbox" disabled /></moz-label
  >
</div>`;

test('label states', () => snapshot('label-states', labels));

test('label dark', () => snapshotDark('label-dark', labels));

test('label high-contrast', () =>
  snapshotContrast('label-high-contrast', labels));
