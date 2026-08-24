import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect, userEvent } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import '../moz-card/moz-card';
import './moz-page-nav';
import type { IconName } from '../../generated/icons';
import type { MozPageNav, MozPageNavButton } from './moz-page-nav';

interface Args {
  heading?: string;
  current?: string;
  showIcons: boolean;
  showSecondary: boolean;
}

const views: { value: string; label: string; icon: IconName }[] = [
  { value: 'general', label: 'General', icon: 'settings' },
  { value: 'privacy', label: 'Privacy & Security', icon: 'shield' },
  { value: 'sync', label: 'Sync', icon: 'sync' },
];

const meta: Meta<Args> = {
  title: 'Components/PageNav',
  component: 'moz-page-nav',
  tags: ['autodocs'],
  decorators: [logEvents('moz-page-nav:change')],
  argTypes: {
    heading: { control: 'text' },
    current: { control: 'text' },
    showIcons: { control: 'boolean' },
    showSecondary: { control: 'boolean' },
  },
  args: {
    heading: 'Settings',
    current: 'general',
    showIcons: true,
    showSecondary: false,
  },
  render: (args) => html`
    <moz-page-nav
      id="settings-nav"
      heading=${ifDefined(args.heading)}
      current=${ifDefined(args.current)}
    >
      ${views.map(
        (v) => html`
          <moz-page-nav-button
            value=${v.value}
            icon-start=${ifDefined(args.showIcons ? v.icon : undefined)}
          >
            ${v.label}
          </moz-page-nav-button>
        `,
      )}
      ${
        args.showSecondary
          ? html`<moz-page-nav-button
              slot="secondary"
              href="https://support.mozilla.org"
              icon-start=${ifDefined(args.showIcons ? 'help' : undefined)}
              >Get help</moz-page-nav-button
            >`
          : null
      }
    </moz-page-nav>
  `,
};

export default meta;
type Story = StoryObj<Args>;

// --- Visual stories (no play) ---

export const Default: Story = {};

export const WithoutIcons: Story = { args: { showIcons: false } };

export const WithSecondaryLinks: Story = { args: { showSecondary: true } };

// Heading supplied via the `heading` slot instead of the attribute.
export const HeadingSlot: Story = {
  render: (args) => html`
    <moz-page-nav id="settings-nav" current=${ifDefined(args.current)}>
      <h2 slot="heading" style="margin:0;font:inherit;font-weight:600;">
        Custom heading
      </h2>
      ${views.map(
        (v) =>
          html`<moz-page-nav-button value=${v.value}
            >${v.label}</moz-page-nav-button
          >`,
      )}
    </moz-page-nav>
  `,
};

// No matching `current`: the first button auto-selects.
export const AutoSelectFirst: Story = { args: { current: 'does-not-exist' } };

// A search box (or notification) can go in the `subheading` slot.
export const WithSubheading: Story = {
  render: (args) => html`
    <moz-page-nav
      heading=${ifDefined(args.heading)}
      current=${ifDefined(args.current)}
    >
      <input
        slot="subheading"
        type="search"
        placeholder="Search settings"
        aria-label="Search settings"
        style="inline-size:100%;box-sizing:border-box;padding:6px 8px;"
      />
      ${views.map(
        (v) => html`
          <moz-page-nav-button
            value=${v.value}
            icon-start=${ifDefined(args.showIcons ? v.icon : undefined)}
          >
            ${v.label}
          </moz-page-nav-button>
        `,
      )}
    </moz-page-nav>
  `,
};

// Table of contents: `scrollspy` + in-page `href="#id"` anchors. The item for
// the section scrolled into view highlights; clicks scroll natively + share via
// the URL hash.
export const TableOfContents: Story = {
  render: () => html`
    <div style="display:flex;gap:24px;align-items:flex-start;">
      <moz-card style="position:sticky;top:16px;flex:0 0 220px;">
        <moz-page-nav id="toc" heading="On this page" scrollspy>
          <moz-page-nav-button href="#intro">Introduction</moz-page-nav-button>
          <moz-page-nav-button href="#install">Installation</moz-page-nav-button>
          <moz-page-nav-button href="#usage">Usage</moz-page-nav-button>
          <moz-page-nav-button href="#api">API reference</moz-page-nav-button>
        </moz-page-nav>
      </moz-card>
      <div style="flex:1 1 auto;max-width:520px;">
        ${['intro', 'install', 'usage', 'api'].map(
          (id, i) => html`
            <section id=${id} style="min-block-size:70vh;">
              <h2>
                ${['Introduction', 'Installation', 'Usage', 'API reference'][i]}
              </h2>
              <p>Scroll to highlight the matching nav item.</p>
            </section>
          `,
        )}
      </div>
    </div>
  `,
};

// --- Interaction tests (test-only) ---

const ready = async (canvasElement: HTMLElement) => {
  const nav = canvasElement.querySelector<MozPageNav>('moz-page-nav')!;
  await nav.updateComplete;
  const items = [
    ...nav.querySelectorAll<MozPageNavButton>('moz-page-nav-button'),
  ];
  await Promise.all(items.map((i) => i.updateComplete));
  return { nav, items };
};
const innerButton = (item: MozPageNavButton) =>
  item.shadowRoot!.querySelector('button')!;

// Clicking a view fires moz-page-nav:change with its value and moves
// aria-current onto it.
export const SelectByClick: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const { nav, items } = await ready(canvasElement);
    const events: (string | undefined)[] = [];
    nav.addEventListener('moz-page-nav:change', (e) =>
      events.push((e as CustomEvent<{ value?: string }>).detail.value),
    );

    await userEvent.click(innerButton(items[1]));
    await items[1].updateComplete;

    expect(events).toEqual(['privacy']);
    expect(nav.current).toBe('privacy');
    expect(innerButton(items[1]).getAttribute('aria-current')).toBe('page');
    expect(innerButton(items[0]).hasAttribute('aria-current')).toBe(false);
    // Roving tabindex: only the selected button is a tab stop.
    expect(innerButton(items[1]).tabIndex).toBe(0);
    expect(innerButton(items[0]).tabIndex).toBe(-1);
  },
};

// Re-clicking the current view does not re-fire the change event.
export const NoChangeOnReselect: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const { nav, items } = await ready(canvasElement);
    let count = 0;
    nav.addEventListener('moz-page-nav:change', () => count++);
    await userEvent.click(innerButton(items[0])); // already current
    expect(count).toBe(0);
  },
};

// Arrow keys and Home/End move selection (selection follows focus) and fire
// the change event each step.
export const KeyboardNavigation: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const { nav, items } = await ready(canvasElement);
    const events: (string | undefined)[] = [];
    nav.addEventListener('moz-page-nav:change', (e) =>
      events.push((e as CustomEvent<{ value?: string }>).detail.value),
    );

    innerButton(items[0]).focus();
    await userEvent.keyboard('{ArrowDown}');
    await nav.updateComplete;
    expect(nav.current).toBe('privacy');

    await userEvent.keyboard('{End}');
    await nav.updateComplete;
    expect(nav.current).toBe('sync');

    await userEvent.keyboard('{ArrowUp}');
    await nav.updateComplete;
    expect(nav.current).toBe('privacy');

    await userEvent.keyboard('{Home}');
    await nav.updateComplete;
    expect(nav.current).toBe('general');

    expect(events).toEqual(['privacy', 'sync', 'privacy', 'general']);
  },
};

// A secondary item with href renders an <a> and does not fire change.
export const SecondaryLinkIsAnchor: Story = {
  tags: ['!dev', '!autodocs'],
  args: { showSecondary: true },
  play: async ({ canvasElement }) => {
    const { nav } = await ready(canvasElement);
    const link = nav.querySelector<MozPageNavButton>(
      'moz-page-nav-button[slot="secondary"]',
    )!;
    await link.updateComplete;
    const anchor = link.shadowRoot!.querySelector('a')!;
    expect(anchor).toBeTruthy();
    expect(anchor.getAttribute('href')).toBe('https://support.mozilla.org');
    expect(link.shadowRoot!.querySelector('button')).toBeNull();

    let fired = false;
    nav.addEventListener('moz-page-nav:change', () => {
      fired = true;
    });
    // Stop the real navigation the anchor would otherwise perform in the test.
    anchor.addEventListener('click', (e) => e.preventDefault());
    await userEvent.click(anchor);
    expect(fired).toBe(false);
  },
};

// A non-matching `current` auto-selects the first button and adopts its value.
export const AutoSelectBehaviour: Story = {
  tags: ['!dev', '!autodocs'],
  args: { current: 'nope' },
  play: async ({ canvasElement }) => {
    const { nav, items } = await ready(canvasElement);
    expect(nav.current).toBe('general');
    expect(innerButton(items[0]).getAttribute('aria-current')).toBe('page');
  },
};

// In-page anchor items render as <a href>, select by their hash id, and fire
// change on click (in addition to native scroll).
export const AnchorItemsSelectable: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-page-nav current="usage">
      <moz-page-nav-button href="#intro">Introduction</moz-page-nav-button>
      <moz-page-nav-button href="#usage">Usage</moz-page-nav-button>
    </moz-page-nav>
  `,
  play: async ({ canvasElement }) => {
    const { nav, items } = await ready(canvasElement);
    const firstAnchor = items[0].shadowRoot!.querySelector('a')!;
    expect(firstAnchor.getAttribute('href')).toBe('#intro');

    // `current="usage"` selects the item whose href hash matches.
    expect(items[1].selected).toBe(true);
    expect(
      items[1].shadowRoot!.querySelector('a')!.getAttribute('aria-current'),
    ).toBe('page');

    const events: (string | undefined)[] = [];
    nav.addEventListener('moz-page-nav:change', (e) =>
      events.push((e as CustomEvent<{ value?: string }>).detail.value),
    );
    // Stop the real hash navigation the anchor would do in the test.
    firstAnchor.addEventListener('click', (e) => e.preventDefault());
    await userEvent.click(firstAnchor);
    expect(events).toEqual(['intro']);
    expect(nav.current).toBe('intro');
  },
};

// With allow-no-selection, a non-matching `current` selects nothing.
export const AllowNoSelection: Story = {
  tags: ['!dev', '!autodocs'],
  args: { current: 'nope' },
  render: (args) => html`
    <moz-page-nav current=${ifDefined(args.current)} allow-no-selection>
      ${views.map(
        (v) =>
          html`<moz-page-nav-button value=${v.value}
            >${v.label}</moz-page-nav-button
          >`,
      )}
    </moz-page-nav>
  `,
  play: async ({ canvasElement }) => {
    const { nav, items } = await ready(canvasElement);
    expect(nav.current).toBe('nope');
    expect(items.some((i) => i.selected)).toBe(false);
  },
};
