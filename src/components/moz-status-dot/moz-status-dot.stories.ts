import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import './moz-status-dot';
import type { StatusDotType } from './moz-status-dot';

interface Args {
  type: StatusDotType;
  icon: boolean;
  label?: string;
}

const types: StatusDotType[] = [
  'information',
  'success',
  'warning',
  'critical',
];

const meta: Meta<Args> = {
  title: 'Components/Status Dot',
  component: 'moz-status-dot',
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: types },
    icon: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: { type: 'information', icon: false },
  render: (args) => html`
    <moz-status-dot
      type=${args.type}
      ?icon=${args.icon}
      label=${ifDefined(args.label)}
    ></moz-status-dot>
  `,
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const dot = canvasElement.querySelector('moz-status-dot')!;
    await dot.updateComplete;
    expect(dot.shadowRoot?.querySelector('.dot')).toBeTruthy();
    // No icon: a solid dot, no glyph.
    expect(dot.shadowRoot?.querySelector('moz-icon')).toBeNull();
  },
};

export const WithIcon: Story = {
  args: { type: 'success', icon: true, label: 'Approved' },
  play: async ({ canvasElement }) => {
    const dot = canvasElement.querySelector('moz-status-dot')!;
    await dot.updateComplete;
    // The glyph matches the type (success -> checkmark-circle-fill).
    const glyph = dot.shadowRoot?.querySelector('moz-icon');
    expect(glyph?.getAttribute('name')).toBe('checkmark-circle-fill');
    // A labelled dot is exposed to assistive tech.
    expect(dot.getAttribute('role')).toBe('img');
    expect(dot.getAttribute('aria-label')).toBe('Approved');
  },
};

export const Dots: Story = {
  render: () => html`
    <div style="display:flex;gap:8px;align-items:center;">
      ${types.map((t) => html`<moz-status-dot type=${t}></moz-status-dot>`)}
    </div>
  `,
};

export const IconDots: Story = {
  render: () => html`
    <div style="display:flex;gap:8px;align-items:center;">
      ${types.map((t) => html`<moz-status-dot type=${t} icon></moz-status-dot>`)}
    </div>
  `,
};
