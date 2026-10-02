import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { MozLitElement } from '../../base/moz-lit-element';
import radioMark from '../../base/radio-mark.css';
import {
  SelectControlBaseElement,
  SelectControlItemMixin,
} from '../../base/select-control';
import shared from '../../base/shared.css';
import { slotHasContent } from '../../base/slots';
import buttonTokens from '../../generated/component-tokens/button.css';
import styles from './moz-visual-picker.css';
import itemStyles from './moz-visual-picker-item.css';

/**
 * `card` centres the content with selection shown by the border; `radio` adds a
 * radio indicator and left-aligns the text, for options that read as a list.
 */
export type VisualPickerVariant = 'card' | 'radio';

/**
 * A single-selection group whose options are cards rather than radios: the
 * selected one is shown by its border, not a control. The card's content is the
 * consumer's — slot in an illustration, an icon, a swatch — with an optional
 * label and description.
 *
 * Selection, the shared `value`, the roving tab stop, and arrow-key navigation
 * come from `SelectControlBaseElement`, shared with `moz-radio-group`.
 *
 * Reach for `moz-radio-group` instead when the options are text: a visible
 * radio is the clearer affordance when there's nothing visual to pick between.
 *
 * @slot - the `moz-visual-picker-item` options.
 * @slot description - Rich helper text, as an alternative to the `description` attribute.
 * @csspart fieldset - The grouping element.
 * @csspart legend - The group label.
 * @csspart description - The helper-text region.
 * @csspart error - The group-level error message.
 * @fires change - Composed; the selection changed.
 */
export class MozVisualPicker extends SelectControlBaseElement {
  static styles = [shared, styles];
  static childElementName = 'moz-visual-picker-item';

  constructor() {
    super();
    // The base defaults to vertical, which suits stacked radios. A picker's
    // cards read as a row, which is also what Firefox's picker defaults to.
    this.orientation = 'horizontal';
  }

  /** Group label, rendered as the `<legend>`. */
  @property() label?: string;

  /** Helper text below the legend (or use the `description` slot). */
  @property() description?: string;

  /** Group-level error message, announced when it appears. */
  @property() error?: string;

  /**
   * Presentation for every card in the group. Set here rather than per item so
   * a group can't end up half-and-half.
   */
  @property({ reflect: true }) variant: VisualPickerVariant = 'card';

  /** Whether a selection is required. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Disable every option in the group. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /**
   * Set by a container (a disabled `moz-fieldset`, or a checkbox's `nested`
   * slot) to disable the group without touching its own `disabled`.
   */
  @state() parentDisabled = false;

  @state() private hasSlottedDescription = false;

  /** Disabled by its own `disabled` or by a container. */
  get isDisabled(): boolean {
    return this.disabled || this.parentDisabled;
  }

  // SelectControlItem doesn't carry parentDisabled, so narrow to the real item
  // type — same as moz-radio-group does for its radios.
  get #items(): MozVisualPickerItem[] {
    return this.childElements as MozVisualPickerItem[];
  }

  protected updated(changed: PropertyValues<this>): void {
    super.updated?.(changed);
    if (changed.has('disabled') || changed.has('parentDisabled')) {
      this.#propagateToItems();
      this.syncFocusState();
    } else if (changed.has('variant')) {
      this.#propagateToItems();
    }
  }

  override syncStateToChildElements(): void {
    this.#propagateToItems();
    super.syncStateToChildElements();
  }

  #propagateToItems(): void {
    for (const item of this.#items) {
      item.parentDisabled = this.isDisabled;
      item.variant = this.variant;
    }
  }

  #onDescriptionSlotChange = (event: Event) => {
    this.hasSlottedDescription = slotHasContent(
      event.target as HTMLSlotElement,
    );
  };

  get #describedBy(): string | undefined {
    const ids: string[] = [];
    if (this.description || this.hasSlottedDescription) ids.push('description');
    if (this.error) ids.push('error');
    return ids.length ? ids.join(' ') : undefined;
  }

  render() {
    return html`<fieldset
      part="fieldset"
      role="radiogroup"
      aria-label=${ifDefined(this.label)}
      aria-describedby=${ifDefined(this.#describedBy)}
      aria-invalid=${ifDefined(this.error ? 'true' : undefined)}
      aria-required=${ifDefined(this.required ? 'true' : undefined)}
      aria-orientation=${this.orientation}
      ?disabled=${this.isDisabled}
    >
      ${
        this.label
          ? html`<legend part="legend">
            ${this.label}${
              this.required
                ? html`<span class="label-required" aria-hidden="true"> *</span>`
                : nothing
            }
          </legend>`
          : nothing
      }
      <div
        id="description"
        part="description"
        class="description"
        ?hidden=${!(this.description || this.hasSlottedDescription)}
      >
        ${
          this.description ??
          html`<slot
            name="description"
            @slotchange=${this.#onDescriptionSlotChange}
          ></slot>`
        }
      </div>
      <div class="options">
        <slot
          @slotchange=${this.handleSlotChange}
          @change=${this.handleChange}
        ></slot>
      </div>
      ${
        this.error
          ? html`<p id="error" part="error" class="error" role="alert">
            ${this.error}
          </p>`
          : nothing
      }
    </fieldset>`;
  }
}

/**
 * One card in a `moz-visual-picker`.
 *
 * A `<button role="radio">` rather than a real radio input, so the whole card
 * is the target and the selected state shows as a border.
 *
 * Visual content goes in the default slot — an `img`, a `moz-icon`, a
 * `moz-illustration` — per the library's convention of slotting arbitrary
 * markup rather than taking a src.
 *
 * **Both slots must hold non-interactive content.** The card is a button, so a
 * focusable child nests one control inside another: use `moz-status-badge` or
 * `moz-badge` rather than `moz-chip`, and don't slot links or buttons.
 *
 * @slot - the card's visual content.
 * @slot badge - Content on the line above the label, for the `radio` variant.
 * @csspart item - The card button.
 * @csspart label - The card's label.
 * @csspart description - The card's description.
 */
export class MozVisualPickerItem extends SelectControlItemMixin(MozLitElement) {
  // buttonTokens carry the fills the card and its radio indicator use; shared
  // brings box-sizing and --opacity-disabled into the shadow root.
  static styles = [shared, buttonTokens, radioMark, itemStyles];

  /** Value contributed to the group when selected. */
  @property({ reflect: true }) value = '';

  /** Whether this card is the selected one. */
  @property({ type: Boolean, reflect: true }) checked = false;

  /** Whether this card can be chosen. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Set by the group; disables the card without touching its own `disabled`. */
  @property({ type: Boolean, reflect: true, attribute: 'parent-disabled' })
  parentDisabled = false;

  /** Shared form name, applied by the group. */
  @property({ reflect: true }) name?: string;

  /** Visible label inside the card. */
  @property() label?: string;

  /** Supporting text under the label. */
  @property() description?: string;

  /** Accessible name, when the card's content doesn't provide one. */
  @property({ attribute: 'aria-label' }) itemAriaLabel: string | null = null;

  /** Presentation, set by the group. */
  @property({ reflect: true }) variant: VisualPickerVariant = 'card';

  /** Disabled by its own `disabled` or by the group. */
  get isDisabled(): boolean {
    return this.disabled || this.parentDisabled;
  }

  get #button(): HTMLButtonElement | null {
    return this.renderRoot?.querySelector('.item') ?? null;
  }

  override focus(options?: FocusOptions): void {
    this.#button?.focus(options);
  }

  override blur(): void {
    this.#button?.blur();
  }

  override click(): void {
    this.#button?.click();
  }

  #onKeydown = (event: KeyboardEvent) => {
    // Activation goes through one path: preventDefault stops the browser also
    // synthesising a click from the key press. Mirrors upstream, though a
    // native button would activate on Space/Enter unaided.
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    this.#activate();
  };

  #onClick = (event: Event) => {
    // Retarget from the inner button so listeners see the host, not the shadow.
    event.stopPropagation();
    this.#activate();
  };

  #activate(): void {
    if (this.isDisabled) return;
    const wasChecked = this.checked;
    this.handleClick();
    this.dispatchEvent(new Event('click', { bubbles: true, composed: true }));
    if (wasChecked) return;
    // No input to fire these for us.
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  // With no label or aria-label, name the card from whatever was slotted —
  // which is how an icon- or image-only option gets an accessible name.
  #onSlotChange = (event: Event) => {
    if (this.label || this.itemAriaLabel) return;
    const button = this.#button;
    if (!button) return;
    const slot = event.target as HTMLSlotElement;
    button.ariaLabelledByElements = slot.assignedElements({ flatten: true });
  };

  #textTemplate() {
    if (!this.label) return nothing;
    return html`<span class="text">
      <span class="label" part="label">${this.label}</span>
      ${
        this.description
          ? html`<span class="description" part="description"
            >${this.description}</span
          >`
          : nothing
      }
    </span>`;
  }

  render() {
    const text = this.#textTemplate();
    // The indicator is decorative — aria-checked on the button carries the
    // state. See the class doc for why it isn't a real input.
    return html`<button
      class="item"
      part="item"
      type="button"
      role="radio"
      aria-checked=${this.checked ? 'true' : 'false'}
      aria-label=${ifDefined(this.itemAriaLabel ?? undefined)}
      tabindex=${this.isDisabled ? -1 : this.itemTabIndex}
      ?disabled=${this.isDisabled}
      @click=${this.#onClick}
      @keydown=${this.#onKeydown}
    >
      <slot name="badge"></slot>
      <slot @slotchange=${this.#onSlotChange}></slot>
      ${
        this.variant === 'radio'
          ? html`<span class="row">
            <span
              class="indicator mark-circle"
              part="indicator"
              aria-hidden="true"
            >
              <span class="mark-dot"></span>
            </span>
            ${text}
          </span>`
          : text
      }
    </button>`;
  }
}

if (!customElements.get('moz-visual-picker-item')) {
  customElements.define('moz-visual-picker-item', MozVisualPickerItem);
}

if (!customElements.get('moz-visual-picker')) {
  customElements.define('moz-visual-picker', MozVisualPicker);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-visual-picker': MozVisualPicker;
    'moz-visual-picker-item': MozVisualPickerItem;
  }
}
