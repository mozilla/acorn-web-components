import { property } from 'lit/decorators.js';
import type { AttrValue } from '../../base/attrs';
import { MozInputText } from '../moz-input-text/moz-input-text';
import styles from './moz-input-date.css';

/**
 * The native date/time entry types. They differ only by the native `type` —
 * same constraints, same picker affordance — so they share one control, on the
 * same argument that collapsed email/url/tel into `moz-input-text`.
 */
export type DateType = 'date' | 'datetime-local' | 'time' | 'month' | 'week';

/**
 * Date and time field: a `moz-input-text` over the native date/time types, so
 * the platform supplies the picker, the locale's field order, and the
 * calendar keyboard model rather than us reimplementing them.
 *
 * `value` is the platform's string form for the chosen `type` (`YYYY-MM-DD`
 * for `date`, `HH:MM` for `time`, and so on) — not a localized string. That is
 * what a form submits and what `min` / `max` are compared against.
 *
 * Engine support is uneven: `month` and `week` fall back to a plain text field
 * in Firefox and WebKit, where the user types the platform string themselves.
 * Prefer `date` unless a coarser value is genuinely what you want to store.
 *
 * @csspart field - the bordered field box.
 * @csspart input - the native date/time `<input>`.
 */
export class MozInputDate extends MozInputText {
  static styles = [...MozInputText.styles, styles];

  /**
   * Which date/time type to render. Named `date-type` rather than `type`
   * because the inherited `type` is `moz-input-text`'s narrower text union and
   * a subclass can't widen it.
   */
  @property({ attribute: 'date-type' }) dateType: DateType = 'date';

  /** Earliest accepted value, in the same string form as `value`. */
  @property() min?: string;

  /** Latest accepted value, in the same string form as `value`. */
  @property() max?: string;

  /** Stepping granularity in seconds for `time` / `datetime-local`. */
  @property() step?: number | 'any';

  protected get inputType(): string {
    return this.dateType;
  }

  protected get inputAttributes(): Record<string, AttrValue> {
    return { min: this.min, max: this.max, step: this.step };
  }

  /** The value as a `Date`, or `null` when empty or unparseable. */
  get valueAsDate(): Date | null {
    // `time` and `week` have no valueAsDate in every engine, so go through the
    // control where it exists and fall back to parsing the platform string.
    const input = this.inputEl;
    if (input && 'valueAsDate' in input) {
      const date = (input as HTMLInputElement).valueAsDate;
      if (date) return date;
    }
    if (!this.value) return null;
    const parsed = new Date(this.value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  /** Show the native picker, where the engine supports it. */
  showPicker(): void {
    this.inputEl?.showPicker?.();
  }
}

if (!customElements.get('moz-input-date')) {
  customElements.define('moz-input-date', MozInputDate);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-input-date': MozInputDate;
  }
}
