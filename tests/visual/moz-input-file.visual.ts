import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { test } from 'vitest';
import '../../src/components/moz-input-file/moz-input-file';
import type { MozInputFile } from '../../src/components/moz-input-file/moz-input-file';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

const MB = 1024 * 1024;

// Empty, constrained, unconstrained, custom hint, error, and disabled. The
// filled and drag states need files and a pointer, so the stories cover those.
const states = html`<div
  style="display:flex;flex-direction:column;gap:16px;inline-size:420px;"
>
  <moz-input-file
    label="Upload extension"
    description="Great copy goes here"
    accept=".zip,.xpi"
    max-size=${200 * MB}
    placeholder="Drag & drop your package, or"
  ></moz-input-file>
  <moz-input-file label="Attachment"></moz-input-file>
  <moz-input-file label="Upload extension" accept=".zip,.xpi" disabled>
  </moz-input-file>
</div>`;

test('file states', () => snapshot('file-states', states));

test('file dark', () => snapshotDark('file-dark', states));

test('file high-contrast', () =>
  snapshotContrast('file-high-contrast', states));

const errored = html`<div style="inline-size:420px;">
  <moz-input-file
    label="Upload extension"
    accept=".zip,.xpi"
    max-size=${200 * MB}
    error="That package could not be read."
  ></moz-input-file>
</div>`;

test('file error', () => snapshot('file-error', errored));

// The filled state Figma specifies: filename, humanised size, and Remove.
// Files can only come from a DataTransfer, so they're attached as the element
// renders — the ref fires before the shadow root exists, hence updateComplete.
const attach = async (
  node: Element | undefined,
  names: [string, number][],
): Promise<void> => {
  if (!node) return;
  // The ref fires as the element is inserted, before it has a shadow root.
  await (node as MozInputFile).updateComplete;
  const inner = node.shadowRoot?.querySelector('input');
  if (!inner) return;
  const transfer = new DataTransfer();
  for (const [name, size] of names) {
    transfer.items.add(new File([new Uint8Array(size)], name));
  }
  inner.files = transfer.files;
  inner.dispatchEvent(new Event('change', { bubbles: true }));
};

const filled = html`<div
  style="display:flex;flex-direction:column;gap:16px;inline-size:420px;"
>
  <moz-input-file
    label="Upload extension"
    description="Great copy goes here"
    accept=".zip,.xpi"
    ${ref((node) => void attach(node, [['Tab organizer.zip', 376 * 1024]]))}
  ></moz-input-file>
  <moz-input-file
    label="Screenshots"
    multiple
    ${ref(
      (node) =>
        void attach(node, [
          ['screenshot-one.png', 240 * 1024],
          ['a-rather-long-screenshot-name.png', 1_500_000],
        ]),
    )}
  ></moz-input-file>
</div>`;

test('file filled', () => snapshot('file-filled', filled));

test('file filled dark', () => snapshotDark('file-filled-dark', filled));
