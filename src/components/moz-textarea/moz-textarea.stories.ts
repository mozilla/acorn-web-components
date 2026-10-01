import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-textarea';
import type { MozTextarea, TextareaResize } from './moz-textarea';

interface Args {
  label: string;
  name?: string;
  value?: string;
  rows: number;
  placeholder?: string;
  description?: string;
  error?: string;
  maxlength?: number;
  showCounter: boolean;
  resize: TextareaResize;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  fullWidth: boolean;
}

const lorem =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const meta: Meta<Args> = {
  title: 'Components/Input Textarea',
  component: 'moz-textarea',
  tags: ['autodocs'],
  decorators: [logEvents('input', 'change')],
  argTypes: {
    label: { control: 'text' },
    name: { control: 'text' },
    value: { control: 'text' },
    rows: { control: 'number' },
    placeholder: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    maxlength: { control: 'number' },
    showCounter: { control: 'boolean' },
    resize: {
      control: 'select',
      options: ['both', 'vertical', 'horizontal', 'none'],
    },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    required: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
  args: {
    label: 'Description',
    name: 'description',
    rows: 2,
    placeholder: 'Tell us about your add-on…',
    showCounter: false,
    resize: 'both',
    disabled: false,
    readonly: false,
    required: false,
    fullWidth: false,
  },
  render: (args) => html`
    <moz-textarea
      label=${args.label}
      name=${ifDefined(args.name)}
      value=${ifDefined(args.value)}
      rows=${args.rows}
      placeholder=${ifDefined(args.placeholder)}
      description=${ifDefined(args.description)}
      error=${ifDefined(args.error)}
      maxlength=${ifDefined(args.maxlength)}
      ?show-counter=${args.showCounter}
      resize=${args.resize}
      ?disabled=${args.disabled}
      ?readonly=${args.readonly}
      ?required=${args.required}
      ?full-width=${args.fullWidth}
    ></moz-textarea>
  `,
};

export default meta;
type Story = StoryObj<Args>;

const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const el = (root: HTMLElement) =>
  root.querySelector<MozTextarea>('moz-textarea')!;
const counter = (node: MozTextarea) =>
  node.shadowRoot!.querySelector('.counter');

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const area = el(canvasElement);
    await area.updateComplete;
    const inner = area.shadowRoot!.querySelector('textarea')!;
    expect(inner).toBeTruthy();
    expect(inner.rows).toBe(2);
    // No counter unless asked for or bounded.
    expect(counter(area)).toBeNull();
  },
};

export const WithDescription: Story = {
  args: {
    value: lorem,
    rows: 4,
    description: 'Shown on your add-on’s listing page.',
  },
};

export const Rows: Story = {
  args: { label: 'Summary', rows: 6, value: lorem },
};

export const Required: Story = { args: { required: true } };
export const Disabled: Story = { args: { value: lorem, disabled: true } };
export const ReadOnly: Story = { args: { value: lorem, readonly: true } };
export const WithError: Story = {
  args: { value: 'Too short', error: 'Please write at least 50 characters.' },
};

// A limit implies a counter; no flag needed.
export const WithMaxlength: Story = {
  args: { label: 'Summary', maxlength: 250, value: lorem, rows: 4 },
  play: async ({ canvasElement }) => {
    const area = el(canvasElement);
    await area.updateComplete;
    expect(area.shadowRoot!.querySelector('textarea')!.maxLength).toBe(250);
    expect(counter(area)!.textContent?.trim()).toBe(`${lorem.length}/250`);
  },
};

// Counter without a limit: a plain count.
export const CounterWithoutLimit: Story = {
  args: { label: 'Notes', showCounter: true, value: 'Hello' },
  play: async ({ canvasElement }) => {
    const area = el(canvasElement);
    await area.updateComplete;
    expect(counter(area)!.textContent?.trim()).toBe('5');
  },
};

export const FullWidth: Story = {
  args: { value: lorem, rows: 4, fullWidth: true },
};

// --- interaction tests ---

// Enter inserts a newline instead of submitting; Ctrl/Cmd+Enter submits.
export const EnterDoesNotSubmit: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <form
      @submit=${(e: Event) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setAttribute('data-submitted', 'true');
      }}
    >
      <moz-textarea label="Notes" value="line one"></moz-textarea>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const inner = el(canvasElement).shadowRoot!.querySelector('textarea')!;

    const press = (init: KeyboardEventInit) =>
      inner.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          composed: true,
          ...init,
        }),
      );

    press({});
    await wait();
    expect(form.hasAttribute('data-submitted')).toBe(false);

    press({ ctrlKey: true });
    await wait();
    expect(form.getAttribute('data-submitted')).toBe('true');
  },
};

// The counter tracks typing and only opens a live region near the limit.
export const CounterUpdates: Story = {
  tags: ['!dev', '!autodocs'],
  args: { maxlength: 20, value: '' },
  play: async ({ canvasElement }) => {
    const area = el(canvasElement);
    await area.updateComplete;
    expect(counter(area)!.textContent?.trim()).toBe('0/20');
    // Far from the limit: silent.
    expect(counter(area)!.getAttribute('aria-live')).toBe('off');

    const inner = area.shadowRoot!.querySelector('textarea')!;
    inner.value = 'twelve chars';
    inner.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await area.updateComplete;
    expect(counter(area)!.textContent?.trim()).toBe('12/20');
    // 8 remaining, within the threshold: now announced.
    expect(counter(area)!.getAttribute('aria-live')).toBe('polite');
  },
};

// select() reaches a textarea, not just an input (base class delegation).
export const SelectsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: 'hello' },
  play: async ({ canvasElement }) => {
    const area = el(canvasElement);
    await area.updateComplete;
    area.focus();
    area.select();
    const inner = area.shadowRoot!.querySelector('textarea')!;
    expect(inner.selectionStart).toBe(0);
    expect(inner.selectionEnd).toBe('hello'.length);
  },
};

// Form association and reset behave like the single-line field.
export const InForm: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <form>
      <moz-textarea name="summary" label="Summary" value="Draft"></moz-textarea>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const area = el(canvasElement);
    await wait();
    expect(new FormData(form).get('summary')).toBe('Draft');

    area.value = 'Edited';
    await wait();
    expect(new FormData(form).get('summary')).toBe('Edited');

    form.reset();
    await wait();
    expect(area.value).toBe('Draft');
  },
};

// Validation mirrors from the textarea, same as any other control.
export const Validation: Story = {
  tags: ['!dev', '!autodocs'],
  args: { required: true, value: '' },
  play: async ({ canvasElement }) => {
    const area = el(canvasElement);
    await wait();
    expect(area.checkValidity()).toBe(false);
    expect(area.validity.valueMissing).toBe(true);

    area.value = 'Present';
    await wait();
    expect(area.checkValidity()).toBe(true);
  },
};

// Composed events cross the shadow boundary.
export const EmitsComposedEvents: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const area = el(canvasElement);
    await area.updateComplete;
    let inputs = 0;
    let changes = 0;
    area.addEventListener('input', () => inputs++);
    area.addEventListener('change', () => changes++);

    const inner = area.shadowRoot!.querySelector('textarea')!;
    inner.value = 'typed';
    inner.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    inner.dispatchEvent(new Event('change', { bubbles: true }));
    await wait();

    expect(inputs).toBe(1);
    expect(changes).toBe(1);
    expect(area.value).toBe('typed');
  },
};

// Resize maps onto the textarea's CSS, and a horizontal drag has to grow the
// host too — field-width.css would otherwise clamp it and the drag would
// silently do nothing. The drag itself isn't scriptable, so this sets the
// inline width the browser would set and checks the host follows.
export const ResizeGrowsHost: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: 'resize me' },
  play: async ({ canvasElement }) => {
    const area = el(canvasElement);
    await area.updateComplete;
    const inner = area.shadowRoot!.querySelector('textarea')!;
    const styleOf = (node: Element) => getComputedStyle(node).resize;

    expect(styleOf(inner)).toBe('both');
    const startWidth = area.getBoundingClientRect().width;

    inner.style.width = `${startWidth + 120}px`;
    await wait();
    expect(area.getBoundingClientRect().width).toBeGreaterThan(startWidth);

    // Vertical-only keeps the host at its configured width.
    inner.style.width = '';
    area.resize = 'vertical';
    await area.updateComplete;
    expect(styleOf(inner)).toBe('vertical');
    expect(area.getBoundingClientRect().width).toBeCloseTo(startWidth, 0);

    area.resize = 'none';
    await area.updateComplete;
    expect(styleOf(inner)).toBe('none');
  },
};

// The grip sits one --space-xsmall step in from the field border on both edges,
// rather than inheriting the single-line field's larger inline padding. The
// step is 0.25rem against Nova's 15px root, so it resolves to 3.75px — asserted
// against the resolved token rather than a literal, since the whole spacing
// scale lands on non-integer pixels.
export const GripInset: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const area = el(canvasElement);
    await area.updateComplete;
    const field = area.shadowRoot!.querySelector('.field')!;
    const inner = area.shadowRoot!.querySelector('textarea')!;

    const step = Number.parseFloat(
      getComputedStyle(area).getPropertyValue('--space-xsmall'),
    );
    const stepPx = step * Number.parseFloat(getComputedStyle(area).fontSize);

    const fieldPad = getComputedStyle(field);
    expect(Number.parseFloat(fieldPad.paddingBottom)).toBeCloseTo(stepPx, 1);
    expect(Number.parseFloat(fieldPad.paddingRight)).toBeCloseTo(stepPx, 1);

    // Measured from the field's border box, the gap is the border plus that one
    // step — and it's the same on every edge, so the grip is evenly inset.
    const inset = stepPx + Number.parseFloat(fieldPad.borderBottomWidth);
    const fieldBox = field.getBoundingClientRect();
    const innerBox = inner.getBoundingClientRect();
    expect(fieldBox.bottom - innerBox.bottom).toBeCloseTo(inset, 1);
    expect(fieldBox.right - innerBox.right).toBeCloseTo(inset, 1);
    expect(innerBox.left - fieldBox.left).toBeCloseTo(inset, 1);
    expect(innerBox.top - fieldBox.top).toBeCloseTo(inset, 1);
  },
};
