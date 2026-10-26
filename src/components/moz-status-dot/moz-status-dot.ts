import { html, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import '../moz-icon/moz-icon';
import type { IconName } from '../../generated/icons';
import type { StatusBadgeType } from '../moz-status-badge/moz-status-badge';
import styles from './moz-status-dot.css';

// Each status's glyph, matching moz-message-bar.
const typeIcon: Record<StatusBadgeType, IconName> = {
  ghost: 'information-fill',
  default: 'information-fill',
  information: 'information-fill',
  success: 'checkmark-circle-fill',
  warning: 'warning-fill',
  critical: 'critical-fill',
};

/**
 * A 22px status circle in the message-bar icon style. `type` picks the color;
 * set `icon` for a status-tinted disc with the type's matching glyph, or omit it
 * for a solid colored dot. Status is conveyed by color alone, so set `label` for
 * an accessible name — without one the dot is decorative.
 *
 * @csspart dot - the circle.
 */
export class MozStatusDot extends MozLitElement {
  static styles = [shared, styles];

  /** Status color. */
  @property({ reflect: true }) type: StatusBadgeType = 'information';

  /** Show the type's icon inside the disc; omit for a solid dot. */
  @property({ type: Boolean, reflect: true }) icon = false;

  /** Accessible name. Omit to leave the dot decorative. */
  @property() label?: string;

  protected updated(changed: PropertyValues<this>): void {
    if (!changed.has('label')) return;
    if (this.label) {
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', this.label);
      this.removeAttribute('aria-hidden');
    } else {
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
      this.setAttribute('aria-hidden', 'true');
    }
  }

  render() {
    return html`
      <span class="dot" part="dot">
        ${
          this.icon
            ? html`<moz-icon
                class="icon"
                name=${typeIcon[this.type]}
              ></moz-icon>`
            : nothing
        }
      </span>
    `;
  }
}

if (!customElements.get('moz-status-dot')) {
  customElements.define('moz-status-dot', MozStatusDot);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-status-dot': MozStatusDot;
  }
}
