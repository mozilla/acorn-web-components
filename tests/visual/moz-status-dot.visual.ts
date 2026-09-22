import { html } from 'lit';
import { test } from 'vitest';
import type { StatusDotType } from '../../src/components/moz-status-dot/moz-status-dot';
import '../../src/components/moz-status-dot/moz-status-dot';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

const types: StatusDotType[] = [
  'information',
  'success',
  'warning',
  'critical',
];
const dots = html`<div style="display:flex;gap:12px;align-items:center;">
  ${types.map((t) => html`<moz-status-dot type=${t}></moz-status-dot>`)}
  ${types.map((t) => html`<moz-status-dot type=${t} icon></moz-status-dot>`)}
</div>`;

test('status-dot variants', () => snapshot('status-dot-variants', dots));

test('status-dot dark', () => snapshotDark('status-dot-dark', dots));

test('status-dot high-contrast', () =>
  snapshotContrast('status-dot-high-contrast', dots));
