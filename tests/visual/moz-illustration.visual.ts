import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-illustration/moz-illustration';
import type { IllustrationName } from '../../src/generated/illustrations';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// A representative slice, not all ~120 (an exhaustive baseline would be huge and
// churn on every upstream art tweak): a spread of pictograms and kit pieces.
const sample: IllustrationName[] = [
  'pic-globe',
  'pic-lock-closed',
  'pic-shield',
  'pic-heart',
  'pic-magnifying-glass',
  'pic-sparkles-ai',
  'pic-puzzle',
  'pic-envelope-closed',
  'kit-paw',
  'kit-house',
  'kit-hold-heart',
  'kit-butterflies',
];

const row = (names: IllustrationName[], width = 72) =>
  html`<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
    ${names.map(
      (n) =>
        html`<moz-illustration
          name=${n}
          style="width:${width}px;"
        ></moz-illustration>`,
    )}
  </div>`;

test('illustration sample', () => snapshot('illustration-sample', row(sample)));

test('illustration high-contrast', () =>
  snapshotContrast('illustration-high-contrast', row(sample)));

// The one behaviour unique to illustrations: a light/dark pair resolves to
// different artwork from the ambient provider theme. Snapshotting both proves
// the variant actually swaps, not just the surrounding token surface.
const themed = row(['kit-devices-sync', 'kit-devices-sync-error'], 160);

test('illustration themed light', () =>
  snapshot('illustration-themed-light', themed));

test('illustration themed dark', () =>
  snapshotDark('illustration-themed-dark', themed));
