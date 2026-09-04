import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import breadcrumbTokens from '../../generated/component-tokens/breadcrumb.css';
import '../moz-icon/moz-icon';
import styles from './moz-breadcrumb.css';

/** `detail` of the {@link MozBreadcrumb} `moz-breadcrumb:select` event. */
export interface BreadcrumbSelectDetail {
  href?: string;
}

/**
 * A single breadcrumb. Renders a link when `href` is set, or plain text when it
 * has no href or is the current page. Use it on its own, or nest several inside
 * a {@link MozBreadcrumbGroup} (which marks the last one current). The label is
 * the default slot.
 *
 * @slot - the crumb label.
 * @fires moz-breadcrumb:select - cancelable; the crumb's link was activated.
 *   detail is `{ href }`. preventDefault to block navigation (e.g. SPA routing).
 */
export class MozBreadcrumb extends MozLitElement {
  static styles = [shared, breadcrumbTokens, styles];

  /** Link target; omit for a non-link crumb. */
  @property() href?: string;

  /** The current page — plain text with `aria-current="page"`. Set by
   * moz-breadcrumb-group on the last crumb. */
  @property({ type: Boolean, reflect: true }) current = false;

  #select(event: MouseEvent) {
    const selectEvent = new CustomEvent<BreadcrumbSelectDetail>(
      'moz-breadcrumb:select',
      {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { href: this.href },
      },
    );
    // A consumer that cancels wants to own navigation, so block the anchor's.
    if (!this.dispatchEvent(selectEvent)) event.preventDefault();
  }

  render() {
    return this.current || !this.href
      ? html`<span
          class="crumb"
          aria-current=${ifDefined(this.current ? 'page' : undefined)}
          ><slot></slot
        ></span>`
      : html`<a class="crumb" href=${this.href} @click=${this.#select}
          ><slot></slot
        ></a>`;
  }
}

/**
 * A breadcrumb trail: a `<nav>` landmark wrapping an ordered list of slotted
 * `<moz-breadcrumb>` children, separated by a forward arrow. The last crumb is
 * marked the current page automatically. Styling is driven by the scoped
 * `--breadcrumb-*` tokens.
 *
 * @slot - the `<moz-breadcrumb>` crumbs, root first.
 */
export class MozBreadcrumbGroup extends MozLitElement {
  static styles = [shared, breadcrumbTokens, styles];

  /** Accessible name for the nav landmark; pass a localized string. */
  @property() label = 'Breadcrumb';

  #observer?: MutationObserver;

  connectedCallback() {
    super.connectedCallback();
    // Re-render when crumbs are added/removed so slots + current stay in sync.
    this.#observer = new MutationObserver(() => this.requestUpdate());
    this.#observer.observe(this, { childList: true });
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#observer = undefined;
    super.disconnectedCallback();
  }

  get #crumbs(): MozBreadcrumb[] {
    return Array.from(this.querySelectorAll('moz-breadcrumb'));
  }

  willUpdate() {
    const crumbs = this.#crumbs;
    crumbs.forEach((crumb, i) => {
      crumb.slot = `crumb-${i}`;
      crumb.current = i === crumbs.length - 1;
    });
  }

  render() {
    const crumbs = this.#crumbs;
    return html`
      <nav aria-label=${this.label}>
        <ol role="list">
          ${crumbs.map(
            (_, i) => html`<li>
              <slot name="crumb-${i}"></slot>
              ${
                i < crumbs.length - 1
                  ? html`<moz-icon
                      class="separator"
                      name="chevron-right"
                      aria-hidden="true"
                    ></moz-icon>`
                  : nothing
              }
            </li>`,
          )}
        </ol>
      </nav>
    `;
  }
}

if (!customElements.get('moz-breadcrumb')) {
  customElements.define('moz-breadcrumb', MozBreadcrumb);
}
if (!customElements.get('moz-breadcrumb-group')) {
  customElements.define('moz-breadcrumb-group', MozBreadcrumbGroup);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-breadcrumb': MozBreadcrumb;
    'moz-breadcrumb-group': MozBreadcrumbGroup;
  }
}
