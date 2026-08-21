import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import './moz-box-button';
import type { IconName } from '../../generated/icons';

interface Args {
  label: string;
  description?: string;
  iconStart?: IconName;
  layout?: 'default' | 'medium-icon' | 'large-icon';
  disabled: boolean;
}

const icons: IconName[] = ['settings', 'information', 'help', 'shield'];

const meta: Meta<Args> = {
  title: 'Components/Box/Button',
  component: 'moz-box-button',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    iconStart: { control: 'select', options: [undefined, ...icons] },
    layout: {
      control: 'inline-radio',
      options: ['default', 'medium-icon', 'large-icon'],
    },
    disabled: { control: 'boolean' },
  },
  args: { label: 'Privacy & Security', disabled: false },
  render: (args) => html`
    <moz-box-button
      label=${args.label}
      description=${ifDefined(args.description)}
      icon-start=${ifDefined(args.iconStart)}
      layout=${ifDefined(args.layout)}
      ?disabled=${args.disabled}
    ></moz-box-button>
  `,
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: {
    label: 'Notifications',
    description: 'Choose what you get alerted to.',
  },
};

export const WithIcon: Story = {
  args: {
    label: 'Extensions',
    description: 'Manage your installed add-ons.',
    iconStart: 'extension',
  },
};

export const Disabled: Story = {
  args: { label: 'Sync (signed out)', iconStart: 'settings', disabled: true },
};

// Enabled buttons fire a click; disabled ones don't.
export const Clickable: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('moz-box-button')!;
    await button.updateComplete;
    let clicks = 0;
    button.addEventListener('click', () => clicks++);
    button.shadowRoot!.querySelector('button')!.click();
    expect(clicks).toBe(1);
  },
};

export const DisabledBlocksClick: Story = {
  tags: ['!dev', '!autodocs'],
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('moz-box-button')!;
    await button.updateComplete;
    let clicks = 0;
    button.addEventListener('click', () => clicks++);
    // A disabled native button swallows the click.
    button.shadowRoot!.querySelector('button')!.click();
    expect(clicks).toBe(0);
  },
};
