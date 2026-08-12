import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import './moz-message-bar.js';
import '../moz-button/moz-button.js';
import type { MessageBarType } from './moz-message-bar.js';

interface Args {
  type: MessageBarType;
  heading?: string;
  dismissable: boolean;
  message: string;
}

const types: MessageBarType[] = [
  'info',
  'warning',
  'success',
  'error',
  'critical',
];

const meta: Meta<Args> = {
  title: 'Components/MessageBar',
  component: 'moz-message-bar',
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: types },
    heading: { control: 'text' },
    dismissable: { control: 'boolean' },
    message: { control: 'text' },
  },
  args: {
    type: 'info',
    dismissable: false,
    message: 'Your changes have been saved.',
  },
  render: (args) => html`
    <moz-message-bar
      type=${args.type}
      heading=${ifDefined(args.heading)}
      ?dismissable=${args.dismissable}
    >
      ${args.message}
    </moz-message-bar>
  `,
};

export default meta;
type Story = StoryObj<Args>;

export const Info: Story = {};
export const Warning: Story = {
  args: { type: 'warning', message: 'Your add-on is missing an icon.' },
};
export const Success: Story = { args: { type: 'success' } };
export const ErrorBar: Story = {
  name: 'Error',
  args: { type: 'error', message: 'Something went wrong. Please try again.' },
};

export const WithHeading: Story = {
  args: {
    heading: 'Update available',
    message: 'A new version is ready to install.',
  },
};

// Visible example (renders the close button). The dismiss *behaviour* is
// covered separately below, because a play that removes the bar would leave
// this story's canvas empty.
export const Dismissable: Story = {
  args: { dismissable: true },
};

// Interaction test only: clicking close fires the cancelable event and, when
// unprevented, removes the bar. Tagged test-only (`!dev`/`!autodocs`) so it
// still runs under Vitest/CI but doesn't show an empty canvas in the sidebar or
// docs.
export const DismissBehaviour: Story = {
  tags: ['!dev', '!autodocs'],
  args: { dismissable: true },
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector('moz-message-bar')!;
    await bar.updateComplete;
    let dismissed = false;
    bar.addEventListener('moz-message-bar:dismissed', () => {
      dismissed = true;
    });
    const close = bar.shadowRoot
      ?.querySelector('moz-button.close')
      ?.shadowRoot?.querySelector('button');
    close?.click();
    await new Promise((r) => setTimeout(r, 20));
    expect(dismissed).toBe(true);
    expect(bar.isConnected).toBe(false);
  },
};

export const WithActions: Story = {
  args: { dismissable: true },
  render: (args) => html`
    <moz-message-bar type=${args.type} ?dismissable=${args.dismissable}>
      ${args.message}
      <moz-button slot="actions" size="small">Undo</moz-button>
    </moz-message-bar>
  `,
};

export const Types: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:12px;max-width:640px;">
      ${types.map(
        (t) =>
          html`<moz-message-bar type=${t} heading=${t}
            >The quick brown fox jumps over the lazy dog.</moz-message-bar
          >`,
      )}
    </div>
  `,
};
