import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import '../moz-button/moz-button';
import './moz-box-item';
import type { IconName } from '../../generated/icons';

interface Args {
  label?: string;
  description?: string;
  iconStart?: IconName;
  layout?: 'default' | 'medium-icon' | 'large-icon';
}

const icons: IconName[] = ['settings', 'information', 'help', 'shield'];

const meta: Meta<Args> = {
  title: 'Components/Box/Item',
  component: 'moz-box-item',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    iconStart: { control: 'select', options: [undefined, ...icons] },
    layout: {
      control: 'inline-radio',
      options: ['default', 'medium-icon', 'large-icon'],
    },
  },
  args: {
    label: 'Firefox Account',
    description: 'Signed in as user@example.com',
  },
  render: (args) => html`
    <moz-box-item
      label=${ifDefined(args.label)}
      description=${ifDefined(args.description)}
      icon-start=${ifDefined(args.iconStart)}
      layout=${ifDefined(args.layout)}
    ></moz-box-item>
  `,
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithIcon: Story = {
  args: {
    label: 'Location',
    description: 'Allowed for 2 sites',
    iconStart: 'information',
  },
};

export const LargeIcon: Story = {
  args: {
    label: 'Firefox Account',
    description: 'Signed in as user@example.com',
    iconStart: 'shield',
    layout: 'large-icon',
  },
};

// Trailing action(s) via the `actions-end` slot; `actions-start` mirrors it.
export const WithActions: Story = {
  render: (args) => html`
    <moz-box-item
      label=${ifDefined(args.label)}
      description=${ifDefined(args.description)}
      icon-start=${ifDefined(args.iconStart)}
    >
      <moz-button slot="actions-end" variant="ghost" icon-start="edit"
        >Edit</moz-button
      >
    </moz-box-item>
  `,
  args: {
    label: 'Display name',
    description: 'Ada Lovelace',
    iconStart: 'information',
  },
};

// Both action slots reveal their region via slotchange.
export const ActionsSlots: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-box-item label="Item">
      <moz-button slot="actions-start" variant="ghost" icon-start="settings"
        >Settings</moz-button
      >
      <moz-button slot="actions-end" variant="ghost" icon-start="edit"
        >Edit</moz-button
      >
    </moz-box-item>
  `,
  play: async ({ canvasElement }) => {
    const item = canvasElement.querySelector('moz-box-item')!;
    await item.updateComplete;
    const regions = item.shadowRoot!.querySelectorAll('.actions');
    expect(regions[0].hasAttribute('hidden')).toBe(false); // actions-start
    expect(regions[1].hasAttribute('hidden')).toBe(false); // actions-end
  },
};

// The default slot replaces the text content for fully custom rows.
export const CustomContent: Story = {
  render: () => html`
    <moz-box-item>
      <label>Enable telemetry <input type="checkbox" checked /></label>
    </moz-box-item>
  `,
};

// label/description/icon render; the header row shows all three.
export const Structure: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    label: 'A label',
    description: 'A description',
    iconStart: 'settings',
  },
  play: async ({ canvasElement }) => {
    const item = canvasElement.querySelector('moz-box-item')!;
    await item.updateComplete;
    const root = item.shadowRoot!;
    expect(root.querySelector('.label')!.textContent).toContain('A label');
    expect(root.querySelector('.description')!.textContent).toContain(
      'A description',
    );
    expect(root.querySelector('moz-icon')!.getAttribute('name')).toBe(
      'settings',
    );
  },
};

// With no label, the default slot is rendered instead of the text grid.
export const CustomContentSlot: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`<moz-box-item><span>Custom</span></moz-box-item>`,
  play: async ({ canvasElement }) => {
    const item = canvasElement.querySelector('moz-box-item')!;
    await item.updateComplete;
    const root = item.shadowRoot!;
    expect(root.querySelector('.text-content')).toBeNull();
    expect(root.querySelector('.box-content slot')).not.toBeNull();
  },
};
