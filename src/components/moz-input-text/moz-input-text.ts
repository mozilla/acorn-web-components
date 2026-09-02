import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import fieldWidth from '../../base/field-width.css';
import { iconButton } from '../../base/icon-button';
import { MozBaseInputElement } from '../../base/input-element';
import inputTokens from '../../generated/component-tokens/input.css';
import type { IconName } from '../../generated/icons';
import '../moz-icon/moz-icon';
import styles from './moz-input-text.css';

/**
 * The text-entry types that share this one control: they differ only by the
 * native `type` (keyboard, autofill, validation). `search`, `password`, and
 * `number` have enough extra behavior to be their own components.
 */
export type InputType = 'text' | 'email' | 'url' | 'tel';

/**
 * Single-line text input. Built on {@link MozBaseInputElement}, so it carries
 * the shared label, description, and form/validation wiring; this class adds
 * the text-specific attributes, an optional in-field leading icon (`icon-start`,
 * distinct from the label's `label-icon`), and an optional clear button.
 *
 * @csspart field - The bordered box wrapping the icon, input, and clear button.
 * @csspart input - The native `<input>` element.
 */
export class MozInputText extends MozBaseInputElement {
  static styles = [
    ...MozBaseInputElement.styles,
    inputTokens,
    fieldWidth,
    styles,
  ];
  static inputLayout = 'block' as const;

  /** Fill the container instead of the default 320px width. */
  @property({ type: Boolean, reflect: true, attribute: 'full-width' })
  fullWidth = false;

  /** Text-entry type (drives keyboard, autofill, and native validation). */
  @property() type: InputType = 'text';

  /** Placeholder shown when empty. */
  @property() placeholder?: string;

  /** Whether the value is read-only. */
  @property({ type: Boolean, reflect: true }) readonly = false;

  /** Native validation pattern. */
  @property() pattern?: string;

  /** Native autocomplete hint. */
  @property() autocomplete?: string;

  /** Leading icon shown inside the field, before the text. */
  @property({ attribute: 'icon-start' }) iconStart?: IconName;

  /** Whether to show a clear button once the field has a value. */
  @property({ type: Boolean, reflect: true }) clearable = false;

  get #showClear(): boolean {
    return this.clearable && !!this.value && !this.isDisabled && !this.readonly;
  }

  #clear = () => {
    this.value = '';
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    this.focus();
  };

  protected inputTemplate() {
    return html`<div class="field" part="field">
      ${
        this.iconStart
          ? html`<moz-icon
            class="field-icon"
            name=${this.iconStart}
            size="small"
          ></moz-icon>`
          : nothing
      }
      <input
        id="input"
        part="input"
        type=${this.type}
        name=${ifDefined(this.name)}
        .value=${this.value}
        placeholder=${ifDefined(this.placeholder)}
        pattern=${ifDefined(this.pattern)}
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
      />
      ${
        this.#showClear
          ? iconButton({
              icon: 'close',
              label: `Clear ${this.label ?? ''}`.trim(),
              size: 'small',
              class: 'clear',
              onClick: this.#clear,
            })
          : nothing
      }
    </div>`;
  }
}

if (!customElements.get('moz-input-text')) {
  customElements.define('moz-input-text', MozInputText);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-input-text': MozInputText;
  }
}
