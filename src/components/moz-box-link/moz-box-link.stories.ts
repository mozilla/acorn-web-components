import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import './moz-box-link';
import type { IconName } from '../../generated/icons';

interface Args {
  label: string;
  description?: string;
  iconStart?: IconName;
  href: string;
}

const meta: Meta<Args> = {
  title: 'Components/Box/Link',
  component: 'moz-box-link',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    iconStart: {
      control: 'select',
      options: [undefined, 'help', 'information', 'settings'],
    },
    href: { control: 'text' },
  },
  args: {
    label: 'Get help on support.mozilla.org',
    href: 'https://support.mozilla.org',
  },
  render: (args) => html`
    <moz-box-link
      label=${args.label}
      description=${ifDefined(args.description)}
      icon-start=${ifDefined(args.iconStart)}
      href=${args.href}
    ></moz-box-link>
  `,
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: {
    label: 'Release notes',
    description: "See what's new in this version.",
  },
};

export const WithIcon: Story = {
  args: { label: 'Support articles', iconStart: 'help' },
};

// Renders an anchor pointing at href, opening in a new tab.
export const AnchorSemantics: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const link = canvasElement.querySelector('moz-box-link')!;
    await link.updateComplete;
    const anchor = link.shadowRoot!.querySelector('a')!;
    expect(anchor.getAttribute('href')).toBe('https://support.mozilla.org');
    expect(anchor.getAttribute('target')).toBe('_blank');
    expect(
      link.shadowRoot!.querySelector('moz-icon')!.getAttribute('name'),
    ).toBe('external-link');
  },
};
