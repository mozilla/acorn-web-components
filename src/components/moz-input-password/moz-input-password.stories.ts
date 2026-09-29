import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-input-password';
import type { MozInputPassword } from './moz-input-password';

interface Args {
  label: string;
  name?: string;
  value?: string;
  placeholder?: string;
  description?: string;
  error?: string;
  autocomplete?: string;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  hideReveal: boolean;
  clearable: boolean;
}

const meta: Meta<Args> = {
  title: 'Components/Input Password',
  component: 'moz-input-password',
  tags: ['autodocs'],
  decorators: [logEvents('input', 'change')],
  argTypes: {
    label: { control: 'text' },
    name: { control: 'text' },
    value: { control: 'text' },
    placeholder: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    autocomplete: {
      control: 'select',
      options: ['current-password', 'new-password', 'off'],
    },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    required: { control: 'boolean' },
    hideReveal: { control: 'boolean' },
    clearable: { control: 'boolean' },
  },
  args: {
    label: 'Password',
    name: 'password',
    placeholder: '••••••••',
    disabled: false,
    readonly: false,
    required: false,
    hideReveal: false,
    clearable: false,
  },
  render: (args) => html`
    <moz-input-password
      label=${args.label}
      name=${ifDefined(args.name)}
      value=${ifDefined(args.value)}
      placeholder=${ifDefined(args.placeholder)}
      description=${ifDefined(args.description)}
      error=${ifDefined(args.error)}
      autocomplete=${ifDefined(args.autocomplete)}
      ?disabled=${args.disabled}
      ?readonly=${args.readonly}
      ?required=${args.required}
      ?hide-reveal=${args.hideReveal}
      ?clearable=${args.clearable}
    ></moz-input-password>
  `,
};

export default meta;
type Story = StoryObj<Args>;

const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const reveal = (el: MozInputPassword) =>
  el.shadowRoot!.querySelector<HTMLElement>('.reveal');

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const el =
      canvasElement.querySelector<MozInputPassword>('moz-input-password')!;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('input')!.type).toBe('password');
    // Sensible default for a sign-in field; consumers override for sign-up.
    expect(el.autocomplete).toBe('current-password');
  },
};

export const WithDescription: Story = {
  args: {
    autocomplete: 'new-password',
    description: 'At least 12 characters, and not one you use elsewhere.',
  },
};

export const Required: Story = { args: { required: true } };
export const Disabled: Story = {
  args: { value: 'hunter2', disabled: true },
};
export const WithError: Story = {
  args: { value: 'short', error: 'That password is too short.' },
};

// Not every password field should offer a reveal (e.g. a confirmation field).
export const HideReveal: Story = {
  args: { value: 'hunter2', hideReveal: true },
  play: async ({ canvasElement }) => {
    const el =
      canvasElement.querySelector<MozInputPassword>('moz-input-password')!;
    await el.updateComplete;
    expect(reveal(el)).toBeNull();
  },
};

// The toggle swaps the native type and relabels itself for the next action.
export const Reveal: Story = {
  args: { value: 'hunter2' },
  play: async ({ canvasElement }) => {
    const el =
      canvasElement.querySelector<MozInputPassword>('moz-input-password')!;
    await el.updateComplete;
    const button = reveal(el)!;
    expect(button.textContent).toContain('Show password');

    button.click();
    await wait();
    expect(el.revealed).toBe(true);
    expect(el.shadowRoot!.querySelector('input')!.type).toBe('text');
    expect(reveal(el)!.textContent).toContain('Hide password');

    reveal(el)!.click();
    await wait();
    expect(el.revealed).toBe(false);
    expect(el.shadowRoot!.querySelector('input')!.type).toBe('password');
  },
};

// A disabled or read-only field has nothing to toggle.
export const NoRevealWhenDisabled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: 'hunter2', disabled: true },
  play: async ({ canvasElement }) => {
    const el =
      canvasElement.querySelector<MozInputPassword>('moz-input-password')!;
    await el.updateComplete;
    expect(reveal(el)).toBeNull();

    el.disabled = false;
    el.readonly = true;
    await el.updateComplete;
    expect(reveal(el)).toBeNull();

    el.readonly = false;
    await el.updateComplete;
    expect(reveal(el)).toBeTruthy();
  },
};

// Reveal + clear can both show; reveal stays the trailing control.
export const Clearable: Story = {
  args: { value: 'hunter2', clearable: true },
  play: async ({ canvasElement }) => {
    const el =
      canvasElement.querySelector<MozInputPassword>('moz-input-password')!;
    await el.updateComplete;
    const buttons = [...el.shadowRoot!.querySelectorAll('moz-button')];
    expect(buttons).toHaveLength(2);
    expect(buttons.at(-1)!.classList.contains('reveal')).toBe(true);
  },
};

// Resetting the form must not leave the old value on screen in the clear.
export const ResetHidesValue: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <form>
      <moz-input-password
        name="password"
        label="Password"
        value="hunter2"
      ></moz-input-password>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const el =
      canvasElement.querySelector<MozInputPassword>('moz-input-password')!;
    await el.updateComplete;
    expect(new FormData(form).get('password')).toBe('hunter2');

    reveal(el)!.click();
    await wait();
    expect(el.revealed).toBe(true);

    form.reset();
    await wait();
    expect(el.revealed).toBe(false);
    expect(el.value).toBe('hunter2');
  },
};

// hide() is the imperative equivalent, for a consumer leaving a form.
export const HideImperatively: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: 'hunter2' },
  play: async ({ canvasElement }) => {
    const el =
      canvasElement.querySelector<MozInputPassword>('moz-input-password')!;
    await el.updateComplete;
    el.revealed = true;
    await el.updateComplete;
    el.hide();
    await el.updateComplete;
    expect(el.revealed).toBe(false);
    expect(el.shadowRoot!.querySelector('input')!.type).toBe('password');
  },
};
