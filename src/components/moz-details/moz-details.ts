import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { DisclosureController } from '../../base/disclosure';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import '../moz-icon/moz-icon';
import styles from './moz-details.css';

/**
 * Nova disclosure: a labeled summary that expands to reveal its content. Built
 * on native `<details>`/`<summary>` for correct keyboard and ARIA semantics.
 * The heading comes from the `heading` attribute or the `heading` slot; the
 * collapsible content goes in the default slot. A chevron rotates when open.
 * Stack several to build an accordion.
 *
 * @slot - collapsible content.
 * @slot heading - rich summary label (overrides the `heading` attribute).
 * @csspart summary - the clickable `<summary>` row.
 * @csspart chevron - the disclosure chevron.
 * @csspart heading - the summary label wrapper.
 * @csspart content - the collapsible content region.
 * @fires moz-details:toggle - the open state changed via user interaction;
 *   `detail: { open }`.
 */
export class MozDetails extends MozLitElement {
  static styles = [shared, styles];

  /** Whether the disclosure is expanded. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Plain-text summary label; use the `heading` slot for richer content. */
  @property() heading?: string;

  /** Whether toggling is disabled. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  // Toggle behavior is shared with moz-card's accordion via DisclosureController; native <summary> still supplies the disclosure role and aria-expanded, so we don't manage them here.
  #disclosure = new DisclosureController(this, {
    get: () => this.open,
    set: (open) => {
      this.open = open;
    },
    eventType: 'moz-details:toggle',
    isDisabled: () => this.disabled,
  });

  render() {
    return html`
      <details ?open=${this.open}>
        <summary
          part="summary"
          tabindex=${this.disabled ? -1 : 0}
          aria-disabled=${ifDefined(this.disabled ? 'true' : undefined)}
          @click=${this.#disclosure.handleSummaryClick}
          @keydown=${this.#disclosure.handleSummaryKeydown}
        >
          <moz-icon class="chevron" part="chevron" name="chevron-down"></moz-icon>
          <span class="heading" part="heading">
            <slot name="heading">${this.heading ?? nothing}</slot>
          </span>
        </summary>
        <div class="content" part="content">
          <slot></slot>
        </div>
      </details>
    `;
  }
}

if (!customElements.get('moz-details')) {
  customElements.define('moz-details', MozDetails);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-details': MozDetails;
  }
}
