import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import '../components/moz-icon/moz-icon';
import type { IconName } from '../generated/icons';
import inputCommon from './input-common.css';
import { labelContent } from './label-content';
import labelContentCss from './label-content.css';
import { MozLitElement } from './moz-lit-element';
import shared from './shared.css';
import { slotHasContent } from './slots';

export type InputLayout = 'inline' | 'block' | 'inline-end';

/**
 * `true`/`false` as usual; `"no-whitespace"` additionally rejects a value that
 * is present but only whitespace, reporting it as missing.
 */
export type RequiredState = boolean | 'no-whitespace';

const requiredConverter = {
  fromAttribute(value: string | null): RequiredState {
    if (value === null) return false;
    return value === 'no-whitespace' ? 'no-whitespace' : true;
  },
  toAttribute(value: RequiredState): string | null {
    if (value === 'no-whitespace') return 'no-whitespace';
    return value ? '' : null;
  },
};

/**
 * Form-associated base for Acorn form controls (ported from Firefox's
 * MozBaseInputElement). Owns form participation, the label + description
 * scaffolding, validation mirroring, and the three `inputLayout` arrangements;
 * subclasses only supply the control markup via `inputTemplate()`.
 *
 * Participates in a light-DOM `<form>` through `ElementInternals` even though
 * the real control lives in the shadow tree, and re-emits `input`/`change` as
 * composed events so consumers get the platform contract they expect.
 *
 * Not registered — subclass it (see `moz-input-text`).
 *
 * @slot description - Rich helper text, as an alternative to the `description` attribute.
 * @csspart wrapper - The label + control container.
 * @csspart label - The `<label>` element.
 * @csspart label-content - The label's icon + text + required marker.
 * @csspart input - The control the subclass renders (its `id` is `input`).
 * @csspart description - The helper-text region.
 * @csspart error - The error message region.
 * @fires input - Composed; the value changed (controls that support live edits).
 * @fires change - Composed; the value was committed.
 */
export abstract class MozBaseInputElement<
  T extends
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement = HTMLInputElement,
> extends MozLitElement {
  static styles = [shared, inputCommon, labelContentCss];
  static formAssociated = true;
  static shadowRootOptions = {
    ...MozLitElement.shadowRootOptions,
    // Focusable, and lets form.reportValidity() reach the inner control.
    delegatesFocus: true,
  };

  /** Default arrangement for the subclass; overridden per control. */
  static inputLayout: InputLayout = 'block';

  /**
   * Name of the boolean property that "activates" a choice control (e.g.
   * `checked`). When set, its value mirrors to a matching `:state()` and gates
   * the `nested` slot. Text inputs leave it undefined.
   */
  static activatedProperty?: string;

  #internals = this.attachInternals();
  #customValidity = '';
  #slottedDescription = false;
  #hasNested = false;
  #accessKey?: string;

  /** Access key forwarded to the inner control (see {@link connectedCallback}). */
  protected get controlAccessKey(): string | undefined {
    return this.#accessKey;
  }

  /** Visible label text. */
  @property() label?: string;

  /**
   * Form control name. Reflected so form submission keys off it whether set as
   * an attribute or a property (ElementInternals submits under the `name`
   * content attribute).
   */
  @property({ reflect: true }) name?: string;

  /**
   * Current value. Submitted under `name` (for choice controls, only when
   * activated). The `value` attribute is the default used by form reset — like
   * a native control's `defaultValue` — so it is not reflected.
   */
  @property() value = '';

  /** Whether the control is disabled. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /**
   * Set by a container (e.g. `moz-fieldset`) to disable this control without
   * touching its own `disabled`, so the container's state can be lifted later
   * and each control returns to whatever it was. Read {@link isDisabled}.
   */
  @property({ type: Boolean, state: true }) parentDisabled = false;

  /** Whether a value is required; `"no-whitespace"` also rejects blank-only. */
  @property({ converter: requiredConverter }) required: RequiredState = false;

  /** Helper text below the label (or use the `description` slot). */
  @property() description?: string;

  /** Error message shown below the field; also puts the control in its error state. */
  @property() error?: string;

  /** Optional icon shown before the label text (distinct from any in-field icon). */
  @property({ attribute: 'label-icon' }) labelIcon?: IconName;

  /** Label/control arrangement. */
  @property({ reflect: true, attribute: 'inputlayout' })
  inputLayout: InputLayout;

  /** Accessible name forwarded to the control when there is no visible label. */
  @property({ attribute: 'aria-label' }) inputAriaLabel: string | null = null;

  constructor() {
    super();
    this.inputLayout = (
      this.constructor as typeof MozBaseInputElement
    ).inputLayout;
    this.addEventListener('keydown', this.#handleKeydown);
  }

  connectedCallback(): void {
    super.connectedCallback();
    // Move an authored `accesskey` onto the inner control (and off the host) so
    // the browser's access key activates the control (toggles a checkbox, focuses
    // a text field) rather than just focusing the host. The matching label
    // character is underlined in labelContent. (Access keys can still collide
    // with browser/OS shortcuts — the letter choice matters.)
    const accessKey = this.getAttribute('accesskey');
    if (accessKey) {
      this.#accessKey = accessKey;
      this.removeAttribute('accesskey');
    }
  }

  // --- Form lifecycle ---

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
  }

  formResetCallback() {
    const activated = (this.constructor as typeof MozBaseInputElement)
      .activatedProperty;
    if (activated) {
      // Restore the activated state to its default — the initial attribute,
      // like a native control's `defaultChecked` (so the property must not
      // reflect, or the default would be lost on toggle).
      (this as Record<string, unknown>)[activated] =
        this.hasAttribute(activated);
    } else {
      this.value = this.getAttribute('value') ?? '';
    }
  }

  formStateRestoreCallback(state: string) {
    this.value = state ?? '';
  }

  #handleKeydown = (event: KeyboardEvent) => {
    // Match native single-line controls: Enter submits the associated form. A
    // multiline control (textarea) must override this to leave Enter alone.
    if (event.key === 'Enter') this.#internals.form?.requestSubmit();
  };

  /** Disabled by its own `disabled` or by a disabled container. */
  get isDisabled(): boolean {
    return this.disabled || this.parentDisabled;
  }

  // --- Reactive lifecycle ---

  protected willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate?.(changed);
    // `disabled` drives `:host(:state(disabled))`; the activated flag (e.g.
    // `checked`) mirrors so a choice control can style itself and gate nesting.
    this.#setState('disabled', this.isDisabled);
    // `error` drives `:host(:state(error))` so the subclass field can restyle.
    this.#setState('error', !!this.error);

    const activated = (this.constructor as typeof MozBaseInputElement)
      .activatedProperty;
    if (activated) {
      this.#setState(activated, !!(this as Record<string, unknown>)[activated]);
    }
  }

  protected updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    const activated = (this.constructor as typeof MozBaseInputElement)
      .activatedProperty;
    // A choice control (checkbox/radio/toggle) submits its value only when
    // activated; a text control always submits its value.
    // `activatedProperty` is a dynamic key the base's type doesn't know, so
    // check it against the change set as a plain map.
    const changedKeys = changed as unknown as Map<string, unknown>;
    if (activated) {
      if (changedKeys.has('value') || changedKeys.has(activated)) {
        const on = !!(this as Record<string, unknown>)[activated];
        this.#internals.setFormValue(on ? this.value : null);
      }
      if (
        changedKeys.has('disabled') ||
        changedKeys.has('parentDisabled') ||
        changedKeys.has(activated)
      ) {
        this.#updateNestedElements();
      }
    } else if (changed.has('value')) {
      this.#internals.setFormValue(this.value);
    }
    // Validity depends on value plus any number of constraint attributes, so
    // re-mirror it from the inner control on every update rather than enumerate.
    this.#updateValidation();
  }

  // Gate nested controls: disable them while this control is disabled or not
  // activated (an unchecked parent checkbox shouldn't leave its sub-options live).
  #updateNestedElements = () => {
    const slot = this.renderRoot?.querySelector<HTMLSlotElement>(
      'slot[name="nested"]',
    );
    if (!slot) return;
    const activated = (this.constructor as typeof MozBaseInputElement)
      .activatedProperty;
    const off = activated
      ? !(this as Record<string, unknown>)[activated]
      : false;
    const assigned = slot.assignedElements({ flatten: true });
    // Hide the nested region when empty so it doesn't add spacing.
    if (assigned.length > 0 !== this.#hasNested) {
      this.#hasNested = assigned.length > 0;
      this.requestUpdate();
    }
    const gated = this.isDisabled || off;
    for (const el of assigned) {
      if (el instanceof MozBaseInputElement) el.parentDisabled = gated;
    }
  };

  #setState(key: string, on: boolean) {
    if (on) this.#internals.states.add(key);
    else this.#internals.states.delete(key);
  }

  // --- Events ---

  /** Wire to the inner control's `input`; updates `value` and re-emits composed. */
  protected handleInput = (event: Event) => {
    event.stopPropagation();
    this.value = (event.target as HTMLInputElement).value;
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  };

  /** Wire to the inner control's `change`; re-emits composed. */
  protected handleChange = (event: Event) => {
    event.stopPropagation();
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  };

  #onDescriptionSlotChange = (event: Event) => {
    this.#slottedDescription = slotHasContent(event.target as HTMLSlotElement);
    this.requestUpdate();
  };

  #onDescriptionClick = (event: MouseEvent) => {
    // Clicking the helper text acts like the label — focus and activate the
    // control (toggles a checkbox) — but interactive content inside it (e.g. a
    // support link) still behaves normally.
    if ((event.target as HTMLElement).closest('a, button, input, select')) {
      return;
    }
    this.inputEl?.focus();
    this.inputEl?.click();
  };

  // --- Validation (mirrors the inner control's native validity) ---

  #updateValidation() {
    const input = this.inputEl;
    if (!input) return;

    if (this.#customValidity) {
      this.#internals.setValidity(
        { customError: true },
        this.#customValidity,
        input,
      );
      return;
    }

    // A whitespace-only value satisfies native `required`, so enforce the
    // stricter "no-whitespace" contract ourselves.
    if (
      this.required === 'no-whitespace' &&
      this.value.length > 0 &&
      !this.value.trim()
    ) {
      this.#internals.setValidity(
        { valueMissing: true },
        input.validationMessage || 'Please fill out this field.',
        input,
      );
      return;
    }

    if (input.validity.valid) this.#internals.setValidity({});
    else
      this.#internals.setValidity(
        input.validity,
        input.validationMessage,
        input,
      );
  }

  /** Whether the control passes all validity constraints. */
  checkValidity(): boolean {
    return this.#internals.checkValidity();
  }

  /** Like {@link checkValidity}, but also shows the platform validity UI. */
  reportValidity(): boolean {
    return this.#internals.reportValidity();
  }

  /** Set a custom error message (takes precedence; empty string clears it). */
  setCustomValidity(message: string): void {
    this.#customValidity = message;
    this.#updateValidation();
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

  // --- Element refs + focus delegation ---

  get inputEl(): T | null {
    return this.renderRoot?.querySelector<T>('#input') ?? null;
  }

  get labelEl(): HTMLLabelElement | null {
    return this.renderRoot?.querySelector('label') ?? null;
  }

  override focus(options?: FocusOptions) {
    this.inputEl?.focus(options);
  }

  override blur() {
    this.inputEl?.blur();
  }

  override click() {
    this.inputEl?.click();
  }

  select() {
    if (this.inputEl instanceof HTMLInputElement) this.inputEl.select();
  }

  // --- Templates ---

  /** The ids for `aria-describedby`: the description and/or the error message. */
  protected get describedBy(): string | undefined {
    const ids: string[] = [];
    if (this.description || this.#slottedDescription) ids.push('description');
    if (this.error) ids.push('error');
    return ids.length ? ids.join(' ') : undefined;
  }

  /**
   * Subclass hook: return the control element, giving it `id="input"` and
   * `part="input"` and wiring `@input`/`@change` to {@link handleInput} /
   * {@link handleChange}.
   */
  protected abstract inputTemplate(): TemplateResult;

  /** Subclass hook for control-specific `<style>`/state markup. */
  protected inputStylesTemplate(): unknown {
    return nothing;
  }

  #descriptionTemplate() {
    return html`<div
      id="description"
      part="description"
      class="description"
      ?hidden=${!(this.description || this.#slottedDescription)}
      @click=${this.#onDescriptionClick}
    >
      ${
        this.description ??
        html`<slot
        name="description"
        @slotchange=${this.#onDescriptionSlotChange}
      ></slot>`
      }
    </div>`;
  }

  #errorTemplate() {
    if (!this.error) return nothing;
    return html`<div id="error" part="error" class="error" role="alert">
      <moz-icon class="error-icon" name="critical" color="critical" size="small"></moz-icon>
      <span>${this.error}</span>
    </div>`;
  }

  #nestedTemplate() {
    return (this.constructor as typeof MozBaseInputElement).activatedProperty
      ? html`<slot
          name="nested"
          class="nested"
          ?hidden=${!this.#hasNested}
          @slotchange=${this.#updateNestedElements}
        ></slot>`
      : nothing;
  }

  render() {
    const inline = this.inputLayout === 'inline';
    return html`
      ${this.inputStylesTemplate()}
      <div class="content-wrapper" part="wrapper">
        <span class="label-wrapper">
          <label id="label" part="label" for="input">
            ${inline ? this.inputTemplate() : nothing}${labelContent({
              label: this.label,
              icon: this.labelIcon,
              required: !!this.required,
              accessKey: this.#accessKey,
            })}
          </label>
          ${this.#descriptionTemplate()}
        </span>
        ${inline ? nothing : this.inputTemplate()} ${this.#errorTemplate()}
      </div>
      ${this.#nestedTemplate()}
    `;
  }
}
