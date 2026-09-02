import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { checkMark, dashMark } from '../../base/marks';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import checkboxTokens from '../../generated/component-tokens/checkbox.css';
import styles from './moz-checkbox-visual.css';

/**
 * A checkbox drawn purely for display — the checked/indeterminate box next to a
 * label, with no input, focus, or form participation. Use it to mark statements
 * as true in a list, not to collect input (that's `moz-checkbox`).
 *
 * The box is decorative; make sure the label text carries the meaning for
 * assistive tech.
 *
 * @slot - the label, as an alternative to the `label` attribute.
 */
export class MozCheckboxVisual extends MozLitElement {
  static styles = [shared, checkboxTokens, styles];

  /** Whether the box shows as checked. */
  @property({ type: Boolean, reflect: true }) checked = false;

  /** Whether the box shows the mixed ("dash") state. */
  @property({ type: Boolean, reflect: true }) indeterminate = false;

  /** Label text (or use the default slot). */
  @property() label?: string;

  render() {
    return html`<span class="box" aria-hidden="true">
        ${checkMark}${dashMark}
      </span>
      <span class="label"><slot>${this.label ?? nothing}</slot></span>`;
  }
}

if (!customElements.get('moz-checkbox-visual')) {
  customElements.define('moz-checkbox-visual', MozCheckboxVisual);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-checkbox-visual': MozCheckboxVisual;
  }
}
