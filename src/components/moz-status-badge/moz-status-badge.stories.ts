import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import './moz-status-badge';
import { type IconName, iconNames } from '../../generated/icons';
import type { StatusBadgeType } from './moz-status-badge';

interface Args {
  type: StatusBadgeType;
  label: string;
  iconStart?: IconName;
}

const types: StatusBadgeType[] = [
  'default',
  'ghost',
  'success',
  'warning',
  'critical',
  'information',
];

const meta: Meta<Args> = {
  title: 'Components/Status Badge',
  component: 'moz-status-badge',
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: types },
    label: { control: 'text' },
    iconStart: { control: 'select', options: [undefined, ...iconNames] },
  },
  args: {
    type: 'default',
    label: 'Status',
  },
  render: (args) => html`
    <moz-status-badge type=${args.type} icon-start=${ifDefined(args.iconStart)}>
      ${args.label}
    </moz-status-badge>
  `,
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('moz-status-badge')!;
    await badge.updateComplete;
    expect(badge.shadowRoot?.querySelector('.badge')).toBeTruthy();
  },
};

export const Ghost: Story = { args: { type: 'ghost', label: 'Draft' } };
export const Success: Story = { args: { type: 'success', label: 'Approved' } };
export const Warning: Story = { args: { type: 'warning', label: 'Pending' } };
export const Critical: Story = { args: { type: 'critical', label: 'Blocked' } };
export const Information: Story = {
  args: { type: 'information', label: 'In review' },
};

export const WithIcon: Story = {
  args: { type: 'success', label: 'Approved', iconStart: 'checkmark' },
};

export const AllTypes: Story = {
  render: () => html`
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
      ${types.map(
        (t) => html`<moz-status-badge type=${t}>${t}</moz-status-badge>`,
      )}
    </div>
  `,
};
