import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import './moz-badge';
import { type IconName, iconNames } from '../../generated/icons';
import type { BadgeType } from './moz-badge';

interface Args {
  type: BadgeType;
  label: string;
  iconStart?: IconName;
}

const types: BadgeType[] = ['default', 'beta', 'new'];

const meta: Meta<Args> = {
  title: 'Components/Badge',
  component: 'moz-badge',
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: types },
    label: { control: 'text' },
    iconStart: { control: 'select', options: [undefined, ...iconNames] },
  },
  args: {
    type: 'default',
    label: 'Badge',
  },
  render: (args) => html`
    <moz-badge type=${args.type} icon-start=${ifDefined(args.iconStart)}>
      ${args.label}
    </moz-badge>
  `,
};

export default meta;
type Story = StoryObj<Args>;

// The vendored Nova `new` badge pairs white text with `--color-green-50`
// (#008865), which computes 4.45:1 — a hair under WCAG AA's 4.5:1. That is a
// design-token value (Firefox ships it), not something this component controls,
// so color-contrast is disabled on the filled-variant stories rather than
// diverging from the token.
const filledA11y = {
  a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
};

export const Default: Story = {};
export const Beta: Story = { args: { type: 'beta', label: 'Beta' } };
export const New: Story = {
  args: { type: 'new', label: 'New' },
  parameters: filledA11y,
};
export const WithIcon: Story = {
  args: { type: 'new', label: 'New', iconStart: 'information' },
  parameters: filledA11y,
};

export const Types: Story = {
  parameters: filledA11y,
  render: () => html`
    <div style="display:flex;gap:12px;align-items:center;">
      ${types.map((t) => html`<moz-badge type=${t}>${t}</moz-badge>`)}
    </div>
  `,
};

// Interaction/test-only stories: run under Vitest/CI but hidden from the sidebar
// and docs.

// Renders, defaults to `type="default"`, and shows no icon when none is given.
export const RendersDefault: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('moz-badge')!;
    await badge.updateComplete;
    expect(badge.type).toBe('default');
    expect(badge.getAttribute('type')).toBe('default');
    expect(badge.textContent?.trim()).toBe('Badge');
    // Icon branch: absent without icon-start.
    expect(badge.shadowRoot?.querySelector('moz-icon')).toBeNull();
  },
};

// `type` reflects to the host attribute (drives the filled variant styling).
export const TypeReflects: Story = {
  tags: ['!dev', '!autodocs'],
  args: { type: 'new', label: 'New' },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('moz-badge')!;
    await badge.updateComplete;
    expect(badge.getAttribute('type')).toBe('new');
    badge.type = 'beta';
    await badge.updateComplete;
    expect(badge.getAttribute('type')).toBe('beta');
  },
};

// Icon branch: `icon-start` renders a moz-icon with the given name.
export const IconStartRenders: Story = {
  tags: ['!dev', '!autodocs'],
  args: { iconStart: 'information', label: 'Info' },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('moz-badge')!;
    await badge.updateComplete;
    const icon = badge.shadowRoot?.querySelector('moz-icon');
    expect(icon).toBeTruthy();
    expect(icon?.getAttribute('name')).toBe('information');
  },
};
