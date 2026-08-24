import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import '../moz-icon/moz-icon';
import type { IconSize } from '../../generated/icon-options';
import styles from './moz-five-star.css';

type Fill = 'full' | 'half' | 'empty';

// The Nova rating star is the bookmark glyph (a five-point star).
const STAR_ICON = 'bookmark-fill';

/** `detail` of the `moz-five-star:change` event. */
export interface FiveStarChangeDetail {
  /** The newly selected rating (a whole number of stars). */
  value: number;
}

/**
 * Nova component to show or select a 5-star rating. `rating` (0–`max`, halves
 * supported for display) is drawn as full / half / empty stars.
 *
 * By default it's a read-only display: a single labelled image with the stars
 * hidden from assistive tech. Add `selectable` to let the user pick a whole-star
 * rating — the stars become a radio group (arrow keys move and select, click
 * sets, hover previews) that fires `moz-five-star:change`.
 *
 * @fires moz-five-star:change - `{ value }` when the user picks a rating.
 */
export class MozFiveStar extends MozLitElement {
  static styles = [shared, styles];

  /** Rating out of `max`; rounded to the nearest half for display. */
  @property({ type: Number, reflect: true }) rating = 0;

  /** Total number of stars. */
  @property({ type: Number, reflect: true }) max = 5;

  /** Let the user pick a whole-star rating (radio-group semantics). */
  @property({ type: Boolean, reflect: true }) selectable = false;

  /** Star size, from the Nova `--icon-size-*` scale. Defaults to 16px. */
  @property() size?: IconSize;

  /**
   * Accessible label; defaults to "R out of M stars" for display, or "Rating"
   * when `selectable`.
   */
  @property() label?: string;

  /** Star (1-based) previewed on hover; 0 when not hovering. */
  @state() private hoverValue = 0;

  // Whole-star selection value; rounds a half rating to the nearest star.
  get #selected(): number {
    return Math.round(Math.max(0, Math.min(this.max, this.rating)));
  }

  #fills(): Fill[] {
    // Hover fills whole stars up to the hovered one, previewing the selection.
    if (this.selectable && this.hoverValue > 0) {
      return Array.from({ length: this.max }, (_, i) =>
        i < this.hoverValue ? 'full' : 'empty',
      );
    }
    const rounded = Math.max(
      0,
      Math.min(this.max, Math.round(this.rating * 2) / 2),
    );
    return Array.from({ length: this.max }, (_, i) => {
      const diff = rounded - i;
      if (diff >= 1) return 'full';
      if (diff === 0.5) return 'half';
      return 'empty';
    });
  }

  #label(): string {
    if (this.label) return this.label;
    if (this.selectable) return 'Rating';
    const rating = Math.max(0, Math.min(this.max, this.rating));
    return `${rating} out of ${this.max} stars`;
  }

  #select(value: number, focus = false) {
    if (!this.selectable) return;
    if (focus) {
      // Roving tabindex moves with selection, so focus after the re-render.
      this.updateComplete.then(() => {
        this.shadowRoot
          ?.querySelectorAll<HTMLElement>('.star')
          [value - 1]?.focus();
      });
    }
    if (value === this.#selected) return;
    this.rating = value;
    this.dispatchEvent(
      new CustomEvent<FiveStarChangeDetail>('moz-five-star:change', {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #onKeydown(e: KeyboardEvent) {
    if (!this.selectable) return;
    const keys = [
      'ArrowRight',
      'ArrowLeft',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const rtl = getComputedStyle(this).direction === 'rtl';
    const forward =
      e.key === 'ArrowDown' || e.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
    let next: number;
    if (e.key === 'Home') next = 1;
    else if (e.key === 'End') next = this.max;
    else if (forward) next = Math.min(this.max, (this.#selected || 0) + 1);
    else next = Math.max(1, (this.#selected || 1) - 1);
    this.#select(next, true);
  }

  render() {
    const interactive = this.selectable;
    const selected = this.#selected;
    return html`
      <div
        class="stars"
        role=${interactive ? 'radiogroup' : 'img'}
        aria-label=${this.#label()}
        @keydown=${this.#onKeydown}
        @pointerleave=${() => {
          this.hoverValue = 0;
        }}
      >
        ${this.#fills().map((fill, i) => {
          const value = i + 1;
          const checked = value === selected;
          return html`
            <span
              class="star"
              data-fill=${fill}
              role=${ifDefined(interactive ? 'radio' : undefined)}
              aria-hidden=${ifDefined(interactive ? undefined : 'true')}
              aria-checked=${ifDefined(interactive ? String(checked) : undefined)}
              aria-label=${ifDefined(
                interactive
                  ? value === 1
                    ? '1 star'
                    : `${value} stars`
                  : undefined,
              )}
              tabindex=${ifDefined(
                interactive
                  ? checked || (!selected && i === 0)
                    ? 0
                    : -1
                  : undefined,
              )}
              @click=${() => this.#select(value)}
              @pointerenter=${() => {
                if (interactive) this.hoverValue = value;
              }}
            >
              <moz-icon
                class="empty"
                name=${STAR_ICON}
                size=${ifDefined(this.size)}
              ></moz-icon>
              <moz-icon
                class="fill"
                name=${STAR_ICON}
                size=${ifDefined(this.size)}
              ></moz-icon>
            </span>
          `;
        })}
      </div>
    `;
  }
}

if (!customElements.get('moz-five-star')) {
  customElements.define('moz-five-star', MozFiveStar);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-five-star': MozFiveStar;
  }
}
