import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-input-search/moz-input-search';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

const searches = html`<div
  style="display:flex;flex-direction:column;gap:12px;align-items:flex-start;"
>
  <moz-input-search
    label="Search add-ons"
    placeholder="Search…"
  ></moz-input-search>
  <moz-input-search label="With value" value="ublock"></moz-input-search>
  <moz-input-search label="Disabled" value="ublock" disabled></moz-input-search>
</div>`;

test('input-search states', () => snapshot('input-search-states', searches));

test('input-search dark', () => snapshotDark('input-search-dark', searches));

test('input-search high-contrast', () =>
  snapshotContrast('input-search-high-contrast', searches));
