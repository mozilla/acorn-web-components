import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-button/moz-button';
import '../../src/components/moz-panel-list/moz-panel-list';
import '../../src/components/moz-panel-item/moz-panel-item';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// `stay-open` puts the list in normal flow, so the surface can be captured
// without an anchor to position it against.
const panelBasic = html`<moz-panel-list stay-open open label="Add-on actions">
  <moz-panel-item icon-start="edit">Edit listing</moz-panel-item>
  <moz-panel-item icon-start="copy">Duplicate</moz-panel-item>
  <hr />
  <moz-panel-item icon-start="delete">Remove</moz-panel-item>
</moz-panel-list>`;

test('panel-list', () => snapshot('panel-list', panelBasic));

test('panel-list dark', () => snapshotDark('panel-list-dark', panelBasic));

test('panel-list high-contrast', () =>
  snapshotContrast('panel-list-high-contrast', panelBasic));

// A titled header with a back button, separated from the rows.
const panelHeader = html`<moz-panel-list
  stay-open
  open
  heading="Listing details"
  back-label="Back"
>
  <moz-button
    slot="header-end"
    icon-only="About listings"
    icon-start="information"
    variant="ghost"
  ></moz-button>
  <moz-panel-item icon-start="edit">Edit listing</moz-panel-item>
  <moz-panel-item icon-start="copy">Duplicate</moz-panel-item>
</moz-panel-list>`;

test('panel-list header', () => snapshot('panel-list-header', panelHeader));

test('panel-list header dark', () =>
  snapshotDark('panel-list-header-dark', panelHeader));

// Headings among the rows caption the ones that follow them.
test('panel-list subheadings', () =>
  snapshot(
    'panel-list-subheadings',
    html`<moz-panel-list stay-open open label="Versions">
      <moz-panel-item icon-start="add">Upload new version</moz-panel-item>
      <hr />
      <h2>Awaiting review</h2>
      <moz-panel-item>1.4.2</moz-panel-item>
      <h2>Published</h2>
      <moz-panel-item>1.4.1</moz-panel-item>
      <moz-panel-item>1.4.0</moz-panel-item>
    </moz-panel-list>`,
  ));

// Capped height: a chevron marks the end the rows continue past.
test('panel-list overflow', () =>
  snapshot(
    'panel-list-overflow',
    html`<moz-panel-list
      stay-open
      open
      label="Versions"
      style="max-block-size:140px;"
    >
      <moz-panel-item>Version 1.4.11</moz-panel-item>
      <moz-panel-item>Version 1.4.10</moz-panel-item>
      <moz-panel-item>Version 1.4.9</moz-panel-item>
      <moz-panel-item>Version 1.4.8</moz-panel-item>
      <moz-panel-item>Version 1.4.7</moz-panel-item>
    </moz-panel-list>`,
  ));
