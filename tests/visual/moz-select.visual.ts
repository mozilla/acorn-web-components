import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-select/moz-select';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

const licences = html`
  <moz-option value="mpl2" label="MPL 2.0"></moz-option>
  <moz-option value="apache2" label="Apache 2.0"></moz-option>
  <hr />
  <moz-option value="other" label="Something else"></moz-option>
`;

// Two columns so the matrix stays inside the 800px snapshot viewport — past
// that, the rows below never paint and the baseline bakes in the truncation.
const states = html`<div style="display:flex;gap:16px;align-items:flex-start;">
  <div style="display:flex;flex-direction:column;gap:16px;inline-size:320px;">
    <moz-select label="Licence" value="mpl2">${licences}</moz-select>
    <moz-select
      label="Licence"
      value="mpl2"
      description="How others may reuse your add-on."
      >${licences}</moz-select
    >
    <moz-select label="Licence" value="mpl2" icon-start="shield"
      >${licences}</moz-select
    >
    <moz-select label="Licence" value="mpl2" size="small"
      >${licences}</moz-select
    >
  </div>
  <div style="display:flex;flex-direction:column;gap:16px;inline-size:320px;">
    <moz-select
      label="Licence"
      value=""
      placeholder="Choose a licence…"
      required
      >${licences}</moz-select
    >
    <moz-select label="Licence" value="mpl2" required>${licences}</moz-select>
    <moz-select label="Licence" value="mpl2" error="Choose a licence."
      >${licences}</moz-select
    >
    <moz-select label="Licence" value="mpl2" disabled>${licences}</moz-select>
    <moz-select label="Licence" value="mpl2" variant="pill"
      >${licences}</moz-select
    >
    <moz-select label="Licence" value="mpl2" variant="pill" size="small"
      >${licences}</moz-select
    >
    <moz-select label="Licence" value="mpl2" variant="pill" disabled
      >${licences}</moz-select
    >
  </div>
</div>`;

test('select states', () => snapshot('select-states', states));

test('select dark', () => snapshotDark('select-dark', states));

test('select high-contrast', () =>
  snapshotContrast('select-high-contrast', states));

// Both variants at both sizes, with and without a leading icon.
const matrix = html`<div
  style="display:flex;flex-direction:column;gap:16px;align-items:flex-start;"
>
  <moz-select label="standard / default" value="mpl2">${licences}</moz-select>
  <moz-select label="standard / small" value="mpl2" size="small"
    >${licences}</moz-select
  >
  <moz-select label="pill / default" value="mpl2" variant="pill"
    >${licences}</moz-select
  >
  <moz-select label="pill / small" value="mpl2" variant="pill" size="small"
    >${licences}</moz-select
  >
  <moz-select label="pill / icon" value="mpl2" variant="pill" icon-start="shield"
    >${licences}</moz-select
  >
</div>`;

test('select variants', () => snapshot('select-variants', matrix));

// Width: the shared 320px default, full-width, and a custom inline-size. The
// pill hugs its content instead, unless asked to fill.
const widths = html`<div
  style="display:flex;flex-direction:column;gap:16px;inline-size:600px;"
>
  <moz-select label="Default (320px)" value="mpl2">${licences}</moz-select>
  <moz-select label="Full width" value="mpl2" full-width>${licences}</moz-select>
  <moz-select label="Custom (480px)" value="mpl2" style="inline-size:480px"
    >${licences}</moz-select
  >
  <moz-select label="Pill hugs content" value="mpl2" variant="pill"
    >${licences}</moz-select
  >
  <moz-select label="Pill full width" value="mpl2" variant="pill" full-width
    >${licences}</moz-select
  >
</div>`;

test('select widths', () => snapshot('select-widths', widths));
