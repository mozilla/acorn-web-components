import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-visual-picker';
import '../moz-icon/moz-icon';
import '../moz-status-badge/moz-status-badge';
import type {
  MozVisualPicker,
  MozVisualPickerItem,
  VisualPickerVariant,
} from './moz-visual-picker';

interface Args {
  label?: string;
  name?: string;
  value?: string;
  description?: string;
  error?: string;
  orientation: 'horizontal' | 'vertical';
  variant: VisualPickerVariant;
  required: boolean;
  disabled: boolean;
}

const meta: Meta<Args> = {
  title: 'Components/Visual Picker',
  component: 'moz-visual-picker',
  tags: ['autodocs'],
  decorators: [logEvents('change')],
  argTypes: {
    label: { control: 'text' },
    name: { control: 'text' },
    value: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    variant: { control: 'inline-radio', options: ['card', 'radio'] },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    label: 'Theme',
    name: 'theme',
    value: 'system',
    orientation: 'horizontal',
    variant: 'card',
    required: false,
    disabled: false,
  },
  render: (args) => html`
    <moz-visual-picker
      label=${ifDefined(args.label)}
      name=${ifDefined(args.name)}
      value=${ifDefined(args.value)}
      description=${ifDefined(args.description)}
      error=${ifDefined(args.error)}
      orientation=${args.orientation}
      variant=${args.variant}
      ?required=${args.required}
      ?disabled=${args.disabled}
    >
      <moz-visual-picker-item value="light" label="Light">
        <moz-icon name="sun" size="xlarge"></moz-icon>
      </moz-visual-picker-item>
      <moz-visual-picker-item value="dark" label="Dark">
        <moz-icon name="moon" size="xlarge"></moz-icon>
      </moz-visual-picker-item>
      <moz-visual-picker-item value="system" label="System">
        <moz-icon name="device-mobile" size="xlarge"></moz-icon>
      </moz-visual-picker-item>
    </moz-visual-picker>
  `,
};

export default meta;
type Story = StoryObj<Args>;

const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const group = (root: HTMLElement) =>
  root.querySelector<MozVisualPicker>('moz-visual-picker')!;
const items = (root: HTMLElement) => [
  ...root.querySelectorAll<MozVisualPickerItem>('moz-visual-picker-item'),
];
const button = (item: MozVisualPickerItem) =>
  item.shadowRoot!.querySelector('.item') as HTMLButtonElement;

export const Default: Story = {};

export const Vertical: Story = {
  args: { orientation: 'vertical', label: 'Distribution' },
  render: (args) => html`
    <moz-visual-picker
      label=${ifDefined(args.label)}
      orientation="vertical"
      value="amo"
      description="Choose how this version will be distributed."
    >
      <moz-visual-picker-item
        value="amo"
        label="On AMO"
        description="Listed on addons.mozilla.org after review."
      ></moz-visual-picker-item>
      <moz-visual-picker-item
        value="self"
        label="On your own"
        description="Signed for self-distribution. You handle updates."
      ></moz-visual-picker-item>
    </moz-visual-picker>
  `,
};

export const WithDescription: Story = {
  args: { description: 'Applies to every window.' },
};

export const Required: Story = { args: { required: true, value: '' } };
export const Disabled: Story = { args: { disabled: true } };
export const WithError: Story = {
  args: { value: '', error: 'Pick a theme to continue.' },
};

// Content-only cards: with no label, the slotted content names the option.
export const ContentOnly: Story = {
  render: () => html`
    <moz-visual-picker label="Accent" name="accent" value="violet">
      ${['violet', 'green', 'orange'].map(
        (name) => html`
          <moz-visual-picker-item value=${name} aria-label=${name}>
            <moz-icon name="shield" size="xlarge"></moz-icon>
          </moz-visual-picker-item>
        `,
      )}
    </moz-visual-picker>
  `,
};

// --- interaction tests ---

// Clicking a card selects it, deselects the previous one, and reports up.
export const Selecting: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const picker = group(canvasElement);
    await picker.updateComplete;
    await wait();
    let changes = 0;
    picker.addEventListener('change', () => changes++);

    const [light, , system] = items(canvasElement);
    expect(system.checked).toBe(true);

    button(light).click();
    await wait();
    expect(picker.value).toBe('light');
    expect(light.checked).toBe(true);
    expect(system.checked).toBe(false);
    expect(changes).toBe(1);
  },
};

// The card is a button, not an input, so it dispatches its own events —
// including input, which consumers of the other controls expect.
export const DispatchesComposedEvents: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const picker = group(canvasElement);
    await picker.updateComplete;
    await wait();
    const seen: string[] = [];
    for (const type of ['click', 'input', 'change']) {
      picker.addEventListener(type, () => seen.push(type));
    }

    const [light] = items(canvasElement);
    button(light).click();
    await wait();
    expect(seen).toEqual(['click', 'input', 'change']);

    // Re-activating the selected card changes nothing, so no input/change.
    seen.length = 0;
    button(light).click();
    await wait();
    expect(seen).toEqual(['click']);
  },
};

// Space and Enter activate the focused card.
export const KeyboardActivation: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const picker = group(canvasElement);
    await picker.updateComplete;
    await wait();
    const [light, dark] = items(canvasElement);

    for (const [item, key, expected] of [
      [light, ' ', 'light'],
      [dark, 'Enter', 'dark'],
    ] as const) {
      button(item).dispatchEvent(
        new KeyboardEvent('keydown', {
          key,
          bubbles: true,
          composed: true,
        }),
      );
      await wait();
      expect(picker.value).toBe(expected);
    }
  },
};

// One tab stop for the group: the selected card, or the first when none is.
export const RovingTabStop: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const picker = group(canvasElement);
    await picker.updateComplete;
    await wait();
    const all = items(canvasElement);

    const tabIndexes = () => all.map((item) => button(item).tabIndex);
    // `system` is selected, so it owns the tab stop.
    expect(tabIndexes()).toEqual([-1, -1, 0]);

    button(all[0]).click();
    await wait();
    expect(tabIndexes()).toEqual([0, -1, -1]);
  },
};

// Arrow keys move selection, wrapping, and follow focus — the ARIA radio
// pattern, handled by the group. Dispatched from inside the card so the event
// retargets to the item: the group ignores keys from anywhere else.
export const ArrowKeyNavigation: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const picker = group(canvasElement);
    await picker.updateComplete;
    await wait();
    const all = items(canvasElement);

    picker.value = 'light';
    await wait();

    const press = (item: MozVisualPickerItem, key: string) =>
      button(item).dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, composed: true }),
      );

    press(all[0], 'ArrowRight');
    await wait();
    expect(picker.value).toBe('dark');

    press(all[1], 'ArrowLeft');
    await wait();
    expect(picker.value).toBe('light');

    // Wraps around the start.
    press(all[0], 'ArrowLeft');
    await wait();
    expect(picker.value).toBe('system');
  },
};

// A disabled group gates every card without touching their own `disabled`.
export const DisabledGroupGatesItems: Story = {
  tags: ['!dev', '!autodocs'],
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const picker = group(canvasElement);
    await picker.updateComplete;
    await wait();
    const all = items(canvasElement);

    expect(all.every((item) => item.parentDisabled)).toBe(true);
    expect(all.every((item) => item.disabled)).toBe(false);
    expect(button(all[0]).disabled).toBe(true);

    button(all[0]).click();
    await wait();
    expect(picker.value).toBe('system');

    // Lifting the group's state hands each card back its own.
    picker.disabled = false;
    await picker.updateComplete;
    await wait();
    expect(all.every((item) => item.parentDisabled)).toBe(false);
  },
};

// A single disabled card can't be chosen but the rest still work.
export const DisabledItem: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-visual-picker label="Theme" value="light">
      <moz-visual-picker-item value="light" label="Light"></moz-visual-picker-item>
      <moz-visual-picker-item
        value="dark"
        label="Dark"
        disabled
      ></moz-visual-picker-item>
    </moz-visual-picker>
  `,
  play: async ({ canvasElement }) => {
    const picker = group(canvasElement);
    await picker.updateComplete;
    await wait();
    const [, dark] = items(canvasElement);

    expect(button(dark).disabled).toBe(true);
    button(dark).click();
    await wait();
    expect(picker.value).toBe('light');
  },
};

// Selection is conveyed by aria-checked on a radio, not by a visible control.
export const Semantics: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const picker = group(canvasElement);
    await picker.updateComplete;
    await wait();
    const all = items(canvasElement);

    expect(
      picker.shadowRoot!.querySelector('fieldset')!.getAttribute('role'),
    ).toBe('radiogroup');
    expect(button(all[0]).getAttribute('role')).toBe('radio');
    expect(button(all[2]).getAttribute('aria-checked')).toBe('true');
    expect(button(all[0]).getAttribute('aria-checked')).toBe('false');
    // No radio input anywhere: the border carries the state.
    expect(all[0].shadowRoot!.querySelector('input')).toBeNull();
  },
};

// An unlabelled card borrows its accessible name from the slotted content.
export const NamedFromSlottedContent: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-visual-picker label="Accent" value="violet">
      <moz-visual-picker-item value="violet">
        <moz-icon name="shield" label="Violet"></moz-icon>
      </moz-visual-picker-item>
    </moz-visual-picker>
  `,
  play: async ({ canvasElement }) => {
    const [item] = items(canvasElement);
    await item.updateComplete;
    await wait(50);
    const named = button(item).ariaLabelledByElements ?? [];
    expect(named.length).toBeGreaterThan(0);
    expect((named[0] as HTMLElement).localName).toBe('moz-icon');
  },
};

// Orientation drives the layout: a row of equal-width cards, or a full-width
// stack. The group sizes the slotted items, since our item mixin doesn't
// propagate `orientation` the way Firefox's does.
export const OrientationLaysOut: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const picker = group(canvasElement);
    await picker.updateComplete;
    await wait(50);
    const all = items(canvasElement);
    const tops = () => all.map((item) => item.getBoundingClientRect().top);

    // Horizontal: all three share a row. Asserted on the computed flex too,
    // because a ::slotted selector that doesn't match still *looks* fine in a
    // wide container — it only stacks once the row is narrow.
    expect(getComputedStyle(all[0]).flexGrow).toBe('1');
    expect(new Set(tops()).size).toBe(1);
    // ...and divide the width between them rather than each filling it.
    const widths = all.map((item) => item.getBoundingClientRect().width);
    expect(widths[0]).toBeCloseTo(widths[1], 0);
    expect(widths[0]).toBeLessThan(picker.getBoundingClientRect().width / 2);

    picker.orientation = 'vertical';
    await picker.updateComplete;
    await wait(50);

    // Vertical: each on its own row, full width.
    expect(new Set(tops()).size).toBe(3);
    expect(all[0].getBoundingClientRect().width).toBeCloseTo(
      picker.getBoundingClientRect().width,
      0,
    );
  },
};

// The radio variant: a visible indicator, left-aligned text, and a badge slot
// on the line above the label.
export const RadioVariant: Story = {
  args: { orientation: 'vertical', variant: 'radio' },
  render: () => html`
    <moz-visual-picker
      label="Add-on distribution"
      description="Choose how this version will be distributed before you upload."
      orientation="vertical"
      variant="radio"
      value="amo"
    >
      <moz-visual-picker-item
        value="amo"
        label="On AMO (addons.mozilla.org)"
        description="Listed on addons.mozilla.org and in the Add-ons Manager after code review. Automatic updates are handled by this site."
      >
        <moz-status-badge slot="badge" icon-start="globe"
          >AMO</moz-status-badge
        >
      </moz-visual-picker-item>
      <moz-visual-picker-item
        value="self"
        label="On your own / Self"
        description="Immediately signed for self-distribution. You handle updates via updateURL."
      >
        <moz-status-badge slot="badge" icon-start="home"
          >Self</moz-status-badge
        >
      </moz-visual-picker-item>
    </moz-visual-picker>
  `,
};

// The variant is a group-level decision, propagated so a group can't be
// half card and half radio.
export const VariantPropagates: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const picker = group(canvasElement);
    await picker.updateComplete;
    await wait();
    const all = items(canvasElement);

    expect(all.every((item) => item.variant === 'card')).toBe(true);
    expect(all[0].shadowRoot!.querySelector('.indicator')).toBeNull();

    picker.variant = 'radio';
    await picker.updateComplete;
    await wait();
    expect(all.every((item) => item.variant === 'radio')).toBe(true);

    // The indicator is decorative — the button still carries the state, and
    // there's no nested input.
    const indicator = all[0].shadowRoot!.querySelector('.indicator')!;
    expect(indicator.getAttribute('aria-hidden')).toBe('true');
    expect(all[0].shadowRoot!.querySelector('input')).toBeNull();
    expect(button(all[2]).getAttribute('aria-checked')).toBe('true');
  },
};

// The badge slot renders above the label, and text is left-aligned.
export const RadioVariantLayout: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-visual-picker variant="radio" orientation="vertical" value="amo">
      <moz-visual-picker-item
        value="amo"
        label="On AMO"
        description="Listed after review."
      >
        <span slot="badge" data-badge>AMO</span>
      </moz-visual-picker-item>
    </moz-visual-picker>
  `,
  play: async ({ canvasElement }) => {
    const [item] = items(canvasElement);
    await item.updateComplete;
    await wait(50);

    const badge = canvasElement.querySelector('[data-badge]')!;
    const label = item.shadowRoot!.querySelector('.label')!;
    const indicator = item.shadowRoot!.querySelector('.indicator')!;

    // Badge on the line above the label.
    expect(badge.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      label.getBoundingClientRect().top,
    );
    // Indicator leads the label on the same line.
    expect(indicator.getBoundingClientRect().left).toBeLessThan(
      label.getBoundingClientRect().left,
    );
    expect(
      getComputedStyle(item.shadowRoot!.querySelector('.item')!).textAlign,
    ).toBe('start');
  },
};

// The indicator fills only for the selected card. Asserts the dot is actually
// painted — size and an opaque colour — not just that it's displayed: the fill
// comes from a button token, and when that token wasn't in scope the dot was
// `display: block` but fully transparent.
export const RadioIndicatorReflectsSelection: Story = {
  tags: ['!dev', '!autodocs'],
  args: { variant: 'radio' },
  play: async ({ canvasElement }) => {
    const picker = group(canvasElement);
    await picker.updateComplete;
    await wait(50);
    const all = items(canvasElement);
    const dotOf = (item: MozVisualPickerItem) =>
      item.shadowRoot!.querySelector('.mark-dot') as HTMLElement;
    const painted = (item: MozVisualPickerItem) => {
      const style = getComputedStyle(dotOf(item));
      const box = dotOf(item).getBoundingClientRect();
      return {
        shown: style.display !== 'none',
        opaque:
          style.backgroundColor !== 'transparent' &&
          !style.backgroundColor.includes('rgba(0, 0, 0, 0)'),
        sized: box.width > 0 && box.height > 0,
      };
    };

    // `system` is the selected one.
    expect(painted(all[2])).toEqual({ shown: true, opaque: true, sized: true });
    expect(painted(all[0]).shown).toBe(false);

    button(all[0]).click();
    await wait();
    expect(painted(all[0])).toEqual({ shown: true, opaque: true, sized: true });
    expect(painted(all[2]).shown).toBe(false);
  },
};

// Horizontal by default, unlike the shared base (which defaults to vertical for
// stacked radios) — so a picker with no orientation set still lays out in a row.
export const DefaultsToHorizontal: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <div style="inline-size:380px;">
      <moz-visual-picker label="Theme" value="system">
        <moz-visual-picker-item value="light" label="Light"></moz-visual-picker-item>
        <moz-visual-picker-item value="dark" label="Dark"></moz-visual-picker-item>
        <moz-visual-picker-item value="system" label="System"></moz-visual-picker-item>
      </moz-visual-picker>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const picker = group(canvasElement);
    await picker.updateComplete;
    await wait(50);
    const all = items(canvasElement);

    expect(picker.orientation).toBe('horizontal');
    expect(picker.getAttribute('orientation')).toBe('horizontal');
    // Narrow container, no orientation set: still one row, sharing the width.
    expect(
      new Set(all.map((i) => Math.round(i.getBoundingClientRect().top))).size,
    ).toBe(1);
    expect(getComputedStyle(all[0]).flexGrow).toBe('1');
  },
};
