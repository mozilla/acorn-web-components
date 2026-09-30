import { html, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import fieldWidth from '../../base/field-width.css';
import { MozBaseInputElement } from '../../base/input-element';
import buttonTokens from '../../generated/component-tokens/button.css';
import inputTokens from '../../generated/component-tokens/input.css';
import '../moz-icon/moz-icon';
import styles from './moz-input-color.css';

/** Row height: 40px as designed, or 32px to line up with the text fields. */
export type InputColorSize = 'default' | 'small';

/**
 * Colour input: the whole row is the control — a circular swatch, some text,
 * and an edit affordance — opening the operating system's colour picker.
 *
 * By default the row shows the `label`, so the row is the `<label>`. With
 * `show-value` it shows the selected hex instead and the label moves above the
 * row, like any other block field.
 *
 * The platform picker only carries an opaque `#rrggbb`, so there's no alpha
 * channel; pair this with a separate opacity control where translucency
 * matters. `required` renders the label's asterisk but nothing more — a colour
 * input always holds a value, so it can never fail validation.
 *
 * With no `label`, the row has no accessible name — set `aria-label`.
 *
 * @csspart field - The bordered row, when `show-value` is set. Without it the
 * row is the inherited `label` part, since that's the element the swatch sits in.
 * @csspart input - The native `<input type="color">` swatch.
 * @csspart value - The hex readout, when `show-value` is set.
 * @csspart edit - The trailing edit affordance.
 */
export class MozInputColor extends MozBaseInputElement {
  // buttonTokens supply the ghost hover/active fills the input set doesn't define.
  static styles = [
    ...MozBaseInputElement.styles,
    inputTokens,
    buttonTokens,
    fieldWidth,
    styles,
  ];
  static inputLayout = 'inline' as const;

  /** Fill the container instead of the default 320px width. */
  @property({ type: Boolean, reflect: true, attribute: 'full-width' })
  fullWidth = false;

  /**
   * Show the selected hex in the row instead of the label, which then sits
   * above the row. Displayed upper-case; `value` itself is untouched.
   */
  @property({ type: Boolean, reflect: true, attribute: 'show-value' })
  showValue = false;

  /** Row height. */
  @property({ reflect: true }) size: InputColorSize = 'default';

  constructor() {
    super();
    // A colour input is never empty; black is the platform's own default.
    this.value = '#000000';
  }

  protected willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    // Showing the value means the label needs somewhere else to go, so move it
    // above the row. Only on change, so an explicit `input-layout` still wins.
    if (changed.has('showValue')) {
      this.inputLayout = this.showValue ? 'block' : 'inline';
    }
  }

  /**
   * With `show-value` the row is a plain element — the label sits above it —
   * so only the swatch would be clickable, unlike the default layout where the
   * row *is* the label. Forward row clicks to the swatch to keep the whole row
   * the target in both modes.
   */
  #activateFromRow = (event: MouseEvent) => {
    const input = this.inputEl;
    if (!input || this.isDisabled) return;
    // Already on the swatch: the platform has it, and forwarding would recurse.
    if (event.composedPath().includes(input)) return;
    input.focus();
    if (typeof input.showPicker === 'function') input.showPicker();
    else input.click();
  };

  #swatchTemplate() {
    return html`<input
      id="input"
      part="input"
      type="color"
      name=${ifDefined(this.name)}
      .value=${this.value}
      aria-label=${ifDefined(this.inputAriaLabel ?? undefined)}
      aria-describedby=${ifDefined(this.describedBy)}
      aria-invalid=${ifDefined(this.error ? 'true' : undefined)}
      accesskey=${ifDefined(this.controlAccessKey)}
      ?disabled=${this.isDisabled}
      @input=${this.handleInput}
      @change=${this.handleChange}
    />`;
  }

  #editTemplate() {
    return html`<moz-icon
      class="edit"
      part="edit"
      name="edit-active"
      size="small"
    ></moz-icon>`;
  }

  protected inputTemplate() {
    // Without `show-value` the base nests this inside the label, which is what
    // makes the whole row the control. With it, the row is ours to draw.
    if (!this.showValue) {
      return html`${this.#swatchTemplate()}${this.#editTemplate()}`;
    }

    return html`<div class="field" part="field" @click=${this.#activateFromRow}>
      ${this.#swatchTemplate()}
      <!-- Hidden from AT: this is a visual rendering of the value the input
           already exposes, so announcing it again is noise. -->
      <span class="value" part="value" aria-hidden="true"
        >${this.value.toUpperCase()}</span
      >
      ${this.#editTemplate()}
    </div>`;
  }
}

if (!customElements.get('moz-input-color')) {
  customElements.define('moz-input-color', MozInputColor);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-input-color': MozInputColor;
  }
}
