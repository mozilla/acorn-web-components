import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { ref } from 'lit/directives/ref.js';
import { expect } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-input-file';
import type { InputFileRejectedDetail, MozInputFile } from './moz-input-file';

interface Args {
  label: string;
  name?: string;
  accept?: string;
  maxSize?: number;
  description?: string;
  error?: string;
  placeholder?: string;
  browseLabel?: string;
  multiple: boolean;
  disabled: boolean;
  fullWidth: boolean;
}

const MB = 1024 * 1024;

const meta: Meta<Args> = {
  title: 'Components/Input File',
  component: 'moz-input-file',
  tags: ['autodocs'],
  decorators: [logEvents('change', 'moz-input-file:rejected')],
  argTypes: {
    label: { control: 'text' },
    name: { control: 'text' },
    accept: { control: 'text' },
    maxSize: { control: 'number' },
    description: { control: 'text' },
    error: { control: 'text' },
    placeholder: { control: 'text' },
    browseLabel: { control: 'text' },
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
  args: {
    label: 'Upload extension',
    name: 'package',
    accept: '.zip,.xpi',
    maxSize: 200 * MB,
    description: 'Great copy goes here',
    placeholder: 'Drag & drop your package, or',
    multiple: false,
    disabled: false,
    fullWidth: false,
  },
  render: (args) => html`
    <moz-input-file
      label=${args.label}
      name=${ifDefined(args.name)}
      accept=${ifDefined(args.accept)}
      max-size=${ifDefined(args.maxSize)}
      description=${ifDefined(args.description)}
      error=${ifDefined(args.error)}
      placeholder=${ifDefined(args.placeholder)}
      browse-label=${ifDefined(args.browseLabel)}
      ?multiple=${args.multiple}
      ?disabled=${args.disabled}
      ?full-width=${args.fullWidth}
    ></moz-input-file>
  `,
};

export default meta;
type Story = StoryObj<Args>;

const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const el = (root: HTMLElement) =>
  root.querySelector<MozInputFile>('moz-input-file')!;
const zone = (node: MozInputFile) =>
  node.shadowRoot!.querySelector('.zone') as HTMLElement;

const file = (name: string, size = 1024, type = '') =>
  new File([new Uint8Array(size)], name, { type });

/**
 * Drag events can't be driven by a real pointer here, so they're synthesised.
 * `DataTransfer` isn't constructible in every engine — where it isn't, the
 * drag stories skip rather than assert something weaker.
 */
const transferFor = (files: File[]): DataTransfer | null => {
  try {
    const transfer = new DataTransfer();
    for (const entry of files) transfer.items.add(entry);
    return transfer;
  } catch {
    return null;
  }
};

const drag = (node: HTMLElement, type: string, transfer: DataTransfer) =>
  node.dispatchEvent(
    new DragEvent(type, {
      bubbles: true,
      composed: true,
      dataTransfer: transfer,
    }),
  );

/**
 * Files can only reach an input through a DataTransfer, so the already-selected
 * stories attach them as the element renders. The ref fires before the shadow
 * root exists, hence the updateComplete.
 */
const attach = async (
  node: Element | undefined,
  names: [string, number][],
): Promise<void> => {
  if (!node) return;
  await (node as MozInputFile).updateComplete;
  const inner = node.shadowRoot?.querySelector('input');
  const transfer = transferFor(names.map(([name, size]) => file(name, size)));
  if (!inner || !transfer) return;
  inner.files = transfer.files;
  inner.dispatchEvent(new Event('change', { bubbles: true }));
};

export const Default: Story = {};

// The selected state: filename, size, and Remove at the trailing edge.
export const WithFile: Story = {
  render: (args) => html`
    <moz-input-file
      label=${args.label}
      description=${ifDefined(args.description)}
      accept=${ifDefined(args.accept)}
      max-size=${ifDefined(args.maxSize)}
      ${ref((node) => void attach(node, [['Tab organizer.zip', 376 * 1024]]))}
    ></moz-input-file>
  `,
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    await wait(50);
    expect(input.files).toHaveLength(1);
    expect(input.shadowRoot!.querySelector('.remove')).toBeTruthy();
  },
};

export const WithMultipleFiles: Story = {
  args: { multiple: true, label: 'Screenshots', accept: '.png,.jpg' },
  render: (args) => html`
    <moz-input-file
      label=${args.label}
      accept=${ifDefined(args.accept)}
      multiple
      ${ref(
        (node) =>
          void attach(node, [
            ['screenshot-one.png', 240 * 1024],
            ['screenshot-two.png', 1_500_000],
          ]),
      )}
    ></moz-input-file>
  `,
};

// Remove clears the selection and returns the zone to its empty state.
export const RemoveReturnsToEmpty: Story = {
  tags: ['!dev', '!autodocs'],
  render: WithFile.render,
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    await wait(50);
    expect(input.shadowRoot!.querySelector('.file')).toBeTruthy();

    (input.shadowRoot!.querySelector('.remove') as HTMLElement).click();
    await input.updateComplete;
    expect(input.files).toHaveLength(0);
    expect(input.shadowRoot!.querySelector('.prompt')).toBeTruthy();
  },
};

export const Multiple: Story = { args: { multiple: true } };
export const Disabled: Story = { args: { disabled: true } };
export const WithError: Story = {
  args: { error: 'That package could not be read.' },
};
export const FullWidth: Story = { args: { fullWidth: true } };

// No accept or max-size, so there's no hint line to derive.
export const WithoutConstraints: Story = {
  args: { accept: undefined, maxSize: undefined, description: undefined },
};

// The derived hint can be replaced wholesale.
export const CustomHint: Story = {
  render: (args) => html`
    <moz-input-file label=${args.label} accept=".zip,.xpi">
      <span slot="hint">Signed packages only</span>
    </moz-input-file>
  `,
};

// --- interaction tests ---

// The hint is derived from accept + max-size rather than authored twice.
export const DerivedHint: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    const hint = input.shadowRoot!.querySelector('.hint')!;
    expect(hint.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Max 200 MB · .zip or .xpi',
    );
  },
};

export const HintHiddenWithoutConstraints: Story = {
  tags: ['!dev', '!autodocs'],
  args: { accept: undefined, maxSize: undefined },
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    expect(
      input.shadowRoot!.querySelector('.hint')!.hasAttribute('hidden'),
    ).toBe(true);
  },
};

// Picking a file fills the zone and reports a composed change.
export const PickingAFile: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    let changes = 0;
    input.addEventListener('change', () => changes++);

    const inner = input.shadowRoot!.querySelector('input')!;
    const transfer = transferFor([file('tab-organizer.zip', 376 * 1024)]);
    if (!transfer) return;
    inner.files = transfer.files;
    inner.dispatchEvent(new Event('change', { bubbles: true }));
    await input.updateComplete;

    expect(changes).toBe(1);
    expect(input.files.map((f) => f.name)).toEqual(['tab-organizer.zip']);
    const row = input.shadowRoot!.querySelector('.file')!;
    expect(row.textContent).toContain('tab-organizer.zip');
    expect(row.textContent).toContain('376 KB');
    // The prompt is replaced, not stacked underneath.
    expect(input.shadowRoot!.querySelector('.prompt')).toBeNull();
  },
};

// The native input is cleared after each pick, so the same file can be chosen
// twice and still be reported.
export const RepickingTheSameFile: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    const inner = input.shadowRoot!.querySelector('input')!;
    const transfer = transferFor([file('a.zip')]);
    if (!transfer) return;

    inner.files = transfer.files;
    inner.dispatchEvent(new Event('change', { bubbles: true }));
    await input.updateComplete;
    expect(inner.value).toBe('');
    expect(input.files).toHaveLength(1);
  },
};

// Remove empties the selection and reports it, without reopening the dialog.
export const Removing: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    const inner = input.shadowRoot!.querySelector('input')!;
    const transfer = transferFor([file('a.zip')]);
    if (!transfer) return;
    inner.files = transfer.files;
    inner.dispatchEvent(new Event('change', { bubbles: true }));
    await input.updateComplete;

    let opened = 0;
    inner.click = () => {
      opened++;
    };
    let changes = 0;
    input.addEventListener('change', () => changes++);

    const remove = input.shadowRoot!.querySelector('.remove') as HTMLElement;
    remove.click();
    await input.updateComplete;

    expect(input.files).toHaveLength(0);
    expect(changes).toBe(1);
    // Remove sits inside the clickable zone; its click must not reopen the dialog.
    expect(opened).toBe(0);
  },
};

// A file outside `accept` is reported, not silently kept.
export const RejectsWrongType: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    const rejected: InputFileRejectedDetail[] = [];
    input.addEventListener('moz-input-file:rejected', (event) =>
      rejected.push((event as CustomEvent<InputFileRejectedDetail>).detail),
    );

    const inner = input.shadowRoot!.querySelector('input')!;
    const transfer = transferFor([file('notes.txt', 100, 'text/plain')]);
    if (!transfer) return;
    inner.files = transfer.files;
    inner.dispatchEvent(new Event('change', { bubbles: true }));
    await input.updateComplete;

    expect(input.files).toHaveLength(0);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBe('type');
    expect(rejected[0].accept).toBe('.zip,.xpi');
  },
};

// max-size is ours to enforce; the platform has no equivalent.
export const RejectsOversizeFile: Story = {
  tags: ['!dev', '!autodocs'],
  args: { maxSize: 1024 },
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    const rejected: InputFileRejectedDetail[] = [];
    input.addEventListener('moz-input-file:rejected', (event) =>
      rejected.push((event as CustomEvent<InputFileRejectedDetail>).detail),
    );

    const inner = input.shadowRoot!.querySelector('input')!;
    const transfer = transferFor([file('big.zip', 4096)]);
    if (!transfer) return;
    inner.files = transfer.files;
    inner.dispatchEvent(new Event('change', { bubbles: true }));
    await input.updateComplete;

    expect(input.files).toHaveLength(0);
    expect(rejected[0].reason).toBe('size');
    expect(rejected[0].maxSize).toBe(1024);
  },
};

// Dropping welcomes an acceptable payload and reflects it in the zone's state.
export const DroppingAFile: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    const transfer = transferFor([file('tab-organizer.zip', 2048)]);
    if (!transfer) return;
    const target = zone(input);

    drag(target, 'dragenter', transfer);
    drag(target, 'dragover', transfer);
    await input.updateComplete;
    expect(target.classList.contains('accepted')).toBe(true);

    drag(target, 'drop', transfer);
    await input.updateComplete;
    expect(zone(input).classList.contains('accepted')).toBe(false);
    expect(input.files.map((f) => f.name)).toEqual(['tab-organizer.zip']);
  },
};

// Leaving without dropping returns the zone to rest.
export const DragLeaveResets: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    const transfer = transferFor([file('a.zip')]);
    if (!transfer) return;
    const target = zone(input);

    drag(target, 'dragenter', transfer);
    await input.updateComplete;
    expect(target.classList.contains('accepted')).toBe(true);

    // dragenter sets a one-frame flag so a child-boundary dragleave is ignored;
    // wait it out so this reads as a genuine leave.
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    drag(target, 'dragleave', transfer);
    await input.updateComplete;
    expect(zone(input).classList.contains('idle')).toBe(true);
  },
};

// Crossing a child boundary fires dragleave in the same gesture as dragenter,
// which must not flicker the zone back to idle.
export const ChildBoundaryDoesNotFlicker: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    const transfer = transferFor([file('a.zip')]);
    if (!transfer) return;
    const target = zone(input);

    drag(target, 'dragenter', transfer);
    // Same gesture, no frame in between.
    drag(target, 'dragleave', transfer);
    await input.updateComplete;
    expect(target.classList.contains('accepted')).toBe(true);
  },
};

// A disabled zone ignores drops entirely.
export const DisabledIgnoresDrop: Story = {
  tags: ['!dev', '!autodocs'],
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    const transfer = transferFor([file('a.zip')]);
    if (!transfer) return;
    const target = zone(input);

    drag(target, 'dragover', transfer);
    drag(target, 'drop', transfer);
    await input.updateComplete;
    expect(input.files).toHaveLength(0);
    expect(target.classList.contains('idle')).toBe(true);
  },
};

// Nothing is submitted: File objects can't be a string value, so the control
// contributes no form entry under its name.
export const SubmitsNothing: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <form>
      <moz-input-file name="package" label="Package"></moz-input-file>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const input = el(canvasElement);
    await input.updateComplete;
    const inner = input.shadowRoot!.querySelector('input')!;
    const transfer = transferFor([file('a.zip')]);
    if (!transfer) return;
    inner.files = transfer.files;
    inner.dispatchEvent(new Event('change', { bubbles: true }));
    await wait();

    expect(input.files).toHaveLength(1);
    expect([...new FormData(form).keys()]).not.toContain('package');
  },
};

// The hidden input must not be the tab stop, or focus lands out of sight.
export const FocusGoesToTheTrigger: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    const inner = input.shadowRoot!.querySelector('input')!;
    const trigger = input.shadowRoot!.querySelector('.trigger')!;

    expect(inner.getAttribute('tabindex')).toBe('-1');
    input.focus();
    expect(input.shadowRoot!.activeElement).toBe(trigger);
  },
};

// Keyboard activation of the trigger reaches the file dialog via the zone.
export const TriggerOpensDialog: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    const inner = input.shadowRoot!.querySelector('input')!;
    let opened = 0;
    inner.click = () => {
      opened++;
    };

    (input.shadowRoot!.querySelector('.trigger') as HTMLElement).click();
    await wait();
    expect(opened).toBe(1);

    // A click already on the input isn't forwarded, or it would recurse.
    inner.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true }),
    );
    await wait();
    expect(opened).toBe(1);
  },
};

// `multiple` accumulates across picks rather than replacing.
export const MultipleAccumulates: Story = {
  tags: ['!dev', '!autodocs'],
  args: { multiple: true },
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    const inner = input.shadowRoot!.querySelector('input')!;

    for (const name of ['a.zip', 'b.zip']) {
      const transfer = transferFor([file(name)]);
      if (!transfer) return;
      inner.files = transfer.files;
      inner.dispatchEvent(new Event('change', { bubbles: true }));
      await input.updateComplete;
    }

    expect(input.files.map((f) => f.name)).toEqual(['a.zip', 'b.zip']);
    expect(input.shadowRoot!.querySelectorAll('.file')).toHaveLength(2);
  },
};

// Without `multiple`, a second pick replaces the first.
export const SingleReplaces: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    const inner = input.shadowRoot!.querySelector('input')!;

    for (const name of ['a.zip', 'b.zip']) {
      const transfer = transferFor([file(name)]);
      if (!transfer) return;
      inner.files = transfer.files;
      inner.dispatchEvent(new Event('change', { bubbles: true }));
      await input.updateComplete;
    }

    expect(input.files.map((f) => f.name)).toEqual(['b.zip']);
  },
};

// The dash pattern is the design's (2px, 8 on / 4 off). It's an SVG stroke
// because border-style: dashed gives no control over dash length.
export const OutlineMatchesSpec: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    const rect = input.shadowRoot!.querySelector('.outline rect')!;
    const style = getComputedStyle(rect);

    expect(Number.parseFloat(style.strokeWidth)).toBeCloseTo(2, 1);
    expect(style.strokeDasharray.replace(/px/g, '')).toBe('8, 4');

    // The corner radius tracks the field token rather than being a magic
    // number in the markup.
    const radius = Number.parseFloat(
      getComputedStyle(zone(input)).borderStartStartRadius,
    );
    expect(rect.getBoundingClientRect().width).toBeGreaterThan(0);
    expect(radius).toBeCloseTo(12, 0);

    // Armed state drops the dash without changing the stroke.
    const transfer = transferFor([file('a.zip')]);
    if (!transfer) return;
    drag(zone(input), 'dragover', transfer);
    await input.updateComplete;
    const armed = getComputedStyle(
      input.shadowRoot!.querySelector('.outline rect')!,
    );
    expect(armed.strokeDasharray).toBe('none');
    expect(Number.parseFloat(armed.strokeWidth)).toBeCloseTo(2, 1);
  },
};
