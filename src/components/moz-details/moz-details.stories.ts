import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect, userEvent } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-details';

interface Args {
  heading?: string;
  open: boolean;
  disabled: boolean;
  content: string;
}

const meta: Meta<Args> = {
  title: 'Components/Details',
  component: 'moz-details',
  tags: ['autodocs'],
  decorators: [logEvents('moz-details:toggle')],
  argTypes: {
    heading: { control: 'text' },
    open: { control: 'boolean' },
    disabled: { control: 'boolean' },
    content: { control: 'text' },
  },
  args: {
    heading: 'What is a disclosure?',
    open: false,
    disabled: false,
    content: 'A disclosure hides secondary content behind a summary label.',
  },
  render: (args) => html`
    <moz-details
      id="demo-details"
      heading=${ifDefined(args.heading)}
      ?open=${args.open}
      ?disabled=${args.disabled}
    >
      ${args.content}
    </moz-details>
  `,
};

export default meta;
type Story = StoryObj<Args>;

// Visual stories (no play).
export const Default: Story = {};
export const Open: Story = { args: { open: true } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledOpen: Story = { args: { disabled: true, open: true } };

// Rich label via the `heading` slot (overrides the attribute).
export const HeadingSlot: Story = {
  render: (args) => html`
    <moz-details ?open=${args.open}>
      <span slot="heading"><strong>Advanced</strong> settings</span>
      ${args.content}
    </moz-details>
  `,
};

// A stack of disclosures reads as an accordion.
export const Accordion: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:8px;max-width:480px;">
      <moz-details heading="First">First panel content.</moz-details>
      <moz-details heading="Second" open>Second panel content.</moz-details>
      <moz-details heading="Third">Third panel content.</moz-details>
    </div>
  `,
};

const getSummary = (canvasElement: HTMLElement) => {
  const details = canvasElement.querySelector('moz-details')!;
  const root = details.shadowRoot as ShadowRoot;
  const summary = root.querySelector<HTMLElement>('summary')!;
  return { details, summary };
};

// Clicking the summary opens the disclosure and fires the toggle event.
export const OpensOnClick: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const { details, summary } = getSummary(canvasElement);
    await details.updateComplete;
    let toggled: boolean | undefined;
    details.addEventListener('moz-details:toggle', (e) => {
      toggled = (e as CustomEvent<{ open: boolean }>).detail.open;
    });
    await userEvent.click(summary);
    await details.updateComplete;
    expect(details.open).toBe(true);
    expect(details.hasAttribute('open')).toBe(true);
    expect(toggled).toBe(true);
  },
};

// Clicking an open disclosure closes it.
export const ClosesOnClick: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true },
  play: async ({ canvasElement }) => {
    const { details, summary } = getSummary(canvasElement);
    await details.updateComplete;
    let toggled: boolean | undefined;
    details.addEventListener('moz-details:toggle', (e) => {
      toggled = (e as CustomEvent<{ open: boolean }>).detail.open;
    });
    await userEvent.click(summary);
    await details.updateComplete;
    expect(details.open).toBe(false);
    expect(details.hasAttribute('open')).toBe(false);
    expect(toggled).toBe(false);
  },
};

// Enter on the focused summary toggles it (native keyboard semantics).
export const KeyboardToggle: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const { details, summary } = getSummary(canvasElement);
    await details.updateComplete;
    summary.focus();
    await userEvent.keyboard('{Enter}');
    await details.updateComplete;
    expect(details.open).toBe(true);
  },
};

// Disabled disclosures ignore clicks and fire no event.
export const DisabledDoesNotToggle: Story = {
  tags: ['!dev', '!autodocs'],
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const { details, summary } = getSummary(canvasElement);
    await details.updateComplete;
    let fired = false;
    details.addEventListener('moz-details:toggle', () => {
      fired = true;
    });
    // pointer-events:none blocks the click; dispatch directly to prove the
    // handler also guards.
    summary.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await details.updateComplete;
    expect(details.open).toBe(false);
    expect(fired).toBe(false);
    expect(summary.getAttribute('aria-disabled')).toBe('true');
    expect(summary.tabIndex).toBe(-1);
  },
};

// Setting `open` programmatically reflects without firing the event.
export const ProgrammaticOpen: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const details = canvasElement.querySelector('moz-details')!;
    await details.updateComplete;
    let fired = false;
    details.addEventListener('moz-details:toggle', () => {
      fired = true;
    });
    details.open = true;
    await details.updateComplete;
    const native = (details.shadowRoot as ShadowRoot).querySelector('details')!;
    expect(native.open).toBe(true);
    expect(fired).toBe(false);
  },
};
