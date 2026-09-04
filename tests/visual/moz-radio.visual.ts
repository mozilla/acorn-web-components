import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-radio/moz-radio';
import '../../src/components/moz-radio-group/moz-radio-group';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// A vertical group (selected + options + description, with access keys), a
// required group (legend marker), a disabled pair, and a horizontal group.
const radios = html`<div
  style="display:flex;flex-direction:column;gap:24px;align-items:start;inline-size:360px;"
>
  <moz-radio-group
    label="Update channel"
    description="Choose how often you get updates."
    value="beta"
  >
    <moz-radio value="release" label="Release" accesskey="r"></moz-radio>
    <moz-radio value="beta" label="Beta" accesskey="b"></moz-radio>
    <moz-radio value="nightly" label="Nightly" accesskey="n"></moz-radio>
  </moz-radio-group>

  <moz-radio-group label="Notifications" required>
    <moz-radio value="all" label="All"></moz-radio>
    <moz-radio value="none" label="None"></moz-radio>
  </moz-radio-group>

  <moz-radio-group label="Disabled" value="on" disabled>
    <moz-radio value="on" label="Selected"></moz-radio>
    <moz-radio value="off" label="Unselected"></moz-radio>
  </moz-radio-group>

  <moz-radio-group label="Layout" value="grid" orientation="horizontal">
    <moz-radio value="list" label="List"></moz-radio>
    <moz-radio value="grid" label="Grid"></moz-radio>
  </moz-radio-group>
</div>`;

test('radio states', () => snapshot('radio-states', radios));

test('radio dark', () => snapshotDark('radio-dark', radios));

test('radio high-contrast', () =>
  snapshotContrast('radio-high-contrast', radios));
