import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-toggle/moz-toggle';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// Default layout (switch then label): off, on, description, label icon,
// required, disabled (on + off); plus the full-width variant (label then switch).
const toggles = html`<div
  style="display:flex;flex-direction:column;gap:16px;align-items:start;inline-size:320px;"
>
  <moz-toggle label="Off"></moz-toggle>
  <moz-toggle label="On" checked></moz-toggle>
  <moz-toggle
    label="Share technical data"
    description="Helps prioritize what to build next."
  ></moz-toggle>
  <moz-toggle label="Private browsing" label-icon="shield"></moz-toggle>
  <moz-toggle label="Required" required></moz-toggle>
  <moz-toggle label="Disabled on" checked disabled></moz-toggle>
  <moz-toggle label="Disabled off" disabled></moz-toggle>
  <moz-toggle
    inputlayout="inline-end"
    label="Full width"
    description="Label first, switch at the end."
    checked
    style="align-self:stretch;"
  ></moz-toggle>
</div>`;

test('toggle states', () => snapshot('toggle-states', toggles));

test('toggle dark', () => snapshotDark('toggle-dark', toggles));

test('toggle high-contrast', () =>
  snapshotContrast('toggle-high-contrast', toggles));
