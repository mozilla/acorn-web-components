import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-input-number';
import type { MozInputNumber } from './moz-input-number';

interface Args {
  label: string;
  name?: string;
  value?: string;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  error?: string;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  hideSpinner: boolean;
}

const meta: Meta<Args> = {
  title: 'Components/Input Number',
  component: 'moz-input-number',
  tags: ['autodocs'],
  decorators: [logEvents('input', 'change')],
  argTypes: {
    label: { control: 'text' },
    name: { control: 'text' },
    value: { control: 'text' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    description: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    required: { control: 'boolean' },
    hideSpinner: { control: 'boolean' },
  },
  args: {
    label: 'Quantity',
    name: 'quantity',
    value: '1',
    disabled: false,
    readonly: false,
    required: false,
    hideSpinner: false,
  },
  render: (args) => html`
    <moz-input-number
      label=${args.label}
      name=${ifDefined(args.name)}
      value=${ifDefined(args.value)}
      min=${ifDefined(args.min)}
      max=${ifDefined(args.max)}
      step=${ifDefined(args.step)}
      description=${ifDefined(args.description)}
      error=${ifDefined(args.error)}
      ?disabled=${args.disabled}
      ?readonly=${args.readonly}
      ?required=${args.required}
      ?hide-spinner=${args.hideSpinner}
    ></moz-input-number>
  `,
};

export default meta;
type Story = StoryObj<Args>;

const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const el = (root: HTMLElement) =>
  root.querySelector<MozInputNumber>('moz-input-number')!;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    expect(input.shadowRoot!.querySelector('input')!.type).toBe('number');
  },
};

export const WithRange: Story = {
  args: {
    label: 'Rating',
    min: 1,
    max: 5,
    value: '3',
    description: 'Between 1 and 5.',
  },
};

export const WithStep: Story = {
  args: { label: 'Price', min: 0, step: 0.5, value: '2.5' },
};

export const Required: Story = { args: { required: true, value: '' } };
export const Disabled: Story = { args: { disabled: true } };
export const WithError: Story = {
  args: { value: '99', max: 5, error: 'Pick a number from 1 to 5.' },
};

// The spinner is presentational; the value is still steppable by keyboard.
export const HiddenSpinner: Story = {
  args: { label: 'Version code', hideSpinner: true, value: '42' },
};

// min/max/step reach the inner control, so native range validity applies.
export const RangeValidity: Story = {
  tags: ['!dev', '!autodocs'],
  args: { min: 1, max: 5, value: '9' },
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await wait();
    const inner = input.shadowRoot!.querySelector('input')!;
    expect(inner.getAttribute('min')).toBe('1');
    expect(inner.getAttribute('max')).toBe('5');
    expect(input.checkValidity()).toBe(false);
    expect(input.validity.rangeOverflow).toBe(true);

    input.value = '4';
    await wait();
    expect(input.checkValidity()).toBe(true);
  },
};

// A constraint that goes away must be removed from the control, not left stale.
export const ConstraintsClear: Story = {
  tags: ['!dev', '!autodocs'],
  args: { min: 1, max: 5, value: '9' },
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await wait();
    expect(input.checkValidity()).toBe(false);

    input.max = undefined;
    await wait();
    expect(input.shadowRoot!.querySelector('input')!.hasAttribute('max')).toBe(
      false,
    );
    expect(input.checkValidity()).toBe(true);
  },
};

// valueAsNumber mirrors the platform, NaN for an empty field included.
export const ValueAsNumber: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: '7' },
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    expect(input.valueAsNumber).toBe(7);

    input.valueAsNumber = 12;
    await input.updateComplete;
    expect(input.value).toBe('12');

    input.value = '';
    await input.updateComplete;
    expect(Number.isNaN(input.valueAsNumber)).toBe(true);
  },
};

// stepUp/stepDown delegate to the native control and report the change.
export const Stepping: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: '2', step: 2, min: 0 },
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await wait();
    let changes = 0;
    input.addEventListener('change', () => changes++);

    input.stepUp();
    await wait();
    expect(input.value).toBe('4');
    expect(changes).toBe(1);

    input.stepDown(2);
    await wait();
    expect(input.value).toBe('0');
    expect(changes).toBe(2);
  },
};

// The value submits under `name` like any other field.
export const InForm: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <form>
      <moz-input-number name="count" label="Count" value="3"></moz-input-number>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    await wait();
    expect(new FormData(form).get('count')).toBe('3');
  },
};
