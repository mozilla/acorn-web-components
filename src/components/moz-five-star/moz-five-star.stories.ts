import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import type { IconSize } from '../../generated/icon-options';
import { iconSizes } from '../../generated/icon-options';
import './moz-five-star';

interface Args {
  rating: number;
  max: number;
  selectable: boolean;
  size?: IconSize;
}

const meta: Meta<Args> = {
  title: 'Components/FiveStar',
  component: 'moz-five-star',
  tags: ['autodocs'],
  decorators: [logEvents('moz-five-star:change')],
  argTypes: {
    rating: { control: { type: 'number', min: 0, max: 5, step: 0.5 } },
    max: { control: { type: 'number', min: 1, max: 10, step: 1 } },
    selectable: { control: 'boolean' },
    size: { control: 'select', options: iconSizes },
  },
  args: {
    rating: 4.5,
    max: 5,
    selectable: false,
  },
  render: (args) => html`
    <moz-five-star
      rating=${args.rating}
      max=${args.max}
      ?selectable=${args.selectable}
      size=${ifDefined(args.size)}
    ></moz-five-star>
  `,
};

export default meta;
type Story = StoryObj<Args>;

export const Empty: Story = { args: { rating: 0 } };
export const Half: Story = { args: { rating: 2.5 } };
export const Full: Story = { args: { rating: 5 } };
export const Partial: Story = { args: { rating: 3.5 } };

// Interactive: click or use the arrow keys to pick a whole-star rating.
export const Selectable: Story = { args: { rating: 0, selectable: true } };

export const Scale: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${[0, 1.5, 2.5, 3.5, 4.5, 5].map(
        (r) => html`<moz-five-star rating=${r}></moz-five-star>`,
      )}
    </div>
  `,
};

// Stars scale with the shared Nova icon-size steps.
export const Sizes: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:12px;align-items:start;">
      ${iconSizes.map(
        (s) => html`<moz-five-star rating="3.5" size=${s}></moz-five-star>`,
      )}
    </div>
  `,
};

// Interaction test: assert the rendered fill states and the accessible label.
export const RendersRatingAndLabel: Story = {
  tags: ['!dev', '!autodocs'],
  args: { rating: 3.5, max: 5 },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-five-star')!;
    await el.updateComplete;
    const container = el.shadowRoot!.querySelector('.stars')!;
    // Read-only display exposed as a single labeled image.
    expect(container.getAttribute('role')).toBe('img');
    expect(container.getAttribute('aria-label')).toBe('3.5 out of 5 stars');
    // 3.5 rounds to three full + one half + one empty.
    const fills = [...el.shadowRoot!.querySelectorAll('.star')].map((s) =>
      s.getAttribute('data-fill'),
    );
    expect(fills).toEqual(['full', 'full', 'full', 'half', 'empty']);
    // Individual stars are hidden from assistive tech.
    for (const star of el.shadowRoot!.querySelectorAll('.star')) {
      expect(star.getAttribute('aria-hidden')).toBe('true');
    }
  },
};

// Interaction test: selecting fires the change event and updates the rating.
export const SelectsRating: Story = {
  tags: ['!dev', '!autodocs'],
  args: { rating: 0, selectable: true },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-five-star')!;
    await el.updateComplete;
    const changes: number[] = [];
    el.addEventListener('moz-five-star:change', (e) =>
      changes.push((e as CustomEvent<{ value: number }>).detail.value),
    );
    const container = el.shadowRoot!.querySelector('.stars')!;
    // Selectable exposes the radio-group pattern.
    expect(container.getAttribute('role')).toBe('radiogroup');
    const stars = el.shadowRoot!.querySelectorAll<HTMLElement>('.star');
    expect(stars[2].getAttribute('role')).toBe('radio');
    // Clicking the third star sets rating 3, fires the event, checks the radio.
    stars[2].click();
    await el.updateComplete;
    expect(el.rating).toBe(3);
    expect(changes).toEqual([3]);
    expect(
      el.shadowRoot!.querySelectorAll('.star')[2].getAttribute('aria-checked'),
    ).toBe('true');
  },
};
