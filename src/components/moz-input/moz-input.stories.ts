import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import './moz-input';
import '../moz-provider/moz-provider';
import { type IconName, iconNames } from '../../generated/icons';
import type { InputType } from './moz-input';

interface InputArgs {
  label: string;
  type: InputType;
  value: string;
  placeholder?: string;
  description?: string;
  error?: string;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  clearable: boolean;
  fullWidth: boolean;
  iconStart?: IconName;
  labelIcon?: IconName;
}

const types: InputType[] = ['text', 'email', 'url', 'tel'];

const meta: Meta<InputArgs> = {
  title: 'Components/Input',
  component: 'moz-input',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    type: { control: 'select', options: types },
    value: { control: 'text' },
    placeholder: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    required: { control: 'boolean' },
    clearable: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    iconStart: { control: 'select', options: [undefined, ...iconNames] },
    labelIcon: { control: 'select', options: [undefined, ...iconNames] },
  },
  args: {
    label: 'Display name',
    type: 'text',
    value: '',
    placeholder: 'e.g. Ada Lovelace',
    disabled: false,
    readonly: false,
    required: false,
    clearable: false,
    fullWidth: false,
  },
  render: (args) => html`
    <moz-input
      label=${args.label}
      type=${args.type}
      value=${args.value}
      placeholder=${ifDefined(args.placeholder)}
      description=${ifDefined(args.description)}
      error=${ifDefined(args.error)}
      icon-start=${ifDefined(args.iconStart)}
      label-icon=${ifDefined(args.labelIcon)}
      ?disabled=${args.disabled}
      ?readonly=${args.readonly}
      ?required=${args.required}
      ?clearable=${args.clearable}
      ?full-width=${args.fullWidth}
    ></moz-input>
  `,
};

export default meta;
type Story = StoryObj<InputArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('moz-input');
    const inner = input?.shadowRoot?.querySelector('input');
    expect(inner).toBeTruthy();
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Email',
    type: 'email',
    description: "We'll only use this to contact you about your add-on.",
    placeholder: 'you@example.com',
  },
};

export const Required: Story = { args: { label: 'Title', required: true } };
export const Disabled: Story = {
  args: { label: 'Slug', value: 'my-addon', disabled: true },
};
export const ReadOnly: Story = {
  args: { label: 'Add-on ID', value: '{c1a2b3…}', readonly: true },
};
export const WithIcon: Story = {
  args: { label: 'Homepage', type: 'url', iconStart: 'link' },
};
export const WithLabelIcon: Story = {
  args: { label: 'Homepage', type: 'url', labelIcon: 'link' },
};

// Error state: red border, an icon-prefixed message below, and aria-invalid.
export const WithError: Story = {
  args: {
    label: 'Version',
    value: '1.0',
    error: 'A version number must look like 1.0.0.',
  },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('moz-input')!;
    await new Promise((r) => setTimeout(r, 20));
    const message = input.shadowRoot!.querySelector('#error');
    expect(message?.textContent).toContain('1.0.0');
    const inner = input.shadowRoot!.querySelector('input')!;
    expect(inner.getAttribute('aria-invalid')).toBe('true');
    expect(inner.getAttribute('aria-describedby')).toContain('error');
  },
};

// The clear button appears once there's a value and empties the field on click.
export const Clearable: Story = {
  args: { label: 'Search add-ons', value: 'privacy', clearable: true },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('moz-input')!;
    await new Promise((r) => setTimeout(r, 20));
    const clear = input.shadowRoot!.querySelector('.clear') as HTMLElement;
    expect(clear).toBeTruthy();
    clear.click();
    await new Promise((r) => setTimeout(r, 20));
    expect(input.value).toBe('');
    // Cleared: the button hides again with no value.
    expect(input.shadowRoot!.querySelector('.clear')).toBeNull();
  },
};

export const Types: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:16px;inline-size:320px;">
      ${types.map((t) => html`<moz-input label=${t} type=${t}></moz-input>`)}
    </div>
  `,
};

// Width: 320px by default, `full-width` fills the container, or set a custom
// inline-size / --field-width.
export const Widths: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:16px;inline-size:600px;">
      <moz-input label="Default (320px)"></moz-input>
      <moz-input label="Full width" full-width></moz-input>
      <moz-input label="Custom (480px)" style="inline-size:480px"></moz-input>
    </div>
  `,
};

// Composed events: an input in the shadow tree still reaches a host listener.
export const EmitsComposedEvents: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`<moz-input label="Name"></moz-input>`,
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('moz-input')!;
    const inner = input.shadowRoot!.querySelector('input')!;
    let inputs = 0;
    let changes = 0;
    input.addEventListener('input', () => inputs++);
    input.addEventListener('change', () => changes++);

    inner.value = 'Ada';
    inner.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    inner.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 20));

    expect(inputs).toBe(1);
    expect(changes).toBe(1);
    // handleInput mirrored the inner value onto the host property.
    expect(input.value).toBe('Ada');
  },
};

// Form association: the value submits under `name`, and reset restores it.
export const InForm: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <form>
      <moz-input name="title" label="Title" value="Draft"></moz-input>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const input = canvasElement.querySelector('moz-input')!;
    expect(new FormData(form).get('title')).toBe('Draft');

    input.value = 'Edited';
    await new Promise((r) => setTimeout(r, 20));
    expect(new FormData(form).get('title')).toBe('Edited');

    form.reset();
    await new Promise((r) => setTimeout(r, 20));
    expect(input.value).toBe('Draft');
  },
};

// Validation: required + custom message surface through ElementInternals.
export const Validation: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`<moz-input label="Title" required></moz-input>`,
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('moz-input')!;
    await new Promise((r) => setTimeout(r, 20));
    expect(input.checkValidity()).toBe(false);

    input.value = 'Present';
    await new Promise((r) => setTimeout(r, 20));
    expect(input.checkValidity()).toBe(true);

    input.setCustomValidity('Nope');
    await new Promise((r) => setTimeout(r, 20));
    expect(input.checkValidity()).toBe(false);
    expect(input.validationMessage).toBe('Nope');
  },
};

// Imperative API: focus/select/blur/click delegate to the inner control, and the
// validity getters + labelEl read through.
export const ImperativeApi: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`<moz-input label="Name" value="hello"></moz-input>`,
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('moz-input')!;
    const inner = input.shadowRoot!.querySelector('input')!;

    input.focus();
    expect(input.shadowRoot!.activeElement).toBe(inner);
    input.select();
    expect(inner.selectionEnd).toBe('hello'.length);
    // A synthetic click doesn't move focus, so just exercise the delegation.
    input.click();
    input.blur();
    expect(input.shadowRoot!.activeElement).toBeNull();

    expect(input.labelEl?.tagName).toBe('LABEL');
    expect(input.willValidate).toBe(true);
    expect(input.validity.valid).toBe(true);
    expect(input.reportValidity()).toBe(true);
  },
};

// Enter in a single-line field submits the associated form.
export const EnterSubmits: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <form
      @submit=${(e: Event) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setAttribute('data-submitted', 'true');
      }}
    >
      <moz-input label="Query" value="firefox"></moz-input>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const inner = canvasElement
      .querySelector('moz-input')!
      .shadowRoot!.querySelector('input')!;
    inner.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        composed: true,
      }),
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(form.getAttribute('data-submitted')).toBe('true');
  },
};

// A native disabled <fieldset> disables the control via formDisabledCallback.
export const InDisabledFieldset: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <fieldset disabled>
      <moz-input label="Name" value="x"></moz-input>
    </fieldset>
  `,
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('moz-input')!;
    await new Promise((r) => setTimeout(r, 20));
    expect(input.disabled).toBe(true);
    expect(input.shadowRoot!.querySelector('input')!.disabled).toBe(true);
  },
};
