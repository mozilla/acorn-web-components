import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { expect } from 'storybook/test';
import '../moz-box-button/moz-box-button';
import '../moz-box-item/moz-box-item';
import '../moz-box-link/moz-box-link';
import './moz-box-group';

const meta: Meta = {
  title: 'Components/Box/Group',
  component: 'moz-box-group',
  tags: ['autodocs'],
  // Groups are typically page-width; constrain for the docs canvas.
  decorators: [(story) => html`<div style="max-width: 420px">${story()}</div>`],
};

export default meta;
type Story = StoryObj;

// A list of navigation buttons — the common settings pattern.
export const Buttons: Story = {
  render: () => html`
    <moz-box-group label="Settings">
      <moz-box-button label="General" icon-start="settings"></moz-box-button>
      <moz-box-button
        label="Privacy & Security"
        description="Cookies, permissions, and data"
        icon-start="shield"
      ></moz-box-button>
      <moz-box-button label="Extensions" icon-start="extension"></moz-box-button>
      <moz-box-button label="Sync (signed out)" disabled></moz-box-button>
    </moz-box-group>
  `,
};

export const Links: Story = {
  render: () => html`
    <moz-box-group label="Resources">
      <moz-box-link label="Support articles" href="https://support.mozilla.org"></moz-box-link>
      <moz-box-link
        label="Release notes"
        description="What's new in this version"
        href="https://www.mozilla.org"
      ></moz-box-link>
    </moz-box-group>
  `,
};

// Static items and interactive rows can be mixed in one group.
export const Mixed: Story = {
  render: () => html`
    <moz-box-group label="Account">
      <moz-box-item
        label="Firefox Account"
        description="user@example.com"
        icon-start="information"
      ></moz-box-item>
      <moz-box-button label="Manage account" icon-start="settings"></moz-box-button>
      <moz-box-link label="Learn more" href="https://www.mozilla.org"></moz-box-link>
    </moz-box-group>
  `,
};

const threeButtons = html`
  <moz-box-group label="Settings">
    <moz-box-button label="One"></moz-box-button>
    <moz-box-button label="Two"></moz-box-button>
    <moz-box-button label="Three"></moz-box-button>
  </moz-box-group>
`;

// Every row is its own tab stop (natural tab order), not a roving group.
export const TabStops: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => threeButtons,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-box-group')!;
    await group.updateComplete;
    const rows = [...group.querySelectorAll('moz-box-button')];
    await Promise.all(rows.map((r) => r.updateComplete));

    for (const row of rows) {
      expect(row.hasAttribute('tabindex')).toBe(false);
      row.focus();
      expect(row.matches(':focus-within')).toBe(true);
    }
  },
};

// Arrow Up/Down and Home/End also move focus between rows.
export const KeyboardNav: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => threeButtons,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-box-group')!;
    await group.updateComplete;
    const rows = [...group.querySelectorAll('moz-box-button')];
    await Promise.all(rows.map((r) => r.updateComplete));

    const arrow = (key: string) =>
      rows
        .find((r) => r.matches(':focus-within'))!
        .dispatchEvent(
          new KeyboardEvent('keydown', { key, bubbles: true, composed: true }),
        );

    rows[0].focus();
    arrow('ArrowDown');
    expect(rows[1].matches(':focus-within')).toBe(true);
    arrow('End');
    expect(rows[2].matches(':focus-within')).toBe(true);
    arrow('ArrowUp');
    expect(rows[1].matches(':focus-within')).toBe(true);

    // Arrow nav doesn't clobber the natural tab order.
    expect(rows.every((r) => !r.hasAttribute('tabindex'))).toBe(true);
  },
};
