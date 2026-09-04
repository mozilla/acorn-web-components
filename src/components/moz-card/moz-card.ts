import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { DisclosureController } from '../../base/disclosure';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import { slotHasContent } from '../../base/slots';
import '../moz-icon/moz-icon';
import cardTokens from '../../generated/component-tokens/card.css';
import type { IconName } from '../../generated/icons';
import styles from './moz-card.css';

export type CardSpacing = 'default' | 'compact';
export type CardVariant = 'default' | 'accordion';

/**
 * Nova card: a presentational surface grouping content and actions about a
 * single subject. Body goes in the default slot; `heading` (attribute or the
 * `heading` slot) titles the card with an optional leading `icon-start`, the
 * `media` slot holds a cover image, and the `actions` slot holds a footer row
 * (e.g. buttons). Appearance is driven by the scoped `--card-*` tokens;
 * `spacing` picks the default or compact scale.
 *
 * With `variant="accordion"` the header becomes a clickable summary and the body
 * collapses; `open` controls (and reflects) the open state. The disclosure
 * behavior is shared with moz-details via DisclosureController.
 *
 * @slot - body content.
 * @slot heading - rich heading markup (overrides the `heading` attribute).
 * @slot media - cover image/media, shown above the header.
 * @slot actions - footer actions row.
 * @csspart card - the outer `<article>` surface.
 * @csspart media - the cover media region.
 * @csspart header - the header row (the `<summary>` when `variant="accordion"`).
 * @csspart summary - the accordion `<summary>` (accordion variant only).
 * @csspart chevron - the accordion disclosure chevron (accordion variant only).
 * @csspart icon - the leading `icon-start` icon.
 * @csspart heading - the heading text from the `heading` attribute.
 * @csspart content - the body content region.
 * @csspart actions - the footer actions region.
 * @fires moz-card:toggle - accordion open state changed via user interaction;
 *   `detail: { open }`.
 */
export class MozCard extends MozLitElement {
  static styles = [shared, cardTokens, styles];

  /** Spacing scale: `compact` pulls the reduced padding/gap/radius tokens. */
  @property({ reflect: true }) spacing: CardSpacing = 'default';

  /** `accordion` makes the card an expandable disclosure. */
  @property({ reflect: true }) variant: CardVariant = 'default';

  /** Whether the accordion is open (only meaningful when `variant="accordion"`). */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Optional heading text; rendered as the card's accessible label. */
  @property() heading?: string;

  /** Optional icon shown before the heading. */
  @property({ attribute: 'icon-start' }) iconStart?: IconName;

  @state() private hasHeadingSlot = false;
  @state() private hasMedia = false;
  @state() private hasActions = false;
  @state() private hasContent = false;

  #disclosure = new DisclosureController(this, {
    get: () => this.open,
    set: (open) => {
      this.open = open;
    },
    eventType: 'moz-card:toggle',
  });

  // Regions start hidden and are revealed on slotchange, so an unused region adds no stray gap.
  #onSlot(name: 'heading' | 'media' | 'actions' | 'content', event: Event) {
    const has = slotHasContent(event.target as HTMLSlotElement);
    if (name === 'heading') this.hasHeadingSlot = has;
    else if (name === 'media') this.hasMedia = has;
    else if (name === 'actions') this.hasActions = has;
    else this.hasContent = has;
  }

  #media() {
    return html`<div class="media" part="media" ?hidden=${!this.hasMedia}>
      <slot
        name="media"
        @slotchange=${(e: Event) => this.#onSlot('media', e)}
      ></slot>
    </div>`;
  }

  #headerContent() {
    return html`
      ${
        this.iconStart
          ? html`<moz-icon
            class="icon"
            part="icon"
            name=${this.iconStart}
          ></moz-icon>`
          : nothing
      }
      ${
        this.heading
          ? html`<span id="heading" class="heading" part="heading"
            >${this.heading}</span
          >`
          : nothing
      }
      <slot
        name="heading"
        @slotchange=${(e: Event) => this.#onSlot('heading', e)}
      ></slot>
    `;
  }

  #content() {
    return html`<div class="content" part="content" ?hidden=${!this.hasContent}>
      <slot @slotchange=${(e: Event) => this.#onSlot('content', e)}></slot>
    </div>`;
  }

  #actions() {
    return html`<div class="actions" part="actions" ?hidden=${!this.hasActions}>
      <slot
        name="actions"
        @slotchange=${(e: Event) => this.#onSlot('actions', e)}
      ></slot>
    </div>`;
  }

  render() {
    const labelledby = this.heading ? 'heading' : undefined;
    if (this.variant === 'accordion') {
      return html`
        <article
          class="card"
          part="card"
          aria-labelledby=${ifDefined(labelledby)}
        >
          ${this.#media()}
          <details class="accordion" ?open=${this.open}>
            <summary
              class="header"
              part="header summary"
              @click=${this.#disclosure.handleSummaryClick}
              @keydown=${this.#disclosure.handleSummaryKeydown}
            >
              <moz-icon
                class="chevron"
                part="chevron"
                name="chevron-down"
              ></moz-icon>
              ${this.#headerContent()}
            </summary>
            <div class="details-body">${this.#content()}${this.#actions()}</div>
          </details>
        </article>
      `;
    }
    return html`
      <article class="card" part="card" aria-labelledby=${ifDefined(labelledby)}>
        ${this.#media()}
        <div
          class="header"
          part="header"
          ?hidden=${!this.heading && !this.hasHeadingSlot && !this.iconStart}
        >
          ${this.#headerContent()}
        </div>
        ${this.#content()} ${this.#actions()}
      </article>
    `;
  }
}

if (!customElements.get('moz-card')) {
  customElements.define('moz-card', MozCard);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-card': MozCard;
  }
}
