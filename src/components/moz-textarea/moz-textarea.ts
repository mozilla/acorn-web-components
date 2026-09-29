import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { MozInputText } from '../moz-input-text/moz-input-text';
import styles from './moz-textarea.css';

/** Remaining characters at which the counter starts announcing itself. */
const ANNOUNCE_THRESHOLD = 10;

/**
 * Which axes the user can drag the field along. `both` matches the platform
 * default and the diagonal grip in the design.
 */
export type TextareaResize = 'both' | 'vertical' | 'horizontal' | 'none';

/**
 * Multiline text input. A `moz-input-text` that swaps the native control for a
 * `<textarea>`, so it keeps the shared label, description, and form/validation
 * wiring, and adds `rows`, a resize handle, and an optional character counter.
 *
 * Unlike a single-line field, Enter inserts a newline rather than submitting;
 * Ctrl/Cmd+Enter still submits the form, which is the convention for getting
 * out of a textarea without reaching for the mouse.
 *
 * The inherited in-field affordances — `icon-start` and `clearable` — don't
 * apply to a multiline field and are not rendered.
 *
 * @tagname moz-textarea
 * @slot description - Rich helper text, as an alternative to the `description` attribute.
 * @csspart wrapper - The label + control container.
 * @csspart label - The `<label>` element.
 * @csspart field - The bordered box wrapping the textarea.
 * @csspart input - The native `<textarea>`.
 * @csspart counter - The character counter, when shown.
 * @csspart description - The helper-text region.
 * @csspart error - The error message region.
 * @fires input - Composed; the value changed.
 * @fires change - Composed; the value was committed.
 *
 * @example
 * ```html
 * <moz-textarea
 *   label="Summary"
 *   name="summary"
 *   rows="4"
 *   maxlength="250"
 * ></moz-textarea>
 * ```
 */
export class MozTextarea extends MozInputText<HTMLTextAreaElement> {
  static styles = [...MozInputText.styles, styles];

  /**
   * Visible rows, i.e. the field's starting height.
   *
   * @default 2
   */
  @property({ type: Number, reflect: true }) rows = 2;

  /**
   * Maximum character count. Enforced natively by the textarea, and enough on
   * its own to show the counter.
   */
  @property({ type: Number }) maxlength?: number;

  /**
   * Show the character counter even with no `maxlength`, in which case it's a
   * plain count rather than `n/max`.
   *
   * @default false
   */
  @property({ type: Boolean, reflect: true, attribute: 'show-counter' })
  showCounter = false;

  /**
   * Which axes the field can be dragged along. Horizontal resizing grows the
   * host too, up to the width of its container.
   *
   * @default 'both'
   */
  @property({ reflect: true }) resize: TextareaResize = 'both';

  /** A counter is meaningful once there's a limit, or when asked for. */
  get #hasCounter(): boolean {
    return this.showCounter || this.maxlength !== undefined;
  }

  /**
   * Enter belongs to the textarea, so only Ctrl/Cmd+Enter reaches the base's
   * submit-on-Enter behaviour.
   */
  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    if (event.ctrlKey || event.metaKey) super.handleKeydown(event);
  }

  // The count is visible text, so it's announced when focus lands on the
  // field. Re-announcing every keystroke is noise, so the live region only
  // opens up near the limit, where it's actually news.
  get #announceCount(): boolean {
    return (
      this.maxlength !== undefined &&
      this.maxlength - this.value.length <= ANNOUNCE_THRESHOLD
    );
  }

  protected inputTemplate() {
    return html`<div class="field" part="field">
        <textarea
          id="input"
          part="input"
          name=${ifDefined(this.name)}
          .value=${this.value}
          rows=${this.rows}
          maxlength=${ifDefined(this.maxlength)}
          placeholder=${ifDefined(this.placeholder)}
          autocomplete=${ifDefined(this.autocomplete)}
          aria-label=${ifDefined(this.inputAriaLabel ?? undefined)}
          aria-describedby=${ifDefined(this.describedBy)}
          aria-invalid=${ifDefined(this.error ? 'true' : undefined)}
          accesskey=${ifDefined(this.controlAccessKey)}
          ?disabled=${this.isDisabled}
          ?readonly=${this.readonly}
          ?required=${!!this.required}
          @input=${this.handleInput}
          @change=${this.handleChange}
        ></textarea>
      </div>
      ${this.#counterTemplate()}`;
  }

  #counterTemplate() {
    if (!this.#hasCounter) return nothing;
    const used = this.value.length;
    return html`<div
      class="counter"
      part="counter"
      aria-live=${this.#announceCount ? 'polite' : 'off'}
    >
      ${this.maxlength === undefined ? used : `${used}/${this.maxlength}`}
    </div>`;
  }
}

if (!customElements.get('moz-textarea')) {
  customElements.define('moz-textarea', MozTextarea);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-textarea': MozTextarea;
  }
}
