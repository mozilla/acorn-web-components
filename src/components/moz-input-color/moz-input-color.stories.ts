import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-input-color';
import type { InputColorSize, MozInputColor } from './moz-input-color';

interface Args {
  label: string;
  name?: string;
  value?: string;
  description?: string;
  error?: string;
  disabled: boolean;
  fullWidth: boolean;
  showValue: boolean;
  size: InputColorSize;
}

const meta: Meta<Args> = {
  title: 'Components/Input Color',
  component: 'moz-input-color',
  tags: ['autodocs'],
  decorators: [logEvents('input', 'change')],
  argTypes: {
    label: { control: 'text' },
    name: { control: 'text' },
    value: { control: 'color' },
    description: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    showValue: { control: 'boolean' },
    size: { control: 'inline-radio', options: ['default', 'small'] },
  },
  args: {
    label: 'Highlight colour',
    name: 'highlight',
    value: '#0060df',
    disabled: false,
    fullWidth: false,
    showValue: false,
    size: 'default',
  },
  render: (args) => html`
    <moz-input-color
      label=${args.label}
      name=${ifDefined(args.name)}
      value=${ifDefined(args.value)}
      description=${ifDefined(args.description)}
      error=${ifDefined(args.error)}
      ?disabled=${args.disabled}
      ?full-width=${args.fullWidth}
      ?show-value=${args.showValue}
      size=${args.size}
    ></moz-input-color>
  `,
};

export default meta;
type Story = StoryObj<Args>;

const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const el = (root: HTMLElement) =>
  root.querySelector<MozInputColor>('moz-input-color')!;
const swatch = (node: MozInputColor) =>
  node.shadowRoot!.querySelector('input') as HTMLInputElement;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    expect(swatch(input).type).toBe('color');
    expect(swatch(input).value).toBe('#0060df');
  },
};

export const WithDescription: Story = {
  args: { description: 'Used for links and selected rows.' },
};

export const Disabled: Story = { args: { disabled: true } };
export const WithError: Story = {
  args: { error: 'Pick a colour with enough contrast.' },
};
export const FullWidth: Story = { args: { fullWidth: true } };

// The row shows the selected hex, so the label moves above it.
export const ShowValue: Story = {
  args: { showValue: true, value: '#0060df' },
};

// 32px, to line up with the text fields in the same form.
export const Small: Story = { args: { size: 'small' } };

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:12px;">
      <moz-input-color label="Default (40px)" value="#0060df"></moz-input-color>
      <moz-input-color
        label="Small (32px)"
        value="#0060df"
        size="small"
      ></moz-input-color>
      <moz-input-color
        label="Default, value shown"
        value="#0060df"
        show-value
      ></moz-input-color>
      <moz-input-color
        label="Small, value shown"
        value="#0060df"
        show-value
        size="small"
      ></moz-input-color>
    </div>
  `,
};

// Black is the platform's own default for a colour input.
export const DefaultsToBlack: Story = {
  render: () => html`<moz-input-color label="Accent"></moz-input-color>`,
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    expect(input.value).toBe('#000000');
    expect(swatch(input).value).toBe('#000000');
  },
};

export const Swatches: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${['#0060df', '#2ac3a2', '#ffa537', '#ff4f5e', '#9059ff'].map(
        (colour) =>
          html`<moz-input-color
            label=${colour}
            value=${colour}
          ></moz-input-color>`,
      )}
    </div>
  `,
};

// --- interaction tests ---

// The swatch is round, and the edit affordance sits at the trailing edge even
// though the base renders it before the label text.
export const LayoutOrder: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    await wait();

    const box = input.shadowRoot!.querySelector('label')!;
    const edit = input.shadowRoot!.querySelector('.edit')!;
    const labelText = input.shadowRoot!.querySelector('.label-text')!;

    // Round: the radius is at least half the swatch, whichever engine draws it.
    const swatchBox = swatch(input).getBoundingClientRect();
    const radius = Number.parseFloat(
      getComputedStyle(swatch(input)).borderStartStartRadius,
    );
    expect(radius).toBeGreaterThanOrEqual(swatchBox.width / 2);
    expect(swatchBox.width).toBeCloseTo(swatchBox.height, 0);

    // Visual order: swatch, label text, then the edit icon at the far edge.
    expect(swatchBox.left).toBeLessThan(labelText.getBoundingClientRect().left);
    const editBox = edit.getBoundingClientRect();
    expect(editBox.left).toBeGreaterThan(
      labelText.getBoundingClientRect().right,
    );
    expect(box.getBoundingClientRect().right - editBox.right).toBeLessThan(16);
  },
};

// The edit icon is decorative, so it must not be announced or focusable.
export const EditIconIsDecorative: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    await wait();
    const edit = input.shadowRoot!.querySelector('.edit')!;
    expect(edit.getAttribute('aria-hidden')).toBe('true');
    expect(edit.hasAttribute('tabindex')).toBe(false);

    // Focus goes to the swatch, and the row is a single tab stop.
    input.focus();
    expect(input.shadowRoot!.activeElement).toBe(swatch(input));
  },
};

// Clicking anywhere on the row opens the picker, because the row is the label.
export const RowIsTheControl: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    const box = input.shadowRoot!.querySelector('label')!;
    expect(box.getAttribute('for')).toBe('input');
    expect(getComputedStyle(box).cursor).toBe('pointer');
  },
};

export const EmitsComposedEvents: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    let inputs = 0;
    let changes = 0;
    input.addEventListener('input', () => inputs++);
    input.addEventListener('change', () => changes++);

    const inner = swatch(input);
    inner.value = '#2ac3a2';
    inner.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    inner.dispatchEvent(new Event('change', { bubbles: true }));
    await wait();

    expect(inputs).toBe(1);
    expect(changes).toBe(1);
    expect(input.value).toBe('#2ac3a2');
  },
};

export const InForm: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <form>
      <moz-input-color
        name="highlight"
        label="Highlight"
        value="#0060df"
      ></moz-input-color>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const input = el(canvasElement);
    await wait();
    expect(new FormData(form).get('highlight')).toBe('#0060df');

    input.value = '#9059ff';
    await wait();
    expect(new FormData(form).get('highlight')).toBe('#9059ff');

    form.reset();
    await wait();
    expect(input.value).toBe('#0060df');
  },
};

// Disabling stops the row submitting and blocks the picker, like any control.
export const DisabledBehaviour: Story = {
  tags: ['!dev', '!autodocs'],
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await wait();
    expect(swatch(input).disabled).toBe(true);
    expect(
      getComputedStyle(input.shadowRoot!.querySelector('label')!).cursor,
    ).toBe('not-allowed');
  },
};

// `required` marks the label but can't be enforced: the platform always has a
// colour selected, so there's no missing state to catch.
export const RequiredIsCosmetic: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    html`<moz-input-color label="Accent" required></moz-input-color>`,
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await wait();
    expect(input.shadowRoot!.querySelector('.label-required')).toBeTruthy();
    expect(swatch(input).hasAttribute('required')).toBe(false);
    expect(input.checkValidity()).toBe(true);
  },
};

// Pinned to the design: a 40px row around a 24px swatch. The swatch can
// overrun the row and set the height itself, which is how it first hit 33.5px.
export const Metrics: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    await wait();

    const row = input
      .shadowRoot!.querySelector('label')!
      .getBoundingClientRect();
    const dot = swatch(input).getBoundingClientRect();

    expect(row.height).toBeCloseTo(40, 0);
    expect(dot.width).toBeCloseTo(24, 0);
    expect(dot.height).toBeCloseTo(24, 0);
  },
};

// show-value swaps what the row displays and where the label sits: the hex goes
// inside (upper-cased, without touching `value`) and the label moves above.
export const ShowValueMovesLabel: Story = {
  tags: ['!dev', '!autodocs'],
  args: { showValue: true, value: '#0060df' },
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    await wait();

    expect(input.inputLayout).toBe('block');
    const readout = input.shadowRoot!.querySelector('.value')!;
    expect(readout.textContent?.trim()).toBe('#0060DF');
    // Upper-cased for display only.
    expect(input.value).toBe('#0060df');

    // The row is now .field, and the label sits outside it.
    const field = input.shadowRoot!.querySelector('.field')!;
    const label = input.shadowRoot!.querySelector('label')!;
    expect(field.contains(label)).toBe(false);
    expect(label.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      field.getBoundingClientRect().top,
    );

    // The readout tracks the value and stays out of the accessibility tree.
    expect(readout.getAttribute('aria-hidden')).toBe('true');
    input.value = '#2ac3a2';
    await input.updateComplete;
    expect(input.shadowRoot!.querySelector('.value')!.textContent?.trim()).toBe(
      '#2AC3A2',
    );
  },
};

// Toggling back restores the label-inside-the-row layout.
export const ShowValueIsReversible: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    expect(input.inputLayout).toBe('inline');

    input.showValue = true;
    await input.updateComplete;
    expect(input.inputLayout).toBe('block');

    input.showValue = false;
    await input.updateComplete;
    expect(input.inputLayout).toBe('inline');
    expect(input.shadowRoot!.querySelector('.value')).toBeNull();
    // Back to the label being the row.
    expect(
      input.shadowRoot!.querySelector('label')!.contains(swatch(input)),
    ).toBe(true);
  },
};

// `small` matches the 32px text fields, with a swatch that fits inside it.
export const SmallMetrics: Story = {
  tags: ['!dev', '!autodocs'],
  args: { size: 'small' },
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    await wait();

    const row = input
      .shadowRoot!.querySelector('label')!
      .getBoundingClientRect();
    const dot = swatch(input).getBoundingClientRect();
    expect(row.height).toBeCloseTo(32, 0);
    expect(dot.width).toBeCloseTo(16, 0);

    // The swatch must not overrun the row (see Metrics).
    expect(dot.height).toBeLessThan(row.height);
  },
};

// The whole row opens the picker in both layouts. In `show-value` mode the row
// isn't the label, so without forwarding only the 24px swatch would respond.
export const RowOpensPickerWithValueShown: Story = {
  tags: ['!dev', '!autodocs'],
  args: { showValue: true, value: '#0060df' },
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    await wait();

    const inner = swatch(input);
    let opened = 0;
    inner.showPicker = () => {
      opened++;
    };

    const click = (node: Element) =>
      node.dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true }),
      );

    // The hex readout, the edit affordance, and the row itself all count.
    click(input.shadowRoot!.querySelector('.value')!);
    click(input.shadowRoot!.querySelector('.edit')!);
    click(input.shadowRoot!.querySelector('.field')!);
    await wait();
    expect(opened).toBe(3);

    // A click that already landed on the swatch isn't forwarded, or it would
    // recurse through click().
    click(inner);
    await wait();
    expect(opened).toBe(3);
  },
};

// Disabled rows stay inert.
export const DisabledRowDoesNotOpenPicker: Story = {
  tags: ['!dev', '!autodocs'],
  args: { showValue: true, disabled: true },
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    await wait();

    let opened = 0;
    swatch(input).showPicker = () => {
      opened++;
    };
    input
      .shadowRoot!.querySelector('.value')!
      .dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true }),
      );
    await wait();
    expect(opened).toBe(0);
  },
};

// The edit icon takes the label text's colour in every state. moz-icon
// otherwise resolves --icon-color, which wouldn't follow the row.
export const EditIconMatchesLabelColour: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const input = el(canvasElement);
    await input.updateComplete;
    await wait(50);

    const colours = () => ({
      icon: getComputedStyle(input.shadowRoot!.querySelector('.edit')!).color,
      text: getComputedStyle(input.shadowRoot!.querySelector('.label-text')!)
        .color,
    });

    const enabled = colours();
    expect(enabled.icon).toBe(enabled.text);

    input.disabled = true;
    await input.updateComplete;
    const disabled = colours();
    expect(disabled.icon).toBe(disabled.text);
    // And the disabled state actually changed the colour, so the match above
    // isn't just both being the default.
    expect(disabled.text).not.toBe(enabled.text);
  },
};
