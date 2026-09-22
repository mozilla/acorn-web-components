import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
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
 *
 * With `href` set it renders a real `<a>` (styled identically) so it gets link
 * semantics — new-tab, context menu, screen-reader "link". A disabled button
 * with `href` stays a `<button>`, since a disabled link isn't a real state.
 *
 * @slot - button label.
 * @csspart button - the `<button>` (or `<a>` in link mode).
 */
export class MozButton extends MozLitElement {
  static styles = [buttonTokens, styles];

  static shadowRootOptions = {
    ...super.shadowRootOptions,
    delegatesFocus: true,
  };

  static formAssociated = true;

  #internals = this.attachInternals();

  /** Visual variant, selecting a `--button-*` token set. */
  @property({ reflect: true }) variant: ButtonVariant = 'default';

  /** Size step. */
  @property({ reflect: true }) size: ButtonSize = 'medium';

  /** Whether the button is disabled. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /**
   * Whether to render as a compact icon-only square (`--button-size-icon`
   * scale); provide the icon via `icon-start` and a visually-hidden slotted
   * label for the accessible name.
   */
  @property({ type: Boolean, reflect: true, attribute: 'icon-only' })
  iconOnly = false;

  /** Native button type. */
  @property() type: 'button' | 'submit' | 'reset' = 'button';

  /** Icon rendered before the label. */
  @property({ attribute: 'icon-start' }) iconStart?: IconName;

  /** Icon rendered after the label. */
  @property({ attribute: 'icon-end' }) iconEnd?: IconName;

  /** If set, render as a link (`<a href>`) styled as a button. */
  @property() href?: string;

  /** Link target (link mode only), e.g. `_blank`. */
  @property() target?: string;

  /** Link `rel` (link mode only); defaults to `noopener` when `target="_blank"`. */
  @property() rel?: string;

  #handleClick() {
    if (this.disabled) return;
    // The shadow-DOM <button> can't reach the light-DOM form, so forward it.
    if (this.type === 'submit') this.#internals.form?.requestSubmit();
    else if (this.type === 'reset') this.#internals.form?.reset();
  }

  #content() {
    return html`
      ${
        this.iconStart
          ? html`<moz-icon name=${this.iconStart}></moz-icon>`
          : nothing
      }
      <slot></slot>
      ${this.iconEnd ? html`<moz-icon name=${this.iconEnd}></moz-icon>` : nothing}
    `;
  }

  render() {
    // A disabled link isn't a real state, so keep the <button> for that case.
    if (this.href && !this.disabled) {
      const rel =
        this.rel ?? (this.target === '_blank' ? 'noopener' : undefined);
      return html`
        <a
          part="button"
          href=${this.href}
          target=${ifDefined(this.target)}
          rel=${ifDefined(rel)}
        >
          ${this.#content()}
        </a>
      `;
    }
    return html`
      <button
        part="button"
        type=${this.type}
        ?disabled=${this.disabled}
        @click=${this.#handleClick}
      >
        ${this.#content()}
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
