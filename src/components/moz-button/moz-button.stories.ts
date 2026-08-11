import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import './moz-button.js';
import '../moz-provider/moz-provider.js';
import { type IconName, iconNames } from '../../generated/icons.js';
import type { ButtonSize, ButtonVariant } from './moz-button.js';

interface ButtonArgs {
  label: string;
  variant: ButtonVariant;
  size: ButtonSize;
  disabled: boolean;
  iconStart?: IconName;
  iconEnd?: IconName;
}

const variants: ButtonVariant[] = [
  'default',
  'primary',
  'destructive',
  'ghost',
  'muted',
];
const sizes: ButtonSize[] = ['small', 'medium', 'large'];

const meta: Meta<ButtonArgs> = {
  title: 'Components/Button',
  component: 'moz-button',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    variant: { control: 'select', options: variants },
    size: { control: 'select', options: sizes },
    disabled: { control: 'boolean' },
    iconStart: { control: 'select', options: [undefined, ...iconNames] },
    iconEnd: { control: 'select', options: [undefined, ...iconNames] },
  },
  args: {
    label: 'Button',
    variant: 'default',
    size: 'medium',
    disabled: false,
  },
  render: (args) => html`
    <moz-button
      variant=${args.variant}
      size=${args.size}
      ?disabled=${args.disabled}
      icon-start=${ifDefined(args.iconStart)}
      icon-end=${ifDefined(args.iconEnd)}
    >
      ${args.label}
    </moz-button>
  `,
};

export default meta;
type Story = StoryObj<ButtonArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('moz-button');
    expect(button).toBeTruthy();
    const inner = button?.shadowRoot?.querySelector('button');
    expect(inner).toBeTruthy();
  },
};

export const Primary: Story = { args: { variant: 'primary', label: 'Save' } };
export const Destructive: Story = {
  args: { variant: 'destructive', label: 'Delete' },
};
export const Ghost: Story = { args: { variant: 'ghost', label: 'Cancel' } };
export const Muted: Story = { args: { variant: 'muted', label: 'Quiet' } };
export const WithIcon: Story = {
  args: { variant: 'primary', label: 'Edit', iconStart: 'edit' },
};

export const InForm: Story = {
  render: () => html`
    <form
      @submit=${(e: Event) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setAttribute('data-submitted', 'true');
      }}
    >
      <moz-button type="submit" variant="primary">Submit</moz-button>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const inner = canvasElement
      .querySelector('moz-button')!
      .shadowRoot!.querySelector('button')!;
    inner.click();
    await new Promise((r) => setTimeout(r, 20));
    // Form association: the shadow button's click submitted the light-DOM form.
    expect(form.getAttribute('data-submitted')).toBe('true');
  },
};

export const Reset: Story = {
  render: () => html`
    <form>
      <input aria-label="Name" name="name" value="default" />
      <moz-button type="reset">Reset</moz-button>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('input')!;
    const inner = canvasElement
      .querySelector('moz-button')!
      .shadowRoot!.querySelector('button')!;
    input.value = 'changed';
    inner.click();
    await new Promise((r) => setTimeout(r, 20));
    // Form association: the shadow button's click reset the light-DOM form.
    expect(input.value).toBe('default');
  },
};

export const DisabledDoesNotSubmit: Story = {
  render: () => html`
    <form
      @submit=${(e: Event) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setAttribute('data-submitted', 'true');
      }}
    >
      <moz-button type="submit" variant="primary" disabled>Submit</moz-button>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const inner = canvasElement
      .querySelector('moz-button')!
      .shadowRoot!.querySelector('button')!;
    // A disabled button ignores activation, so the form must not submit.
    inner.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 20));
    expect(form.hasAttribute('data-submitted')).toBe(false);
  },
};

export const Variants: Story = {
  render: () => html`
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
      ${variants.map((v) => html`<moz-button variant=${v}>${v}</moz-button>`)}
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex;gap:12px;align-items:center;">
      ${sizes.map((s) => html`<moz-button size=${s}>${s}</moz-button>`)}
    </div>
  `,
};
