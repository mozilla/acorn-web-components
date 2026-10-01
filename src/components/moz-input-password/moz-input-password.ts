import { property, state } from 'lit/decorators.js';
import { iconButton } from '../../base/icon-button';
import { MozInputText } from '../moz-input-text/moz-input-text';
import styles from './moz-input-password.css';

/**
 * Password field: a `moz-input-text` preset to `type="password"` with a reveal
 * toggle inside the field. Revealing swaps the native type to `text` (rather
 * than styling the dots away) so the value is selectable and the browser stops
 * offering to save it mid-edit.
 *
 * The toggle's accessible name flips between "Show password" and "Hide
 * password" instead of carrying `aria-pressed`, so a screen reader announces
 * the action available rather than a state whose polarity is ambiguous.
 *
 * @csspart field - the bordered field box.
 * @csspart input - the native `<input>`.
 */
export class MozInputPassword extends MozInputText {
  static styles = [...MozInputText.styles, styles];

  /**
   * Drop the reveal toggle (e.g. on a confirmation field). Negative, like
   * `hide-spinner`, because a boolean that defaults to `true` can't be turned
   * off by leaving its attribute out.
   */
  @property({ type: Boolean, reflect: true, attribute: 'hide-reveal' })
  hideReveal = false;

  /** Whether the value is currently shown as plain text. */
  @state() revealed = false;

  constructor() {
    super();
    this.autocomplete = 'current-password';
  }

  protected get inputType(): string {
    return this.revealed ? 'text' : 'password';
  }

  get #showReveal(): boolean {
    return !this.hideReveal && !this.isDisabled && !this.readonly;
  }

  #toggleReveal = () => {
    this.revealed = !this.revealed;
    // Keep the caret in the field: the toggle is inside it, so a bare click
    // would otherwise leave focus on a button that just changed its label.
    this.focus();
  };

  formResetCallback(): void {
    super.formResetCallback();
    // Never leave a reset form showing the previous value in the clear.
    this.revealed = false;
  }

  protected fieldEndTemplate() {
    if (!this.#showReveal) return super.fieldEndTemplate();
    return iconButton({
      icon: this.revealed ? 'show-password-slash' : 'show-password',
      label: this.revealed ? 'Hide password' : 'Show password',
      size: 'small',
      class: 'reveal',
      onClick: this.#toggleReveal,
    });
  }

  /** Hide the value again (e.g. when navigating away from a form). */
  hide(): void {
    this.revealed = false;
  }
}

if (!customElements.get('moz-input-password')) {
  customElements.define('moz-input-password', MozInputPassword);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-input-password': MozInputPassword;
  }
}
