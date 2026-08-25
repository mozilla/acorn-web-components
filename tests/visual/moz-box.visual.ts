import { html, type TemplateResult } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-box-button/moz-box-button';
import '../../src/components/moz-box-group/moz-box-group';
import '../../src/components/moz-box-item/moz-box-item';
import '../../src/components/moz-box-link/moz-box-link';
import '../../src/components/moz-button/moz-button';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// Box family: a group composes the outer border + dividers; rows carry the
// label/description/icon layout, states, and trailing nav icons.
const boxSettings = html`
  <moz-box-group label="Settings">
    <moz-box-button label="General" icon-start="settings"></moz-box-button>
    <moz-box-button
      label="Privacy & Security"
      description="Cookies, permissions, and data"
      icon-start="shield"
    ></moz-box-button>
    <moz-box-button label="Extensions" icon-start="extension"></moz-box-button>
    <moz-box-button label="Sync (signed out)" disabled></moz-box-button>
  </moz-box-group>
`;

const boxWidth = (content: TemplateResult) =>
  html`<div style="inline-size:420px">${content}</div>`;

test('box-group buttons', () =>
  snapshot('box-group-buttons', boxWidth(boxSettings)));

test('box-group buttons dark', () =>
  snapshotDark('box-group-buttons-dark', boxWidth(boxSettings)));

test('box-group buttons high-contrast', () =>
  snapshotContrast('box-group-buttons-high-contrast', boxWidth(boxSettings)));

test('box-group mixed', () =>
  snapshot(
    'box-group-mixed',
    boxWidth(html`
      <moz-box-group label="Account">
        <moz-box-item
          label="Firefox Account"
          description="user@example.com"
          icon-start="information"
        ></moz-box-item>
        <moz-box-link
          label="Learn more"
          href="https://www.mozilla.org"
        ></moz-box-link>
        <moz-box-button
          label="Manage account"
          icon-start="settings"
        ></moz-box-button>
      </moz-box-group>
    `),
  ));

test('box standalone rows', () =>
  snapshot(
    'box-standalone',
    html`<div
      style="display:flex;flex-direction:column;gap:1rem;inline-size:420px"
    >
      <moz-box-item
        label="Item"
        description="A standalone item"
        icon-start="information"
      >
        <moz-button slot="actions-end" variant="ghost" icon-start="edit"
          >Edit</moz-button
        >
      </moz-box-item>
      <moz-box-button
        label="Button"
        description="A standalone button"
        icon-start="settings"
      ></moz-box-button>
      <moz-box-link
        label="Link"
        href="https://www.mozilla.org"
      ></moz-box-link>
    </div>`,
  ));

test('box item layouts', () =>
  snapshot(
    'box-item-layouts',
    html`<div
      style="display:flex;flex-direction:column;gap:1rem;inline-size:420px"
    >
      <moz-box-item
        label="Default"
        description="16px icon"
        icon-start="shield"
      ></moz-box-item>
      <moz-box-item
        label="Medium icon"
        description="24px icon"
        icon-start="shield"
        layout="medium-icon"
      ></moz-box-item>
      <moz-box-item
        label="Large icon"
        description="32px icon"
        icon-start="shield"
        layout="large-icon"
      ></moz-box-item>
    </div>`,
  ));
