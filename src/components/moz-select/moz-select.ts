import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import fieldWidth from '../../base/field-width.css';
import { MozBaseInputElement } from '../../base/input-element';
import { MozLitElement } from '../../base/moz-lit-element';
import inputTokens from '../../generated/component-tokens/input.css';
import selectTokens from '../../generated/component-tokens/select.css';
import type { IconName } from '../../generated/icons';
import '../moz-icon/moz-icon';
import { MozPanelItem } from '../moz-panel-item/moz-panel-item';
import type { MozPanelList } from '../moz-panel-list/moz-panel-list';
import '../moz-panel-item/moz-panel-item';
import '../moz-panel-list/moz-panel-list';
import styles from './moz-select.css';

/** Presentational shape: a form field, or the pill-shaped dropdown button. */
export type SelectVariant = 'standard' | 'pill';

/** Control height, from the `--select-min-height[-small]` tokens. */
export type SelectSize = 'default' | 'small';

/**
 * Which popup the control opens: the platform's own, or a `<moz-panel-list>`
 * styled like the rest of Nova.
 */
export type SelectPopup = 'native' | 'panel';

/** One harvested option, or a separator standing in for a slotted `<hr>`. */
interface SelectOption {
  value?: string;
  label?: string;
  icon?: IconName;
  disabled?: boolean;
  hidden?: boolean;
  separator?: boolean;
}

const OBSERVED_OPTION_ATTRIBUTES = [
  'label',
  'value',
  'icon',
  'disabled',
  'hidden',
];

/**
 * A single-selection dropdown wrapping a native `<select>`, so the platform
 * supplies the popup, its keyboard model, and the touch/mobile presentation.
 *
 * Options are slotted `<moz-option>` elements (plus `<hr>` for a separator),
 * mirrored into the real `<select>` in the shadow root.
 *
 * `<optgroup>` is deliberately unsupported, matching Firefox's `moz-select`;
 * use an `<hr>` separator instead.
 *
 * `popup` picks what opens: the platform's own popup, or a `<moz-panel-list>`
 * styled like the rest of Nova. An option with an `icon` takes the panel either
 * way, since a native popup can't render one — the same swap Firefox's
 * `moz-select` makes.
 *
 * @slot - the `<moz-option>` options, and any `<hr>` separators.
 * @csspart field - The bordered box wrapping the icon, select, and chevron.
 * @csspart input - The native `<select>`.
 * @csspart icon - The leading icon, when one is shown.
 * @csspart chevron - The dropdown indicator.
 */
export class MozSelect extends MozBaseInputElement<HTMLSelectElement> {
  static styles = [
    ...MozBaseInputElement.styles,
    inputTokens,
    selectTokens,
    fieldWidth,
    styles,
  ];
  static inputLayout = 'block' as const;

  /** Presentational shape. `pill` is the Nova dropdown button treatment. */
  @property({ reflect: true }) variant: SelectVariant = 'standard';

  /** Control height. */
  @property({ reflect: true }) size: SelectSize = 'default';

  /**
   * Which popup to open. `native` is the platform's, which brings the mobile
   * picker and the OS keyboard model for free but can't be styled or show an
   * option's icon. `panel` swaps in a `<moz-panel-list>`, which can.
   *
   * An option with an `icon` forces `panel` whatever this says, since there is
   * no way for a native popup to render one.
   */
  @property({ reflect: true }) popup: SelectPopup = 'native';

  /** Fill the container instead of the default 320px width. */
  @property({ type: Boolean, reflect: true, attribute: 'full-width' })
  fullWidth = false;

  /**
   * Leading icon shown inside the control. The selected option's own `icon`
   * takes precedence when it has one.
   */
  @property({ attribute: 'icon-start' }) iconStart?: IconName;

  /**
   * Prompt shown when nothing is selected, as a leading empty-valued option.
   * Worth setting on any select that isn't pre-answered: a native
   * select always shows its first option, so without one an unset `value`
   * submits the first real option as if the user had chosen it. Disabled and
   * hidden, so pair it with `required` to reject the empty state.
   */
  @property() placeholder?: string;

  /** Options harvested from the default slot. */
  @state() private options: SelectOption[] = [];

  #observer?: MutationObserver;

  /** The currently selected option, if the value matches one. */
  get selectedOption(): SelectOption | undefined {
    return this.options.find(
      (option) => !option.separator && option.value === this.value,
    );
  }

  get #icon(): IconName | undefined {
    return this.selectedOption?.icon ?? this.iconStart;
  }

  /** Whether this render uses the panel rather than the platform popup. */
  get #usePanel(): boolean {
    return (
      this.popup === 'panel' ||
      this.options.some((option) => !option.separator && option.icon)
    );
  }

  get #panelList(): MozPanelList | null {
    return this.renderRoot?.querySelector('moz-panel-list') ?? null;
  }

  /** The options a user can land on, in render order. */
  get #choosableOptions(): SelectOption[] {
    return this.options.filter(
      (option) => !option.separator && !option.disabled && !option.hidden,
    );
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer?.disconnect();
    this.#observer = undefined;
  }

  #slot(): HTMLSlotElement | null {
    return this.renderRoot?.querySelector('slot:not([name])') ?? null;
  }

  /**
   * Reads each option's properties, not its attributes: `moz-option` reflects
   * asynchronously, so the attributes are still unset on the `slotchange` that
   * follows an option being created, and the resulting valueless list collapses
   * the selection to the first option (Firefox bug 2070217).
   */
  #populate = (): void => {
    const slot = this.#slot();
    if (!slot) return;

    this.options = slot
      .assignedNodes({ flatten: true })
      .flatMap((node): SelectOption[] => {
        if (node instanceof MozOption) {
          return [
            {
              value: node.value,
              label: node.label,
              icon: node.icon,
              disabled: node.disabled,
              hidden: node.hidden,
            },
          ];
        }
        if (node instanceof HTMLHRElement) return [{ separator: true }];
        return [];
      });

    this.#observe(slot);
  };

  // Mutating a slotted option doesn't fire slotchange, so watch them directly.
  #observe(slot: HTMLSlotElement): void {
    this.#observer?.disconnect();
    this.#observer = new MutationObserver(() => this.#populate());
    for (const node of slot.assignedElements({ flatten: true })) {
      this.#observer.observe(node, {
        attributes: true,
        attributeFilter: OBSERVED_OPTION_ATTRIBUTES,
      });
    }
  }

  protected updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    // The base mirrors validity off the inner control, and in panel mode that
    // is a <button>, which is always valid — so `required` has to be enforced
    // here instead.
    if (this.#usePanel) {
      this.setCustomValidity(
        this.required && !this.value
          ? 'Please select an item in the list.'
          : '',
      );
    }
    if (!this.options.length) return;
    const matches = this.options.some(
      (option) => !option.separator && option.value === this.value,
    );
    if (this.#usePanel) {
      // No platform popup to fall back on, so adopt the first choosable option
      // rather than render a trigger with no label.
      if (!matches && !this.placeholder) {
        this.value = this.#choosableOptions[0]?.value ?? '';
      }
      return;
    }
    // A native select always has something selected, so an unmatched value
    // would submit something other than what the user can see.
    const control = this.inputEl;
    if (!control) return;
    if (control.value !== this.value && !matches) this.value = control.value;
  }

  #openPanel(event: Event) {
    const panel = this.#panelList;
    if (!panel || this.isDisabled) return;
    panel.toggle(event, this.inputEl ?? undefined);
  }

  // A select opens onto the option it is already on, not the top of the list.
  #onPanelShown = () => {
    const panel = this.#panelList;
    const current = panel?.querySelector<MozPanelItem>(
      'moz-panel-item[checked]',
    );
    current?.focus();
  };

  #onPanelClick = (event: Event) => {
    const item = event
      .composedPath()
      .find((node): node is MozPanelItem => node instanceof MozPanelItem);
    if (!item || item.disabled) return;
    const value = item.dataset.value ?? '';
    if (value === this.value) return;
    this.value = value;
    // Only `change` fires: the panel commits a choice outright, where a native
    // select would have fired `input` for each one the user moved across.
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  };

  #onTriggerKeydown = (event: KeyboardEvent) => {
    if (this.#panelList?.open) return;
    // Every one of these opens the panel rather than stepping the value in
    // place, which is what a closed native select does on Windows and Linux.
    // A popup that can show icons is worth seeing before choosing from, and it
    // is the one behaviour both platforms agree on.
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      this.#openPanel(event);
    }
  };

  protected inputTemplate() {
    const icon = this.#icon;
    // Not `:host(:has(.icon))` — that inspects light-DOM children, so it never
    // matches an icon rendered in the shadow tree.
    return html`<div
      class="field ${icon ? 'with-icon' : ''}"
      part="field"
    >
      ${
        icon
          ? html`<moz-icon
            class="icon"
            part="icon"
            name=${icon}
            size="small"
          ></moz-icon>`
          : nothing
      }
      ${this.#usePanel ? this.#triggerTemplate() : this.#selectTemplate()}
      <moz-icon
        class="chevron"
        part="chevron"
        name="chevron-down"
        size="small"
      ></moz-icon>
      <slot hidden @slotchange=${this.#populate}></slot>
    </div>
    ${this.#usePanel ? this.#panelTemplate() : nothing}`;
  }

  #selectTemplate() {
    return html`<select
        id="input"
        part="input"
        class=${this.placeholder && !this.value ? 'placeholder-shown' : ''}
        name=${ifDefined(this.name)}
        .value=${this.value}
        aria-label=${ifDefined(this.inputAriaLabel ?? undefined)}
        aria-describedby=${ifDefined(this.describedBy)}
        aria-invalid=${ifDefined(this.error ? 'true' : undefined)}
        accesskey=${ifDefined(this.controlAccessKey)}
        ?disabled=${this.isDisabled}
        ?required=${!!this.required}
        @input=${this.handleInput}
        @change=${this.handleChange}
      >
        ${
          this.placeholder
            ? html`<option value="" disabled hidden .selected=${!this.value}>
              ${this.placeholder}
            </option>`
            : nothing
        }
        ${this.options.map((option) =>
          option.separator
            ? html`<hr />`
            : html`<option
                value=${ifDefined(option.value)}
                .selected=${option.value === this.value}
                ?disabled=${option.disabled}
                ?hidden=${option.hidden}
              >
                ${option.label}
              </option>`,
        )}
      </select>`;
  }

  /**
   * The closed control in panel mode. A `<button>` rather than a `<select>`, so
   * `<label for="input">` still names it and the base's form plumbing — which
   * runs off the host's ElementInternals, not this element — keeps working.
   */
  #triggerTemplate() {
    const label = this.selectedOption?.label ?? this.placeholder ?? '';
    return html`<button
      id="input"
      part="input"
      type="button"
      class="trigger ${this.placeholder && !this.value ? 'placeholder-shown' : ''}"
      role="combobox"
      aria-haspopup="menu"
      aria-controls="popup"
      aria-expanded=${this.#panelList?.open ? 'true' : 'false'}
      aria-label=${ifDefined(this.inputAriaLabel ?? undefined)}
      aria-describedby=${ifDefined(this.describedBy)}
      aria-invalid=${ifDefined(this.error ? 'true' : undefined)}
      accesskey=${ifDefined(this.controlAccessKey)}
      ?disabled=${this.isDisabled}
      @click=${this.#openPanel}
      @keydown=${this.#onTriggerKeydown}
    >
      <span class="trigger-label">${label}</span>
    </button>`;
  }

  #panelTemplate() {
    return html`<moz-panel-list
      id="popup"
      min-width-from-anchor
      label=${ifDefined(this.label ?? this.inputAriaLabel ?? undefined)}
      @moz-panel-list:shown=${this.#onPanelShown}
      @click=${this.#onPanelClick}
    >
      ${this.options.map((option) =>
        option.separator
          ? html`<hr />`
          : html`<moz-panel-item
              type="radio"
              data-value=${ifDefined(option.value)}
              ?checked=${option.value === this.value}
              ?disabled=${option.disabled}
              ?hidden=${option.hidden}
              icon-start=${ifDefined(option.icon)}
              >${option.label}</moz-panel-item
            >`,
      )}
    </moz-panel-list>`;
  }
}

/**
 * One option for `moz-select`. A declarative data carrier with no presentation
 * of its own — the parent mirrors it into a native `<option>`. Every property
 * reflects, so the parent's `MutationObserver` sees post-slot changes.
 */
export class MozOption extends MozLitElement {
  /** Submitted value. */
  @property({ reflect: true }) value = '';

  /** Visible text. */
  @property({ reflect: true }) label = '';

  /**
   * Icon for this option. Only rendered when the option is the selected one, on
   * the closed control — a native popup can't show icons.
   */
  @property({ reflect: true }) icon?: IconName;

  /** Whether the option can be chosen. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Whether the option is hidden from the list. */
  @property({ type: Boolean, reflect: true }) hidden = false;

  // moz-select reads these properties and builds the real <option> itself.
  render() {
    return nothing;
  }
}

if (!customElements.get('moz-option')) {
  customElements.define('moz-option', MozOption);
}

if (!customElements.get('moz-select')) {
  customElements.define('moz-select', MozSelect);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-select': MozSelect;
    'moz-option': MozOption;
  }
}
