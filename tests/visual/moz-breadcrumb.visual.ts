import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-breadcrumb/moz-breadcrumb';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

const breadcrumbTrail = html`
  <moz-breadcrumb href="#">Home</moz-breadcrumb>
  <moz-breadcrumb href="#">Extensions</moz-breadcrumb>
  <moz-breadcrumb>Details</moz-breadcrumb>
`;

const breadcrumbs = html`<moz-breadcrumb-group>${breadcrumbTrail}</moz-breadcrumb-group>`;

test('breadcrumb', () => snapshot('breadcrumb', breadcrumbs));

test('breadcrumb dark', () => snapshotDark('breadcrumb-dark', breadcrumbs));

// High contrast (app-driven): exercises the breadcrumb link a11y layer.
test('breadcrumb high-contrast', () =>
  snapshotContrast('breadcrumb-high-contrast', breadcrumbs));
