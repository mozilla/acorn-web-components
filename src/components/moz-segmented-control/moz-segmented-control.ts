import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { MozLitElement } from '../../base/moz-lit-element';
import {
  SelectControlBaseElement,
  type SelectControlItem,
} from '../../base/select-control';
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
 * Selection, the shared `value`, the roving tab stop, and arrow-key navigation
 * (selection follows focus, wrapping around the ends) come from
 * {@link SelectControlBaseElement}, shared with `moz-radio-group`.
 *
 * ARIA follows usage. On its own it's the radio-group pattern (host
 * `role=radiogroup`, items `role=radio`). When `deck` references a
 * {@link MozSegmentedControlDeck} by id it becomes the tabs pattern (host
 * `role=tablist`, items `role=tab` with `aria-controls`), and selecting an item
 * switches the deck's visible panel automatically.
 *
 * @slot - segment items (`<moz-segmented-control-item>` children).
 * @fires moz-segmented-control:change - `{ value }` when the selection changes.
 */
export class MozSegmentedControl extends SelectControlBaseElement {
  static styles = [shared, segmentedControlTokens, styles];
  static childElementName = 'moz-segmented-control-item';

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

  constructor() {
    super();
    // Segments lay out horizontally, so the arrow-key axis follows.
    this.orientation = 'horizontal';
  }

  get #tabs(): boolean {
    return !!this.deck;
  }

  get #segmentItems(): MozSegmentedControlItem[] {
    return this.childElements as MozSegmentedControlItem[];
  }

  /** Segment items currently slotted into the group. */
  get items(): MozSegmentedControlItem[] {
    return this.#segmentItems;
  }

  get #deckEl(): MozSegmentedControlDeck | null {
    if (!this.deck) return null;
    const root = this.getRootNode() as Document | ShadowRoot;
    return root.getElementById(this.deck) as MozSegmentedControlDeck | null;
  }

  // Push group-owned disabled onto the options before the base resolves the
  // selection and tab stop, so a group-disabled option is never chosen as the
  // focusable one.
  override syncStateToChildElements(): void {
    for (const item of this.#segmentItems) item.groupDisabled = this.disabled;
    super.syncStateToChildElements();
    this.#syncModes();
  }

  protected updated(changed: PropertyValues<this>): void {
    super.updated?.(changed);
    this.setAttribute('role', this.#tabs ? 'tablist' : 'radiogroup');
    if (this.label) this.setAttribute('aria-label', this.label);
    else this.removeAttribute('aria-label');
    if (this.disabled) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');
    if (changed.has('disabled')) {
      for (const item of this.#segmentItems) item.groupDisabled = this.disabled;
      this.syncFocusState();
    }
    this.#syncModes();
  }

  // Set each option's ARIA mode and, in tabs mode, wire it to its deck panel.
  #syncModes(): void {
    const deck = this.#deckEl;
    for (const item of this.#segmentItems) {
      item.mode = this.#tabs ? 'tab' : 'radio';
      const panel =
        this.#tabs && deck
          ? deck.querySelector<HTMLElement>(
              `[name="${CSS.escape(item.value)}"]`,
            )
          : null;
      if (panel && deck) {
        if (!item.id) item.id = `${deck.id}-tab-${item.value}`;
        if (!panel.id) panel.id = `${deck.id}-panel-${item.value}`;
        item.controls = panel.id;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', item.id);
        // A tabpanel with only static content needs a tab stop so keyboard
        // users can reach and scroll it (ARIA APG tabs pattern).
        panel.setAttribute('tabindex', '0');
      } else {
        item.controls = '';
      }
    }
    if (deck) deck.value = this.value ?? '';
  }

  // Re-dispatch an option's selection move as the component's public change
  // event; the base fires a plain `change` on the option for both click and
  // arrow-key selection, so both funnel through here.
  override handleChange = (event: Event): void => {
    if (!this.#segmentItems.includes(event.target as MozSegmentedControlItem)) {
      return;
    }
    event.stopPropagation();
    this.dispatchEvent(
      new CustomEvent<SegmentedControlChangeDetail>(
        'moz-segmented-control:change',
        {
          bubbles: true,
          composed: true,
          detail: { value: this.value ?? '' },
        },
      ),
    );
  };

  #onClick = (event: MouseEvent): void => {
    const item = event
      .composedPath()
      .find(
        (el): el is MozSegmentedControlItem =>
          el instanceof MozSegmentedControlItem &&
          this.#segmentItems.includes(el),
      );
    if (!item || item.isDisabled) return;
    item.focus();
    if (item.value === this.value) return;
    this.value = item.value;
    // Emit the same `change` the base fires for arrow nav so selection funnels
    // through handleChange into the one public event.
    item.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  };

  render() {
    return html`<slot
      @slotchange=${this.handleSlotChange}
      @change=${this.handleChange}
      @click=${this.#onClick}
    ></slot>`;
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
export class MozSegmentedControlItem
  extends MozLitElement
  implements SelectControlItem
{
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

  /**
   * Whether this segment is selected; managed by the parent group. The
   * select-control base drives `checked`; it reflects to the `selected`
   * attribute the styles key off.
   */
  @property({ type: Boolean, reflect: true, attribute: 'selected' })
  checked = false;

  /** Whether the whole group is disabled; set by the parent group. */
  @property({ type: Boolean, reflect: true, attribute: 'group-disabled' })
  groupDisabled = false;

  /** ARIA mode, driven by the parent (radio group vs tabs). */
  @property({ attribute: false }) mode: 'radio' | 'tab' = 'radio';

  /** aria-controls target (tab → panel id); set by the parent in tabs mode. */
  @property({ attribute: false }) controls = '';

  /** Roving tabindex value; managed by the parent group. */
  @state() itemTabIndex = -1;

  /** Index within the group; managed by the parent group. */
  @state() position = 0;

  /** Part of the select-control option contract; unused here (no form name). */
  name?: string;

  get isDisabled(): boolean {
    return this.disabled || this.groupDisabled;
  }

  updated(changed: PropertyValues<this>) {
    super.updated(changed);
    const isDisabled = this.isDisabled;
    if (this.mode === 'tab') {
      this.setAttribute('role', 'tab');
      this.setAttribute('aria-selected', this.checked ? 'true' : 'false');
      this.removeAttribute('aria-checked');
      if (this.controls) this.setAttribute('aria-controls', this.controls);
      else this.removeAttribute('aria-controls');
    } else {
      this.setAttribute('role', 'radio');
      this.setAttribute('aria-checked', this.checked ? 'true' : 'false');
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
