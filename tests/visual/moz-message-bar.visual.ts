import { html } from 'lit';
import { test } from 'vitest';
import type { MessageBarType } from '../../src/components/moz-message-bar/moz-message-bar';
import '../../src/components/moz-message-bar/moz-message-bar';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

const messageTypes: MessageBarType[] = [
  'info',
  'warning',
  'success',
  'error',
  'critical',
];

const messageBars = html`<div
  style="display:flex;flex-direction:column;gap:12px;inline-size:600px;"
>
  ${messageTypes.map(
    (t) =>
      html`<moz-message-bar type=${t} heading=${t}
        >The quick brown fox jumps over the lazy dog.</moz-message-bar
      >`,
  )}
</div>`;

test('message-bar types', () => snapshot('message-bar-types', messageBars));

test('message-bar dark', () => snapshotDark('message-bar-dark', messageBars));

test('message-bar dismissable', () =>
  snapshot(
    'message-bar-dismissable',
    html`<div style="inline-size:520px;">
      <moz-message-bar type="info" heading="Heads up" dismissable
        >Your changes have been saved.</moz-message-bar
      >
    </div>`,
  ));

// High-contrast (app-driven): type colors drop to a plain border.
test('message-bar high-contrast', () =>
  snapshotContrast(
    'message-bar-high-contrast',
    html`<div style="display:flex;flex-direction:column;gap:12px;inline-size:600px;">
      ${messageTypes.map(
        (t) =>
          html`<moz-message-bar type=${t} heading=${t}
            >The quick brown fox.</moz-message-bar
          >`,
      )}
    </div>`,
  ));
