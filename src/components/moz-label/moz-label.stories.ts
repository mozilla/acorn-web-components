import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import './moz-label';
import '../moz-provider/moz-provider';
import { type IconName, iconNames } from '../../generated/icons';

interface LabelArgs {
  label: string;
  required: boolean;
  disabled: boolean;
  description?: string;
  labelIcon?: IconName;
}

const meta: Meta<LabelArgs> = {
  title: 'Components/Label',
  component: 'moz-label',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    description: { control: 'text' },
    labelIcon: { control: 'select', options: [undefined, ...iconNames] },
  },
  args: { label: 'Accept terms', required: false, disabled: false },
  render: (args) => html`
    <moz-label
      label=${args.label}
      label-icon=${ifDefined(args.labelIcon)}
      description=${ifDefined(args.description)}
      ?required=${args.required}
      ?disabled=${args.disabled}
    >
      <input type="checkbox" ?disabled=${args.disabled} />
    </moz-label>
  `,
};

export default meta;
type Story = StoryObj<LabelArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const label = canvasElement.querySelector('moz-label')!;
    const checkbox = canvasElement.querySelector('input')!;
    expect(checkbox.checked).toBe(false);
    // Clicking the label text activates the slotted control.
    (label.shadowRoot!.querySelector('.label-text') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 20));
    expect(checkbox.checked).toBe(true);
  },
};

export const Required: Story = {
  args: { label: 'Email address', required: true },
};
export const WithIcon: Story = {
  args: { label: 'Private key', labelIcon: 'shield' },
};
export const WithDescription: Story = {
  args: {
    label: 'Share usage data',
    description: 'Helps us prioritize what to build next.',
  },
};

// Disabled dims the label to 0.7 and no longer forwards clicks to the control.
export const Disabled: Story = {
  args: { label: 'Accept terms', disabled: true },
  play: async ({ canvasElement }) => {
    const label = canvasElement.querySelector('moz-label')!;
    const checkbox = canvasElement.querySelector('input')!;
    (label.shadowRoot!.querySelector('.label-text') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 20));
    // Click on the label text is ignored while disabled.
    expect(checkbox.checked).toBe(false);
  },
};
