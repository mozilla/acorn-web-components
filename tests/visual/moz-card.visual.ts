import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-button/moz-button';
import '../../src/components/moz-card/moz-card';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// Inline SVG data URI keeps the cover image deterministic (no network/fonts).
const cardMedia =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='96'%3E%3Crect width='280' height='96' fill='%230060df'/%3E%3C/svg%3E";

const cardSpacing = html`<div
  style="display:flex;gap:16px;align-items:flex-start;"
>
  <moz-card heading="Default" style="inline-size:240px;"
    >A card groups related content about a single subject.</moz-card
  >
  <moz-card heading="Compact" spacing="compact" style="inline-size:240px;"
    >Compact pulls the scale in for denser layouts.</moz-card
  >
</div>`;

test('card spacing', () => snapshot('card-spacing', cardSpacing));

test('card dark', () => snapshotDark('card-dark', cardSpacing));

test('card high-contrast', () =>
  snapshotContrast('card-high-contrast', cardSpacing));

test('card media and actions', () =>
  snapshot(
    'card-media-actions',
    html`<moz-card heading="Featured" style="inline-size:280px;">
      <img slot="media" src=${cardMedia} alt="" />
      Media, body, and a footer of actions together in one surface.
      <div slot="actions" style="display:flex;gap:8px;">
        <moz-button variant="primary">Save</moz-button>
        <moz-button variant="ghost">Cancel</moz-button>
      </div>
    </moz-card>`,
  ));

test('card icon', () =>
  snapshot(
    'card-icon',
    html`<moz-card
      heading="With icon"
      icon-start="information"
      style="inline-size:280px;"
    >
      A leading icon sits before the heading.
    </moz-card>`,
  ));

test('card accordion', () =>
  snapshot(
    'card-accordion',
    html`<div
      style="display:flex;flex-direction:column;gap:16px;inline-size:320px;"
    >
      <moz-card variant="accordion" heading="Collapsed"
        >Hidden until expanded.</moz-card
      >
      <moz-card variant="accordion" open heading="Expanded">
        Body revealed when expanded.
        <moz-button slot="actions" size="small">Action</moz-button>
      </moz-card>
    </div>`,
  ));
