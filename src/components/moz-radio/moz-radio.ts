import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { MozBaseInputElement } from '../../base/input-element';
import { SelectControlItemMixin } from '../../base/select-control';
import buttonTokens from '../../generated/component-tokens/button.css';
import styles from './moz-radio.css';

/**
 * A single radio option: {@link MozBaseInputElement} for the label / description
 * / validation, plus {@link SelectControlItemMixin} for the select-control
 * behavior. Its `moz-radio-group` owns single-selection, the shared name, and
 * arrow-key navigation; selecting it (however that happens) updates the group.
 *
 * @csspart input - The native `<input type="radio">`, styled as the circle.
 * @csspart dot - The inner selection dot.
 */
export class MozRadio extends SelectControlItemMixin(MozBaseInputElement) {
  static styles = [...MozBaseInputElement.styles, buttonTokens, styles];
  static inputLayout = 'inline' as const;
  static activatedProperty = 'checked';

  /**
   * Whether this option is selected. Not reflected: like a native control, the
   * `checked` attribute is the reset default, so selecting must not overwrite it.
   */
  @property({ type: Boolean }) checked = false;

  constructor() {
    super();
    // Native radios default an omitted value to "on".
    this.value = 'on';
  }

  // In a group, handleClick settles selection before this fires; standalone,
  // this is the only path that adopts the native input's checked state (and so
  // its form value and validity).
  #handleChange = (event: Event) => {
    this.checked = (event.target as HTMLInputElement).checked;
    this.handleChange(event);
  };

  protected inputTemplate() {
    return html`<span class="circle">
      <input
        id="input"
        part="input"
        type="radio"
        name=${ifDefined(this.name)}
        .value=${this.value}
        .checked=${this.checked}
        tabindex=${this.itemTabIndex}
        aria-label=${ifDefined(this.inputAriaLabel ?? undefined)}
        aria-describedby=${ifDefined(this.describedBy)}
        accesskey=${ifDefined(this.controlAccessKey)}
        ?disabled=${this.isDisabled}
        ?required=${!!this.required}
        @click=${this.handleClick}
        @change=${this.#handleChange}
      />
      <span class="dot" part="dot" aria-hidden="true"></span>
    </span>`;
  }
}

if (!customElements.get('moz-radio')) {
  customElements.define('moz-radio', MozRadio);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-radio': MozRadio;
  }
}
