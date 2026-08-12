import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import cardTokens from '../../generated/component-tokens/card.css';
import styles from './moz-card.css';

export type CardSpacing = 'default' | 'compact';

/**
 * Nova card: a presentational surface grouping content and actions about a
 * single subject. Body goes in the default slot; `heading` (attribute or the
 * `heading` slot) titles the card, the `media` slot holds a cover image, and
 * the `actions` slot holds a footer row (e.g. buttons). Appearance is driven by
 * the scoped `--card-*` tokens; `spacing` picks the default or compact scale.
 *
 * Presentational only — Firefox's interactive `accordion` type is intentionally
 * omitted so the card stays a plain surface.
 */
export class MozCard extends MozLitElement {
  static styles = [shared, cardTokens, styles];

  /** Spacing scale: `compact` pulls the reduced padding/gap/radius tokens. */
  @property({ reflect: true }) spacing: CardSpacing = 'default';

  /** Optional heading text; rendered as the card's accessible label. */
  @property() heading?: string;

  @state() private hasHeadingSlot = false;
  @state() private hasMedia = false;
  @state() private hasActions = false;

  // Optional-slot wrappers start hidden and are revealed on slotchange, so an
  // unused media/heading/actions region adds no stray gap.
  #onSlot(name: 'heading' | 'media' | 'actions', event: Event) {
    const slot = event.target as HTMLSlotElement;
    const has = slot.assignedNodes({ flatten: true }).length > 0;
    if (name === 'heading') this.hasHeadingSlot = has;
    else if (name === 'media') this.hasMedia = has;
    else this.hasActions = has;
  }

  render() {
    const labelledby = this.heading ? 'heading' : undefined;
    return html`
      <article
        class="card"
        part="card"
        aria-labelledby=${ifDefined(labelledby)}
      >
        <div class="media" part="media" ?hidden=${!this.hasMedia}>
          <slot
            name="media"
            @slotchange=${(e: Event) => this.#onSlot('media', e)}
          ></slot>
        </div>
        <div
          class="header"
          part="header"
          ?hidden=${!this.heading && !this.hasHeadingSlot}
        >
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
        </div>
        <div class="content" part="content"><slot></slot></div>
        <div class="actions" part="actions" ?hidden=${!this.hasActions}>
          <slot
            name="actions"
            @slotchange=${(e: Event) => this.#onSlot('actions', e)}
          ></slot>
        </div>
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
