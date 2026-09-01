import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-checkbox/moz-checkbox';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// Unchecked, checked, indeterminate, description, label icon, access key,
// required, disabled, and a nested group (checked parent with live children).
const checkboxes = html`<div
  style="display:flex;flex-direction:column;gap:12px;align-items:start;inline-size:360px;"
>
  <moz-checkbox label="Unchecked"></moz-checkbox>
  <moz-checkbox label="Checked" checked></moz-checkbox>
  <moz-checkbox label="Indeterminate" indeterminate></moz-checkbox>
  <moz-checkbox
    label="Share technical data"
    description="Helps prioritize what to build next."
  ></moz-checkbox>
  <moz-checkbox label="Private browsing" label-icon="shield"></moz-checkbox>
  <moz-checkbox label="Save password" accesskey="s"></moz-checkbox>
  <moz-checkbox label="Required" required></moz-checkbox>
  <moz-checkbox label="Disabled" checked disabled></moz-checkbox>
  <moz-checkbox label="Sync" checked>
    <moz-checkbox slot="nested" label="Bookmarks" checked></moz-checkbox>
    <moz-checkbox slot="nested" label="History"></moz-checkbox>
  </moz-checkbox>
</div>`;

test('checkbox states', () => snapshot('checkbox-states', checkboxes));

test('checkbox dark', () => snapshotDark('checkbox-dark', checkboxes));

test('checkbox high-contrast', () =>
  snapshotContrast('checkbox-high-contrast', checkboxes));
