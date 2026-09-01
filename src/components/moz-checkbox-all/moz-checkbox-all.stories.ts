import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { expect } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-checkbox-all';
import '../moz-checkbox/moz-checkbox';
import '../moz-fieldset/moz-fieldset';
import '../moz-provider/moz-provider';

const meta: Meta = {
  title: 'Components/Checkbox/Select All',
  component: 'moz-checkbox-all',
  tags: ['autodocs'],
  decorators: [logEvents('change')],
  render: () => html`
    <moz-fieldset label="Sync your data">
      <moz-checkbox-all label="Select all"></moz-checkbox-all>
      <moz-checkbox label="Bookmarks" value="bookmarks"></moz-checkbox>
      <moz-checkbox label="History" value="history"></moz-checkbox>
      <moz-checkbox label="Passwords" value="passwords"></moz-checkbox>
    </moz-fieldset>
  `,
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

// Some-but-not-all checked shows the indeterminate state on the select-all.
export const SomeChecked: Story = {
  render: () => html`
    <moz-fieldset label="Sync your data">
      <moz-checkbox-all label="Select all"></moz-checkbox-all>
      <moz-checkbox label="Bookmarks" value="bookmarks" checked></moz-checkbox>
      <moz-checkbox label="History" value="history"></moz-checkbox>
      <moz-checkbox label="Passwords" value="passwords"></moz-checkbox>
    </moz-fieldset>
  `,
};

// A disabled option is left out of both the tally and the toggle.
export const WithDisabled: Story = {
  render: () => html`
    <moz-fieldset label="Sync your data">
      <moz-checkbox-all label="Select all"></moz-checkbox-all>
      <moz-checkbox label="Bookmarks" value="bookmarks"></moz-checkbox>
      <moz-checkbox label="History" value="history" disabled></moz-checkbox>
    </moz-fieldset>
  `,
};

// --- interaction tests ---

const wait = () => new Promise((r) => setTimeout(r, 20));

// Toggling the select-all drives every enabled option; the options in turn drive
// its checked / indeterminate state.
export const Coordinates: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const fieldset = canvasElement.querySelector('moz-fieldset')!;
    const all = canvasElement.querySelector('moz-checkbox-all')!;
    const boxes = [...fieldset.querySelectorAll('moz-checkbox')];
    await all.updateComplete;
    await wait();

    // Nothing checked: neither checked nor indeterminate.
    expect(all.checked).toBe(false);
    expect(all.indeterminate).toBe(false);

    // Check one option -> the select-all is indeterminate.
    boxes[0].shadowRoot!.querySelector('input')!.click();
    await wait();
    expect(all.indeterminate).toBe(true);
    expect(all.checked).toBe(false);

    // Toggle the select-all on -> every option follows, no longer mixed.
    all.shadowRoot!.querySelector('input')!.click();
    await wait();
    expect(boxes.every((b) => b.checked)).toBe(true);
    expect(all.checked).toBe(true);
    expect(all.indeterminate).toBe(false);

    // Toggle it off -> every option clears.
    all.shadowRoot!.querySelector('input')!.click();
    await wait();
    expect(boxes.some((b) => b.checked)).toBe(false);
    expect(all.checked).toBe(false);
  },
};

// A disabled option is ignored: checking the rest still reads as "all".
export const IgnoresDisabled: Story = {
  tags: ['!dev', '!autodocs'],
  render: WithDisabled.render,
  play: async ({ canvasElement }) => {
    const fieldset = canvasElement.querySelector('moz-fieldset')!;
    const all = canvasElement.querySelector('moz-checkbox-all')!;
    const enabled = [...fieldset.querySelectorAll('moz-checkbox')].find(
      (b) => !b.disabled,
    )!;
    const disabled = [...fieldset.querySelectorAll('moz-checkbox')].find(
      (b) => b.disabled,
    )!;
    await all.updateComplete;
    await wait();

    // Check the only enabled option -> the select-all reads as fully checked.
    enabled.shadowRoot!.querySelector('input')!.click();
    await wait();
    expect(all.checked).toBe(true);
    expect(all.indeterminate).toBe(false);

    // Toggling all off leaves the disabled option untouched.
    all.shadowRoot!.querySelector('input')!.click();
    await wait();
    expect(disabled.checked).toBe(false);
  },
};
