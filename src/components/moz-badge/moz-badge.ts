import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import badgeTokens from '../../generated/component-tokens/badge.css';
import '../moz-icon/moz-icon';
import type { IconName } from '../../generated/icons';
import styles from './moz-badge.css';

export type BadgeType = 'default' | 'beta' | 'new';

/**
 * Nova badge: a small inline status/label chip. Appearance is driven by the
 * scoped `--badge-*` tokens, selected by the `type` attribute (`new` is the
 * filled/accent variant; `default` and `beta` are outlined). The label goes in
 * the default slot; `icon-start` renders a leading moz-icon. Purely presentational.
 *
 * @slot - the badge label.
 */
export class MozBadge extends MozLitElement {
  static styles = [shared, badgeTokens, styles];

  /** Visual type, selecting a `--badge-*` token set. */
  @property({ reflect: true }) type: BadgeType = 'default';

  /** Icon rendered before the label. */
  @property({ attribute: 'icon-start' }) iconStart?: IconName;

  render() {
    return html`
      <span class="badge">
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

if (!customElements.get('moz-badge')) {
  customElements.define('moz-badge', MozBadge);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-badge': MozBadge;
  }
}
