import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import {
  literal,
  type StaticValue,
  html as staticHtml,
} from 'lit/static-html.js';
import { iconButton } from '../../base/icon-button';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import { slotHasContent } from '../../base/slots';
import '../moz-badge/moz-badge';
import '../moz-button/moz-button';
import '../moz-icon/moz-icon';
import type { IconName } from '../../generated/icons';
import styles from './moz-page-header.css';

/** Heading level 1-6; picks the real heading element to render. */
export type PageHeaderLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** Optional badge shown beside the heading. */
export type PageHeaderBadge = 'beta' | 'new';

const headings: Record<number, StaticValue> = {
  1: literal`h1`,
  2: literal`h2`,
  3: literal`h3`,
  4: literal`h4`,
  5: literal`h5`,
  6: literal`h6`,
};

const badgeText: Record<PageHeaderBadge, string> = {
  beta: 'Beta',
  new: 'New',
};

/**
 * Nova page header: a title block giving context for a page. The heading comes
 * from the `heading` attribute or the default slot; the description from the
 * `description` attribute or the `description` slot. Optional: a leading
 * `icon-start` (or the `icon` slot for arbitrary markup, e.g. an image), a
 * `back-button`, a `beta`/`new` `badge`, a `breadcrumbs` slot above the heading,
 * and a right-aligned `actions` slot.
 *
 * Semantics and appearance are decoupled: `level` chooses the real heading
 * element (`<h1>`-`<h6>`) while the visual size stays constant.
 *
 * @slot - Heading content (fallback when `heading` is unset).
 * @slot description - Secondary text (fallback when `description` is unset).
 * @slot breadcrumbs - A moz-breadcrumb-group shown above the heading.
 * @slot icon - Leading icon or image (alternative to `icon-start`).
 * @slot actions - Right-aligned actions, e.g. buttons.
 * @csspart heading - The rendered heading element.
 * @csspart description - The description paragraph.
 * @fires moz-page-header:back - The back button was activated.
 */
export class MozPageHeader extends MozLitElement {
  static styles = [shared, styles];

  /** Title text. When unset, the default slot supplies the heading. */
  @property() heading?: string;

  /** Secondary text. When unset, the `description` slot supplies it. */
  @property() description?: string;

  /** Leading icon; for arbitrary markup (e.g. an image) use the `icon` slot. */
  @property({ attribute: 'icon-start' }) iconStart?: IconName;

  /** Heading level, selecting the `<h1>`-`<h6>` element. */
  @property({ type: Number, reflect: true }) level: PageHeaderLevel = 1;

  /** Show a leading back button (fires `moz-page-header:back`). */
  @property({ type: Boolean, reflect: true, attribute: 'back-button' })
  backButton = false;

  /** Accessible name for the back button; pass a localized string. */
  @property({ attribute: 'back-label' }) backLabel = 'Back';

  /** Optional badge beside the heading. */
  @property({ reflect: true }) badge?: PageHeaderBadge;

  @state() private hasIcon = false;
  @state() private hasActions = false;
  @state() private hasDescriptionSlot = false;
  @state() private hasBreadcrumbs = false;

  #onSlotChange(event: Event) {
    const slot = event.target as HTMLSlotElement;
    const filled = slotHasContent(slot);
    if (slot.name === 'icon') this.hasIcon = filled;
    else if (slot.name === 'actions') this.hasActions = filled;
    else if (slot.name === 'description') this.hasDescriptionSlot = filled;
    else if (slot.name === 'breadcrumbs') this.hasBreadcrumbs = filled;
  }

  #back() {
    this.dispatchEvent(
      new CustomEvent('moz-page-header:back', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  #headingTemplate() {
    // Fall back to h1 for an out-of-range level.
    const tag = headings[this.level] ?? headings[1];
    const content = this.heading ? this.heading : html`<slot></slot>`;
    return staticHtml`<${tag} class="heading" part="heading">${content}</${tag}>`;
  }

  render() {
    const showDescription = !!this.description || this.hasDescriptionSlot;
    return html`
      <div class="container">
        <div class="breadcrumbs" ?hidden=${!this.hasBreadcrumbs}>
          <slot name="breadcrumbs" @slotchange=${this.#onSlotChange}></slot>
        </div>
        <div class="main">
          ${
            this.backButton
              ? iconButton({
                  icon: 'back',
                  label: this.backLabel,
                  onClick: () => this.#back(),
                  class: 'back',
                })
              : nothing
          }
          <span class="leading" ?hidden=${!this.iconStart && !this.hasIcon}>
            ${
              this.iconStart
                ? html`<moz-icon name=${this.iconStart} size="xlarge"></moz-icon>`
                : html`<slot name="icon" @slotchange=${this.#onSlotChange}></slot>`
            }
          </span>
          <div class="titles">
            <div class="heading-row">
              ${this.#headingTemplate()}
              ${
                this.badge
                  ? html`<moz-badge type=${this.badge}
                      >${badgeText[this.badge]}</moz-badge
                    >`
                  : nothing
              }
            </div>
            <p class="description" part="description" ?hidden=${!showDescription}>
              ${
                this.description
                  ? this.description
                  : html`<slot
                      name="description"
                      @slotchange=${this.#onSlotChange}
                    ></slot>`
              }
            </p>
          </div>
          <span class="actions" ?hidden=${!this.hasActions}>
            <slot name="actions" @slotchange=${this.#onSlotChange}></slot>
          </span>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('moz-page-header')) {
  customElements.define('moz-page-header', MozPageHeader);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-page-header': MozPageHeader;
  }
}
