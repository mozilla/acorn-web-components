import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { MozBoxRow } from '../../base/box-row';
import boxRow from '../../base/box-row.css';
import shared from '../../base/shared.css';
import boxTokens from '../../generated/component-tokens/box.css';

/**
 * Nova box link: a full-width box row rendered as an `<a>`, for linking out of
 * the current page. Shows an optional `icon-start`, label, and description with
 * a trailing external-link icon. Opens in a new tab.
 */
export class MozBoxLink extends MozBoxRow {
  static styles = [shared, boxTokens, boxRow];

  // Forward focus to the inner <a> so the host is a single tab stop.
  static shadowRootOptions = {
    ...super.shadowRootOptions,
    delegatesFocus: true,
  };

  /** Destination URL. */
  @property() href = '';

  render() {
    return html`
      <a
        class="button"
        href=${this.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        ${this.renderText()}
        <moz-icon class="nav-icon" name="external-link"></moz-icon>
      </a>
    `;
  }
}

if (!customElements.get('moz-box-link')) {
  customElements.define('moz-box-link', MozBoxLink);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-box-link': MozBoxLink;
  }
}
