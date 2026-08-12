import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import type { IconColor, IconSize } from '../../generated/icon-options';
import { type IconName, iconLoaders } from '../../generated/icons';
import styles from './moz-icon.css';

// Cache each icon module so it's only imported once.
const cache = new Map<string, string>();

/**
 * Renders a Firefox (Nova) icon by name. Decorative by default; pass `label` to
 * expose it to assistive tech. Each icon is a separate module loaded on demand,
 * so a consumer only bundles the icons it actually renders.
 */
export class MozIcon extends LitElement {
  static styles = styles;

  /** Name of the icon to render. */
  @property({ type: String }) name?: IconName;

  /** Size step, from the Nova `--icon-size-*` scale. Defaults to `--icon-size`. */
  @property({ type: String }) size?: IconSize;

  /** Colour, from the Nova `--icon-color[-*]` tokens. Defaults to `--icon-color`. */
  @property({ type: String }) color?: IconColor;

  /** Accessible label. When omitted, the icon is treated as decorative. */
  @property({ type: String }) label?: string;

  @state() private svg?: string;

  protected willUpdate(changed: PropertyValues<this>) {
    if (changed.has('name')) {
      void this.load(this.name);
    }
  }

  private async load(name?: IconName) {
    if (!name) {
      this.svg = undefined;
      return;
    }
    const cached = cache.get(name);
    if (cached) {
      this.svg = cached;
      return;
    }
    const loader = iconLoaders[name];
    if (!loader) {
      console.warn(
        `<moz-icon>: unknown icon name "${name}". It will render nothing; see the exported \`iconNames\` for valid values.`,
      );
      this.svg = undefined;
      return;
    }
    try {
      const mod = await loader();
      cache.set(name, mod.default);
      if (this.name === name) this.svg = mod.default;
    } catch {
      this.svg = undefined;
    }
  }

  protected updated(changed: PropertyValues<this>) {
    // Decorative unless labelled.
    if (this.label) {
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', this.label);
      this.removeAttribute('aria-hidden');
    } else {
      this.setAttribute('aria-hidden', 'true');
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
    }

    if (changed.has('size')) {
      if (this.size) {
        this.style.setProperty('--_icon-size', `var(--icon-size-${this.size})`);
      } else {
        this.style.removeProperty('--_icon-size');
      }
    }
    if (changed.has('color')) {
      if (this.color) {
        const suffix = this.color === 'default' ? '' : `-${this.color}`;
        this.style.setProperty('--_icon-color', `var(--icon-color${suffix})`);
      } else {
        this.style.removeProperty('--_icon-color');
      }
    }
  }

  render() {
    return this.svg ? html`${unsafeSVG(this.svg)}` : nothing;
  }
}

if (!customElements.get('moz-icon')) {
  customElements.define('moz-icon', MozIcon);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-icon': MozIcon;
  }
}
