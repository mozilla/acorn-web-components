import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect, userEvent } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-chip';
import { type IconName, iconNames } from '../../generated/icons';
import type { ChipSize } from './moz-chip';

interface ChipArgs {
  label: string;
  size: ChipSize;
  iconStart?: IconName;
  selected: boolean;
  disabled: boolean;
}

const meta: Meta<ChipArgs> = {
  title: 'Components/Chip',
  component: 'moz-chip',
  tags: ['autodocs'],
  // The dismiss button is always present; log its event in the Actions panel.
  decorators: [logEvents('moz-chip:remove')],
  argTypes: {
    label: { control: 'text' },
    size: { control: 'inline-radio', options: ['default', 'small'] },
    iconStart: { control: 'select', options: [undefined, ...iconNames] },
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    label: 'Chip',
    size: 'default',
    selected: false,
    disabled: false,
  },
  render: (args) => html`
    <moz-chip
      size=${args.size}
      id="demo-chip"
      icon-start=${ifDefined(args.iconStart)}
      ?selected=${args.selected}
      ?disabled=${args.disabled}
    >
      ${args.label}
    </moz-chip>
  `,
};

export default meta;
type Story = StoryObj<ChipArgs>;

// The dismiss button (native <button> in the chip's shadow root).
const removeButton = (chip: Element) =>
  chip.shadowRoot?.querySelector<HTMLButtonElement>('button.remove') ?? null;

export const Default: Story = {};
export const Small: Story = { args: { label: 'Small', size: 'small' } };
export const WithIcon: Story = {
  args: { label: 'Documents', iconStart: 'folder' },
};
export const Selected: Story = {
  args: { label: 'Selected', selected: true, iconStart: 'checkmark' },
};
export const Disabled: Story = {
  args: { label: 'Disabled', disabled: true },
};

export const Overview: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:16px;align-items:start;">
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
        <moz-chip id="plain">Plain</moz-chip>
        <moz-chip id="with-icon" icon-start="folder">With icon</moz-chip>
        <moz-chip id="selected" selected icon-start="checkmark">Selected</moz-chip>
        <moz-chip id="disabled" disabled>Disabled</moz-chip>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
        <moz-chip id="small-plain" size="small">Plain</moz-chip>
        <moz-chip id="small-with-icon" size="small" icon-start="folder">With icon</moz-chip>
        <moz-chip id="small-selected" size="small" selected icon-start="checkmark">Selected</moz-chip>
        <moz-chip id="small-disabled" size="small" disabled>Disabled</moz-chip>
      </div>
    </div>
  `,
};

// Interaction: clicking dismiss fires the cancelable event and, when unprevented,
// removes the chip. Test-only so the sidebar/docs don't show an empty canvas.
export const RemoveBehaviour: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Filter' },
  play: async ({ canvasElement }) => {
    const chip = canvasElement.querySelector('moz-chip')!;
    await chip.updateComplete;
    let removed = false;
    chip.addEventListener('moz-chip:remove', () => {
      removed = true;
    });
    const button = removeButton(chip)!;
    expect(button).toBeTruthy();
    await userEvent.click(button);
    expect(removed).toBe(true);
    expect(chip.isConnected).toBe(false);
  },
};

// Interaction: a listener that preventDefault()s keeps the chip in the DOM.
export const RemovePrevented: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Sticky' },
  play: async ({ canvasElement }) => {
    const chip = canvasElement.querySelector('moz-chip')!;
    await chip.updateComplete;
    chip.addEventListener('moz-chip:remove', (e) => e.preventDefault());
    await userEvent.click(removeButton(chip)!);
    expect(chip.isConnected).toBe(true);
  },
};

// Interaction: a disabled chip never fires remove and stays connected.
export const DisabledDoesNotRemove: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Locked', disabled: true },
  play: async ({ canvasElement }) => {
    const chip = canvasElement.querySelector('moz-chip')!;
    await chip.updateComplete;
    let removed = false;
    chip.addEventListener('moz-chip:remove', () => {
      removed = true;
    });
    const button = removeButton(chip)!;
    // The dismiss button reflects the disabled state.
    expect(button.disabled).toBe(true);
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 20));
    expect(removed).toBe(false);
    expect(chip.isConnected).toBe(true);
  },
};
