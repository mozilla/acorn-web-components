import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { expect, userEvent } from 'storybook/test';
import './moz-panel-item';
import '../moz-button/moz-button';
import '../moz-panel-list/moz-panel-list';
import type { IconName } from '../../generated/icons';
import type { MozPanelItem, PanelItemSize } from './moz-panel-item';

interface Args {
  label: string;
  size: PanelItemSize;
  iconStart?: IconName;
  iconEnd?: IconName;
  description: string;
  hint: string;
  badged: boolean;
  disabled: boolean;
}

// A row draws on the surface it sits on, and the list is what reserves the
// gutter across rows, so every story renders inside a `stay-open` list.
const surface = (rows: unknown) =>
  html`<moz-panel-list stay-open open label="Add-on actions"
    >${rows}</moz-panel-list
  >`;

const meta: Meta<Args> = {
  title: 'Components/PanelItem',
  component: 'moz-panel-item',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    size: { control: 'inline-radio', options: ['default', 'large'] },
    iconStart: { control: 'text' },
    iconEnd: { control: 'text' },
    description: { control: 'text' },
    hint: { control: 'text' },
    badged: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    label: 'Edit listing',
    size: 'default',
    iconStart: 'edit',
    iconEnd: undefined,
    description: '',
    hint: '',
    badged: false,
    disabled: false,
  },
  render: (args) =>
    surface(html`
      <moz-panel-item
        size=${args.size}
        icon-start=${args.iconStart || ''}
        icon-end=${args.iconEnd || ''}
        description=${args.description}
        hint=${args.hint}
        ?badged=${args.badged}
        ?disabled=${args.disabled}
        >${args.label}</moz-panel-item
      >
    `),
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

// `default` pairs a 16px icon with a 32px row; `large` steps the icon to 24px
// and the row to 40px.
export const Sizes: Story = {
  render: () =>
    surface(html`
      <moz-panel-item icon-start="bookmark">Default</moz-panel-item>
      <moz-panel-item icon-start="bookmark" size="large">Large</moz-panel-item>
    `),
};

// Rows without an icon of their own still line up, because the list reserves the
// gutter for all of them once one needs it.
export const MixedIcons: Story = {
  render: () =>
    surface(html`
      <moz-panel-item icon-start="bookmark">Bookmarked</moz-panel-item>
      <moz-panel-item>Everything</moz-panel-item>
      <moz-panel-item>Recently added</moz-panel-item>
    `),
};

// A second line of context under the label, and trailing hint text for a
// shortcut or a short status.
export const DescriptionsAndHints: Story = {
  render: () =>
    surface(html`
      <moz-panel-item icon-start="delete" description="Deletes every version"
        >Remove</moz-panel-item
      >
      <moz-panel-item icon-start="copy" hint="⌘D">Duplicate</moz-panel-item>
      <moz-panel-item icon-start="edit" hint="⌘E">Edit listing</moz-panel-item>
    `),
};

// `icon-end` sits inside the row, so it activates with the row.
export const IconEnd: Story = {
  render: () =>
    surface(html`
      <moz-panel-item icon-start="book" icon-end="external-link"
        >Documentation</moz-panel-item
      >
      <moz-panel-item icon-start="history" icon-end="chevron-right"
        >Version history</moz-panel-item
      >
    `),
};

// Naming `icon-end` makes it a control of its own beside the row, so the row's
// highlight stops at its hit area and choosing one isn't choosing the other.
export const TrailingAction: Story = {
  render: () =>
    surface(html`
      <moz-panel-item
        icon-start="bookmark"
        icon-end="delete"
        icon-end-label="Remove Saved for later"
        >Saved for later</moz-panel-item
      >
      <moz-panel-item
        icon-start="bookmark"
        icon-end="delete"
        icon-end-label="Remove Read it twice"
        >Read it twice</moz-panel-item
      >
    `),
};

// A checkbox row is a `menuitemcheckbox` with a real checkbox in the gutter, and
// it toggles itself. Choosing one leaves the list open so several can be set.
export const Checkboxes: Story = {
  render: () =>
    surface(html`
      <moz-panel-item type="checkbox" checked>Version</moz-panel-item>
      <moz-panel-item type="checkbox" checked>Status</moz-panel-item>
      <moz-panel-item type="checkbox">Reviewer</moz-panel-item>
    `),
};

// `badged` marks a row with an accent dot; `badge` adds a `<moz-badge>` after
// the label.
export const Badges: Story = {
  // The filled `new` badge is a hair under AA on its vendored token colors; see
  // the note on moz-badge's own stories.
  parameters: {
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
  },
  render: () =>
    surface(html`
      <moz-panel-item icon-start="settings" badged>Settings</moz-panel-item>
      <moz-panel-item icon-start="activity" badge="New" badge-type="new"
        >Insights</moz-panel-item
      >
      <moz-panel-item icon-start="ask" badge="Beta" badge-type="beta"
        >Ask AI</moz-panel-item
      >
    `),
};

// A row with `href` renders a real link, so it gets new-tab and context-menu
// behaviour.
export const Links: Story = {
  render: () =>
    surface(html`
      <moz-panel-item icon-start="book" href="https://extensionworkshop.com/"
        >Documentation</moz-panel-item
      >
      <moz-panel-item
        icon-start="external-link"
        href="https://addons.mozilla.org/"
        target="_blank"
        >View on AMO</moz-panel-item
      >
    `),
};

export const Disabled: Story = {
  render: () =>
    surface(html`
      <moz-panel-item icon-start="edit">Edit listing</moz-panel-item>
      <moz-panel-item icon-start="copy" disabled>Duplicate</moz-panel-item>
      <moz-panel-item icon-start="delete">Remove</moz-panel-item>
    `),
};

// `<moz-panel-row>` is for a row that isn't itself a choice — the app menu's
// zoom row, where the label is static and the controls beside it do the work.
// Arbitrary controls aren't valid children of a menu, so the panel holding one
// is a `type="slot"` panel.
export const Row: Story = {
  render: () => html`
    <moz-panel-list stay-open open type="slot" label="Page">
      <moz-panel-item icon-start="edit">Edit listing</moz-panel-item>
      <hr />
      <moz-panel-row>
        Zoom
        <div slot="actions">
          <moz-button
            icon-only="Zoom out"
            icon-start="subtract"
            variant="ghost"
            size="small"
          ></moz-button>
          <span>100%</span>
          <moz-button
            icon-only="Zoom in"
            icon-start="add"
            variant="ghost"
            size="small"
          ></moz-button>
          <moz-button
            icon-only="Full screen"
            icon-start="fullscreen-expand"
            variant="ghost"
            size="small"
          ></moz-button>
        </div>
      </moz-panel-row>
    </moz-panel-list>
  `,
};

// Interaction test: activating a checkbox row flips `checked` and the ARIA state
// that goes with it, and the state is already updated by the time the click
// reaches a listener on the list.
export const CheckboxToggles: Story = {
  tags: ['!dev', '!autodocs'],
  render: Checkboxes.render,
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector('moz-panel-list')!;
    const items = [
      ...canvasElement.querySelectorAll('moz-panel-item'),
    ] as MozPanelItem[];
    await list.updateComplete;
    await Promise.all(items.map((item) => item.updateComplete));

    const control = (item: MozPanelItem) =>
      item.shadowRoot!.querySelector('button')!;
    const box = (item: MozPanelItem) =>
      item.shadowRoot!.querySelector('moz-checkbox-visual')!;

    expect(control(items[2]).getAttribute('role')).toBe('menuitemcheckbox');
    expect(control(items[2]).getAttribute('aria-checked')).toBe('false');
    expect(box(items[2]).checked).toBe(false);

    const seen: boolean[] = [];
    list.addEventListener('click', (e) => {
      seen.push((e.target as MozPanelItem).checked);
    });

    await userEvent.click(control(items[2]));
    await items[2].updateComplete;
    expect(items[2].checked).toBe(true);
    expect(control(items[2]).getAttribute('aria-checked')).toBe('true');
    expect(box(items[2]).checked).toBe(true);
    expect(seen).toEqual([true]);

    await userEvent.click(control(items[2]));
    await items[2].updateComplete;
    expect(items[2].checked).toBe(false);
    expect(box(items[2]).checked).toBe(false);
    expect(seen).toEqual([true, false]);
  },
};

// Interaction test: the trailing action is its own control — it fires
// `moz-panel-item:action` and the row's own click never runs.
export const TrailingActionIsSeparate: Story = {
  tags: ['!dev', '!autodocs'],
  render: TrailingAction.render,
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector('moz-panel-list')!;
    const item = canvasElement.querySelector('moz-panel-item') as MozPanelItem;
    await item.updateComplete;

    // A menu may own a group, which is what holds the row and its action.
    expect(item.getAttribute('role')).toBe('group');
    const row = item.shadowRoot!.querySelector('.item')!;
    const action = item.shadowRoot!.querySelector<HTMLElement>('.action')!;
    expect(row.getAttribute('role')).toBe('menuitem');
    expect(action.getAttribute('role')).toBe('menuitem');
    expect(row.contains(action)).toBe(false);

    let actions = 0;
    let clicks = 0;
    item.addEventListener('moz-panel-item:action', () => {
      actions += 1;
    });
    list.addEventListener('click', () => {
      clicks += 1;
    });

    await userEvent.click(action);
    expect(actions).toBe(1);
    // Stopped at the item, so the list never reads it as a row being chosen.
    expect(clicks).toBe(0);
  },
};
