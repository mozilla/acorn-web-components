import { html } from 'lit';
import { test } from 'vitest';
import type { BadgeType } from '../../src/components/moz-badge/moz-badge';
import '../../src/components/moz-badge/moz-badge';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

const badgeTypes: BadgeType[] = ['default', 'beta', 'new'];

const badges = html`<div
  style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;"
>
  ${badgeTypes.map((t) => html`<moz-badge type=${t}>${t}</moz-badge>`)}
  <moz-badge type="new" icon-start="checkmark">verified</moz-badge>
</div>`;

test('badge types', () => snapshot('badge-types', badges));

test('badge dark', () => snapshotDark('badge-dark', badges));

test('badge high-contrast', () =>
  snapshotContrast('badge-high-contrast', badges));
