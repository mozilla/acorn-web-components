import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-visual-picker/moz-visual-picker';
import '../../src/components/moz-icon/moz-icon';
import '../../src/components/moz-status-badge/moz-status-badge';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

const themes = html`
  <moz-visual-picker-item value="light" label="Light">
    <moz-icon name="sun" size="xlarge"></moz-icon>
  </moz-visual-picker-item>
  <moz-visual-picker-item value="dark" label="Dark">
    <moz-icon name="moon" size="xlarge"></moz-icon>
  </moz-visual-picker-item>
  <moz-visual-picker-item value="system" label="System">
    <moz-icon name="device-mobile" size="xlarge"></moz-icon>
  </moz-visual-picker-item>
`;

// Two columns, two groups each, so the matrix stays inside the 800px snapshot
// viewport — past that the rows below never paint and the baseline bakes in the
// truncation.
const states = html`<div style="display:flex;gap:24px;align-items:flex-start;">
  <div style="display:flex;flex-direction:column;gap:24px;inline-size:380px;">
    <moz-visual-picker label="Theme" value="system">${themes}</moz-visual-picker>
    <moz-visual-picker
      label="Theme"
      value="light"
      description="Applies to every window."
      >${themes}</moz-visual-picker
    >
  </div>
  <div style="display:flex;flex-direction:column;gap:24px;inline-size:380px;">
    <moz-visual-picker label="Theme" value="" required
      >${themes}</moz-visual-picker
    >
    <moz-visual-picker label="Theme" value="" error="Pick a theme to continue."
      >${themes}</moz-visual-picker
    >
  </div>
</div>`;

const disabled = html`<div style="inline-size:380px;">
  <moz-visual-picker label="Theme" value="light" disabled
    >${themes}</moz-visual-picker
  >
</div>`;

test('visual-picker states', () => snapshot('visual-picker-states', states));

test('visual-picker dark', () => snapshotDark('visual-picker-dark', states));

test('visual-picker high-contrast', () =>
  snapshotContrast('visual-picker-high-contrast', states));

test('visual-picker disabled', () =>
  snapshot('visual-picker-disabled', disabled));

// Vertical: full-width cards with a label and description, as the design shows
// for text-heavy options.
const vertical = html`<div style="inline-size:420px;">
  <moz-visual-picker
    label="Add-on distribution"
    orientation="vertical"
    value="amo"
    description="Choose how this version will be distributed."
  >
    <moz-visual-picker-item
      value="amo"
      label="On AMO"
      description="Listed on addons.mozilla.org after review."
    ></moz-visual-picker-item>
    <moz-visual-picker-item
      value="self"
      label="On your own"
      description="Signed for self-distribution. You handle updates."
    ></moz-visual-picker-item>
  </moz-visual-picker>
</div>`;

test('visual-picker vertical', () =>
  snapshot('visual-picker-vertical', vertical));

test('visual-picker vertical dark', () =>
  snapshotDark('visual-picker-vertical-dark', vertical));

// Content-only cards, where the slotted icon is the whole option.
const contentOnly = html`<div style="inline-size:420px;">
  <moz-visual-picker label="Accent" value="violet">
    ${['violet', 'green', 'orange'].map(
      (name) => html`
        <moz-visual-picker-item value=${name} aria-label=${name}>
          <moz-icon name="shield" size="xlarge"></moz-icon>
        </moz-visual-picker-item>
      `,
    )}
  </moz-visual-picker>
</div>`;

test('visual-picker content only', () =>
  snapshot('visual-picker-content-only', contentOnly));

// The radio variant: indicator, left-aligned text, and a badge above the label.
const radio = html`<div style="inline-size:460px;">
  <moz-visual-picker
    label="Add-on distribution"
    description="Choose how this version will be distributed."
    orientation="vertical"
    variant="radio"
    value="amo"
  >
    <moz-visual-picker-item
      value="amo"
      label="On AMO (addons.mozilla.org)"
      description="Listed on addons.mozilla.org and in the Add-ons Manager after code review."
    >
      <moz-status-badge slot="badge" icon-start="globe">AMO</moz-status-badge>
    </moz-visual-picker-item>
    <moz-visual-picker-item
      value="self"
      label="On your own / Self"
      description="Immediately signed for self-distribution. You handle updates."
    >
      <moz-status-badge slot="badge" icon-start="home">Self</moz-status-badge>
    </moz-visual-picker-item>
  </moz-visual-picker>
</div>`;

test('visual-picker radio', () => snapshot('visual-picker-radio', radio));

test('visual-picker radio dark', () =>
  snapshotDark('visual-picker-radio-dark', radio));
