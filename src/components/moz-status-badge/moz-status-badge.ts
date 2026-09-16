import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import badgeTokens from '../../generated/component-tokens/badge.css';
import buttonTokens from '../../generated/component-tokens/button.css';
import '../moz-icon/moz-icon';
import type { IconName } from '../../generated/icons';
import styles from './moz-status-badge.css';

export type StatusBadgeType =
  | 'default'
  | 'ghost'
  | 'success'
  | 'warning'
  | 'critical'
  | 'information';

/**
 * Small status pill: like `moz-badge` but xsmall, normal-cased, and 22px tall,
 * with status color types. Colors come from the global status tokens
 * (`--background-color-success`, `--icon-color-success`, and so on). The label
 * goes in the default slot; `icon-start` renders a leading moz-icon. Purely
 * presentational.
 *
 * @slot - the badge label.
 * @csspart badge - the pill container.
 */
export class MozStatusBadge extends MozLitElement {
  static styles = [shared, badgeTokens, buttonTokens, styles];

  /** Status type, selecting the color set. */
  @property({ reflect: true }) type: StatusBadgeType = 'default';

  /** Icon rendered before the label. */
  @property({ attribute: 'icon-start' }) iconStart?: IconName;

  render() {
    return html`
      <span class="badge" part="badge">
        ${
          this.iconStart
            ? html`<moz-icon class="icon" name=${this.iconStart}></moz-icon>`
            : nothing
        }
        <span class="label"><slot></slot></span>
      </span>
    `;
  }
}

if (!customElements.get('moz-status-badge')) {
  customElements.define('moz-status-badge', MozStatusBadge);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-status-badge': MozStatusBadge;
  }
}
