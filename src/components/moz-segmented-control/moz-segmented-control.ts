import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { MozLitElement } from '../../base/moz-lit-element';
import { rovingIndex } from '../../base/roving';
import shared from '../../base/shared.css';
import segmentedControlTokens from '../../generated/component-tokens/segmented-control.css';
import '../moz-icon/moz-icon';
import type { IconName } from '../../generated/icons';
import styles from './moz-segmented-control.css';

export type SegmentedControlSize = 'small' | 'large';

/** `detail` of the `moz-segmented-control:change` event. */
export interface SegmentedControlChangeDetail {
  /** Newly-selected value. (The source is `event.target`.) */
  value: string;
}

/**
 * Nova segmented control: a single-select group of {@link MozSegmentedControlItem}
 * children. Presentational only (not form-associated) — selecting an item sets
 * `value` and fires `moz-segmented-control:change`.
 *
 * ARIA follows usage. On its own it's the radio-group pattern (host
 * `role=radiogroup`, items `role=radio`). When `deck` references a
 * {@link MozSegmentedControlDeck} by id it becomes the tabs pattern (host
 * `role=tablist`, items `role=tab` with `aria-controls`), and selecting an item
 * switches the deck's visible panel automatically. Either way, roving-tabindex
 * arrow-key navigation wraps and selects as focus moves.
 *
 * @slot - segment items (`<moz-segmented-control-item>` children).
 * @fires moz-segmented-control:change - `{ value }` when the selection changes.
 */
export class MozSegmentedControl extends MozLitElement {
  static styles = [shared, segmentedControlTokens, styles];

  /** Value of the currently selected item. */
  @property({ reflect: true }) value = '';

  /** Accessible name for the group (applied as `aria-label`). */
  @property() label = '';

  /** Whether the whole group is disabled. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Whether segments fill the container width equally, rather than hugging
   * their content. */
  @property({ type: Boolean, reflect: true }) fill = false;

  /** Control size: `large` (40px total, default) or `small` (32px). */
  @property({ reflect: true }) size: SegmentedControlSize = 'large';

  /** Id of a `moz-segmented-control-deck` this control drives; switches the
   * control to the tabs ARIA pattern. */
  @property() deck?: string;

  #items: MozSegmentedControlItem[] = [];

  /** Segment items currently slotted into the group. */
  get items(): MozSegmentedControlItem[] {
    return this.#items;
  }

  get #tabs(): boolean {
    return !!this.deck;
  }

  get #deckEl(): MozSegmentedControlDeck | null {
    if (!this.deck) return null;
    const root = this.getRootNode() as Document | ShadowRoot;
    return root.getElementById(this.deck) as MozSegmentedControlDeck | null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeydown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKeydown);
  }

  updated(changed: PropertyValues<this>) {
    super.updated(changed);
    this.setAttribute('role', this.#tabs ? 'tablist' : 'radiogroup');
    if (changed.has('label')) {
      if (this.label) this.setAttribute('aria-label', this.label);
      else this.removeAttribute('aria-label');
    }
    if (changed.has('disabled')) {
      if (this.disabled) this.setAttribute('aria-disabled', 'true');
      else this.removeAttribute('aria-disabled');
    }
    this.#sync();
  }

  #onSlotChange = (e: Event) => {
    this.#items = (e.target as HTMLSlotElement)
      .assignedElements()
      .filter(
        (el): el is MozSegmentedControlItem =>
          el instanceof MozSegmentedControlItem,
      );
    this.#sync();
  };

  // Push selected state + roving tabindex down to the items, wire the ARIA
  // mode, and (in tabs mode) tie each tab to its deck panel. The focusable
  // item is the selected one, else the first enabled one.
  #sync() {
    const items = this.#items;
    let focusable = items.findIndex(
      (it) => it.value === this.value && !it.disabled,
    );
    if (focusable === -1) focusable = items.findIndex((it) => !it.disabled);
    const deck = this.#deckEl;
    items.forEach((it, i) => {
      it.mode = this.#tabs ? 'tab' : 'radio';
      it.groupDisabled = this.disabled;
      it.selected = it.value === this.value && !it.disabled;
      it.itemTabIndex = i === focusable ? 0 : -1;
      const panel =
        this.#tabs && deck
          ? deck.querySelector<HTMLElement>(`[name="${CSS.escape(it.value)}"]`)
          : null;
      if (panel && deck) {
        if (!it.id) it.id = `${deck.id}-tab-${it.value}`;
        if (!panel.id) panel.id = `${deck.id}-panel-${it.value}`;
        it.controls = panel.id;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', it.id);
      } else {
        it.controls = '';
      }
    });
    if (deck) deck.value = this.value;
  }

  #select(item: MozSegmentedControlItem, focus: boolean) {
    if (this.disabled || item.disabled) return;
    if (focus) item.focus();
    if (item.value === this.value) return;
    this.value = item.value;
    this.#sync();
    this.dispatchEvent(
      new CustomEvent<SegmentedControlChangeDetail>(
        'moz-segmented-control:change',
        {
          bubbles: true,
          composed: true,
          detail: { value: this.value },
        },
      ),
    );
  }

  #onClick = (e: MouseEvent) => {
    const item = e
      .composedPath()
      .find(
        (el): el is MozSegmentedControlItem =>
          el instanceof MozSegmentedControlItem && this.#items.includes(el),
      );
    if (item) this.#select(item, true);
  };

  #onKeydown = (e: KeyboardEvent) => {
    const enabled = this.disabled
      ? []
      : this.#items.filter((it) => !it.disabled);
    if (!enabled.length) return;
    const rtl = getComputedStyle(this).direction === 'rtl';
    const current = this.#items.find(
      (it) => it.value === this.value && !it.disabled,
    );
    const idx = current ? enabled.indexOf(current) : 0;
    const next = rovingIndex(e.key, idx, enabled.length, { wrap: true, rtl });
    if (next === null) return;
    e.preventDefault();
    this.#select(enabled[next], true);
  };

  render() {
    return html`<slot @slotchange=${this.#onSlotChange}></slot>`;
  }
}

/**
 * A single segment inside {@link MozSegmentedControl}. Its ARIA role
 * (`radio`/`tab`), selection state, roving tabindex, and disabled propagation
 * are driven by the parent group. Label comes from `label` or the default slot;
 * `icon-start` adds a leading icon, and `icon-only` renders it as a circle (the
 * label stays the accessible name).
 *
 * @slot - the segment label (falls back to the `label` property).
 */
export class MozSegmentedControlItem extends MozLitElement {
  static styles = [shared, segmentedControlTokens, styles];

  /** Value emitted when this segment is selected. */
  @property() value = '';

  /** Visible label / accessible name (or use the default slot). Kept as the
   * accessible name even when `icon-only` hides it visually. */
  @property() label = '';

  /** Optional leading icon. */
  @property({ attribute: 'icon-start' }) iconStart?: IconName;

  /** Whether to show only the icon (as a circle); `label` stays the accessible name. */
  @property({ type: Boolean, reflect: true, attribute: 'icon-only' })
  iconOnly = false;

  /** Whether this segment is disabled. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Whether this segment is selected; managed by the parent group. */
  @property({ type: Boolean, reflect: true }) selected = false;

  /** Whether the whole group is disabled; set by the parent group. */
  @property({ type: Boolean, reflect: true, attribute: 'group-disabled' })
  groupDisabled = false;

  /** ARIA mode, driven by the parent (radio group vs tabs). */
  @property({ attribute: false }) mode: 'radio' | 'tab' = 'radio';

  /** aria-controls target (tab → panel id); set by the parent in tabs mode. */
  @property({ attribute: false }) controls = '';

  /** Roving tabindex value; managed by the parent group. */
  @state() itemTabIndex = -1;

  updated(changed: PropertyValues<this>) {
    super.updated(changed);
    const isDisabled = this.disabled || this.groupDisabled;
    if (this.mode === 'tab') {
      this.setAttribute('role', 'tab');
      this.setAttribute('aria-selected', this.selected ? 'true' : 'false');
      this.removeAttribute('aria-checked');
      if (this.controls) this.setAttribute('aria-controls', this.controls);
      else this.removeAttribute('aria-controls');
    } else {
      this.setAttribute('role', 'radio');
      this.setAttribute('aria-checked', this.selected ? 'true' : 'false');
      this.removeAttribute('aria-selected');
      this.removeAttribute('aria-controls');
    }
    this.setAttribute('tabindex', String(isDisabled ? -1 : this.itemTabIndex));
    if (isDisabled) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');
  }

  render() {
    return html`
      ${
        this.iconStart
          ? html`<moz-icon class="icon" name=${this.iconStart}></moz-icon>`
          : nothing
      }
      <span class="label"><slot>${this.label}</slot></span>
    `;
  }
}

/**
 * A content deck paired with a {@link MozSegmentedControl}: shows only the child
 * panel whose `name` matches `value`, hiding the rest. Give it an `id` and point
 * the control's `deck` attribute at it; the control then drives `value` and
 * wires the tab/tabpanel ARIA.
 *
 * @slot - panels; each a child element with a `name` attribute.
 */
export class MozSegmentedControlDeck extends MozLitElement {
  static styles = [shared, segmentedControlTokens, styles];

  /** Name of the panel to show. */
  @property() value = '';

  #observer?: MutationObserver;

  connectedCallback() {
    super.connectedCallback();
    this.#observer = new MutationObserver(() => this.requestUpdate());
    this.#observer.observe(this, { childList: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer?.disconnect();
    this.#observer = undefined;
  }

  willUpdate() {
    for (const panel of Array.from(this.children)) {
      panel.toggleAttribute(
        'hidden',
        panel.getAttribute('name') !== this.value,
      );
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('moz-segmented-control')) {
  customElements.define('moz-segmented-control', MozSegmentedControl);
}
if (!customElements.get('moz-segmented-control-item')) {
  customElements.define('moz-segmented-control-item', MozSegmentedControlItem);
}
if (!customElements.get('moz-segmented-control-deck')) {
  customElements.define('moz-segmented-control-deck', MozSegmentedControlDeck);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-segmented-control': MozSegmentedControl;
    'moz-segmented-control-item': MozSegmentedControlItem;
    'moz-segmented-control-deck': MozSegmentedControlDeck;
  }
}
