import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { MozBaseInputElement } from '../../base/input-element';
import buttonTokens from '../../generated/component-tokens/button.css';
import toggleTokens from '../../generated/component-tokens/toggle.css';
import styles from './moz-toggle.css';

/**
 * A switch built on {@link MozBaseInputElement}: by default the switch sits first
 * with the label after it; set `inputlayout="inline-end"` for the full-width
 * variant with the label first and the switch pushed to the end. Adds the shared
 * description / error / validation. It's a checkbox under the hood
 * (`role="switch"`), so it participates in forms and fires a composed `change`.
 *
 * @csspart input - The native `<input>`, styled as the track.
 * @csspart thumb - The sliding knob.
 */
export class MozToggle extends MozBaseInputElement {
  // toggleTokens own the switch's look; buttonTokens supply the disabled "on"
  // fill the toggle set doesn't define (see moz-toggle.css).
  static styles = [
    ...MozBaseInputElement.styles,
    toggleTokens,
    buttonTokens,
    styles,
  ];
  static inputLayout = 'inline' as const;
  static activatedProperty = 'checked';

  /**
   * Whether the switch is on (its activated state). Not reflected: like a native
   * control, the `checked` attribute is the default (drives form reset), so
   * toggling must not overwrite it. Style via `:state(checked)`.
   */
  @property({ type: Boolean }) checked = false;

  constructor() {
    super();
    // Native checkbox default: submits "on" when checked with no explicit value.
    this.value = 'on';
  }

  #handleChange = (event: Event) => {
    this.checked = (event.target as HTMLInputElement).checked;
    // Re-emit as a composed change (base helper handles the retarget).
    this.handleChange(event);
  };

  protected inputTemplate() {
    return html`<span class="track">
      <input
        id="input"
        part="input"
        type="checkbox"
        role="switch"
        name=${ifDefined(this.name)}
        .value=${this.value}
        .checked=${this.checked}
        aria-label=${ifDefined(this.inputAriaLabel ?? undefined)}
        aria-describedby=${ifDefined(this.describedBy)}
        accesskey=${ifDefined(this.controlAccessKey)}
        ?disabled=${this.isDisabled}
        ?required=${!!this.required}
        @change=${this.#handleChange}
      />
      <span class="thumb" part="thumb" aria-hidden="true"></span>
    </span>`;
  }
}

if (!customElements.get('moz-toggle')) {
  customElements.define('moz-toggle', MozToggle);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-toggle': MozToggle;
  }
}
