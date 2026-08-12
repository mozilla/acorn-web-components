import { consume } from '@lit/context';
import { LitElement, type PropertyValues } from 'lit';
import { type Contrast, contrastContext } from '../context/contrast-context';
import { localeContext } from '../context/locale-context';
import { type Theme, themeContext } from '../context/theme-context';

/**
 * Shared base for Acorn components (named after Firefox's own `MozLitElement`).
 * Consumes ambient theme, locale, and contrast from `<moz-provider>`. Styling
 * flows through CSS custom properties; context is for ambient state only.
 *
 * High-contrast is reflected to a `data-contrast` host attribute so a
 * component's own `:host([data-contrast='high'])` token overrides win over its
 * base `:host` tokens (an ancestor attribute can't, since a component's own
 * declaration beats an inherited custom property).
 */
export class MozLitElement extends LitElement {
  @consume({ context: themeContext, subscribe: true })
  protected theme?: Theme;

  @consume({ context: localeContext, subscribe: true })
  protected locale?: string;

  @consume({ context: contrastContext, subscribe: true })
  protected contrast?: Contrast;

  protected updated(_changed: PropertyValues<this>): void {
    if (this.contrast === 'high') {
      this.setAttribute('data-contrast', 'high');
    } else {
      this.removeAttribute('data-contrast');
    }
  }
}
