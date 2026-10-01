import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-input-color/moz-input-color';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// The states Figma specifies, plus description and error. Hover/active can't be
// driven from a static snapshot, so they're covered by the stories instead.
const states = html`<div
  style="display:flex;flex-direction:column;gap:16px;inline-size:320px;"
>
  <moz-input-color label="Highlight colour" value="#0060df"></moz-input-color>
  <moz-input-color
    label="Highlight colour"
    value="#2ac3a2"
    description="Used for links and selected rows."
  ></moz-input-color>
  <moz-input-color label="Accent"></moz-input-color>
  <moz-input-color
    label="Highlight colour"
    value="#ff4f5e"
    error="Pick a colour with enough contrast."
  ></moz-input-color>
  <moz-input-color
    label="Highlight colour"
    value="#9059ff"
    disabled
  ></moz-input-color>
</div>`;

test('color states', () => snapshot('color-states', states));

test('color dark', () => snapshotDark('color-dark', states));

test('color high-contrast', () =>
  snapshotContrast('color-high-contrast', states));

// Width: the shared 320px default, full-width, and a custom inline-size.
const widths = html`<div
  style="display:flex;flex-direction:column;gap:16px;inline-size:600px;"
>
  <moz-input-color label="Default (320px)" value="#0060df"></moz-input-color>
  <moz-input-color label="Full width" value="#0060df" full-width></moz-input-color>
  <moz-input-color
    label="Custom (480px)"
    value="#0060df"
    style="inline-size:480px"
  ></moz-input-color>
</div>`;

test('color widths', () => snapshot('color-widths', widths));

// Both sizes, and both label placements: label inside the row, or the hex
// inside with the label above.
const modes = html`<div
  style="display:flex;flex-direction:column;gap:16px;inline-size:320px;"
>
  <moz-input-color label="Default (40px)" value="#0060df"></moz-input-color>
  <moz-input-color
    label="Small (32px)"
    value="#0060df"
    size="small"
  ></moz-input-color>
  <moz-input-color
    label="Value shown"
    value="#0060df"
    show-value
  ></moz-input-color>
  <moz-input-color
    label="Value shown, small"
    value="#2ac3a2"
    show-value
    size="small"
  ></moz-input-color>
  <moz-input-color
    label="Value shown, with help"
    value="#9059ff"
    show-value
    description="Used for links and selected rows."
  ></moz-input-color>
  <moz-input-color
    label="Value shown, disabled"
    value="#ff4f5e"
    show-value
    disabled
  ></moz-input-color>
</div>`;

test('color modes', () => snapshot('color-modes', modes));

test('color modes dark', () => snapshotDark('color-modes-dark', modes));
