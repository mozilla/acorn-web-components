import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { MozLitElement } from '../../base/moz-lit-element';
import buttonTokens from '../../generated/component-tokens/button.css';
import '../moz-icon/moz-icon';
import type { IconName } from '../../generated/icons';
import styles from './moz-button.css';

export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'destructive'
  | 'ghost'
  | 'muted';
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Nova button. Appearance is driven entirely by the scoped `--button-*` tokens
 * (added via `buttonTokens`), selected by the `variant` and `size` attributes.
 * Label goes in the default slot; `icon-start` / `icon-end` render a moz-icon.
 *
 * Form-associated: with `type="submit"` or `type="reset"` it drives the
 * associated light-DOM form, even though the real `<button>` lives in the shadow
 * tree.
 */
export class MozButton extends MozLitElement {
  static styles = [buttonTokens, styles];

  static formAssociated = true;

  #internals = this.attachInternals();

  /** Visual variant, selecting a `--button-*` token set. */
  @property({ reflect: true }) variant: ButtonVariant = 'default';

  /** Size step. */
  @property({ reflect: true }) size: ButtonSize = 'medium';

  /** Disables the button. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /**
   * Icon-only: a compact square (`--button-size-icon` scale). Provide the icon
   * via `icon-start` and a visually-hidden slotted label for the accessible name.
   */
  @property({ type: Boolean, reflect: true }) icon = false;

  /** Native button type. */
  @property() type: 'button' | 'submit' | 'reset' = 'button';

  /** Icon rendered before the label. */
  @property({ attribute: 'icon-start' }) iconStart?: IconName;

  /** Icon rendered after the label. */
  @property({ attribute: 'icon-end' }) iconEnd?: IconName;

  #handleClick() {
    if (this.disabled) return;
    // The shadow-DOM <button> can't reach the light-DOM form, so forward it.
    if (this.type === 'submit') this.#internals.form?.requestSubmit();
    else if (this.type === 'reset') this.#internals.form?.reset();
  }

  render() {
    return html`
      <button
        part="button"
        type=${this.type}
        ?disabled=${this.disabled}
        @click=${this.#handleClick}
      >
        ${
          this.iconStart
            ? html`<moz-icon name=${this.iconStart}></moz-icon>`
            : nothing
        }
        <slot></slot>
        ${
          this.iconEnd
            ? html`<moz-icon name=${this.iconEnd}></moz-icon>`
            : nothing
        }
      </button>
    `;
  }
}

if (!customElements.get('moz-button')) {
  customElements.define('moz-button', MozButton);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-button': MozButton;
  }
}
