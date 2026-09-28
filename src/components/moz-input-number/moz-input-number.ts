import { property } from 'lit/decorators.js';
import type { AttrValue } from '../../base/attrs';
import { MozInputText } from '../moz-input-text/moz-input-text';
import styles from './moz-input-number.css';

/**
 * Numeric field: a `moz-input-text` preset to `type="number"` with the native
 * `min` / `max` / `step` constraints. The browser's own spinner is kept rather
 * than drawn as a pair of buttons, so stepping, keyboard repeat, and locale
 * handling stay native; the base already mirrors the resulting
 * `rangeUnderflow` / `rangeOverflow` / `stepMismatch` validity.
 *
 * `value` stays a string, like the platform's — read `valueAsNumber` for a
 * number (`NaN` when the field is empty or unparseable, again like the
 * platform).
 *
 * @csspart field - the bordered field box.
 * @csspart input - the native `<input type="number">`.
 */
export class MozInputNumber extends MozInputText {
  static styles = [...MozInputText.styles, styles];

  /** Smallest accepted value. */
  @property({ type: Number }) min?: number;

  /** Largest accepted value. */
  @property({ type: Number }) max?: number;

  /** Stepping interval; `"any"` disables step validation. */
  @property() step?: number | 'any';

  /**
   * Hide the native spinner. The value is still steppable with the arrow keys,
   * so this is presentation only.
   */
  @property({ type: Boolean, reflect: true, attribute: 'hide-spinner' })
  hideSpinner = false;

  protected get inputType(): string {
    return 'number';
  }

  protected get inputAttributes(): Record<string, AttrValue> {
    return { min: this.min, max: this.max, step: this.step };
  }

  /** The value as a number; `NaN` when empty or unparseable. */
  get valueAsNumber(): number {
    return this.value === '' ? Number.NaN : Number(this.value);
  }

  set valueAsNumber(next: number) {
    this.value = Number.isNaN(next) ? '' : String(next);
  }

  /** Step the value up by `step` (delegates to the native control). */
  stepUp(amount?: number): void {
    this.inputEl?.stepUp(amount);
    this.#syncFromInput();
  }

  /** Step the value down by `step` (delegates to the native control). */
  stepDown(amount?: number): void {
    this.inputEl?.stepDown(amount);
    this.#syncFromInput();
  }

  // stepUp/stepDown mutate the control directly without firing input, so pull
  // the result back onto the host (and tell consumers) ourselves.
  #syncFromInput() {
    const input = this.inputEl;
    if (!input || input.value === this.value) return;
    this.value = input.value;
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }
}

if (!customElements.get('moz-input-number')) {
  customElements.define('moz-input-number', MozInputNumber);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-input-number': MozInputNumber;
  }
}
