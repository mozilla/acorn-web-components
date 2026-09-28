import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-input-date';
import type { DateType, MozInputDate } from './moz-input-date';

interface Args {
  label: string;
  name?: string;
  dateType: DateType;
  value?: string;
  min?: string;
  max?: string;
  description?: string;
  error?: string;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
}

const dateTypes: DateType[] = [
  'date',
  'datetime-local',
  'time',
  'month',
  'week',
];

const meta: Meta<Args> = {
  title: 'Components/Input Date',
  component: 'moz-input-date',
  tags: ['autodocs'],
  decorators: [logEvents('input', 'change')],
  argTypes: {
    label: { control: 'text' },
    name: { control: 'text' },
    dateType: { control: 'select', options: dateTypes },
    value: { control: 'text' },
    min: { control: 'text' },
    max: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    required: { control: 'boolean' },
  },
  args: {
    label: 'Release date',
    name: 'release-date',
    dateType: 'date',
    disabled: false,
    readonly: false,
    required: false,
  },
  render: (args) => html`
    <moz-input-date
      label=${args.label}
      name=${ifDefined(args.name)}
      date-type=${args.dateType}
      value=${ifDefined(args.value)}
      min=${ifDefined(args.min)}
      max=${ifDefined(args.max)}
      description=${ifDefined(args.description)}
      error=${ifDefined(args.error)}
      ?disabled=${args.disabled}
      ?readonly=${args.readonly}
      ?required=${args.required}
    ></moz-input-date>
  `,
};

export default meta;
type Story = StoryObj<Args>;

const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const el = (root: HTMLElement) =>
  root.querySelector<MozInputDate>('moz-input-date')!;

export const Default: Story = {
  args: { value: '2026-04-01' },
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    expect(input.shadowRoot!.querySelector('input')!.type).toBe('date');
  },
};

export const WithDescription: Story = {
  args: {
    value: '2026-04-01',
    description: 'When the add-on should go live.',
  },
};

export const Required: Story = { args: { required: true } };
export const Disabled: Story = {
  args: { value: '2026-04-01', disabled: true },
};
export const WithError: Story = {
  args: {
    value: '2020-01-01',
    min: '2026-01-01',
    error: 'Pick a date in the future.',
  },
};

// One control over the five native date/time types.
export const Types: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:16px;">
      ${dateTypes.map(
        (type) =>
          html`<moz-input-date label=${type} date-type=${type}></moz-input-date>`,
      )}
    </div>
  `,
};

export const TimeWithStep: Story = {
  args: { label: 'Start time', dateType: 'time', value: '09:30' },
  render: (args) => html`
    <moz-input-date
      label=${args.label}
      date-type="time"
      value=${ifDefined(args.value)}
      step="900"
    ></moz-input-date>
  `,
};

// min/max reach the control, so native range validity applies.
export const RangeValidity: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: '2020-01-01', min: '2026-01-01', max: '2026-12-31' },
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await wait();
    const inner = input.shadowRoot!.querySelector('input')!;
    expect(inner.getAttribute('min')).toBe('2026-01-01');
    expect(input.checkValidity()).toBe(false);
    expect(input.validity.rangeUnderflow).toBe(true);

    input.value = '2026-06-01';
    await wait();
    expect(input.checkValidity()).toBe(true);
  },
};

// The date type drives the native type. Asserted on the attribute, not the
// `type` property: an engine that doesn't implement a type (month and week in
// Firefox and WebKit) reports `text` there, which is the platform degrading,
// not us failing to set it.
export const DateTypeSwitches: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    for (const type of dateTypes) {
      input.dateType = type;
      await input.updateComplete;
      const inner = input.shadowRoot!.querySelector('input')!;
      expect(inner.getAttribute('type')).toBe(type);
    }
  },
};

export const ValueAsDate: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: '2026-04-01' },
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await wait();
    expect(input.valueAsDate?.toISOString()).toBe('2026-04-01T00:00:00.000Z');

    input.value = '';
    await wait();
    expect(input.valueAsDate).toBeNull();
  },
};

// The platform string is what a form submits, not a localized rendering.
export const InForm: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <form>
      <moz-input-date
        name="released"
        label="Released"
        value="2026-04-01"
      ></moz-input-date>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    await wait();
    expect(new FormData(form).get('released')).toBe('2026-04-01');
  },
};
