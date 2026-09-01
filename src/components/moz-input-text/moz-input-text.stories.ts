import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-input-text';
import '../moz-provider/moz-provider';
import { type IconName, iconNames } from '../../generated/icons';
import type { InputType } from './moz-input-text';

interface InputArgs {
  label: string;
  name: string;
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
  accesskey?: string;
}

const types: InputType[] = ['text', 'email', 'url', 'tel'];

const meta: Meta<InputArgs> = {
  title: 'Components/Input Text',
  component: 'moz-input-text',
  tags: ['autodocs'],
  decorators: [logEvents('input', 'change')],
  argTypes: {
    label: { control: 'text' },
    name: { control: 'text' },
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
    accesskey: { control: 'text' },
  },
  args: {
    label: 'Display name',
    name: 'display-name',
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
    <moz-input-text
      label=${args.label}
      name=${ifDefined(args.name)}
      type=${args.type}
      value=${args.value}
      placeholder=${ifDefined(args.placeholder)}
      description=${ifDefined(args.description)}
      error=${ifDefined(args.error)}
      icon-start=${ifDefined(args.iconStart)}
      label-icon=${ifDefined(args.labelIcon)}
      accesskey=${ifDefined(args.accesskey)}
      ?disabled=${args.disabled}
      ?readonly=${args.readonly}
      ?required=${args.required}
      ?clearable=${args.clearable}
      ?full-width=${args.fullWidth}
    ></moz-input-text>
  `,
};

export default meta;
type Story = StoryObj<InputArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('moz-input-text')!;
    expect(input.shadowRoot?.querySelector('input')).toBeTruthy();
    // `name` reflects to the host attribute (so forms key off it) whether set as
    // an attribute or a property.
    input.name = 'renamed';
    await input.updateComplete;
    expect(input.getAttribute('name')).toBe('renamed');
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

// Access key: moved to the inner control and underlined in the label. (Prefer a
// letter that doesn't collide with a browser/OS shortcut — e.g. "a" over "n".)
export const WithAccessKey: Story = {
  args: { label: 'Name', accesskey: 'a' },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-input-text')!;
    await el.updateComplete;
    expect(el.hasAttribute('accesskey')).toBe(false);
    expect(
      el.shadowRoot!.querySelector('input')!.getAttribute('accesskey'),
    ).toBe('a');
    expect(el.shadowRoot!.querySelector('.label-text u')?.textContent).toBe(
      'a',
    );
  },
};

// Error state: red border, an icon-prefixed message below, and aria-invalid.
export const WithError: Story = {
  args: {
    label: 'Version',
    value: '1.0',
    error: 'A version number must look like 1.0.0.',
  },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('moz-input-text')!;
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
    const input = canvasElement.querySelector('moz-input-text')!;
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
      ${types.map((t) => html`<moz-input-text label=${t} type=${t}></moz-input-text>`)}
    </div>
  `,
};

// Width: 320px by default, `full-width` fills the container, or set a custom
// inline-size / --field-width.
export const Widths: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:16px;inline-size:600px;">
      <moz-input-text label="Default (320px)"></moz-input-text>
      <moz-input-text label="Full width" full-width></moz-input-text>
      <moz-input-text label="Custom (480px)" style="inline-size:480px"></moz-input-text>
    </div>
  `,
};

// Setting the value on the host propagates down to the inner control.
export const ValuePropagates: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    html`<moz-input-text label="Name" value="Ada"></moz-input-text>`,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-input-text')!;
    await el.updateComplete;
    const inner = el.shadowRoot!.querySelector('input')!;
    // Initial value reaches the inner control...
    expect(inner.value).toBe('Ada');
    // ...and a top-level change propagates down.
    el.value = 'Grace';
    await el.updateComplete;
    expect(inner.value).toBe('Grace');
  },
};

// Composed events: an input in the shadow tree still reaches a host listener.
export const EmitsComposedEvents: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`<moz-input-text label="Name"></moz-input-text>`,
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('moz-input-text')!;
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
      <moz-input-text name="title" label="Title" value="Draft"></moz-input-text>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const input = canvasElement.querySelector('moz-input-text')!;
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
  render: () => html`<moz-input-text label="Title" required></moz-input-text>`,
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('moz-input-text')!;
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
  render: () =>
    html`<moz-input-text label="Name" value="hello"></moz-input-text>`,
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('moz-input-text')!;
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
      <moz-input-text label="Query" value="firefox"></moz-input-text>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const inner = canvasElement
      .querySelector('moz-input-text')!
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
      <moz-input-text label="Name" value="x"></moz-input-text>
    </fieldset>
  `,
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('moz-input-text')!;
    await new Promise((r) => setTimeout(r, 20));
    expect(input.disabled).toBe(true);
    expect(input.shadowRoot!.querySelector('input')!.disabled).toBe(true);
  },
};
