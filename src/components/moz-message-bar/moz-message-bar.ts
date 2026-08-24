import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { iconButton } from '../../base/icon-button';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import messageBarTokens from '../../generated/component-tokens/message-bar.css';
import '../moz-icon/moz-icon';
import '../moz-button/moz-button';
import type { IconName } from '../../generated/icons';
import type { IconColor } from '../../index';
import styles from './moz-message-bar.css';

export type MessageBarType =
  | 'info'
  | 'warning'
  | 'success'
  | 'error'
  | 'critical';

const typeIcon: Record<MessageBarType, IconName> = {
  info: 'information-fill',
  warning: 'warning-fill',
  success: 'checkmark-circle-fill',
  error: 'error-fill',
  critical: 'error-fill',
};

const typeColor: Record<MessageBarType, IconColor> = {
  info: 'information',
  warning: 'warning',
  success: 'success',
  error: 'critical',
  critical: 'critical',
};

/**
 * Nova message bar for surfacing important information. The message goes in the
 * default slot; the `actions` slot adds buttons and `support-link` adds a link.
 * `type` picks the color and icon; `dismissable` adds a close button.
 *
 * @fires moz-message-bar:dismiss - cancelable; the user clicked close. If not
 *   prevented, the bar removes itself and fires `moz-message-bar:dismissed`.
 * @fires moz-message-bar:dismissed - the bar was removed.
 */
export class MozMessageBar extends MozLitElement {
  static styles = [shared, messageBarTokens, styles];

  /** Message category, selecting the color and icon. */
  @property({ reflect: true }) type: MessageBarType = 'info';

  /** Optional bold heading shown before the message. */
  @property() heading?: string;

  /** Whether to show a close button. */
  @property({ type: Boolean, reflect: true }) dismissable = false;

  /** Accessible name for the close button; pass a localized string. */
  @property({ attribute: 'dismiss-label' }) dismissLabel = 'Close';

  connectedCallback() {
    super.connectedCallback();
    // Announce as an alert by default; a consumer can override with `role`.
    if (!this.hasAttribute('role')) this.setAttribute('role', 'alert');
  }

  #requestDismiss() {
    const event = new CustomEvent('moz-message-bar:dismiss', {
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    this.dispatchEvent(event);
    if (!event.defaultPrevented) this.dismiss();
  }

  /** Remove the bar and notify listeners. */
  dismiss() {
    this.remove();
    this.dispatchEvent(
      new CustomEvent('moz-message-bar:dismissed', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="container">
        <div class="icon-container">
          <moz-icon
            class="icon"
            name=${typeIcon[this.type]}
            color=${typeColor[this.type]}
          ></moz-icon>
        </div>
        <div class="content">
          <div class="text-content">
            ${
              this.heading
                ? html`<strong class="heading">${this.heading}</strong>`
                : nothing
            }
            <span class="message"><slot></slot></span>
            <span class="link"><slot name="support-link"></slot></span>
          </div>
          <span class="actions"><slot name="actions"></slot></span>
        </div>
        ${
          this.dismissable
            ? iconButton({
                icon: 'close',
                label: this.dismissLabel,
                onClick: () => this.#requestDismiss(),
                class: 'close',
              })
            : nothing
        }
      </div>
    `;
  }
}

if (!customElements.get('moz-message-bar')) {
  customElements.define('moz-message-bar', MozMessageBar);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-message-bar': MozMessageBar;
  }
}
