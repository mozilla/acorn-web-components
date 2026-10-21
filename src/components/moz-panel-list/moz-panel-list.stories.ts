import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { expect, userEvent, waitFor } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-panel-list';
import '../moz-button/moz-button';
import '../moz-panel-item/moz-panel-item';
import type { MozPanelItem } from '../moz-panel-item/moz-panel-item';
import type { MozPanelList } from './moz-panel-list';

interface Args {
  label: string;
  minWidthFromAnchor: boolean;
}

const meta: Meta<Args> = {
  title: 'Components/PanelList',
  component: 'moz-panel-list',
  tags: ['autodocs'],
  decorators: [logEvents('moz-panel-list:shown', 'moz-panel-list:hidden')],
  argTypes: {
    label: { control: 'text' },
    minWidthFromAnchor: { control: 'boolean' },
  },
  args: {
    label: 'Add-on actions',
    minWidthFromAnchor: false,
  },
  render: (args) => html`
    <moz-button icon-only="Add-on actions" icon-start="app-menu" menu-id="actions">
    </moz-button>
    <moz-panel-list
      id="actions"
      label=${args.label}
      ?min-width-from-anchor=${args.minWidthFromAnchor}
    >
      <moz-panel-item icon-start="edit">Edit listing</moz-panel-item>
      <moz-panel-item icon-start="copy">Duplicate</moz-panel-item>
      <hr />
      <moz-panel-item icon-start="delete">Remove</moz-panel-item>
    </moz-panel-list>
  `,
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

// `stay-open` drops the list into normal flow with its dismiss handling off, so
// the surface can be inspected without a trigger. Not for production use.
export const Open: Story = {
  render: () => html`
    <moz-panel-list stay-open open label="Add-on actions">
      <moz-panel-item icon-start="edit">Edit listing</moz-panel-item>
      <moz-panel-item icon-start="copy">Duplicate</moz-panel-item>
      <hr />
      <moz-panel-item icon-start="delete">Remove</moz-panel-item>
    </moz-panel-list>
  `,
};

export const DisabledItem: Story = {
  render: () => html`
    <moz-panel-list stay-open open label="Add-on actions">
      <moz-panel-item icon-start="edit">Edit listing</moz-panel-item>
      <moz-panel-item icon-start="copy" disabled>Duplicate</moz-panel-item>
      <moz-panel-item icon-start="delete">Remove</moz-panel-item>
    </moz-panel-list>
  `,
};

// A nested list in the `submenu` slot opens on hover, Enter, or Right.
export const Submenu: Story = {
  render: () => html`
    <moz-button icon-only="Add-on actions" icon-start="app-menu" menu-id="submenu-demo">
    </moz-button>
    <moz-panel-list id="submenu-demo" label="Add-on actions">
      <moz-panel-item icon-start="edit">Edit listing</moz-panel-item>
      <moz-panel-item icon-start="copy" submenu>
        Copy to
        <moz-panel-list slot="submenu" label="Copy to">
          <moz-panel-item>Staging</moz-panel-item>
          <moz-panel-item>Production</moz-panel-item>
        </moz-panel-list>
      </moz-panel-item>
      <hr />
      <moz-panel-item icon-start="delete">Remove</moz-panel-item>
    </moz-panel-list>
  `,
};

// Used like a `<select>` dropdown, the list takes its anchor's width.
export const MinWidthFromAnchor: Story = {
  args: { minWidthFromAnchor: true },
  render: (args) => html`
    <moz-button menu-id="fruit" icon-end="chevron-down" style="inline-size:260px;"
      >Apples</moz-button
    >
    <moz-panel-list
      id="fruit"
      label="Fruit"
      ?min-width-from-anchor=${args.minWidthFromAnchor}
    >
      <moz-panel-item>Apples</moz-panel-item>
      <moz-panel-item>Bananas</moz-panel-item>
      <moz-panel-item>Cherries</moz-panel-item>
    </moz-panel-list>
  `,
};

// A `heading` adds a titled header above the rows, separated from them. The
// title is centred regardless of which side holds a button; `back-label` adds a
// back button that fires `moz-panel-list:back` and leaves the list open, and
// `header-end` takes a control of your own.
export const Header: Story = {
  render: () => html`
    <moz-panel-list
      stay-open
      open
      heading="Listing details"
      back-label="Back to Add-on actions"
    >
      <moz-button
        slot="header-end"
        icon-only="About listings"
        icon-start="information"
        variant="ghost"
      ></moz-button>
      <moz-panel-item icon-start="edit">Edit listing</moz-panel-item>
      <moz-panel-item icon-start="copy">Duplicate</moz-panel-item>
    </moz-panel-list>
  `,
};

// A heading among the rows captions the ones that follow it — Firefox's subview
// subheader.
export const Subheadings: Story = {
  render: () => html`
    <moz-panel-list stay-open open label="Versions">
      <moz-panel-item icon-start="add">Upload new version</moz-panel-item>
      <hr />
      <h2>Awaiting review</h2>
      <moz-panel-item>1.4.2</moz-panel-item>
      <h2>Published</h2>
      <moz-panel-item>1.4.1</moz-panel-item>
      <moz-panel-item>1.4.0</moz-panel-item>
    </moz-panel-list>
  `,
};

// More rows than fit: a chevron at the scrolled-away end hints that the list
// continues, so a clipped list doesn't read as a complete one.
export const Overflow: Story = {
  render: () => html`
    <moz-panel-list stay-open open label="Versions" style="max-block-size:160px;">
      ${Array.from(
        { length: 12 },
        (_, i) => html`<moz-panel-item>Version 1.4.${11 - i}</moz-panel-item>`,
      )}
    </moz-panel-list>
  `,
};

// The control a real pointer would land on. userEvent dispatches on the element
// it is given rather than hit-testing, so clicking a host would miss the button
// inside it.
const control = (el: Element) =>
  el.shadowRoot!.querySelector<HTMLElement>('button, a')!;

/**
 * The list measures and positions across a frame, so every open and close
 * settles asynchronously. Waiting for the event it finishes with beats a fixed
 * delay, which a loaded CI machine can outrun.
 */
const settled = (list: MozPanelList, event: 'shown' | 'hidden') =>
  new Promise<void>((resolve) =>
    list.addEventListener(`moz-panel-list:${event}`, () => resolve(), {
      once: true,
    }),
  );

const settle = () => new Promise((r) => setTimeout(r, 50));

const open = async (canvasElement: HTMLElement) => {
  const trigger = canvasElement.querySelector('moz-button')!;
  const list = canvasElement.querySelector('moz-panel-list') as MozPanelList;
  await trigger.updateComplete;
  await list.updateComplete;
  const shown = settled(list, 'shown');
  await userEvent.click(control(trigger));
  await shown;
  return { trigger, list };
};

// Interaction test: the trigger opens the list, anchors it, reflects the state
// on its own button, and closes it again on a second click.
export const TriggerToggles: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const { trigger, list } = await open(canvasElement);

    expect(list.open).toBe(true);
    expect(list.matches(':popover-open')).toBe(true);
    const button = trigger.shadowRoot!.querySelector('button')!;
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    expect(button.getAttribute('aria-expanded')).toBe('true');

    const triggerBox = trigger.getBoundingClientRect();
    const listBox = list.getBoundingClientRect();
    expect(Math.round(listBox.top)).toBe(Math.round(triggerBox.bottom));

    const items = [...canvasElement.querySelectorAll('moz-panel-item')];
    expect(document.activeElement).toBe(items[0]);

    const hidden = settled(list, 'hidden');
    await userEvent.click(control(trigger));
    await hidden;
    expect(list.open).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  },
};

// Interaction test: Up/Down wrap through the enabled rows, skipping a disabled
// one, and Escape closes the list and hands focus back to the trigger.
export const KeyboardNavigates: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-button icon-only="Add-on actions" icon-start="app-menu" menu-id="keys">
    </moz-button>
    <moz-panel-list id="keys" label="Add-on actions">
      <moz-panel-item>Edit listing</moz-panel-item>
      <moz-panel-item disabled>Duplicate</moz-panel-item>
      <moz-panel-item>Remove</moz-panel-item>
    </moz-panel-list>
  `,
  play: async ({ canvasElement }) => {
    const { trigger, list } = await open(canvasElement);
    const items = [
      ...canvasElement.querySelectorAll('moz-panel-item'),
    ] as MozPanelItem[];

    expect(document.activeElement).toBe(items[0]);

    await userEvent.keyboard('{ArrowDown}');
    // The disabled row is skipped.
    expect(document.activeElement).toBe(items[2]);

    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items[0]);

    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(items[2]);

    const hidden = settled(list, 'hidden');
    await userEvent.keyboard('{Escape}');
    await hidden;
    expect(list.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  },
};

// Interaction test: typing a letter moves focus to the next row starting with
// it, so rows named after user content stay reachable.
export const TypeaheadMovesFocus: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await open(canvasElement);
    const items = [
      ...canvasElement.querySelectorAll('moz-panel-item'),
    ] as MozPanelItem[];

    await userEvent.keyboard('r');
    expect(document.activeElement).toBe(items[2]);
  },
};

// Interaction test: choosing a row closes the list, but a checkbox row leaves it
// open so several can be set in a row.
export const ChoosingARowCloses: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-button icon-only="Columns" icon-start="app-menu" menu-id="choose">
    </moz-button>
    <moz-panel-list id="choose" label="Columns">
      <moz-panel-item type="checkbox">Version</moz-panel-item>
      <moz-panel-item>Reset</moz-panel-item>
    </moz-panel-list>
  `,
  play: async ({ canvasElement }) => {
    const { list } = await open(canvasElement);
    const items = [
      ...canvasElement.querySelectorAll('moz-panel-item'),
    ] as MozPanelItem[];

    await userEvent.click(control(items[0]));
    await settle();
    expect(list.open).toBe(true);

    const hidden = settled(list, 'hidden');
    await userEvent.click(control(items[1]));
    await hidden;
    expect(list.open).toBe(false);
  },
};

// Interaction test: a pointer press outside the list dismisses it.
export const ClickOutsideDismisses: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const { list } = await open(canvasElement);
    const hidden = settled(list, 'hidden');
    await userEvent.click(document.body);
    await hidden;
    expect(list.open).toBe(false);
  },
};

// Interaction test: Right opens a submenu beside its row and Left closes it,
// returning focus to the row that owns it.
export const SubmenuOpensOnArrowKey: Story = {
  tags: ['!dev', '!autodocs'],
  render: Submenu.render,
  play: async ({ canvasElement }) => {
    await open(canvasElement);
    const parent = canvasElement.querySelector(
      'moz-panel-item[submenu]',
    ) as MozPanelItem;
    const submenu = canvasElement.querySelector(
      'moz-panel-list[slot="submenu"]',
    ) as MozPanelList;

    const shown = settled(submenu, 'shown');
    parent.focus();
    await userEvent.keyboard('{ArrowRight}');
    await shown;
    expect(submenu.open).toBe(true);
    expect(parent.submenuOpen).toBe(true);

    const subItems = [...submenu.querySelectorAll('moz-panel-item')];
    expect(document.activeElement).toBe(subItems[0]);

    const hidden = settled(submenu, 'hidden');
    await userEvent.keyboard('{ArrowLeft}');
    await hidden;
    expect(submenu.open).toBe(false);
    expect(document.activeElement).toBe(parent);
  },
};

// Any element can be the trigger: point `anchor` at its `id` and call the
// list's own `toggle()`. A native button carries the ARIA itself.
export const AnchorAttribute: Story = {
  render: () => html`
    <button
      type="button"
      aria-haspopup="menu"
      @click=${(e: Event) =>
        (document.getElementById('anchored') as MozPanelList).toggle(e)}
    >
      Actions
    </button>
    <moz-panel-list id="anchored" anchor="plain-trigger" label="Actions">
      <moz-panel-item>Edit listing</moz-panel-item>
      <moz-panel-item>Remove</moz-panel-item>
    </moz-panel-list>
  `,
};

// Interaction test: the list resolves its anchor from the `anchor` id when the
// triggering event doesn't name one, and annotates it.
export const AnchorAttributeResolves: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <button type="button" id="plain-trigger" aria-haspopup="menu">Actions</button>
    <moz-panel-list id="anchored" anchor="plain-trigger" label="Actions">
      <moz-panel-item>Edit listing</moz-panel-item>
      <moz-panel-item>Remove</moz-panel-item>
    </moz-panel-list>
  `,
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector('button')!;
    const list = canvasElement.querySelector('moz-panel-list') as MozPanelList;
    await list.updateComplete;

    // No target and no event, so only the `anchor` id can supply one.
    const shown = settled(list, 'shown');
    list.show();
    await shown;
    expect(list.open).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(Math.round(list.getBoundingClientRect().top)).toBe(
      Math.round(trigger.getBoundingClientRect().bottom),
    );

    const hidden = settled(list, 'hidden');
    list.hide();
    await hidden;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  },
};

// Interaction test: `align` pins the list to the chosen anchor edge instead of
// letting it flip to fit.
export const AlignsToAnchorEdge: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <div style="display:flex;justify-content:center;">
      <moz-button menu-id="aligned" style="inline-size:300px;">Wide trigger</moz-button>
    </div>
    <moz-panel-list id="aligned" align="end" label="Actions">
      <moz-panel-item>Edit listing</moz-panel-item>
      <moz-panel-item>Remove</moz-panel-item>
    </moz-panel-list>
  `,
  play: async ({ canvasElement }) => {
    const { trigger, list } = await open(canvasElement);
    expect(Math.round(list.getBoundingClientRect().right)).toBe(
      Math.round(trigger.getBoundingClientRect().right),
    );

    list.align = 'start';
    await list.updateComplete;
    list.hide();
    const reshown = settled(list, 'shown');
    await userEvent.click(control(trigger));
    await reshown;
    expect(Math.round(list.getBoundingClientRect().left)).toBe(
      Math.round(trigger.getBoundingClientRect().left),
    );
  },
};

// Interaction test: hovering a submenu row opens it without taking focus, and
// hovering a sibling closes it again so only one is ever open.
export const SubmenuOpensOnHover: Story = {
  tags: ['!dev', '!autodocs'],
  render: Submenu.render,
  play: async ({ canvasElement }) => {
    await open(canvasElement);
    const items = [
      ...canvasElement.querySelectorAll('moz-panel-item'),
    ] as MozPanelItem[];
    const parent = items[1];
    const submenu = canvasElement.querySelector(
      'moz-panel-list[slot="submenu"]',
    ) as MozPanelList;

    let shown = settled(submenu, 'shown');
    await userEvent.hover(parent);
    await shown;
    expect(submenu.open).toBe(true);
    // The pointer only swept over the row, so focus stays where it was.
    expect(document.activeElement).toBe(items[0]);

    // ArrowLeft is handled by the row, so focus has to be on it.
    parent.focus();
    let hidden = settled(submenu, 'hidden');
    await userEvent.keyboard('{ArrowLeft}');
    await hidden;
    expect(submenu.open).toBe(false);

    shown = settled(submenu, 'shown');
    await userEvent.hover(parent);
    await shown;
    expect(submenu.open).toBe(true);

    hidden = settled(submenu, 'hidden');
    await userEvent.hover(items[0]);
    await hidden;
    expect(submenu.open).toBe(false);
  },
};

// Interaction test: a disabled row can't be chosen, so it neither acts nor
// closes the list, and `click()` on an enabled row activates the real control.
export const DisabledRowIsInert: Story = {
  tags: ['!dev', '!autodocs'],
  render: DisabledItem.render,
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector('moz-panel-list') as MozPanelList;
    await list.updateComplete;
    const items = [
      ...canvasElement.querySelectorAll('moz-panel-item'),
    ] as MozPanelItem[];
    await Promise.all(items.map((item) => item.updateComplete));

    let clicks = 0;
    list.addEventListener('click', () => {
      clicks += 1;
    });

    items[1].click();
    expect(clicks).toBe(0);

    items[0].click();
    expect(clicks).toBe(1);
  },
};

// Interaction test: scrolling the anchor keeps the list on it, rather than
// leaving the list stranded where it opened.
//
// A scrolling container, not the window: `scrollBy` is committed on a later
// frame and only if the document happens to be scrollable at all, which made
// this flaky in WebKit, whereas setting `scrollTop` takes effect there and then.
// The list listens for scroll in the capture phase precisely so a container
// like this reaches it.
export const RepositionsOnScroll: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <div id="scroller" style="block-size:120px;overflow:auto;">
      <div style="block-size:400px;padding-block-start:8px;">
        <moz-button icon-only="Actions" icon-start="app-menu" menu-id="scrolled">
        </moz-button>
      </div>
    </div>
    <moz-panel-list id="scrolled" label="Actions">
      <moz-panel-item>Edit listing</moz-panel-item>
      <moz-panel-item>Remove</moz-panel-item>
    </moz-panel-list>
  `,
  play: async ({ canvasElement }) => {
    const { trigger, list } = await open(canvasElement);
    const scroller = canvasElement.querySelector('#scroller') as HTMLElement;
    const before = list.getBoundingClientRect().top;

    // Small enough that the trigger stays in view, so the list can still sit
    // flush under it rather than clamping to the viewport edge.
    scroller.scrollTop = 30;
    expect(scroller.scrollTop).toBe(30);

    await waitFor(() => {
      expect(Math.round(list.getBoundingClientRect().top)).toBe(
        Math.round(trigger.getBoundingClientRect().bottom),
      );
    });
    expect(list.getBoundingClientRect().top).not.toBe(before);
  },
};

// Interaction test: the header's back button reports itself and leaves the list
// open, so the consumer can swap in the previous view.
export const HeaderBackStaysOpen: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-button icon-only="Add-on actions" icon-start="app-menu" menu-id="withheader">
    </moz-button>
    <moz-panel-list
      id="withheader"
      heading="Listing details"
      back-label="Back to Add-on actions"
    >
      <moz-panel-item icon-start="edit">Edit listing</moz-panel-item>
    </moz-panel-list>
  `,
  play: async ({ canvasElement }) => {
    const { list } = await open(canvasElement);
    // The menu is the row container, not the host, so the header's back button
    // isn't one of the menu's children.
    const rows = list.shadowRoot!.querySelector('.list')!;
    expect(rows.getAttribute('role')).toBe('menu');
    expect(rows.getAttribute('aria-labelledby')).toBe('heading');
    expect(rows.contains(list.shadowRoot!.querySelector('.header'))).toBe(
      false,
    );

    let backs = 0;
    list.addEventListener('moz-panel-list:back', () => {
      backs += 1;
    });

    const back = list.shadowRoot!.querySelector('moz-button')!;
    await back.updateComplete;
    await userEvent.click(control(back));
    await settle();

    expect(backs).toBe(1);
    expect(list.open).toBe(true);
  },
};

// Interaction test: the overflow chevrons follow the scroll position, appearing
// only at an end there is more content past.
export const OverflowIndicators: Story = {
  tags: ['!dev', '!autodocs'],
  render: Overflow.render,
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector('moz-panel-list') as MozPanelList;
    await list.updateComplete;

    const rows = list.shadowRoot!.querySelector('.list')!;
    // A ResizeObserver settles these, so wait for them rather than a clock.
    await waitFor(() => {
      expect(list.hasAttribute('data-overflow-bottom')).toBe(true);
      expect(list.hasAttribute('data-overflow-top')).toBe(false);
    });

    // To the real maximum: reserving the indicator rows shortens the scroll
    // port, and the browser doesn't re-clamp an existing scrollTop for that.
    rows.scrollTop = rows.scrollHeight - rows.clientHeight;
    await waitFor(() => {
      expect(list.hasAttribute('data-overflow-top')).toBe(true);
      expect(list.hasAttribute('data-overflow-bottom')).toBe(false);
    });
  },
};

// Interaction test: a panel of arbitrary controls keeps the surface and the
// dismiss handling but isn't a menu, so it doesn't claim its contents are
// choices and leaves them to plain tab order.
export const SlotTypeIsNotAMenu: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-button icon-only="Page" icon-start="app-menu" menu-id="slotpanel"></moz-button>
    <moz-panel-list id="slotpanel" type="slot" label="Page">
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
        </div>
      </moz-panel-row>
    </moz-panel-list>
  `,
  play: async ({ canvasElement }) => {
    const { list } = await open(canvasElement);
    const item = canvasElement.querySelector('moz-panel-item') as MozPanelItem;
    await item.updateComplete;

    expect(list.shadowRoot!.querySelector('.list')!.getAttribute('role')).toBe(
      'group',
    );
    // The row is still a button, just not a menu choice.
    expect(item.shadowRoot!.querySelector('button')!.hasAttribute('role')).toBe(
      false,
    );

    // Arrow keys belong to the menu model, so they don't move focus here.
    const before = document.activeElement;
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(before);

    const hidden = settled(list, 'hidden');
    await userEvent.keyboard('{Escape}');
    await hidden;
    expect(list.open).toBe(false);
  },
};
