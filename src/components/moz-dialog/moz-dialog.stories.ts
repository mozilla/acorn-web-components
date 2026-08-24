import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect, userEvent } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import '../moz-button/moz-button';
import '../moz-icon/moz-icon';
import './moz-dialog';
import type { DialogMode, MozDialog } from './moz-dialog';

interface Args {
  mode: DialogMode;
  heading?: string;
  dismissable: boolean;
  open: boolean;
}

const modes: DialogMode[] = ['modal', 'inline'];

// Open the sibling dialog — the trigger-button pattern (like shadcn's Dialog).
const openDialog = (e: Event) => {
  const root = (e.currentTarget as HTMLElement).parentElement;
  const dialog = root?.querySelector<MozDialog>('moz-dialog');
  if (dialog) dialog.open = true;
};

const meta: Meta<Args> = {
  title: 'Components/Dialog',
  component: 'moz-dialog',
  tags: ['autodocs'],
  decorators: [logEvents('moz-dialog:open', 'moz-dialog:close')],
  argTypes: {
    mode: { control: 'select', options: modes },
    heading: { control: 'text' },
    dismissable: { control: 'boolean' },
    open: { control: 'boolean' },
  },
  args: {
    mode: 'modal',
    heading: 'Delete file?',
    dismissable: true,
    open: false,
  },
  render: (args) => html`
    <moz-button @click=${openDialog}>Open dialog</moz-button>
    <moz-dialog
      id="dialog"
      mode=${args.mode}
      heading=${ifDefined(args.heading)}
      ?dismissable=${args.dismissable}
      ?open=${args.open}
    >
      This action can't be undone.
      <moz-button slot="actions" variant="ghost" data-close>Cancel</moz-button>
      <moz-button slot="actions" variant="destructive" data-close>Delete</moz-button>
    </moz-dialog>
  `,
};

export default meta;
type Story = StoryObj<Args>;

// Click "Open dialog" to show a modal over the dimmed, blurred page.
export const Modal: Story = { args: { mode: 'modal' } };

// An inline dialog rendered in normal document flow, no backdrop.
export const Inline: Story = {
  args: { mode: 'inline', heading: 'Inline notice' },
  render: (args) => html`
    <moz-button @click=${openDialog}>Open dialog</moz-button>
    <moz-dialog
      id="inline-dialog"
      mode=${args.mode}
      heading=${ifDefined(args.heading)}
      ?dismissable=${args.dismissable}
      ?open=${args.open}
    >
      This dialog sits in the page rather than overlaying it.
      <moz-button slot="actions" variant="primary" data-close>Got it</moz-button>
    </moz-dialog>
  `,
};

// A header icon (slotted) sits before the heading.
export const WithIcon: Story = {
  args: { mode: 'modal', heading: 'Delete file?' },
  render: (args) => html`
    <moz-button @click=${openDialog}>Open dialog</moz-button>
    <moz-dialog
      id="icon-dialog"
      mode=${args.mode}
      heading=${ifDefined(args.heading)}
      ?dismissable=${args.dismissable}
      ?open=${args.open}
    >
      <moz-icon slot="icon" name="delete" size="large"></moz-icon>
      This action can't be undone.
      <moz-button slot="actions" variant="ghost" data-close>Cancel</moz-button>
      <moz-button slot="actions" variant="destructive" data-close>Delete</moz-button>
    </moz-dialog>
  `,
};

// Interaction tests below open/close the dialog, so they render an empty canvas
// at rest — tagged test-only to keep them out of the sidebar and docs.
const testTags = ['!dev', '!autodocs'];

// Shared harness for the interaction tests; the trigger button gives focus a
// home so restoration on close can be asserted.
const harness = (args: Partial<Args> = {}) => html`
  <div>
    <button id="trigger">Open</button>
    <moz-dialog
      mode=${args.mode ?? 'modal'}
      heading=${args.heading ?? 'Dialog'}
      ?dismissable=${args.dismissable ?? true}
    >
      Body content.
      <moz-button slot="actions" variant="ghost" data-close>Cancel</moz-button>
      <moz-button slot="actions" variant="primary">OK</moz-button>
    </moz-dialog>
  </div>
`;

const settle = () => new Promise((r) => setTimeout(r, 25));

// Opening a modal fires open, moves focus in; the close button closes it,
// fires the cancelable close event, and restores focus to the trigger.
export const OpensAndClosesViaButton: Story = {
  tags: testTags,
  render: () => harness(),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<MozDialog>('moz-dialog')!;
    const trigger = canvasElement.querySelector<HTMLButtonElement>('#trigger')!;
    await el.updateComplete;
    let opened = 0;
    let closed = 0;
    el.addEventListener('moz-dialog:open', () => opened++);
    el.addEventListener('moz-dialog:close', () => closed++);

    trigger.focus();
    el.open = true;
    await el.updateComplete;
    const dialog = el.shadowRoot!.querySelector('dialog')!;
    expect(dialog.open).toBe(true);
    expect(opened).toBe(1);
    // Focus moved into the dialog.
    expect(el.shadowRoot!.activeElement).toBe(dialog);

    const closeButton = el
      .shadowRoot!.querySelector('moz-button.close')!
      .shadowRoot!.querySelector('button')!;
    await userEvent.click(closeButton);
    await settle();
    expect(closed).toBe(1);
    expect(el.open).toBe(false);
    expect(dialog.open).toBe(false);
    // Focus restored to the previously-focused element.
    expect(document.activeElement).toBe(trigger);
  },
};

// A [data-close] action button (Cancel) closes the dialog and fires close.
export const ClosesViaCancelButton: Story = {
  tags: testTags,
  render: () => harness(),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<MozDialog>('moz-dialog')!;
    await el.updateComplete;
    let closed = 0;
    el.addEventListener('moz-dialog:close', () => closed++);
    el.open = true;
    await el.updateComplete;

    const cancel = el.querySelector<HTMLElement>('[data-close]')!;
    await userEvent.click(cancel);
    await settle();
    expect(closed).toBe(1);
    expect(el.open).toBe(false);
  },
};

// Escape closes a dismissable modal and fires the close event. The browser maps
// Escape on a modal to the dialog's `cancel` event, which we dispatch here (a
// synthetic keypress does not trigger the UA's native mapping).
export const ClosesOnEscape: Story = {
  tags: testTags,
  render: () => harness(),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<MozDialog>('moz-dialog')!;
    await el.updateComplete;
    let closed = 0;
    el.addEventListener('moz-dialog:close', () => closed++);
    el.open = true;
    await el.updateComplete;

    const dialog = el.shadowRoot!.querySelector('dialog')!;
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    await settle();
    expect(closed).toBe(1);
    expect(el.open).toBe(false);
  },
};

// A backdrop click closes a dismissable modal.
export const ClosesOnBackdropClick: Story = {
  tags: testTags,
  render: () => harness(),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<MozDialog>('moz-dialog')!;
    await el.updateComplete;
    let closed = 0;
    el.addEventListener('moz-dialog:close', () => closed++);
    el.open = true;
    await el.updateComplete;

    // Clicking the dialog element itself simulates a backdrop click.
    const dialog = el.shadowRoot!.querySelector('dialog')!;
    dialog.click();
    await settle();
    expect(closed).toBe(1);
    expect(el.open).toBe(false);
  },
};

// Escape does nothing on a non-dismissable modal.
export const EscapeIgnoredWhenNotDismissable: Story = {
  tags: testTags,
  render: () => harness({ dismissable: false }),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<MozDialog>('moz-dialog')!;
    await el.updateComplete;
    let closed = 0;
    el.addEventListener('moz-dialog:close', () => closed++);
    el.open = true;
    await el.updateComplete;

    const dialog = el.shadowRoot!.querySelector('dialog')!;
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    await settle();
    expect(closed).toBe(0);
    expect(el.open).toBe(true);
  },
};

// A listener can prevent the close, keeping the dialog open.
export const PreventedCloseStaysOpen: Story = {
  tags: testTags,
  render: () => harness(),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<MozDialog>('moz-dialog')!;
    await el.updateComplete;
    el.addEventListener('moz-dialog:close', (e) => e.preventDefault());
    el.open = true;
    await el.updateComplete;

    const closeButton = el
      .shadowRoot!.querySelector('moz-button.close')!
      .shadowRoot!.querySelector('button')!;
    closeButton.click();
    await settle();
    expect(el.open).toBe(true);
    expect(el.shadowRoot!.querySelector('dialog')!.open).toBe(true);
  },
};

// Inline mode opens without the top layer (not a modal) and closes on demand.
export const InlineOpensAndCloses: Story = {
  tags: testTags,
  render: () => harness({ mode: 'inline' }),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<MozDialog>('moz-dialog')!;
    await el.updateComplete;
    let opened = 0;
    el.addEventListener('moz-dialog:open', () => opened++);
    el.open = true;
    await el.updateComplete;

    const dialog = el.shadowRoot!.querySelector('dialog')!;
    expect(dialog.open).toBe(true);
    expect(dialog.matches(':modal')).toBe(false);
    expect(opened).toBe(1);

    el.open = false;
    await el.updateComplete;
    await settle();
    expect(dialog.open).toBe(false);
  },
};
