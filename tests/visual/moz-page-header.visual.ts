import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-breadcrumb/moz-breadcrumb';
import '../../src/components/moz-button/moz-button';
import '../../src/components/moz-page-header/moz-page-header';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// Page header: basic, the full config (back button + badge + icon + actions),
// and one with breadcrumbs above the heading.
const pageHeaders = html`<div
  style="display:flex;flex-direction:column;gap:24px;inline-size:640px;"
>
  <moz-page-header
    heading="Extensions"
    description="Manage the add-ons installed in your browser."
  ></moz-page-header>
  <moz-page-header
    heading="Extension details"
    description="This feature is still in testing."
    back-button
    badge="beta"
    icon-start="plugin"
  >
    <moz-button slot="actions" variant="primary">Add extension</moz-button>
  </moz-page-header>
  <moz-page-header heading="Privacy">
    <moz-breadcrumb-group slot="breadcrumbs" label="Breadcrumb">
      <moz-breadcrumb href="#home">Home</moz-breadcrumb>
      <moz-breadcrumb>Privacy</moz-breadcrumb>
    </moz-breadcrumb-group>
    <span slot="description">Control what data is shared.</span>
  </moz-page-header>
</div>`;

test('page-header', () => snapshot('page-header', pageHeaders));

test('page-header dark', () => snapshotDark('page-header-dark', pageHeaders));

test('page-header high-contrast', () =>
  snapshotContrast('page-header-high-contrast', pageHeaders));
