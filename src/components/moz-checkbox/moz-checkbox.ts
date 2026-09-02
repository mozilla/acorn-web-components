import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { MozBaseInputElement } from '../../base/input-element';
import { checkMark, dashMark } from '../../base/marks';
import buttonTokens from '../../generated/component-tokens/button.css';
import checkboxTokens from '../../generated/component-tokens/checkbox.css';
import styles from './moz-checkbox.css';

/**
 * Checkbox built on {@link MozBaseInputElement}: an inline control with a label,
 * plus the shared description / error / validation. Supports an indeterminate
 * ("mixed") state and a `nested` slot of sub-options that disable while the box
 * is unchecked or disabled.
 *
 * Fires a composed `change` when toggled (the platform contract for checkboxes).
 *
 * @csspart input - The native `<input type="checkbox">`, styled as the box.
 * @slot nested - Sub-options shown indented; gated by the checked/disabled state.
 */
export class MozCheckbox extends MozBaseInputElement {
  // buttonTokens: the checked box shares the primary button's fill, including
  // its disabled variant (see moz-checkbox.css).
  static styles = [
    ...MozBaseInputElement.styles,
    checkboxTokens,
    buttonTokens,
    styles,
  ];
  static inputLayout = 'inline' as const;
  static activatedProperty = 'checked';

  /**
   * Whether the checkbox is checked (its activated state). Not reflected: like a
   * native control, the `checked` attribute is the default (drives form reset),
   * so toggling must not overwrite it. Style via `:state(checked)`.
   */
  @property({ type: Boolean }) checked = false;

  /** Tri-state "mixed" display; clears when the user toggles. */
  @property({ type: Boolean }) indeterminate = false;

  constructor() {
    super();
    // Native checkbox default: submits "on" when checked with no explicit value.
    this.value = 'on';
  }

  #handleChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    this.checked = input.checked;
    this.indeterminate = false;
    // Re-emit as a composed change (base helper handles the retarget).
    this.handleChange(event);
  };

  protected inputTemplate() {
    // The mark overlays the box (see base/marks); `currentColor` recolors it.
    return html`<span class="box">
      <input
        id="input"
        part="input"
        type="checkbox"
        name=${ifDefined(this.name)}
        .value=${this.value}
        .checked=${this.checked}
        .indeterminate=${this.indeterminate}
        aria-label=${ifDefined(this.inputAriaLabel ?? undefined)}
        aria-describedby=${ifDefined(this.describedBy)}
        accesskey=${ifDefined(this.controlAccessKey)}
        ?disabled=${this.isDisabled}
        ?required=${!!this.required}
        @change=${this.#handleChange}
      />
      ${checkMark}${dashMark}
    </span>`;
  }
}

if (!customElements.get('moz-checkbox')) {
  customElements.define('moz-checkbox', MozCheckbox);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-checkbox': MozCheckbox;
  }
}
