import { provide } from '@lit/context';
import { html, LitElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import {
  type Contrast,
  contrastContext,
} from '../../context/contrast-context.js';
import { localeContext } from '../../context/locale-context.js';
import { type Theme, themeContext } from '../../context/theme-context.js';
import styles from './moz-provider.css';

/**
 * Provides ambient state (theme, locale, contrast) to descendant Acorn
 * components via `@lit/context`, sets `color-scheme` so the token layer's
 * `light-dark()` values resolve, and toggles `data-contrast` for high contrast.
 * Wrap an app or a subtree in it.
 */
export class MozProvider extends LitElement {
  static styles = styles;

  @provide({ context: themeContext })
  @property({ type: String, reflect: true })
  theme: Theme = 'auto';

  @provide({ context: localeContext })
  @property({ type: String })
  locale = 'en-US';

  /**
   * App-driven high-contrast. `high` activates the higher-contrast token
   * overrides via `[data-contrast='high']`, independent of the OS media queries.
   */
  @provide({ context: contrastContext })
  @property({ type: String })
  contrast: Contrast = 'auto';

  protected updated(changed: PropertyValues<this>) {
    if (changed.has('theme')) {
      this.style.colorScheme =
        this.theme === 'auto' ? 'light dark' : this.theme;
    }
    if (changed.has('contrast')) {
      // Not a reflected attribute: the public API stays `contrast`, but the
      // token layer keys off `[data-contrast='high']`.
      if (this.contrast === 'high') {
        this.setAttribute('data-contrast', 'high');
      } else {
        this.removeAttribute('data-contrast');
      }
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('moz-provider')) {
  customElements.define('moz-provider', MozProvider);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-provider': MozProvider;
  }
}
