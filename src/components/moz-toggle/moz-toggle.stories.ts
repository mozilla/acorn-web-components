import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-toggle';
import '../moz-provider/moz-provider';
import { type IconName, iconNames } from '../../generated/icons';

interface ToggleArgs {
  label: string;
  name: string;
  checked: boolean;
  disabled: boolean;
  required: boolean;
  description?: string;
  labelIcon?: IconName;
  accesskey?: string;
}

const meta: Meta<ToggleArgs> = {
  title: 'Components/Toggle',
  component: 'moz-toggle',
  tags: ['autodocs'],
  decorators: [logEvents('change')],
  argTypes: {
    label: { control: 'text' },
    name: { control: 'text' },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    description: { control: 'text' },
    labelIcon: { control: 'select', options: [undefined, ...iconNames] },
    accesskey: { control: 'text' },
  },
  args: {
    label: 'Enable telemetry',
    name: 'telemetry',
    checked: false,
    disabled: false,
    required: false,
  },
  // Default layout: switch first, then label, shrink-wrapped to content.
  render: (args) => html`
    <moz-toggle
      label=${args.label}
      name=${ifDefined(args.name)}
      description=${ifDefined(args.description)}
      label-icon=${ifDefined(args.labelIcon)}
      accesskey=${ifDefined(args.accesskey)}
      ?checked=${args.checked}
      ?disabled=${args.disabled}
      ?required=${args.required}
    ></moz-toggle>
  `,
};

export default meta;
type Story = StoryObj<ToggleArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-toggle')!;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('input')!.getAttribute('role')).toBe(
      'switch',
    );
    // `name` reflects to the host attribute (so forms key off it).
    el.name = 'renamed';
    await el.updateComplete;
    expect(el.getAttribute('name')).toBe('renamed');
  },
};

export const On: Story = { args: { checked: true } };
export const WithDescription: Story = {
  args: {
    label: 'Share technical data',
    description: 'Helps Mozilla prioritize what to build next.',
  },
};
export const Required: Story = {
  args: { label: 'I accept the terms', required: true },
};
export const Disabled: Story = { args: { checked: true, disabled: true } };
export const WithIcon: Story = {
  args: { label: 'Private browsing', labelIcon: 'shield' },
};

// Full-width variant: label first, switch pushed to the far edge.
export const FullWidth: Story = {
  args: {
    label: 'Share technical data',
    description: 'Helps Mozilla prioritize what to build next.',
  },
  render: (args) => html`
    <div style="inline-size:320px;">
      <moz-toggle
        inputlayout="inline-end"
        label=${args.label}
        description=${ifDefined(args.description)}
        ?checked=${args.checked}
      ></moz-toggle>
    </div>
  `,
};

// Access key: moved to the inner control (so it toggles, not just focuses) and
// underlined in the label.
export const WithAccessKey: Story = {
  args: { label: 'Save password', accesskey: 's' },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-toggle')!;
    await el.updateComplete;
    expect(el.hasAttribute('accesskey')).toBe(false);
    expect(
      el.shadowRoot!.querySelector('input')!.getAttribute('accesskey'),
    ).toBe('s');
    expect(el.shadowRoot!.querySelector('.label-text u')?.textContent).toBe(
      'S',
    );
  },
};

// --- interaction tests ---

// Clicking toggles, fires a composed change, and syncs `checked`.
export const Toggles: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-toggle')!;
    await el.updateComplete;
    let changes = 0;
    el.addEventListener('change', () => changes++);
    const input = el.shadowRoot!.querySelector('input')!;
    input.click();
    await el.updateComplete;
    expect(el.checked).toBe(true);
    expect(changes).toBe(1);
    // Label click toggles too (native for/label association).
    (el.shadowRoot!.querySelector('.label-text') as HTMLElement).click();
    await el.updateComplete;
    expect(el.checked).toBe(false);
  },
};

// Clicking the description activates the switch (like clicking the label).
export const DescriptionActivates: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Telemetry', description: 'Sends anonymous usage data.' },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-toggle')!;
    await el.updateComplete;
    expect(el.checked).toBe(false);
    (el.shadowRoot!.querySelector('.description') as HTMLElement).click();
    await el.updateComplete;
    expect(el.checked).toBe(true);
  },
};

// Form association: submits `value` only when on, and reset restores it.
export const InForm: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <form>
      <moz-toggle name="notify" label="Notify me" checked></moz-toggle>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const el = canvasElement.querySelector('moz-toggle')!;
    await el.updateComplete;
    expect(new FormData(form).get('notify')).toBe('on');

    el.checked = false;
    await el.updateComplete;
    expect(new FormData(form).get('notify')).toBeNull();

    form.reset();
    await el.updateComplete;
    expect(el.checked).toBe(true);
  },
};

// Required is invalid until switched on.
export const RequiredValidation: Story = {
  tags: ['!dev', '!autodocs'],
  args: { required: true },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-toggle')!;
    await el.updateComplete;
    expect(el.checkValidity()).toBe(false);
    el.checked = true;
    await el.updateComplete;
    expect(el.checkValidity()).toBe(true);
  },
};

// Form state restoration (bfcache / autofill) restores the on/off state in both
// directions, not just the value.
export const RestoresState: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-toggle')!;
    await el.updateComplete;
    el.formStateRestoreCallback('on');
    await el.updateComplete;
    expect(el.checked).toBe(true);

    el.formStateRestoreCallback('off');
    await el.updateComplete;
    expect(el.checked).toBe(false);
  },
};
