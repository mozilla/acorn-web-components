import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-textarea/moz-textarea';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

const lorem =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

// Two columns so the matrix stays inside the 800px snapshot viewport — past
// that, the rows below never paint and the baseline bakes in the truncation.
const areas = html`<div style="display:flex;gap:16px;align-items:flex-start;">
  <div style="display:flex;flex-direction:column;gap:16px;inline-size:320px;">
    <moz-textarea
      label="Description"
      placeholder="Tell us about your add-on…"
    ></moz-textarea>
    <moz-textarea label="Description" value=${lorem} rows="4"></moz-textarea>
    <moz-textarea
      label="Summary"
      value=${lorem}
      rows="4"
      description="Shown on your add-on’s listing page."
    ></moz-textarea>
    <moz-textarea
      label="Summary"
      value=${lorem}
      rows="3"
      maxlength="250"
    ></moz-textarea>
  </div>
  <div style="display:flex;flex-direction:column;gap:16px;inline-size:320px;">
    <moz-textarea label="Notes" value="Hello" show-counter></moz-textarea>
    <moz-textarea label="Description" required></moz-textarea>
    <moz-textarea
      label="Description"
      value="Too short"
      error="Please write at least 50 characters."
    ></moz-textarea>
    <moz-textarea
      label="Description"
      value=${lorem}
      rows="3"
      disabled
    ></moz-textarea>
    <moz-textarea
      label="Description"
      value=${lorem}
      rows="3"
      readonly
    ></moz-textarea>
  </div>
</div>`;

test('textarea states', () => snapshot('textarea-states', areas));

test('textarea dark', () => snapshotDark('textarea-dark', areas));

test('textarea high-contrast', () =>
  snapshotContrast('textarea-high-contrast', areas));

// Width: the shared 320px default, full-width, and a custom inline-size.
const widths = html`<div
  style="display:flex;flex-direction:column;gap:16px;inline-size:600px;"
>
  <moz-textarea label="Default (320px)"></moz-textarea>
  <moz-textarea label="Full width" full-width></moz-textarea>
  <moz-textarea label="Custom (480px)" style="inline-size:480px"></moz-textarea>
</div>`;

test('textarea widths', () => snapshot('textarea-widths', widths));
