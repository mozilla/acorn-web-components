import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-segmented-control/moz-segmented-control';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

const segmentedBasic = html`<moz-segmented-control label="Date range" value="week">
  <moz-segmented-control-item
    value="day"
    label="Day"
  ></moz-segmented-control-item>
  <moz-segmented-control-item
    value="week"
    label="Week"
  ></moz-segmented-control-item>
  <moz-segmented-control-item
    value="month"
    label="Month"
  ></moz-segmented-control-item>
</moz-segmented-control>`;

// Standard width: the group hugs its content.
test('segmented-control', () => snapshot('segmented-control', segmentedBasic));

test('segmented-control dark', () =>
  snapshotDark('segmented-control-dark', segmentedBasic));

test('segmented-control high-contrast', () =>
  snapshotContrast('segmented-control-high-contrast', segmentedBasic));

// Fill width: spans the container with equally-sized segments.
test('segmented-control fill', () =>
  snapshot(
    'segmented-control-fill',
    html`<div style="inline-size:420px;">
      <moz-segmented-control label="Date range" value="week" fill>
        <moz-segmented-control-item
          value="day"
          label="Day"
        ></moz-segmented-control-item>
        <moz-segmented-control-item
          value="week"
          label="Week"
        ></moz-segmented-control-item>
        <moz-segmented-control-item
          value="month"
          label="Month"
        ></moz-segmented-control-item>
      </moz-segmented-control>
    </div>`,
  ));

// Sizes: large (40px, default) and small (32px) total heights.
test('segmented-control sizes', () =>
  snapshot(
    'segmented-control-sizes',
    html`<div
      style="display:flex;flex-direction:column;gap:12px;align-items:flex-start;"
    >
      <moz-segmented-control label="Large" value="week">
        <moz-segmented-control-item
          value="day"
          label="Day"
        ></moz-segmented-control-item>
        <moz-segmented-control-item
          value="week"
          label="Week"
        ></moz-segmented-control-item>
      </moz-segmented-control>
      <moz-segmented-control label="Small" value="week" size="small">
        <moz-segmented-control-item
          value="day"
          label="Day"
        ></moz-segmented-control-item>
        <moz-segmented-control-item
          value="week"
          label="Week"
        ></moz-segmented-control-item>
      </moz-segmented-control>
    </div>`,
  ));

// Icon-only segments render as circles.
test('segmented-control icon-only', () =>
  snapshot(
    'segmented-control-icon-only',
    html`<moz-segmented-control label="Formatting" value="edit">
      <moz-segmented-control-item
        value="edit"
        icon-start="edit"
        label="Edit"
        icon-only
      ></moz-segmented-control-item>
      <moz-segmented-control-item
        value="copy"
        icon-start="copy"
        label="Copy"
        icon-only
      ></moz-segmented-control-item>
      <moz-segmented-control-item
        value="close"
        icon-start="close"
        label="Close"
        icon-only
      ></moz-segmented-control-item>
    </moz-segmented-control>`,
  ));

// Disabled: the whole control dims.
test('segmented-control disabled', () =>
  snapshot(
    'segmented-control-disabled',
    html`<moz-segmented-control label="Date range" value="week" disabled>
      <moz-segmented-control-item
        value="day"
        label="Day"
      ></moz-segmented-control-item>
      <moz-segmented-control-item
        value="week"
        label="Week"
      ></moz-segmented-control-item>
      <moz-segmented-control-item
        value="month"
        label="Month"
      ></moz-segmented-control-item>
    </moz-segmented-control>`,
  ));

// Deck: the control (tied via deck/id) drives the visible content panel.
test('segmented-control deck', () =>
  snapshot(
    'segmented-control-deck',
    html`<div>
      <moz-segmented-control label="View" value="activity" deck="vis-deck">
        <moz-segmented-control-item
          value="overview"
          label="Overview"
        ></moz-segmented-control-item>
        <moz-segmented-control-item
          value="activity"
          label="Activity"
        ></moz-segmented-control-item>
      </moz-segmented-control>
      <moz-segmented-control-deck id="vis-deck" style="margin-block-start:1rem;">
        <div name="overview">Overview panel content.</div>
        <div name="activity">Activity panel content.</div>
      </moz-segmented-control-deck>
    </div>`,
  ));
