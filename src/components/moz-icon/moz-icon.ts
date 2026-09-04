import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import type { IconColor, IconSize } from '../../generated/icon-options';
import { type IconName, iconLoaders } from '../../generated/icons';
import styles from './moz-icon.css';

const cache = new Map<string, string>();

type IconLoader = () => Promise<{ default: string }>;

// Nominal pixel size for each t-shirt step (the default `--icon-size-*` scale),
// used only to pick the closest optically-tuned SVG. The rendered box size still
// comes from the tokens, so a themed override resizes without reselecting.
const NOMINAL_PX: Record<IconSize, number> = {
  xsmall: 12,
  small: 16,
  medium: 20,
  large: 24,
  xlarge: 32,
  xxlarge: 48,
};

// Icons exist at only a subset of sizes; on a tie prefer the larger, since scaling down stays crisp.
function pickOpticalSize(available: number[], target: number): number {
  let best = available[0];
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const size of available) {
    const diff = Math.abs(size - target);
    if (diff < bestDiff || (diff === bestDiff && size > best)) {
      best = size;
      bestDiff = diff;
    }
  }
  return best;
}

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

  /** Color, from the Nova `--icon-color[-*]` tokens. Defaults to `--icon-color`. */
  @property({ type: String }) color?: IconColor;

  /** Accessible label. When omitted, the icon is treated as decorative. */
  @property({ type: String }) label?: string;

  @state() private svg?: string;

  protected willUpdate(changed: PropertyValues<this>) {
    // Size selects the optical variant, so reload when either changes.
    if (changed.has('name') || changed.has('size')) {
      void this.load();
    }
  }

  private async load() {
    const { name, size } = this;
    if (!name) {
      this.svg = undefined;
      return;
    }
    const loaders = iconLoaders[name] as Record<number, IconLoader> | undefined;
    if (!loaders) {
      console.warn(
        `<moz-icon>: unknown icon name "${name}". It will render nothing; see the exported \`iconNames\` for valid values.`,
      );
      this.svg = undefined;
      return;
    }
    const target = size ? NOMINAL_PX[size] : NOMINAL_PX.small;
    const optical = pickOpticalSize(Object.keys(loaders).map(Number), target);
    const key = `${name}-${optical}`;
    const cached = cache.get(key);
    if (cached) {
      this.svg = cached;
      return;
    }
    try {
      const mod = await loaders[optical]();
      cache.set(key, mod.default);
      // Ignore if name/size changed while the chunk was in flight.
      if (this.name === name && this.size === size) this.svg = mod.default;
    } catch {
      this.svg = undefined;
    }
  }

  protected updated(changed: PropertyValues<this>) {
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
