import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import pageNavTokens from '../../generated/component-tokens/page-nav.css';
import '../moz-icon/moz-icon';
import type { IconName } from '../../generated/icons';
import styles from './moz-page-nav.css';

// Internal, composed event a child button fires on activation; the parent
// catches it and stops it so it never leaks past <moz-page-nav>.
const ACTIVATE_EVENT = 'moz-page-nav-button:activate';

/**
 * Nova vertical in-page navigation (the about:preferences-style side nav). View
 * buttons go in the default slot as `<moz-page-nav-button>`; external links go
 * in the `secondary` slot and are separated by a rule. A heading comes from the
 * `heading` attribute or the `heading` slot.
 *
 * Exactly one view button is current at a time (`aria-current="page"`); it is
 * the single tab stop, and Up/Down/Left/Right/Home/End move between buttons,
 * with selection following focus. Setting `current` from outside updates the
 * selection silently; only user activation fires `moz-page-nav:change`.
 *
 * For a table of contents, give items `href="#id"` and set `scrollspy`: they
 * become in-page anchors (shareable, native scroll) and the item for the
 * section in view highlights as you scroll.
 *
 * @fires moz-page-nav:change - a view button was activated by the user;
 *   `detail.value` is the selected button's `value`.
 * @slot - default: `<moz-page-nav-button>` view items.
 * @slot heading - custom heading content (overrides the `heading` attribute).
 * @slot subheading - a search box or notification, shown under the heading.
 * @slot secondary - `<moz-page-nav-button href="...">` external links.
 */
export class MozPageNav extends MozLitElement {
  static styles = [shared, pageNavTokens, styles];

  /** Text heading shown above the navigation. */
  @property() heading?: string;

  /** Identity of the current item (a button's `value` or an anchor's `#id`). */
  @property() current?: string;

  /**
   * By default the nav auto-selects the first view when `current` matches none.
   * Set this to allow a non-matching `current` (i.e. no selection) instead.
   */
  @property({ type: Boolean, attribute: 'allow-no-selection' })
  allowNoSelection = false;

  /** Accessible name for the `<nav>` when there is no visible heading. */
  @property({ attribute: 'label' }) label?: string;

  /**
   * Highlight the item for the section in view as the user scrolls (a
   * table-of-contents nav). Items must be in-page anchors (`href="#id"`); the
   * nav observes those targets and updates `current` silently.
   */
  @property({ type: Boolean, reflect: true }) scrollspy = false;

  @state() private hasHeadingSlot = false;
  @state() private hasSubheading = false;
  @state() private hasSecondary = false;

  #scrollObserver?: IntersectionObserver;
  #scrollTargets = new Map<Element, string>();
  #visibleSections = new Set<string>();

  get #buttons(): MozPageNavButton[] {
    const slot =
      this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    return (
      slot
        ?.assignedElements()
        .filter(
          (el): el is MozPageNavButton => el instanceof MozPageNavButton,
        ) ?? []
    );
  }

  firstUpdated() {
    this.#setupScrollspy();
  }

  updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (changed.has('current')) this.#syncSelected();
    if (changed.has('scrollspy')) this.#setupScrollspy();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#scrollObserver?.disconnect();
  }

  #onSlotChange() {
    this.#syncSelected();
    if (this.scrollspy) this.#setupScrollspy();
  }

  #onSecondarySlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    this.hasSecondary = slot.assignedElements().length > 0;
  }

  #onSubheadingSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    this.hasSubheading = slot.assignedElements().length > 0;
  }

  #onHeadingSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    this.hasHeadingSlot = slot.assignedElements().length > 0;
  }

  // Reflect `current` onto the items; when nothing matches, auto-select the
  // first (unless `allowNoSelection`).
  #syncSelected() {
    const buttons = this.#buttons;
    let matched = false;
    for (const button of buttons) {
      button.selected = button.navValue === this.current;
      matched ||= button.selected;
    }
    if (!matched && buttons.length && !this.allowNoSelection) {
      buttons[0].selected = true;
      this.current = buttons[0].navValue;
    }
  }

  #select(value: string | undefined, opts: { focus?: boolean } = {}) {
    const changed = this.current !== value;
    this.current = value;
    this.#syncSelected();
    if (opts.focus) {
      this.#buttons.find((b) => b.navValue === value)?.focus();
    }
    if (changed) {
      this.dispatchEvent(
        new CustomEvent('moz-page-nav:change', {
          detail: { value },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  #onActivate(e: Event) {
    // Internal event: consume it and re-emit the public change instead.
    e.stopPropagation();
    const { value } = (e as CustomEvent<{ value?: string }>).detail;
    this.#select(value);
  }

  #onKeydown(e: KeyboardEvent) {
    const keys = [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ];
    if (!keys.includes(e.key)) return;
    const buttons = this.#buttons.filter((b) => !b.hidden);
    if (!buttons.length) return;
    const current = buttons.findIndex((b) => b.selected);
    let next = current;
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        next = Math.max(0, current - 1);
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        next = Math.min(buttons.length - 1, current + 1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = buttons.length - 1;
        break;
    }
    if (next !== current) {
      e.preventDefault();
      this.#select(buttons[next].navValue, { focus: true });
    }
  }

  // Observe each anchor item's target section; the first section (in nav order)
  // within the top band becomes current. Only the nav's own targets are watched.
  #setupScrollspy() {
    this.#scrollObserver?.disconnect();
    this.#scrollTargets.clear();
    this.#visibleSections.clear();
    if (!this.scrollspy) return;

    for (const button of this.#buttons) {
      const id = button.href?.startsWith('#') ? button.navValue : undefined;
      const target = id ? document.getElementById(id) : null;
      if (id && target) this.#scrollTargets.set(target, id);
    }
    if (!this.#scrollTargets.size) return;

    // A section is "active" once its top reaches the top ~30% of the viewport.
    this.#scrollObserver = new IntersectionObserver(
      (entries) => this.#onIntersect(entries),
      { rootMargin: '0px 0px -70% 0px' },
    );
    for (const el of this.#scrollTargets.keys()) {
      this.#scrollObserver.observe(el);
    }

    // Honour an initial hash so a deep link highlights on load.
    const hash = location.hash.slice(1);
    if (hash && [...this.#scrollTargets.values()].includes(hash)) {
      this.current = hash;
    }
  }

  #onIntersect(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      const id = this.#scrollTargets.get(entry.target);
      if (!id) continue;
      if (entry.isIntersecting) this.#visibleSections.add(id);
      else this.#visibleSections.delete(id);
    }
    const active = this.#buttons
      .map((b) => b.navValue)
      .find((id) => id && this.#visibleSections.has(id));
    // Silent: scroll updates never fire the change event (only user clicks do).
    if (active) this.current = active;
  }

  render() {
    const showHeading = this.hasHeadingSlot || !!this.heading;
    return html`
      <nav aria-label=${!showHeading && this.label ? this.label : nothing}
        aria-labelledby=${showHeading ? 'page-nav-heading' : nothing}>
        <div class="heading" id="page-nav-heading" ?hidden=${!showHeading}>
          <slot name="heading" @slotchange=${this.#onHeadingSlotChange}>
            ${
              this.heading
                ? html`<h2 class="heading-text">${this.heading}</h2>`
                : nothing
            }
          </slot>
        </div>
        <div class="subheading" ?hidden=${!this.hasSubheading}>
          <slot
            name="subheading"
            @slotchange=${this.#onSubheadingSlotChange}
          ></slot>
        </div>
        <div
          class="primary"
          role="list"
          @slotchange=${this.#onSlotChange}
          @keydown=${this.#onKeydown}
          @moz-page-nav-button:activate=${this.#onActivate}
        >
          <slot></slot>
        </div>
        <hr part="separator" ?hidden=${!this.hasSecondary} />
        <div class="secondary" role="list" ?hidden=${!this.hasSecondary}>
          <slot name="secondary" @slotchange=${this.#onSecondarySlotChange}></slot>
        </div>
      </nav>
    `;
  }
}

/**
 * A single item within `<moz-page-nav>`. A view button (no `href`) or an in-page
 * anchor (`href="#id"`) both participate in selection and fire the nav's change
 * event; an `href` item in the `secondary` slot is a plain external link.
 *
 * @slot - the item's label.
 */
export class MozPageNavButton extends MozLitElement {
  static styles = [shared, pageNavTokens, styles];

  /** Identifies the view this button selects; echoed in the change event. */
  @property() value?: string;

  /** Whether this button is the current view. Managed by `<moz-page-nav>`. */
  @property({ type: Boolean, reflect: true }) selected = false;

  /** Optional leading icon name. */
  @property({ attribute: 'icon-start' }) iconStart?: IconName;

  /** Anchor target. `#id` is an in-page (view) link; a URL is external. */
  @property() href?: string;

  /** Identity used for selection: explicit `value`, else the `href` hash id. */
  get navValue(): string | undefined {
    if (this.value !== undefined) return this.value;
    return this.href?.startsWith('#') ? this.href.slice(1) : undefined;
  }

  connectedCallback() {
    super.connectedCallback();
    // The interactive element lives in the shadow; the host is the list item.
    this.setAttribute('role', 'listitem');
  }

  // Focus the inner control so the parent's roving focus lands on it.
  focus() {
    this.shadowRoot?.querySelector<HTMLElement>('.item')?.focus();
  }

  #activate = () => {
    this.dispatchEvent(
      new CustomEvent(ACTIVATE_EVENT, {
        detail: { value: this.navValue },
        bubbles: true,
        composed: true,
      }),
    );
  };

  #inner() {
    return html`
      ${
        this.iconStart
          ? html`<moz-icon class="icon" name=${this.iconStart}></moz-icon>`
          : nothing
      }
      <span class="label"><slot></slot></span>
    `;
  }

  render() {
    if (this.href) {
      // Secondary items are plain links; a primary in-page anchor participates
      // in selection (roving focus, aria-current) and fires the change event.
      const secondary = this.slot === 'secondary';
      return html`<a
        class="item"
        part="item"
        href=${this.href}
        aria-current=${!secondary && this.selected ? 'page' : nothing}
        tabindex=${secondary ? nothing : this.selected ? 0 : -1}
        @click=${secondary ? nothing : this.#activate}
        >${this.#inner()}</a
      >`;
    }
    return html`
      <button
        class="item"
        part="item"
        type="button"
        aria-current=${this.selected ? 'page' : nothing}
        tabindex=${this.selected ? 0 : -1}
        @click=${this.#activate}
      >
        ${this.#inner()}
      </button>
    `;
  }
}

if (!customElements.get('moz-page-nav')) {
  customElements.define('moz-page-nav', MozPageNav);
}
if (!customElements.get('moz-page-nav-button')) {
  customElements.define('moz-page-nav-button', MozPageNavButton);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-page-nav': MozPageNav;
    'moz-page-nav-button': MozPageNavButton;
  }
}
