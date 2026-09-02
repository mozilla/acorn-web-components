import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-checkbox-all/moz-checkbox-all';
import '../../src/components/moz-checkbox/moz-checkbox';
import '../../src/components/moz-fieldset/moz-fieldset';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// A select-all in a fieldset: indeterminate (one option checked), with a
// disabled option left out of the tally.
const selectAll = html`<div style="inline-size:360px;">
  <moz-fieldset
    label="Sync your data"
    description="Choose what to sync across your devices."
  >
    <moz-checkbox-all label="Select all"></moz-checkbox-all>
    <moz-checkbox label="Bookmarks" value="bookmarks" checked></moz-checkbox>
    <moz-checkbox label="History" value="history"></moz-checkbox>
    <moz-checkbox label="Passwords" value="passwords" disabled></moz-checkbox>
  </moz-fieldset>
</div>`;

test('checkbox-all states', () => snapshot('checkbox-all-states', selectAll));

test('checkbox-all dark', () => snapshotDark('checkbox-all-dark', selectAll));

test('checkbox-all high-contrast', () =>
  snapshotContrast('checkbox-all-high-contrast', selectAll));
