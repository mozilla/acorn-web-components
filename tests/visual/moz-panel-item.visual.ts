import { html, type TemplateResult } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-button/moz-button';
import '../../src/components/moz-panel-item/moz-panel-item';
import '../../src/components/moz-panel-list/moz-panel-list';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// A row draws on the panel surface, and the list is what reserves the gutter
// across rows, so every matrix renders inside a `stay-open` list.
const surface = (rows: TemplateResult) =>
  html`<moz-panel-list stay-open open label="Add-on actions"
    >${rows}</moz-panel-list
  >`;

const itemStates = html`
  <moz-panel-item icon-start="edit">Edit listing</moz-panel-item>
  <moz-panel-item icon-start="copy" disabled>Duplicate</moz-panel-item>
  <moz-panel-item icon-start="copy" submenu>Copy to</moz-panel-item>
  <moz-panel-item icon-start="book" href="https://example.com/"
    >Documentation</moz-panel-item
  >
`;

test('panel-item', () => snapshot('panel-item', surface(itemStates)));

test('panel-item dark', () =>
  snapshotDark('panel-item-dark', surface(itemStates)));

test('panel-item high-contrast', () =>
  snapshotContrast('panel-item-high-contrast', surface(itemStates)));

// `default` pairs a 16px icon with a 32px row; `large` steps the icon to 24px
// and the row to 40px.
test('panel-item sizes', () =>
  snapshot(
    'panel-item-sizes',
    surface(html`
      <moz-panel-item icon-start="bookmark">Default</moz-panel-item>
      <moz-panel-item icon-start="bookmark" size="large">Large</moz-panel-item>
    `),
  ));

// Rows without an icon still line up: the list reserves the gutter for all of
// them once one needs it.
test('panel-item mixed icons', () =>
  snapshot(
    'panel-item-mixed-icons',
    surface(html`
      <moz-panel-item icon-start="bookmark">Bookmarked</moz-panel-item>
      <moz-panel-item>Everything</moz-panel-item>
      <moz-panel-item>Recently added</moz-panel-item>
    `),
  ));

// Secondary line under the label, and trailing hint text.
test('panel-item descriptions and hints', () =>
  snapshot(
    'panel-item-descriptions-hints',
    surface(html`
      <moz-panel-item icon-start="delete" description="Deletes every version"
        >Remove</moz-panel-item
      >
      <moz-panel-item icon-start="copy" hint="⌘D">Duplicate</moz-panel-item>
      <moz-panel-item icon-start="edit" hint="⌘E">Edit listing</moz-panel-item>
    `),
  ));

// A checkbox row draws a real checkbox in the gutter.
test('panel-item checkboxes', () =>
  snapshot(
    'panel-item-checkboxes',
    surface(html`
      <moz-panel-item type="checkbox" checked>Version</moz-panel-item>
      <moz-panel-item type="checkbox" checked>Status</moz-panel-item>
      <moz-panel-item type="checkbox">Reviewer</moz-panel-item>
    `),
  ));

test('panel-item checkboxes dark', () =>
  snapshotDark(
    'panel-item-checkboxes-dark',
    surface(html`
      <moz-panel-item type="checkbox" checked>Version</moz-panel-item>
      <moz-panel-item type="checkbox">Reviewer</moz-panel-item>
    `),
  ));

// The accent dot (`badged`) and a trailing `<moz-badge>`.
test('panel-item badges', () =>
  snapshot(
    'panel-item-badges',
    surface(html`
      <moz-panel-item icon-start="settings" badged>Settings</moz-panel-item>
      <moz-panel-item icon-start="activity" badge="New" badge-type="new"
        >Insights</moz-panel-item
      >
      <moz-panel-item icon-start="ask" badge="Beta" badge-type="beta"
        >Ask AI</moz-panel-item
      >
    `),
  ));

// `icon-end` rides along with the row; naming it makes it a control of its own,
// drawn beside the row.
test('panel-item icon-end', () =>
  snapshot(
    'panel-item-icon-end',
    surface(html`
      <moz-panel-item icon-start="book" icon-end="external-link"
        >Documentation</moz-panel-item
      >
      <moz-panel-item
        icon-start="bookmark"
        icon-end="delete"
        icon-end-label="Remove Saved for later"
        >Saved for later</moz-panel-item
      >
    `),
  ));

// A row that only holds controls, in the `type="slot"` panel it belongs to.
test('panel-row', () =>
  snapshot(
    'panel-row',
    html`<moz-panel-list stay-open open type="slot" label="Page">
      <moz-panel-item icon-start="edit">Edit listing</moz-panel-item>
      <hr />
      <moz-panel-row>
        Zoom
        <div slot="actions">
          <moz-button
            icon-only="Zoom out"
            icon-start="subtract"
            variant="ghost"
            size="small"
          ></moz-button>
          <span>100%</span>
          <moz-button
            icon-only="Zoom in"
            icon-start="add"
            variant="ghost"
            size="small"
          ></moz-button>
          <moz-button
            icon-only="Full screen"
            icon-start="fullscreen-expand"
            variant="ghost"
            size="small"
          ></moz-button>
        </div>
      </moz-panel-row>
    </moz-panel-list>`,
  ));
