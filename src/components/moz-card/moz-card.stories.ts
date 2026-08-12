import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import '../moz-button/moz-button';
import './moz-card';
import type { CardSpacing } from './moz-card';

interface Args {
  heading?: string;
  spacing: CardSpacing;
  content: string;
}

const spacings: CardSpacing[] = ['default', 'compact'];

// A neutral placeholder cover image (inline SVG data URI, so no network fetch).
const coverImage =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="160">
       <rect width="320" height="160" fill="#6f5fd6"/>
       <rect width="320" height="160" fill="url(#g)"/>
       <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0" stop-color="#ffffff" stop-opacity="0.25"/>
         <stop offset="1" stop-color="#000000" stop-opacity="0.15"/>
       </linearGradient></defs>
     </svg>`,
  );

const meta: Meta<Args> = {
  title: 'Components/Card',
  component: 'moz-card',
  tags: ['autodocs'],
  argTypes: {
    heading: { control: 'text' },
    spacing: { control: 'select', options: spacings },
    content: { control: 'text' },
  },
  args: {
    heading: 'Card heading',
    spacing: 'default',
    content: 'Cards group related content and actions about a single subject.',
  },
  render: (args) => html`
    <div style="max-inline-size:360px;">
      <moz-card heading=${ifDefined(args.heading)} spacing=${args.spacing}>
        ${args.content}
      </moz-card>
    </div>
  `,
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

// Heading only — no body, media, or actions.
export const HeadingOnly: Story = {
  render: (args) => html`
    <div style="max-inline-size:360px;">
      <moz-card
        heading=${ifDefined(args.heading)}
        spacing=${args.spacing}
      ></moz-card>
    </div>
  `,
};

export const WithMedia: Story = {
  render: (args) => html`
    <div style="max-inline-size:360px;">
      <moz-card heading=${ifDefined(args.heading)} spacing=${args.spacing}>
        <img slot="media" src=${coverImage} alt="" />
        ${args.content}
      </moz-card>
    </div>
  `,
};

export const WithActions: Story = {
  render: (args) => html`
    <div style="max-inline-size:360px;">
      <moz-card heading=${ifDefined(args.heading)} spacing=${args.spacing}>
        ${args.content}
        <moz-button slot="actions" variant="primary" size="small"
          >Confirm</moz-button
        >
        <moz-button slot="actions" size="small">Cancel</moz-button>
      </moz-card>
    </div>
  `,
};

export const Compact: Story = {
  args: { spacing: 'compact' },
  render: (args) => html`
    <div style="max-inline-size:360px;">
      <moz-card heading=${ifDefined(args.heading)} spacing=${args.spacing}>
        <img slot="media" src=${coverImage} alt="" />
        ${args.content}
        <moz-button slot="actions" size="small">Action</moz-button>
      </moz-card>
    </div>
  `,
};

// Custom heading markup via the `heading` slot instead of the attribute.
export const SlottedHeading: Story = {
  render: (args) => html`
    <div style="max-inline-size:360px;">
      <moz-card spacing=${args.spacing}>
        <h2 slot="heading" style="margin:0;font-size:1.1rem;">Slotted heading</h2>
        ${args.content}
      </moz-card>
    </div>
  `,
};

// Interaction test only: every region's slotted content is projected and the
// optional-slot wrappers are revealed. Tagged test-only so it runs under
// Vitest/CI but stays out of the sidebar and docs.
export const SlottedContentRenders: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-card heading="Tested card">
      <p>Body paragraph.</p>
      <img slot="media" src=${coverImage} alt="" />
      <moz-button slot="actions">Confirm</moz-button>
    </moz-card>
  `,
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('moz-card')!;
    await card.updateComplete;
    const root = card.shadowRoot!;

    const defaultSlot =
      root.querySelector<HTMLSlotElement>('slot:not([name])')!;
    expect(
      defaultSlot.assignedElements().some((el) => el.tagName === 'P'),
    ).toBe(true);

    const mediaSlot =
      root.querySelector<HTMLSlotElement>('slot[name="media"]')!;
    expect(mediaSlot.assignedElements().length).toBe(1);
    expect(root.querySelector<HTMLElement>('.media')!.hidden).toBe(false);

    const actionsSlot = root.querySelector<HTMLSlotElement>(
      'slot[name="actions"]',
    )!;
    expect(
      actionsSlot.assignedElements().some((el) => el.tagName === 'MOZ-BUTTON'),
    ).toBe(true);
    expect(root.querySelector<HTMLElement>('.actions')!.hidden).toBe(false);

    // Heading from the attribute renders and labels the article.
    const heading = root.querySelector('#heading');
    expect(heading?.textContent).toContain('Tested card');
    expect(root.querySelector('article')?.getAttribute('aria-labelledby')).toBe(
      'heading',
    );
  },
};
