import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-button/moz-button';
import '../../src/components/moz-dialog/moz-dialog';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// Inline mode (renders in flow) so the panel is captured in the element
// screenshot; a modal would draw in the top layer, outside the host box. Same
// header / body / actions chrome either way.
const dialog = html`<moz-dialog
  variant="inline"
  open
  dismissable
  heading="Delete file?"
  icon-start="delete"
>
  This action can't be undone.
  <moz-button slot="actions" variant="ghost" data-dismiss>Cancel</moz-button>
  <moz-button slot="actions" variant="destructive" data-dismiss>Delete</moz-button>
</moz-dialog>`;

test('dialog', () => snapshot('dialog', dialog));

test('dialog dark', () => snapshotDark('dialog-dark', dialog));

test('dialog high-contrast', () =>
  snapshotContrast('dialog-high-contrast', dialog));
