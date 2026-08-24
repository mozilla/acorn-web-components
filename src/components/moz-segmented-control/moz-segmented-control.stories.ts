import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { expect, userEvent } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-segmented-control';
import type {
  MozSegmentedControl,
  MozSegmentedControlDeck,
  SegmentedControlChangeDetail,
  SegmentedControlSize,
} from './moz-segmented-control';

interface Args {
  value: string;
  label: string;
  disabled: boolean;
  fill: boolean;
  iconOnly: boolean;
  size: SegmentedControlSize;
}

const values = ['day', 'week', 'month'];

const meta: Meta<Args> = {
  title: 'Components/SegmentedControl',
  component: 'moz-segmented-control',
  tags: ['autodocs'],
  decorators: [logEvents('moz-segmented-control:change')],
  argTypes: {
    value: { control: 'select', options: values },
    label: { control: 'text' },
    disabled: { control: 'boolean' },
    fill: { control: 'boolean' },
    iconOnly: { control: 'boolean' },
    size: { control: 'inline-radio', options: ['small', 'large'] },
  },
  args: {
    value: 'day',
    label: 'Date range',
    disabled: false,
    fill: false,
    iconOnly: false,
    size: 'large',
  },
  render: (args) => html`
    <moz-segmented-control
      id="date-range"
      label=${args.label}
      value=${args.value}
      size=${args.size}
      ?disabled=${args.disabled}
      ?fill=${args.fill}
    >
      <moz-segmented-control-item
        value="day"
        label="Day"
        icon-start="highlighter"
        ?icon-only=${args.iconOnly}
      ></moz-segmented-control-item>
      <moz-segmented-control-item
        value="week"
        label="Week"
        icon-start="delete"
        ?icon-only=${args.iconOnly}
      ></moz-segmented-control-item>
      <moz-segmented-control-item
        value="month"
        label="Month"
        icon-start="copy"
        ?icon-only=${args.iconOnly}
      ></moz-segmented-control-item>
    </moz-segmented-control>
  `,
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Selected: Story = { args: { value: 'week' } };

// Fill mode: spans the container width with equally-sized segments.
export const Fill: Story = {
  args: { value: 'week', fill: true },
  render: (args) => html`
    <div style="max-width:480px;">
      <moz-segmented-control id="date-range" label=${args.label} value=${args.value} fill>
        <moz-segmented-control-item
          value="day"
          label="Day"
        ></moz-segmented-control-item>
        <moz-segmented-control-item
          value="week"
          label="Week"
        ></moz-segmented-control-item>
        <moz-segmented-control-item
          value="month"
          label="Month"
        ></moz-segmented-control-item>
      </moz-segmented-control>
    </div>
  `,
};

export const Small: Story = { args: { size: 'small' } };

// Icon-only segments render as circles; the label stays the accessible name.
export const IconOnly: Story = {
  args: { iconOnly: true },
  render: (args) => html`
    <moz-segmented-control id="formatting" label="Formatting" value="edit" size=${args.size}>
      <moz-segmented-control-item
        value="edit"
        icon-start="edit"
        label="Edit"
        ?icon-only=${args.iconOnly}
      ></moz-segmented-control-item>
      <moz-segmented-control-item
        value="copy"
        icon-start="copy"
        label="Copy"
        ?icon-only=${args.iconOnly}
      ></moz-segmented-control-item>
      <moz-segmented-control-item
        value="close"
        icon-start="close"
        label="Close"
        ?icon-only=${args.iconOnly}
      ></moz-segmented-control-item>
    </moz-segmented-control>
  `,
};

export const WithIcons: Story = {
  args: { iconOnly: false },
  render: (args) => html`
    <moz-segmented-control id="view-details" label=${args.label} value=${args.value}>
      <moz-segmented-control-item value="highlights" label="Highlights" icon-start="highlighter" ?icon-only=${args.iconOnly}></moz-segmented-control-item>
      <moz-segmented-control-item value="deleted" label="Deleted" icon-start="delete" ?icon-only=${args.iconOnly}></moz-segmented-control-item>
      <moz-segmented-control-item value="copy" label="Clipboard" icon-start="copy" ?icon-only=${args.iconOnly}></moz-segmented-control-item>
    </moz-segmented-control>
  `,
};

export const Disabled: Story = { args: { disabled: true } };

export const DisabledItem: Story = {
  render: (args) => html`
    <moz-segmented-control id="date-range" label=${args.label} value=${args.value}>
      <moz-segmented-control-item value="day" label="Day"></moz-segmented-control-item>
      <moz-segmented-control-item value="week" label="Week" disabled></moz-segmented-control-item>
      <moz-segmented-control-item value="month" label="Month"></moz-segmented-control-item>
    </moz-segmented-control>
  `,
};

// Interaction test: clicking a segment updates `value`, fires the change event
// with the new value, and flips aria-checked. Test-only so no empty canvas.
export const ClickSelects: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector(
      'moz-segmented-control',
    ) as MozSegmentedControl;
    await group.updateComplete;
    const items = [
      ...canvasElement.querySelectorAll('moz-segmented-control-item'),
    ];

    let fired: string | undefined;
    group.addEventListener('moz-segmented-control:change', (e) => {
      fired = (e as CustomEvent<SegmentedControlChangeDetail>).detail.value;
    });

    await userEvent.click(items[2]);
    await group.updateComplete;
    await items[2].updateComplete;

    expect(group.value).toBe('month');
    expect(fired).toBe('month');
    expect(items[2].getAttribute('aria-checked')).toBe('true');
    expect(items[0].getAttribute('aria-checked')).toBe('false');
  },
};

// Interaction test: roving-tabindex arrow-key navigation moves + selects, and
// wraps from the last item back to the first.
export const KeyboardNavigates: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector(
      'moz-segmented-control',
    ) as MozSegmentedControl;
    await group.updateComplete;
    const items = [
      ...canvasElement.querySelectorAll('moz-segmented-control-item'),
    ];

    const changes: string[] = [];
    group.addEventListener('moz-segmented-control:change', (e) => {
      changes.push(
        (e as CustomEvent<SegmentedControlChangeDetail>).detail.value,
      );
    });

    // Selected item (day) is the roving-tabindex entry point.
    expect(items[0].getAttribute('tabindex')).toBe('0');
    expect(items[1].getAttribute('tabindex')).toBe('-1');

    // Focus the entry item, then press an arrow key on whatever item is
    // currently focused. (`userEvent.keyboard` doesn't deliver key events to a
    // programmatically-focused custom element, so dispatch a real keydown on
    // the focused element — the group handles it via bubbling.)
    const active = () =>
      (group.getRootNode() as Document | ShadowRoot)
        .activeElement as HTMLElement;
    const pressArrowRight = async () => {
      active().dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          bubbles: true,
          cancelable: true,
        }),
      );
      await group.updateComplete;
    };

    items[0].focus();
    expect(active()).toBe(items[0]);

    await pressArrowRight();
    expect(group.value).toBe('week');
    // Focus follows the selection (roving tabindex).
    expect(active()).toBe(items[1]);
    expect(items[1].getAttribute('tabindex')).toBe('0');
    expect(items[0].getAttribute('tabindex')).toBe('-1');

    await pressArrowRight();
    await pressArrowRight();
    // Wrapped past `month` back to `day`.
    expect(group.value).toBe('day');
    expect(changes).toEqual(['week', 'month', 'day']);
  },
};

// Paired with a deck: point the control's `deck` at the deck's `id`. Selecting
// a segment automatically switches the panel and the control adopts the tabs
// ARIA pattern (role=tablist/tab + aria-controls).
export const WithDeck: Story = {
  render: () => html`
    <moz-segmented-control label="View" value="overview" deck="sc-deck">
      <moz-segmented-control-item
        value="overview"
        label="Overview"
      ></moz-segmented-control-item>
      <moz-segmented-control-item
        value="activity"
        label="Activity"
      ></moz-segmented-control-item>
      <moz-segmented-control-item
        value="settings"
        label="Settings"
      ></moz-segmented-control-item>
    </moz-segmented-control>
    <moz-segmented-control-deck id="sc-deck" style="margin-block-start:1rem;">
      <div name="overview">Overview panel content.</div>
      <div name="activity">Activity panel content.</div>
      <div name="settings">Settings panel content.</div>
    </moz-segmented-control-deck>
  `,
};

// Interaction test: selecting a segment shows the matching deck panel and the
// tabs ARIA is wired.
export const DeckSwitches: Story = {
  tags: ['!dev', '!autodocs'],
  render: WithDeck.render,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector(
      'moz-segmented-control',
    ) as MozSegmentedControl;
    const deck = canvasElement.querySelector(
      'moz-segmented-control-deck',
    ) as MozSegmentedControlDeck;
    await group.updateComplete;
    await deck.updateComplete;

    const panel = (name: string) =>
      deck.querySelector<HTMLElement>(`[name="${name}"]`)!;
    expect(group.getAttribute('role')).toBe('tablist');
    expect(panel('overview').hidden).toBe(false);
    expect(panel('activity').hidden).toBe(true);

    const activity = [
      ...canvasElement.querySelectorAll('moz-segmented-control-item'),
    ][1];
    await userEvent.click(activity);
    await group.updateComplete;
    await deck.updateComplete;

    expect(group.value).toBe('activity');
    expect(panel('activity').hidden).toBe(false);
    expect(panel('overview').hidden).toBe(true);
    // Tab ARIA on the newly-selected segment + its panel.
    expect(activity.getAttribute('role')).toBe('tab');
    expect(activity.getAttribute('aria-selected')).toBe('true');
    expect(panel('activity').getAttribute('role')).toBe('tabpanel');
    expect(activity.getAttribute('aria-controls')).toBe(panel('activity').id);
  },
};

// Interaction test: a disabled group ignores clicks (no value change, no event)
// and marks itself + its items disabled.
export const DisabledBehavior: Story = {
  tags: ['!dev', '!autodocs'],
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector(
      'moz-segmented-control',
    ) as MozSegmentedControl;
    await group.updateComplete;
    const items = [
      ...canvasElement.querySelectorAll('moz-segmented-control-item'),
    ];
    await Promise.all(items.map((i) => i.updateComplete));

    expect(group.getAttribute('aria-disabled')).toBe('true');
    expect(items[0].getAttribute('aria-disabled')).toBe('true');
    expect(items[0].getAttribute('tabindex')).toBe('-1');

    let fired = false;
    group.addEventListener('moz-segmented-control:change', () => {
      fired = true;
    });
    await userEvent.click(items[2]);
    await group.updateComplete;

    // Selection is unchanged and no event fired.
    expect(group.value).toBe('day');
    expect(fired).toBe(false);
  },
};
