import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import './moz-button';
import '../moz-provider/moz-provider';
import { type IconName, iconNames } from '../../generated/icons';
import type { ButtonSize, ButtonVariant } from './moz-button';

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

// Icon-only; a string value of icon-only is the accessible name.
export const Icon: Story = {
  render: () => html`
    <moz-button icon-only="Close" variant="ghost" icon-start="close">
    </moz-button>
  `,
};

// The bare boolean still works; then the name comes from slotted hidden text.
export const IconWithSlottedLabel: Story = {
  render: () => html`
    <moz-button icon-only variant="ghost" icon-start="close">
      <span class="visually-hidden">Close</span>
    </moz-button>
  `,
};

export const IconOnlyLabelRenders: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-button id="labelled" icon-only="Close" icon-start="close"></moz-button>
    <moz-button id="slotted" icon-only icon-start="close"
      ><span class="visually-hidden">Close</span></moz-button
    >
  `,
  play: async ({ canvasElement }) => {
    const labelled = canvasElement.querySelector<HTMLElement>('#labelled')!;
    const slotted = canvasElement.querySelector<HTMLElement>('#slotted')!;
    await (labelled as unknown as { updateComplete: Promise<unknown> })
      .updateComplete;
    await (slotted as unknown as { updateComplete: Promise<unknown> })
      .updateComplete;

    expect(
      labelled.shadowRoot!.querySelector('.visually-hidden')?.textContent,
    ).toBe('Close');
    // Still compact: the string form keeps the icon-only attribute reflected.
    expect(labelled.getAttribute('icon-only')).toBe('Close');
    expect(slotted.getAttribute('icon-only')).toBe('');
    expect(slotted.shadowRoot!.querySelector('.visually-hidden')).toBeNull();
  },
};

// A page that breaks words anywhere (`word-break: break-all` and friends) is
// inherited into the shadow tree, where it used to split button labels mid-word.
export const KeepsWordsWhole: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <div style="word-break:break-all;overflow-wrap:anywhere;hyphens:auto;">
      <div style="inline-size:90px;">
        <moz-button variant="primary">Unsubscribe</moz-button>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('moz-button')!;
    await (button as unknown as { updateComplete: Promise<unknown> })
      .updateComplete;
    await document.fonts.ready;

    // One client rect per line box, so a label split across lines gives more
    // than one — whatever the container does to it.
    const range = document.createRange();
    range.selectNodeContents(button);
    expect(range.getClientRects().length).toBe(1);
  },
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

// With href it's a real link, styled as a button.
export const Link: Story = {
  render: () => html`
    <moz-button variant="primary" href="https://example.com" target="_blank"
      >Open docs</moz-button
    >
  `,
};

// href renders an <a> (with rel defaulted for _blank); disabled keeps a <button>.
export const LinkRenders: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-button id="link" href="/docs" target="_blank">Docs</moz-button>
    <moz-button id="disabled" href="/docs" disabled>Docs</moz-button>
  `,
  play: async ({ canvasElement }) => {
    const link = canvasElement.querySelector<HTMLElement>('#link')!;
    const disabled = canvasElement.querySelector<HTMLElement>('#disabled')!;
    await (link as unknown as { updateComplete: Promise<unknown> })
      .updateComplete;
    await (disabled as unknown as { updateComplete: Promise<unknown> })
      .updateComplete;

    const anchor = link.shadowRoot!.querySelector('a')!;
    expect(anchor).toBeTruthy();
    expect(anchor.getAttribute('href')).toBe('/docs');
    expect(anchor.getAttribute('target')).toBe('_blank');
    expect(anchor.getAttribute('rel')).toBe('noopener');
    expect(link.shadowRoot!.querySelector('button')).toBeNull();

    // Disabled + href stays a <button> (a disabled link isn't a real state).
    expect(disabled.shadowRoot!.querySelector('a')).toBeNull();
    expect(disabled.shadowRoot!.querySelector('button')?.disabled).toBe(true);
  },
};
