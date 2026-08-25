import { html, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import '../moz-icon/moz-icon';
import type { IconName } from '../../generated/icons';
import styles from './moz-chip.css';

export type ChipSize = 'default' | 'small';

/**
 * Nova chip: a compact pill for a tag, filter, or selection. The label goes in
 * the default slot; `icon-start` renders a leading moz-icon. A remove button is
 * always present (per the Nova design); `selected` and `disabled` are reflected
 * presentational states. Purely presentational — not form-associated.
 *
 * @slot - chip label.
 * @fires moz-chip:remove - cancelable; the user activated remove. If not
 *   prevented, the chip removes itself.
 */
export class MozChip extends MozLitElement {
  static styles = [shared, styles];

  /** Size variant. */
  @property({ reflect: true }) size: ChipSize = 'default';

  /** Leading icon name (rendered via moz-icon). */
  @property({ attribute: 'icon-start' }) iconStart?: IconName;

  /** Whether the chip is selected (reflected for styling). */
  @property({ type: Boolean, reflect: true }) selected = false;

  /** Whether the chip is disabled (reflected; suppresses the remove action). */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Accessible name for the remove button; pass a localized string. */
  @property({ attribute: 'remove-label' }) removeLabel = 'Remove';

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    // Expose disabled to AT; also exempts the dimmed label from axe contrast.
    if (this.disabled) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');
  }

  #remove() {
    if (this.disabled) return;
    const event = new CustomEvent('moz-chip:remove', {
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    this.dispatchEvent(event);
    if (!event.defaultPrevented) this.remove();
  }

  render() {
    return html`
      <span class="container">
        ${
          this.iconStart
            ? html`<moz-icon
                class="icon"
                name=${this.iconStart}
                aria-hidden="true"
              ></moz-icon>`
            : nothing
        }
        <span class="label"><slot></slot></span>
        <button
          class="remove"
          type="button"
          aria-label=${this.removeLabel}
          ?disabled=${this.disabled}
          @click=${this.#remove}
        >
          <moz-icon name="close" aria-hidden="true"></moz-icon>
        </button>
      </span>
    `;
  }
}

if (!customElements.get('moz-chip')) {
  customElements.define('moz-chip', MozChip);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-chip': MozChip;
  }
}
