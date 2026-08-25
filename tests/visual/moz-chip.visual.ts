import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-chip/moz-chip';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// Chip: default (32px) + small (22px) rows, each covering plain / icon /
// selected / disabled. The dismiss button is always present.
const chipRow = html`<div
  style="display:flex;flex-direction:column;gap:12px;align-items:start;"
>
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
    <moz-chip>Plain</moz-chip>
    <moz-chip icon-start="folder">With icon</moz-chip>
    <moz-chip selected icon-start="checkmark">Selected</moz-chip>
    <moz-chip disabled>Disabled</moz-chip>
  </div>
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
    <moz-chip size="small">Plain</moz-chip>
    <moz-chip size="small" icon-start="folder">With icon</moz-chip>
    <moz-chip size="small" selected icon-start="checkmark">Selected</moz-chip>
    <moz-chip size="small" disabled>Disabled</moz-chip>
  </div>
</div>`;

test('chip', () => snapshot('chip', chipRow));

test('chip dark', () => snapshotDark('chip-dark', chipRow));

test('chip high-contrast', () =>
  snapshotContrast('chip-high-contrast', chipRow));
