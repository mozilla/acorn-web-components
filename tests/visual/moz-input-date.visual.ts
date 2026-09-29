import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-input-date/moz-input-date';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// One column covering: empty, filled, description, required, error, disabled.
const inputs = html`<div style="display:flex;flex-direction:column;gap:16px;">
  <moz-input-date label="Release date"></moz-input-date>
  <moz-input-date label="Release date" value="2026-04-01"></moz-input-date>
  <moz-input-date
    label="Release date"
    value="2026-04-01"
    description="When the add-on should go live."
  ></moz-input-date>
  <moz-input-date label="Release date" required></moz-input-date>
  <moz-input-date
    label="Release date"
    value="2020-01-01"
    min="2026-01-01"
    error="Pick a date in the future."
  ></moz-input-date>
  <moz-input-date
    label="Release date"
    value="2026-04-01"
    disabled
  ></moz-input-date>
</div>`;

test('date states', () => snapshot('date-states', inputs));

test('date dark', () => snapshotDark('date-dark', inputs));

test('date high-contrast', () =>
  snapshotContrast('date-high-contrast', inputs));

// Each native date/time type, all at the shared field width.
const types = html`<div style="display:flex;flex-direction:column;gap:16px;">
  <moz-input-date label="date" date-type="date" value="2026-04-01"></moz-input-date>
  <moz-input-date
    label="datetime-local"
    date-type="datetime-local"
    value="2026-04-01T09:30"
  ></moz-input-date>
  <moz-input-date label="time" date-type="time" value="09:30"></moz-input-date>
  <moz-input-date label="month" date-type="month" value="2026-04"></moz-input-date>
  <moz-input-date label="week" date-type="week" value="2026-W14"></moz-input-date>
</div>`;

test('date types', () => snapshot('date-types', types));
