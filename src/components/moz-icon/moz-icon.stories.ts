import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import './moz-icon';
import {
  type IconColor,
  type IconSize,
  iconColors,
  iconSizes,
} from '../../generated/icon-options';
import { type IconName, iconNames } from '../../generated/icons';

interface IconArgs {
  name: IconName;
  size?: IconSize;
  color?: IconColor;
  label: string;
}

const meta: Meta<IconArgs> = {
  title: 'Components/Icon',
  component: 'moz-icon',
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'select', options: iconNames },
    size: { control: 'select', options: iconSizes },
    color: { control: 'select', options: iconColors },
    label: { control: 'text' },
  },
  args: {
    name: 'edit',
    size: 'large',
    color: 'default',
    label: '',
  },
  render: (args) => html`
    <moz-icon
      name=${args.name}
      size=${ifDefined(args.size)}
      color=${ifDefined(args.color)}
      label=${args.label || ''}
    ></moz-icon>
  `,
};

export default meta;
type Story = StoryObj<IconArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('moz-icon');
    expect(icon).toBeTruthy();
    // The icon module loads asynchronously; poll for the rendered svg.
    let svg: SVGElement | null | undefined;
    for (let i = 0; i < 50 && !svg; i++) {
      svg = icon?.shadowRoot?.querySelector('svg');
      if (!svg) await new Promise((r) => setTimeout(r, 20));
    }
    expect(svg).toBeTruthy();
  },
};

export const Labelled: Story = {
  args: { name: 'info', label: 'Information', color: 'information' },
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('moz-icon')!;
    await icon.updateComplete;
    // A label promotes the icon to an image for assistive tech.
    expect(icon.getAttribute('role')).toBe('img');
    expect(icon.getAttribute('aria-label')).toBe('Information');
    expect(icon.hasAttribute('aria-hidden')).toBe(false);
    expect(icon.style.getPropertyValue('--_icon-color')).toBe(
      'var(--icon-color-information)',
    );
  },
};

export const UnknownName: Story = {
  render: () => html`<moz-icon name="not-a-real-icon"></moz-icon>`,
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('moz-icon')!;
    await icon.updateComplete;
    // An unknown name warns and renders nothing rather than throwing.
    await new Promise((r) => setTimeout(r, 20));
    expect(icon.shadowRoot?.querySelector('svg')).toBeNull();
  },
};

export const NoName: Story = {
  render: () => html`<moz-icon></moz-icon>`,
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('moz-icon')!;
    await icon.updateComplete;
    expect(icon.shadowRoot?.querySelector('svg')).toBeNull();
  },
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex;align-items:flex-end;gap:16px;">
      ${iconSizes.map(
        (s) => html`
          <div
            style="display:flex;flex-direction:column;align-items:center;gap:6px;"
          >
            <moz-icon name="edit" size=${s}></moz-icon>
            <span style="font-size:11px;font-family:monospace;opacity:0.75;"
              >${s}</span
            >
          </div>
        `,
      )}
    </div>
  `,
};

export const Colors: Story = {
  render: () => html`
    <div style="display:flex;align-items:center;gap:16px;">
      ${iconColors.map(
        (c) => html`
          <div
            style="display:flex;flex-direction:column;align-items:center;gap:6px;"
          >
            <moz-icon name="info" size="large" color=${c}></moz-icon>
            <span style="font-size:11px;font-family:monospace;opacity:0.75;"
              >${c}</span
            >
          </div>
        `,
      )}
    </div>
  `,
};

export const Gallery: Story = {
  render: () => html`
    <div
      style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;"
    >
      ${iconNames.map(
        (n) => html`
          <div
            style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px 8px;border:1px solid var(--border-color-interactive, #ccc);border-radius:var(--border-radius-small, 4px);"
          >
            <moz-icon name=${n} size="medium"></moz-icon>
            <span
              style="font-size:11px;font-family:monospace;background-color:black;color:white;padding:1px 5px;line-height:1.3;text-align:center;word-break:break-word;opacity:0.75;"
              >${n}</span
            >
          </div>
        `,
      )}
    </div>
  `,
};
