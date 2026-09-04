import { html, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import fieldWidth from '../../base/field-width.css';
import { SelectControlBaseElement } from '../../base/select-control';
import shared from '../../base/shared.css';
import type { MozRadio } from '../moz-radio/moz-radio';
import styles from './moz-radio-group.css';

/**
 * Groups `moz-radio` options into a single-selection set, built on
 * {@link SelectControlBaseElement}: one shared `name`, one `value`, one tab stop,
 * and arrow-key navigation (selection follows focus). Adds a form-level identity
 * — a `<fieldset role="radiogroup">` with a `<legend>`, optional description, a
 * group-level error, and group-owned `required` validation (native radiogroup
 * required can't work across the options' separate shadow roots).
 *
 * @slot - the `moz-radio` options.
 * @csspart fieldset - the `<fieldset>` element.
 * @csspart legend - the group label.
 * @fires change - a composed `change` from the selected option, re-dispatched here.
 */
export class MozRadioGroup extends SelectControlBaseElement {
  static styles = [shared, fieldWidth, styles];
  static childElementName = 'moz-radio';
  static formAssociated = true;

  /** Group label, rendered as the `<legend>` and the group's accessible name. */
  @property() label?: string;

  /** Helper text below the legend. */
  @property() description?: string;

  /** Group-level error message, announced when it appears. */
  @property() error?: string;

  /** Require a selection; the group reports `valueMissing` until one is made. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Disable every option in the group. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /**
   * Set by a container (e.g. a disabled `moz-fieldset`) to disable the group
   * without touching its own `disabled`, matching `MozBaseInputElement`.
   */
  @property({ type: Boolean, state: true }) parentDisabled = false;

  /** Fill the container instead of the default width. */
  @property({ type: Boolean, reflect: true, attribute: 'full-width' })
  fullWidth = false;

  #internals = this.attachInternals();
  // The initial selection, restored on form reset.
  #defaultValue?: string;
  // Form-owner disabled (a disabled ancestor fieldset), kept separate from the
  // author's `disabled` so the form's state never overwrites the attribute.
  #formDisabled = false;
  // Signature of the current option values, so the duplicate warning fires once
  // per configuration rather than on every sync.
  #valuesKey = '';
  // Options currently owned, so state can be handed back to any that leave.
  #assigned = new Set<MozRadio>();

  get #radios(): MozRadio[] {
    return this.childElements as MozRadio[];
  }

  get #isDisabled(): boolean {
    return this.disabled || this.parentDisabled || this.#formDisabled;
  }

  protected firstUpdated(changed: PropertyValues<this>): void {
    super.firstUpdated(changed);
    this.#defaultValue = this.value;
    this.#updateValidity();
  }

  protected updated(changed: PropertyValues<this>): void {
    super.updated?.(changed);
    if (changed.has('disabled') || changed.has('parentDisabled')) {
      this.#propagateDisabled();
    }
    if (
      changed.has('value') ||
      changed.has('required') ||
      changed.has('disabled') ||
      changed.has('parentDisabled')
    ) {
      this.#updateValidity();
    }
  }

  // Runs on connect and slot changes (via the base). Push the group's disabled
  // state to the options and warn about duplicate values before the base wires
  // up name/position/selection.
  override syncStateToChildElements(): void {
    const current = new Set(this.#radios);
    // Hand container-owned state back to any option that left the group, so it
    // isn't stuck disabled or unreachable if reused elsewhere.
    for (const radio of this.#assigned) {
      if (current.has(radio)) continue;
      radio.parentDisabled = false;
      radio.itemTabIndex = 0;
      if (radio.name === this.name) radio.name = undefined;
    }
    this.#assigned = current;

    this.#warnOnDuplicateValues();
    for (const radio of current) radio.parentDisabled = this.#isDisabled;
    super.syncStateToChildElements();
    // The new option set may have gained or lost the checked option, changing
    // whether a required group is satisfied.
    this.#updateValidity();
  }

  #propagateDisabled(): void {
    for (const radio of this.#radios) radio.parentDisabled = this.#isDisabled;
    this.syncFocusState();
  }

  formResetCallback(): void {
    // Reset reverts each option before this fires; restore on the next microtask
    // so the group's saved selection wins.
    queueMicrotask(() => {
      this.value = this.#defaultValue;
    });
  }

  formDisabledCallback(disabled: boolean): void {
    this.#formDisabled = disabled;
    this.#propagateDisabled();
    this.#updateValidity();
    this.requestUpdate();
  }

  // Radios in separate shadow roots can't do native radiogroup validation, so
  // the group owns it: required is satisfied by any selection. A disabled group
  // is barred from validation, matching native.
  #updateValidity(): void {
    if (
      !this.#isDisabled &&
      this.required &&
      !this.#radios.some((r) => r.checked)
    ) {
      this.#internals.setValidity(
        { valueMissing: true },
        'Please select an option.',
      );
    } else {
      this.#internals.setValidity({});
    }
  }

  /** Whether the group passes validation (a selection when required). */
  checkValidity(): boolean {
    return this.#internals.checkValidity();
  }

  /** Like {@link checkValidity}, but also shows the platform validity UI. */
  reportValidity(): boolean {
    return this.#internals.reportValidity();
  }

  get validity(): ValidityState {
    return this.#internals.validity;
  }

  get validationMessage(): string {
    return this.#internals.validationMessage;
  }

  get willValidate(): boolean {
    return this.#internals.willValidate;
  }

  #warnOnDuplicateValues(): void {
    const values = this.#radios.map((r) => r.value ?? '');
    const key = JSON.stringify(values);
    if (key === this.#valuesKey) return;
    this.#valuesKey = key;

    const duplicates = [
      ...new Set(values.filter((v, i) => values.indexOf(v) !== i)),
    ];
    if (duplicates.length) {
      console.warn(
        `<moz-radio-group>: duplicate option value(s) ${duplicates
          .map((v) => `"${v}"`)
          .join(
            ', ',
          )}. Options must have unique values; selection and form submission are otherwise ambiguous.`,
      );
    }
  }

  get #describedBy(): string | undefined {
    const ids: string[] = [];
    if (this.description) ids.push('description');
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
      ?disabled=${this.#isDisabled}
    >
      ${
        this.label
          ? html`<legend part="legend">
              ${this.label}${
                this.required
                  ? html`<span class="label-required" aria-hidden="true">
                      *</span
                    >`
                  : nothing
              }
            </legend>`
          : nothing
      }
      ${
        this.description
          ? html`<p id="description" part="description" class="description">
              ${this.description}
            </p>`
          : nothing
      }
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

if (!customElements.get('moz-radio-group')) {
  customElements.define('moz-radio-group', MozRadioGroup);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-radio-group': MozRadioGroup;
  }
}
