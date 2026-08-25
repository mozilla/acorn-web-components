import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { MozBoxRow } from '../../base/box-row';
import boxRow from '../../base/box-row.css';
import shared from '../../base/shared.css';
import boxTokens from '../../generated/component-tokens/box.css';
import buttonTokens from '../../generated/component-tokens/button.css';

/**
 * Nova box button: a full-width box row rendered as a `<button>`, for navigating
 * to a sub-page or opening a dialog. Shows an optional `icon-start`, label, and
 * description with a trailing chevron. The native click bubbles; consumers wire
 * up the action.
 */
export class MozBoxButton extends MozBoxRow {
  // buttonTokens supplies --button-opacity-disabled for the disabled state.
  static styles = [shared, buttonTokens, boxTokens, boxRow];

  // Forward focus to the inner <button> so the host is a single tab stop.
  static shadowRootOptions = {
    ...super.shadowRootOptions,
    delegatesFocus: true,
  };

  /** Whether the button is disabled. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  render() {
    return html`
      <button class="button" ?disabled=${this.disabled}>
        ${this.renderText()}
        <moz-icon class="nav-icon" name="chevron-right"></moz-icon>
      </button>
    `;
  }
}

if (!customElements.get('moz-box-button')) {
  customElements.define('moz-box-button', MozBoxButton);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-box-button': MozBoxButton;
  }
}
