import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import './moz-checkbox-visual';
import '../moz-provider/moz-provider';

interface VisualArgs {
  label: string;
  checked: boolean;
  indeterminate: boolean;
}

const meta: Meta<VisualArgs> = {
  title: 'Components/Checkbox/Visual',
  component: 'moz-checkbox-visual',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    checked: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
  },
  args: {
    label: 'Works offline',
    checked: true,
    indeterminate: false,
  },
  render: (args) => html`
    <moz-checkbox-visual
      label=${ifDefined(args.label)}
      ?checked=${args.checked}
      ?indeterminate=${args.indeterminate}
    ></moz-checkbox-visual>
  `,
};

export default meta;
type Story = StoryObj<VisualArgs>;

export const Checked: Story = {};
export const Unchecked: Story = { args: { checked: false } };
export const Indeterminate: Story = {
  args: { checked: false, indeterminate: true },
};

// A read-only capability list — the intended use, marking statements true.
export const InList: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:8px;">
      <moz-checkbox-visual checked label="Works offline"></moz-checkbox-visual>
      <moz-checkbox-visual checked label="Syncs across devices"></moz-checkbox-visual>
      <moz-checkbox-visual label="Requires an account"></moz-checkbox-visual>
    </div>
  `,
};

// --- interaction tests ---

// The mark shown tracks the checked / indeterminate state.
export const ShowsState: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-checkbox-visual')!;
    await el.updateComplete;
    const visible = (sel: string) =>
      getComputedStyle(el.shadowRoot!.querySelector(sel)!).display !== 'none';
    expect(visible('.check')).toBe(true);

    el.checked = false;
    el.indeterminate = true;
    await el.updateComplete;
    expect(visible('.check')).toBe(false);
    expect(visible('.dash')).toBe(true);
  },
};
