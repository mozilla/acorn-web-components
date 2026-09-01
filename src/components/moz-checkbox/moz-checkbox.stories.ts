import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-checkbox';
import '../moz-provider/moz-provider';
import { type IconName, iconNames } from '../../generated/icons';

interface CheckboxArgs {
  label: string;
  name: string;
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  required: boolean;
  description?: string;
  labelIcon?: IconName;
  accesskey?: string;
}

const meta: Meta<CheckboxArgs> = {
  title: 'Components/Checkbox',
  component: 'moz-checkbox',
  tags: ['autodocs'],
  decorators: [logEvents('change')],
  argTypes: {
    label: { control: 'text' },
    name: { control: 'text' },
    checked: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
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
    indeterminate: false,
    disabled: false,
    required: false,
  },
  render: (args) => html`
    <moz-checkbox
      label=${args.label}
      name=${ifDefined(args.name)}
      description=${ifDefined(args.description)}
      label-icon=${ifDefined(args.labelIcon)}
      accesskey=${ifDefined(args.accesskey)}
      ?checked=${args.checked}
      ?indeterminate=${args.indeterminate}
      ?disabled=${args.disabled}
      ?required=${args.required}
    ></moz-checkbox>
  `,
};

export default meta;
type Story = StoryObj<CheckboxArgs>;

export const Default: Story = {};
export const Checked: Story = { args: { checked: true } };
export const Indeterminate: Story = { args: { indeterminate: true } };
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

// Access key: moved to the inner control (so it toggles, not just focuses) and
// underlined in the label.
export const WithAccessKey: Story = {
  args: { label: 'Save password', accesskey: 's' },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-checkbox')!;
    await el.updateComplete;
    // The access key lives on the inner control, not the host.
    expect(el.hasAttribute('accesskey')).toBe(false);
    expect(
      el.shadowRoot!.querySelector('input')!.getAttribute('accesskey'),
    ).toBe('s');
    // The matching label character is underlined.
    expect(el.shadowRoot!.querySelector('.label-text u')?.textContent).toBe(
      'S',
    );
  },
};

// Clicking the description activates the control (like clicking the label).
export const DescriptionActivates: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Telemetry', description: 'Sends anonymous usage data.' },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-checkbox')!;
    await el.updateComplete;
    expect(el.checked).toBe(false);
    (el.shadowRoot!.querySelector('.description') as HTMLElement).click();
    await el.updateComplete;
    expect(el.checked).toBe(true);
  },
};

// Sub-options in the `nested` slot disable while the parent is unchecked.
export const Nested: Story = {
  render: () => html`
    <moz-checkbox label="Sync" checked>
      <moz-checkbox slot="nested" label="Bookmarks" checked></moz-checkbox>
      <moz-checkbox slot="nested" label="History"></moz-checkbox>
    </moz-checkbox>
  `,
};

// --- interaction tests ---

// Clicking toggles, fires a composed change, and syncs `checked`.
export const Toggles: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-checkbox')!;
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

// Toggling an indeterminate box clears the mixed state.
export const IndeterminateClears: Story = {
  tags: ['!dev', '!autodocs'],
  args: { indeterminate: true },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-checkbox')!;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('input')!.indeterminate).toBe(true);
    el.shadowRoot!.querySelector('input')!.click();
    await el.updateComplete;
    expect(el.indeterminate).toBe(false);
    expect(el.checked).toBe(true);
  },
};

// Form association: submits `value` only when checked, and reset restores it.
export const InForm: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <form>
      <moz-checkbox name="agree" label="Agree" checked></moz-checkbox>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const el = canvasElement.querySelector('moz-checkbox')!;
    await el.updateComplete;
    expect(new FormData(form).get('agree')).toBe('on');

    el.checked = false;
    await el.updateComplete;
    expect(new FormData(form).get('agree')).toBeNull();

    form.reset();
    await el.updateComplete;
    expect(el.checked).toBe(true);
  },
};

// Required is invalid until checked.
export const RequiredValidation: Story = {
  tags: ['!dev', '!autodocs'],
  args: { required: true },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-checkbox')!;
    await el.updateComplete;
    expect(el.checkValidity()).toBe(false);
    el.checked = true;
    await el.updateComplete;
    expect(el.checkValidity()).toBe(true);
  },
};

// Nested sub-options are disabled while the parent is unchecked.
export const NestedDisables: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-checkbox label="Sync">
      <moz-checkbox slot="nested" label="Bookmarks"></moz-checkbox>
    </moz-checkbox>
  `,
  play: async ({ canvasElement }) => {
    const parent = canvasElement.querySelector('moz-checkbox')!;
    const child = canvasElement.querySelector('[slot="nested"]')!;
    await parent.updateComplete;
    await new Promise((r) => setTimeout(r, 20));
    // Parent unchecked -> child gated off.
    expect(child.shadowRoot!.querySelector('input')!.disabled).toBe(true);
    parent.checked = true;
    await parent.updateComplete;
    await new Promise((r) => setTimeout(r, 20));
    expect(child.shadowRoot!.querySelector('input')!.disabled).toBe(false);
  },
};
