import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { MozLitElement } from '../../base/moz-lit-element.js';
import shared from '../../base/shared.css';
import messageBarTokens from '../../generated/component-tokens/message-bar.css';
import '../moz-icon/moz-icon.js';
import '../moz-button/moz-button.js';
import type { IconName } from '../../generated/icons.js';
import type { IconColor } from '../../index.js';
import styles from './moz-message-bar.css';

export type MessageBarType =
  | 'info'
  | 'warning'
  | 'success'
  | 'error'
  | 'critical';

const typeIcon: Record<MessageBarType, IconName> = {
  info: 'info-filled',
  warning: 'warning',
  success: 'check-filled',
  error: 'error',
  critical: 'error',
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
 * `type` picks the colour and icon; `dismissable` adds a close button.
 *
 * @fires moz-message-bar:dismissed - cancelable; the user clicked close. If not
 *   prevented, the bar removes itself and fires `moz-message-bar:close`.
 * @fires moz-message-bar:close - the bar was removed.
 */
export class MozMessageBar extends MozLitElement {
  static styles = [shared, messageBarTokens, styles];

  /** Message category, selecting the colour and icon. */
  @property({ reflect: true }) type: MessageBarType = 'info';

  /** Optional bold heading shown before the message. */
  @property() heading?: string;

  /** Whether to show a close button. */
  @property({ type: Boolean }) dismissable = false;

  /** Accessible name for the close button; pass a localized string. */
  @property({ attribute: 'dismiss-label' }) dismissLabel = 'Close';

  connectedCallback() {
    super.connectedCallback();
    // Announce as an alert by default; a consumer can override with `role`.
    if (!this.hasAttribute('role')) this.setAttribute('role', 'alert');
  }

  #dismiss() {
    const event = new CustomEvent('moz-message-bar:dismissed', {
      bubbles: true,
      cancelable: true,
    });
    this.dispatchEvent(event);
    if (!event.defaultPrevented) this.close();
  }

  /** Remove the bar and notify listeners. */
  close() {
    this.remove();
    this.dispatchEvent(
      new CustomEvent('moz-message-bar:close', { bubbles: true }),
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
            ? html`<moz-button
                class="close"
                icon
                variant="ghost"
                icon-start="close"
                @click=${this.#dismiss}
                ><span class="visually-hidden">${this.dismissLabel}</span></moz-button
              >`
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
