import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { iconButton } from '../../base/icon-button';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import { slotHasContent } from '../../base/slots';
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

export type MessageBarVariant = 'default' | 'stacked';

const typeIcon: Record<MessageBarType, IconName> = {
  info: 'information-fill',
  warning: 'warning-fill',
  success: 'checkmark-circle-fill',
  error: 'error-fill',
  critical: 'critical-fill',
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
 * `type` picks the color and icon; `dismissable` adds a close button;
 * `variant="stacked"` stacks the contents vertically at any width.
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

  /** `stacked` lays the contents out vertically at every width. */
  @property({ reflect: true }) variant: MessageBarVariant = 'default';

  /** Whether to show a close button. */
  @property({ type: Boolean, reflect: true }) dismissable = false;

  /** Accessible name for the close button; pass a localized string. */
  @property({ attribute: 'dismiss-label' }) dismissLabel = 'Close';

  @state() private hasMessage = false;
  @state() private hasLink = false;
  @state() private hasActions = false;

  #onSlotChange(event: Event) {
    const slot = event.target as HTMLSlotElement;
    const filled = slotHasContent(slot);
    if (slot.name === 'support-link') this.hasLink = filled;
    else if (slot.name === 'actions') this.hasActions = filled;
    else this.hasMessage = filled;
  }

  connectedCallback() {
    super.connectedCallback();
    // Default to role=alert so assistive tech announces it.
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
    const sibling = this.previousElementSibling ?? this.nextElementSibling;
    // Fire while still connected so `bubbles`/`composed` can reach ancestor
    // listeners — a detached node has nothing to bubble through.
    this.dispatchEvent(
      new CustomEvent('moz-message-bar:dismissed', {
        bubbles: true,
        composed: true,
      }),
    );
    this.remove();
    // Keep focus in the page rather than dropping it to <body>.
    if (sibling instanceof MozMessageBar) {
      sibling.shadowRoot?.querySelector<HTMLElement>('.close')?.focus();
    } else if (sibling instanceof HTMLElement) {
      sibling.focus?.();
    }
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
            <strong class="heading" ?hidden=${!this.heading}
              >${this.heading}</strong
            >
            <span class="message" ?hidden=${!this.hasMessage}>
              <slot @slotchange=${this.#onSlotChange}></slot>
            </span>
            <span class="link" ?hidden=${!this.hasLink}>
              <slot name="support-link" @slotchange=${this.#onSlotChange}></slot>
            </span>
          </div>
          <span class="actions" ?hidden=${!this.hasActions}>
            <slot name="actions" @slotchange=${this.#onSlotChange}></slot>
          </span>
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
