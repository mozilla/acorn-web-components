import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-checkbox-visual/moz-checkbox-visual';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// Checked, indeterminate, and unchecked, as a read-only capability list.
const visuals = html`<div
  style="display:flex;flex-direction:column;gap:8px;align-items:start;"
>
  <moz-checkbox-visual checked label="Works offline"></moz-checkbox-visual>
  <moz-checkbox-visual indeterminate label="Partly supported"></moz-checkbox-visual>
  <moz-checkbox-visual label="Requires an account"></moz-checkbox-visual>
</div>`;

test('checkbox-visual states', () =>
  snapshot('checkbox-visual-states', visuals));

test('checkbox-visual dark', () =>
  snapshotDark('checkbox-visual-dark', visuals));

test('checkbox-visual high-contrast', () =>
  snapshotContrast('checkbox-visual-high-contrast', visuals));
