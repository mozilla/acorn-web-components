import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { iconButton } from '../../base/icon-button';
import { MozLitElement } from '../../base/moz-lit-element';
import { rovingIndex } from '../../base/roving';
import shared from '../../base/shared.css';
import buttonTokens from '../../generated/component-tokens/button.css';
import panelTokens from '../../generated/component-tokens/panel.css';
import panelMenuitemTokens from '../../generated/component-tokens/panel-menuitem.css';
import { MozPanelItem } from '../moz-panel-item/moz-panel-item';
import '../moz-icon/moz-icon';
import { slotHasContent } from '../../base/slots';
import styles from './moz-panel-list.css';

/**
 * What the panel holds, from Figma's Panel `Type` variants. `menu` is a list of
 * choices; `slot` is a panel of arbitrary content, which a menu's ARIA can't
 * describe — only rows and separators may live in a menu.
 */
export type PanelListType = 'menu' | 'slot';

/** Which edge of the anchor the panel lines up with; `auto` flips to fit. */
export type PanelListAlign = 'auto' | 'start' | 'end';

/** Keeps the panel clear of the viewport edge rather than flush against it. */
const VIEWPORT_MARGIN = 10;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Nova panel list: a floating menu of `<moz-panel-item>` rows, anchored to the
 * control that opened it. Ported from Firefox's `panel-list`, which positions
 * itself by measurement; this one renders in the top layer as a `manual`
 * popover, so it escapes `overflow` and stacking contexts and can be placed in
 * plain viewport coordinates.
 *
 * Open it from the trigger's click handler with `toggle(event)` — the event's
 * target becomes the anchor — or point `<moz-button menu-id>` at the list's
 * `id` and it wires the click, the ARIA, and the `open` state for you.
 *
 * Alongside `<moz-panel-item>` rows the default slot takes `<hr>` separators, a
 * heading (`<h2>`, styled as Firefox's subview subheader) to caption the rows
 * that follow it, and `<moz-panel-row>` for a row that only holds controls. A
 * `heading` adds a titled header above them, and a chevron appears at either end
 * of the rows when there are more of them than fit.
 *
 * The rows sit in a `role="menu"`, with Up/Down/Home/End moving focus between
 * them (wrapping), first-letter typeahead, Escape and Tab closing, and focus
 * returning to the anchor. The menu is the row container rather than the host,
 * so the header's own controls aren't children of it — a menu may only own rows
 * and separators. Choosing an item closes the list, except for a `checkbox` item or one
 * that owns a submenu.
 *
 * A panel holding anything other than rows and separators — a `<moz-panel-row>`
 * of controls, say — needs `type="slot"`, since those aren't valid children of a
 * menu. It keeps the surface, the anchoring and the dismiss handling, but drops
 * the menu role and its arrow-key model for plain tab order.
 *
 * @slot - `<moz-panel-item>` rows, `<hr>` separators, and subheadings.
 * @slot heading - header title content (overrides the `heading` attribute).
 * @slot header-start - a control at the header's inline start, beside the back button.
 * @slot header-end - a control at the header's inline end.
 * @csspart header - the header row.
 * @csspart heading - the header title.
 * @csspart list - the scrollable row container.
 * @fires moz-panel-list:shown - the list opened and was positioned.
 * @fires moz-panel-list:hidden - the list closed.
 * @fires moz-panel-list:back - the header's back button was pressed. The list
 *   stays open; swap its contents to the previous view.
 */
export class MozPanelList extends MozLitElement {
  static styles = [
    shared,
    buttonTokens,
    panelTokens,
    panelMenuitemTokens,
    styles,
  ];

  /** What the panel holds: a list of choices, or arbitrary content. */
  @property({ reflect: true }) type: PanelListType = 'menu';

  /** Whether the list is open. Reflected for two-way binding. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** `id` of the element to anchor to, when no triggering event supplies one. */
  @property() anchor?: string;

  /** Which anchor edge to line up with. `auto` flips when it would overflow. */
  @property({ reflect: true }) align: PanelListAlign = 'auto';

  /** Match the anchor's width, for a list used like a `<select>` dropdown. */
  @property({
    type: Boolean,
    reflect: true,
    attribute: 'min-width-from-anchor',
  })
  minWidthFromAnchor = false;

  /**
   * Render in normal flow and skip the dismiss handling, for inspecting the
   * list in Storybook or a snapshot. Not for production use.
   */
  @property({ type: Boolean, reflect: true, attribute: 'stay-open' })
  stayOpen = false;

  /** Header title; alternatively use the `heading` slot. */
  @property() heading?: string;

  /** Accessible name for the menu. Defaults to the header title. */
  @property() label?: string;

  /**
   * Accessible name for a back button in the header; pass a localized string.
   * Pressing it fires `moz-panel-list:back` and leaves the list open.
   */
  @property({ attribute: 'back-label' }) backLabel?: string;

  @state() private hasHeadingSlot = false;
  @state() private hasHeaderStart = false;
  @state() private hasHeaderEnd = false;

  #anchorEl: HTMLElement | null = null;
  #openedByHover = false;
  #resizeObserver?: ResizeObserver;

  get #floating(): boolean {
    return !this.stayOpen;
  }

  /** The item this list is the submenu of, if any. */
  get #parentItem(): MozPanelItem | null {
    const parent = this.parentElement;
    return this.slot === 'submenu' && parent instanceof MozPanelItem
      ? parent
      : null;
  }

  get #listEl(): HTMLElement | null {
    return this.renderRoot?.querySelector('.list') ?? null;
  }

  get #items(): MozPanelItem[] {
    const slot =
      this.renderRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    return (slot?.assignedElements({ flatten: true }) ?? []).filter(
      (el): el is MozPanelItem => el instanceof MozPanelItem,
    );
  }

  get #focusableItems(): MozPanelItem[] {
    return this.#items.filter((item) => !item.hidden && !item.disabled);
  }

  get #isMenu(): boolean {
    return this.type === 'menu';
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#removeDismissListeners();
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = undefined;
  }

  protected firstUpdated(changed: PropertyValues<this>) {
    super.firstUpdated?.(changed);
    const list = this.#listEl;
    if (!list) return;
    // Whether there is more to scroll to depends on the rows' height, which
    // changes without the list re-rendering.
    this.#resizeObserver = new ResizeObserver(() => this.#updateOverflow());
    this.#resizeObserver.observe(list);
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (changed.has('type')) this.#syncItems();
    if (changed.has('stayOpen')) {
      if (this.#floating) this.setAttribute('popover', 'manual');
      else this.removeAttribute('popover');
    }
    if (changed.has('open')) {
      if (this.open) this.#onShow();
      else this.#onHide();
    }
  }

  /**
   * Open the list, anchored to `target`, else the event's target, else the
   * `anchor` element.
   */
  show(triggeringEvent?: Event, target?: HTMLElement) {
    if (this.open) return;
    this.#anchorEl = target ?? this.#resolveAnchor(triggeringEvent);
    this.#openedByHover = triggeringEvent?.type === 'pointerenter';
    this.open = true;
  }

  /** Close the list and return focus to the anchor. */
  hide() {
    if (!this.open) return;
    this.open = false;
  }

  /** Open a closed list, close an open one. */
  toggle(triggeringEvent?: Event, target?: HTMLElement) {
    if (this.open) this.hide();
    else this.show(triggeringEvent, target);
  }

  #resolveAnchor(triggeringEvent?: Event): HTMLElement | null {
    if (this.anchor) {
      const root = this.getRootNode() as Document | ShadowRoot;
      const found = root.getElementById?.(this.anchor);
      if (found instanceof HTMLElement) return found;
    }
    // `target`, not `composedPath()[0]`: retargeting gives the control the
    // consumer wrote (a `<moz-button>`) rather than the button inside it.
    const target = triggeringEvent?.target;
    if (target instanceof HTMLElement) return target;
    return this.#parentItem ?? this.parentElement;
  }

  async #onShow() {
    if (this.#floating) {
      if (!this.#anchorEl) this.#anchorEl = this.#resolveAnchor();
      this.setAttribute('showing', '');
      try {
        this.showPopover();
      } catch {
        // Already showing, or not yet a popover; positioning still applies.
      }
      await this.#position();
      if (!this.open) return;
      this.removeAttribute('showing');
      this.#addDismissListeners();
      this.#setAnchorExpanded(true);
      // Focus on every kind of open, not just a keyboard one: detecting the
      // input source is unreliable (NVDA's browse mode synthesizes a mouse
      // click) and guessing wrong strands keyboard and screen reader users in a
      // menu they can't reach (Firefox bug 2031420). A submenu the pointer
      // merely swept over is the exception, having committed the user to
      // nothing.
      if (!this.#openedByHover) this.#focusFirst();
    }
    this.#updateOverflow();
    this.dispatchEvent(
      new CustomEvent('moz-panel-list:shown', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  #onHide() {
    const anchor = this.#anchorEl;
    if (this.#floating) {
      this.#removeDismissListeners();
      this.removeAttribute('showing');
      try {
        this.hidePopover();
      } catch {
        // Already hidden.
      }
      this.#setAnchorExpanded(false);
      const root = this.getRootNode() as Document | ShadowRoot;
      const hadFocus = this.contains(root.activeElement);
      for (const item of this.#items) item.closeSubmenu();
      // Only reclaim focus when it was inside the list; a list dismissed by a
      // click or a hover elsewhere must leave focus where the user put it.
      if (hadFocus) anchor?.focus();
    }
    this.dispatchEvent(
      new CustomEvent('moz-panel-list:hidden', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Mark the trigger as expanded, but only where that is valid ARIA. A custom
   * element host is exposed as `generic` and a `<moz-panel-item>` as `none`,
   * neither of which can carry the state — both `<moz-button menu-id>` and the
   * item annotate the real control in their own shadow tree instead.
   */
  #setAnchorExpanded(expanded: boolean) {
    const anchor = this.#anchorEl;
    if (!anchor || anchor === this.#parentItem) return;
    const role = anchor.getAttribute('role');
    const annotatable =
      anchor instanceof HTMLButtonElement ||
      anchor instanceof HTMLAnchorElement ||
      anchor.hasAttribute('aria-haspopup') ||
      (!!role && role !== 'none' && role !== 'presentation');
    if (annotatable) anchor.setAttribute('aria-expanded', String(expanded));
  }

  /**
   * Place the panel beside its anchor in viewport coordinates. The top layer
   * takes the panel out of flow entirely, so there is no offset parent or
   * scroll offset to correct for — unlike Firefox's `setAlign()`.
   */
  async #position(): Promise<void> {
    const anchor = this.#anchorEl;
    if (!anchor) return;
    // The popover was shown this tick; wait for layout before measuring it.
    await new Promise(requestAnimationFrame);
    if (!this.open || !anchor.isConnected) return;

    const anchorBox = anchor.getBoundingClientRect();
    this.style.minInlineSize = this.minWidthFromAnchor
      ? `${Math.round(anchorBox.width)}px`
      : '';
    this.style.maxBlockSize = '';

    const rtl = getComputedStyle(this).direction === 'rtl';
    // clientWidth excludes the scrollbar, which would otherwise read as space
    // the panel can occupy.
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const { width, height } = this.getBoundingClientRect();
    const fits = (left: number) =>
      left >= VIEWPORT_MARGIN &&
      left + width <= viewportWidth - VIEWPORT_MARGIN;

    let left: number;
    let top: number;
    let blockSize = height;

    if (this.#parentItem) {
      // A submenu sits beside its parent row, flipping to the other side when
      // there isn't room. Its first item lines up with that row, so the panel's
      // own block padding has to come off the top.
      const beside = rtl ? anchorBox.left - width : anchorBox.right;
      const flipped = rtl ? anchorBox.right : anchorBox.left - width;
      left = fits(beside) ? beside : flipped;
      const padding =
        Number.parseFloat(getComputedStyle(this).paddingBlockStart) || 0;
      top = anchorBox.top - padding;
    } else {
      const atStart = rtl ? anchorBox.right - width : anchorBox.left;
      const atEnd = rtl ? anchorBox.left : anchorBox.right - width;
      if (this.align === 'start') left = atStart;
      else if (this.align === 'end') left = atEnd;
      else left = fits(atStart) ? atStart : atEnd;

      const spaceBelow = viewportHeight - anchorBox.bottom;
      const spaceAbove = anchorBox.top;
      // Only flip above when that is genuinely the roomier side, so a panel
      // that merely needs to scroll still opens downwards.
      const above =
        height + VIEWPORT_MARGIN > spaceBelow && spaceAbove > spaceBelow;
      const space = (above ? spaceAbove : spaceBelow) - VIEWPORT_MARGIN;
      this.style.maxBlockSize = `${Math.max(0, space)}px`;
      // A taller panel is about to be capped at `space`, so place it by the
      // height it will end up with rather than the one just measured.
      top = above ? anchorBox.top - Math.min(height, space) : anchorBox.bottom;
      blockSize = Math.min(height, space);
    }

    this.style.left = `${Math.round(clamp(left, VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN))}px`;
    this.style.top = `${Math.round(clamp(top, VIEWPORT_MARGIN, viewportHeight - blockSize - VIEWPORT_MARGIN))}px`;
    this.#updateOverflow();
  }

  #addDismissListeners() {
    this.addEventListener('click', this.#onClick);
    document.addEventListener('keydown', this.#onKeydown);
    document.addEventListener('pointerdown', this.#onPointerDown, true);
    window.addEventListener('resize', this.#onViewportChange);
    window.addEventListener('scroll', this.#onViewportChange, true);
    window.addEventListener('blur', this.#onWindowBlur);
  }

  #removeDismissListeners() {
    this.removeEventListener('click', this.#onClick);
    document.removeEventListener('keydown', this.#onKeydown);
    document.removeEventListener('pointerdown', this.#onPointerDown, true);
    window.removeEventListener('resize', this.#onViewportChange);
    window.removeEventListener('scroll', this.#onViewportChange, true);
    window.removeEventListener('blur', this.#onWindowBlur);
  }

  #onWindowBlur = () => this.hide();

  #onViewportChange = (event: Event) => {
    // Scrolling the list itself isn't the page moving out from under it.
    if (event.composedPath().includes(this)) return;
    void this.#position();
  };

  #onPointerDown = (event: Event) => {
    const path = event.composedPath();
    // The anchor is excluded so its own click can close the list through
    // toggle(), instead of this closing it first and the click reopening it.
    if (path.includes(this)) return;
    if (this.#anchorEl && path.includes(this.#anchorEl)) return;
    this.hide();
  };

  #onClick = (event: Event) => {
    const item = event
      .composedPath()
      .find((node): node is MozPanelItem => node instanceof MozPanelItem);
    if (!item || item.disabled) return;
    // A submenu row opens its submenu, and a checkbox row is meant to be
    // toggled repeatedly; neither is a choice that dismisses the menu.
    if (item.submenu || item.type === 'checkbox') return;
    this.hide();
  };

  #onKeydown = (event: KeyboardEvent) => {
    if (!this.open) return;
    // Both an open submenu and this list hear the keystroke through their own
    // document listener; the submenu, as the innermost menu, owns it.
    if (this.#items.some((item) => item.submenuOpen)) return;

    if (event.key === 'Escape' || event.key === 'Tab') {
      // Escape is consumed; Tab is not, so focus moves on from the anchor
      // hide() has just restored it to.
      if (event.key === 'Escape') event.preventDefault();
      event.stopPropagation();
      this.hide();
      return;
    }

    // Arrow-key navigation and typeahead are the menu's model; a slot panel
    // leaves its contents to plain tab order.
    if (!this.#isMenu) return;

    if (this.#parentItem) {
      const rtl = getComputedStyle(this).direction === 'rtl';
      if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) {
        event.preventDefault();
        event.stopPropagation();
        this.hide();
        return;
      }
    }

    const items = this.#focusableItems;
    if (!items.length) return;
    const focused = this.#focusedItem(items);
    const index = items.indexOf(focused as MozPanelItem);
    const next = rovingIndex(
      event.key,
      // With nothing focused, wrapping from the last item puts ArrowDown on the
      // first and ArrowUp on the last.
      index === -1 ? items.length - 1 : index,
      items.length,
      { wrap: true, orientation: 'vertical' },
    );
    if (next !== null) {
      event.preventDefault();
      event.stopPropagation();
      items[next].focus();
      return;
    }

    if (
      event.key.length === 1 &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      const match = this.#matchFirstLetter(items, event.key, index);
      if (match) {
        event.preventDefault();
        event.stopPropagation();
        match.focus();
      }
    }
  };

  /**
   * A panel in the top layer isn't in tab order after its trigger (nothing links
   * the two), so opening has to put focus inside it or a keyboard user can't
   * reach it at all.
   */
  #focusFirst() {
    const item = this.#focusableItems[0];
    if (item) {
      item.focus();
      return;
    }
    const focusable = this.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"]), moz-button:not([disabled])',
    );
    focusable?.focus();
  }

  #focusedItem(items: MozPanelItem[]): MozPanelItem | null {
    const active = (this.getRootNode() as Document | ShadowRoot).activeElement;
    return (
      items.find((item) => item === active || item.contains(active)) ?? null
    );
  }

  /**
   * The next item after `from` whose label starts with `key`, wrapping around.
   * A menu listing names the user chose — a file, a bookmark — has no message
   * to hang a shortcut on, so this is the only way to reach it by keyboard.
   */
  #matchFirstLetter(
    items: MozPanelItem[],
    key: string,
    from: number,
  ): MozPanelItem | undefined {
    const letter = key.toLowerCase();
    const matches = (item: MozPanelItem) =>
      (item.textContent ?? '').trim().charAt(0).toLowerCase() === letter;
    const after = items.slice(from + 1).find(matches);
    return after ?? items.find(matches);
  }

  /** Keep every row's gutter aligned once any one of them needs one. */
  #syncItems() {
    const items = this.#items;
    const gutter = items.some((item) => item.needsGutter);
    for (const item of items) {
      item.gutter = gutter;
      item.menu = this.#isMenu;
    }
  }

  #onSlotChange() {
    this.#syncItems();
    this.#updateOverflow();
  }

  /**
   * A menu's required children are rows and separators, so a slotted heading
   * stands aside in the a11y tree; its text still reads in place, it just isn't
   * a heading to navigate to. Firefox's panel subheaders live in a `panelview`,
   * which is not a menu, so they keep their heading semantics there.
   */
  #presentSubheadings(event: Event) {
    const slot = event.target as HTMLSlotElement;
    for (const el of slot.assignedElements({ flatten: true })) {
      if (/^h[1-6]$/.test(el.localName) && !el.hasAttribute('role')) {
        el.setAttribute('role', 'presentation');
      }
    }
  }

  #updateOverflow = () => {
    const list = this.#listEl;
    if (!list) return;
    // A fractional scroll height rounds against us, so allow a pixel of slack
    // before claiming there is more to see.
    this.toggleAttribute(
      'data-scrollable',
      list.scrollHeight > list.clientHeight + 1,
    );
    this.toggleAttribute('data-overflow-top', list.scrollTop > 1);
    this.toggleAttribute(
      'data-overflow-bottom',
      list.scrollTop + list.clientHeight < list.scrollHeight - 1,
    );
  };

  #onBack = () => {
    this.dispatchEvent(
      new CustomEvent('moz-panel-list:back', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  #headerTemplate() {
    return html`<div class="header" part="header">
        <span class="header-start">
          ${
            this.backLabel
              ? iconButton({
                  icon: 'back',
                  label: this.backLabel,
                  onClick: this.#onBack,
                })
              : nothing
          }
          <slot
            name="header-start"
            @slotchange=${(e: Event) => {
              this.hasHeaderStart = slotHasContent(e.target as HTMLSlotElement);
            }}
          ></slot>
        </span>
        <h2 id="heading" class="heading" part="heading">
          <slot
            name="heading"
            @slotchange=${(e: Event) => {
              this.hasHeadingSlot = slotHasContent(e.target as HTMLSlotElement);
            }}
            >${this.heading ?? nothing}</slot
          >
        </h2>
        <span class="header-end">
          <slot
            name="header-end"
            @slotchange=${(e: Event) => {
              this.hasHeaderEnd = slotHasContent(e.target as HTMLSlotElement);
            }}
          ></slot>
        </span>
      </div>
      <hr class="header-separator" part="header-separator" />`;
  }

  render() {
    const showHeader =
      !!this.heading ||
      !!this.backLabel ||
      this.hasHeadingSlot ||
      this.hasHeaderStart ||
      this.hasHeaderEnd;
    return html`
      ${showHeader ? this.#headerTemplate() : nothing}
      <moz-icon
        class="overflow top"
        name="chevron-up"
        size="small"
        aria-hidden="true"
      ></moz-icon>
      <div
        class="list"
        part="list"
        role=${this.#isMenu ? 'menu' : 'group'}
        aria-labelledby=${ifDefined(showHeader ? 'heading' : undefined)}
        aria-label=${ifDefined(showHeader ? undefined : this.label)}
        @scroll=${this.#updateOverflow}
      >
        <slot
          @slotchange=${(e: Event) => {
            this.#onSlotChange();
            this.#presentSubheadings(e);
          }}
        ></slot>
      </div>
      <moz-icon
        class="overflow bottom"
        name="chevron-down"
        size="small"
        aria-hidden="true"
      ></moz-icon>
    `;
  }
}

if (!customElements.get('moz-panel-list')) {
  customElements.define('moz-panel-list', MozPanelList);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-panel-list': MozPanelList;
  }
}
