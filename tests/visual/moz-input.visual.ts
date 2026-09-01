import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-input/moz-input';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// One column covering: plain, description, in-field icon, label icon, required
// marker, clear button, error, and disabled.
const inputs = html`<div
  style="display:flex;flex-direction:column;gap:16px;inline-size:320px;"
>
  <moz-input label="Display name" placeholder="e.g. Ada Lovelace"></moz-input>
  <moz-input
    label="Email"
    type="email"
    value="ada@example.com"
    description="We'll only use this to contact you about your add-on."
  ></moz-input>
  <moz-input label="Homepage" type="url" icon-start="link"></moz-input>
  <moz-input label="Private key" label-icon="shield" value="hunter2"></moz-input>
  <moz-input label="Title" required value="My add-on"></moz-input>
  <moz-input label="Search" value="privacy" clearable></moz-input>
  <moz-input
    label="Version"
    value="1.0"
    error="A version number must look like 1.0.0."
  ></moz-input>
  <moz-input label="Slug" value="my-addon" disabled></moz-input>
</div>`;

test('input states', () => snapshot('input-states', inputs));

test('input dark', () => snapshotDark('input-dark', inputs));

test('input high-contrast', () =>
  snapshotContrast('input-high-contrast', inputs));

// Default 320px, full-width, and a custom inline-size, in a 600px container.
const widths = html`<div
  style="display:flex;flex-direction:column;gap:16px;inline-size:600px;"
>
  <moz-input label="Default (320px)"></moz-input>
  <moz-input label="Full width" full-width></moz-input>
  <moz-input label="Custom (480px)" style="inline-size:480px"></moz-input>
</div>`;

test('input widths', () => snapshot('input-widths', widths));
