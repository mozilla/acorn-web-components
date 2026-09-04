import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import './moz-radio';
import '../moz-provider/moz-provider';
import { type IconName, iconNames } from '../../generated/icons';

interface RadioArgs {
  label: string;
  value: string;
  checked: boolean;
  disabled: boolean;
  description?: string;
  labelIcon?: IconName;
  accesskey?: string;
}

// A single radio is normally used inside `moz-radio-group`, which owns
// selection, the shared name, and arrow-key navigation. These stories show one
// option's states in isolation.
const meta: Meta<RadioArgs> = {
  title: 'Components/Radio/Radio',
  component: 'moz-radio',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    description: { control: 'text' },
    labelIcon: { control: 'select', options: [undefined, ...iconNames] },
    accesskey: { control: 'text' },
  },
  args: {
    label: 'Release',
    value: 'release',
    checked: false,
    disabled: false,
  },
  render: (args) => html`
    <moz-radio
      label=${args.label}
      value=${ifDefined(args.value)}
      description=${ifDefined(args.description)}
      label-icon=${ifDefined(args.labelIcon)}
      accesskey=${ifDefined(args.accesskey)}
      ?checked=${args.checked}
      ?disabled=${args.disabled}
    ></moz-radio>
  `,
};

export default meta;
type Story = StoryObj<RadioArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-radio')!;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('input')!.type).toBe('radio');
  },
};

// A standalone required radio validates (group-level required lives on
// moz-radio-group).
export const RequiredValidates: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    html`<moz-radio name="accept" label="Accept" required></moz-radio>`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-radio')!;
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 20));
    expect(el.checkValidity()).toBe(false);
    el.checked = true;
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 20));
    expect(el.checkValidity()).toBe(true);
  },
};

// Activating a standalone radio (no group to settle selection) adopts the
// native input's checked state, so its form value follows.
export const ClickSelectsStandalone: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <form><moz-radio name="choice" value="yes" label="Yes"></moz-radio></form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const el = canvasElement.querySelector('moz-radio')!;
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 20));
    expect(el.checked).toBe(false);

    el.shadowRoot!.querySelector('input')!.click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 20));
    expect(el.checked).toBe(true);
    expect(new FormData(form).get('choice')).toBe('yes');
  },
};

// With no explicit value, a checked radio submits "on" like a native radio.
export const DefaultValueSubmitsOn: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <form><moz-radio name="choice" label="Yes" checked></moz-radio></form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const el = canvasElement.querySelector('moz-radio')!;
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 20));
    expect(new FormData(form).get('choice')).toBe('on');
  },
};

export const Selected: Story = { args: { checked: true } };
export const WithDescription: Story = {
  args: {
    label: 'Nightly',
    description: 'Bleeding-edge builds, updated daily.',
  },
};
export const Disabled: Story = { args: { checked: true, disabled: true } };
export const WithIcon: Story = {
  args: { label: 'Private', labelIcon: 'shield' },
};

// Access key: moved to the inner control and underlined in the label.
export const WithAccessKey: Story = {
  args: { label: 'Beta', accesskey: 'b' },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-radio')!;
    await el.updateComplete;
    expect(el.hasAttribute('accesskey')).toBe(false);
    expect(
      el.shadowRoot!.querySelector('input')!.getAttribute('accesskey'),
    ).toBe('b');
    expect(el.shadowRoot!.querySelector('.label-text u')?.textContent).toBe(
      'B',
    );
  },
};
