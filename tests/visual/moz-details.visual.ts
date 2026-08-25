import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-details/moz-details';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

const detailsStates = html`<div
  style="display:flex;flex-direction:column;gap:12px;inline-size:360px;"
>
  <moz-details heading="Collapsed">Hidden content.</moz-details>
  <moz-details heading="Expanded" open
    >Revealed content in the disclosure body.</moz-details
  >
</div>`;

test('details states', () => snapshot('details-states', detailsStates));

test('details dark', () => snapshotDark('details-dark', detailsStates));

// High contrast (app-driven): borderless normally, gains a border here.
test('details high-contrast', () =>
  snapshotContrast(
    'details-high-contrast',
    html`<div style="inline-size:360px;">
      <moz-details heading="High contrast" open
        >Gains a visible border in high contrast.</moz-details
      >
    </div>`,
  ));
