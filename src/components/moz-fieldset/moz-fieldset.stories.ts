import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import './moz-fieldset';
import '../moz-input-text/moz-input-text';
import '../moz-provider/moz-provider';

interface FieldsetArgs {
  label: string;
  description?: string;
  error?: string;
  disabled: boolean;
  fullWidth: boolean;
}

const meta: Meta<FieldsetArgs> = {
  title: 'Components/Fieldset',
  component: 'moz-fieldset',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
  args: {
    label: 'Contact details',
    description: 'How reviewers can reach you about this add-on.',
    disabled: false,
    fullWidth: false,
  },
  render: (args) => html`
    <moz-fieldset
      label=${args.label}
      description=${ifDefined(args.description)}
      error=${ifDefined(args.error)}
      ?disabled=${args.disabled}
      ?full-width=${args.fullWidth}
    >
      <moz-input-text label="Name" name="name"></moz-input-text>
      <moz-input-text label="Email" name="email" type="email"></moz-input-text>
    </moz-fieldset>
  `,
};

export default meta;
type Story = StoryObj<FieldsetArgs>;

export const Default: Story = {};
export const WithError: Story = {
  args: { error: 'Enter at least one way to reach you.' },
};

// Full width fills the container; its controls fill the fieldset in turn.
export const FullWidth: Story = { args: { fullWidth: true } };

// Disabling the fieldset flows through to each slotted control.
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, 20));
    const inputs = canvasElement.querySelectorAll('moz-input-text');
    for (const input of inputs) {
      const inner = input.shadowRoot!.querySelector('input')!;
      expect(inner.disabled).toBe(true);
    }
  },
};
