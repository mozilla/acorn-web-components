import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { MozLitElement } from '../../base/moz-lit-element';
import {
  type IllustrationName,
  illustrationLoaders,
} from '../../generated/illustrations';
import styles from './moz-illustration.css';

const cache = new Map<string, string>();

type Loader = () => Promise<{ default: string }>;
type Variants = Partial<Record<'light' | 'dark' | 'default', Loader>>;

const prefersDark = () =>
  typeof matchMedia === 'function' &&
  matchMedia('(prefers-color-scheme: dark)').matches;

/**
 * Renders a Firefox illustration (a `kit` building block or a `pictogram`) by
 * name. Full-colour artwork that renders at its intrinsic size and scales down
 * to its container; decorative by default, pass `label` to expose it to
 * assistive tech. Illustrations with light/dark variants follow the ambient
 * `<moz-provider>` theme (or the OS preference when unset). Each illustration is
 * a separate module loaded on demand, so a consumer only bundles what it renders.
 *
 * Illustrations are vendored from [FirefoxUX/acorn-icons](https://github.com/FirefoxUX/acorn-icons).
 */
export class MozIllustration extends MozLitElement {
  static styles = styles;

  /** Name of the illustration to render. */
  @property({ type: String }) name?: IllustrationName;

  /** Accessible label. When omitted, the illustration is treated as decorative. */
  @property({ type: String }) label?: string;

  @state() private svg?: string;

  #media?: MediaQueryList;
  #onMediaChange = () => {
    // Only auto-following illustrations care about the OS preference.
    if (!this.theme || this.theme === 'auto') void this.load();
  };

  connectedCallback(): void {
    super.connectedCallback();
    if (typeof matchMedia === 'function') {
      this.#media = matchMedia('(prefers-color-scheme: dark)');
      this.#media.addEventListener('change', this.#onMediaChange);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#media?.removeEventListener('change', this.#onMediaChange);
  }

  protected willUpdate(changed: PropertyValues<this>) {
    // `theme` (inherited from MozLitElement) is the ambient context that selects
    // the variant, so reload when either changes.
    const changedKeys = changed as Map<PropertyKey, unknown>;
    if (changedKeys.has('name') || changedKeys.has('theme')) {
      void this.load();
    }
  }

  private async load() {
    const { name } = this;
    if (!name) {
      this.svg = undefined;
      return;
    }
    const variants = illustrationLoaders[name] as Variants | undefined;
    if (!variants) {
      console.warn(
        `<moz-illustration>: unknown illustration name "${name}". It will render nothing; see the exported \`illustrationNames\` for valid values.`,
      );
      this.svg = undefined;
      return;
    }
    const resolved =
      (this.theme && this.theme !== 'auto' ? this.theme : undefined) ??
      (prefersDark() ? 'dark' : 'light');
    const loader =
      variants.default ?? variants[resolved] ?? variants.light ?? variants.dark;
    if (!loader) {
      this.svg = undefined;
      return;
    }
    const key = `${name}:${variants.default ? 'default' : resolved}`;
    const cached = cache.get(key);
    if (cached) {
      this.svg = cached;
      return;
    }
    const theme = this.theme;
    try {
      const mod = await loader();
      cache.set(key, mod.default);
      // Ignore if name/theme changed while the chunk was in flight.
      if (this.name === name && this.theme === theme) this.svg = mod.default;
    } catch {
      this.svg = undefined;
    }
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (this.label) {
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', this.label);
      this.removeAttribute('aria-hidden');
    } else {
      this.setAttribute('aria-hidden', 'true');
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
    }
  }

  render() {
    return this.svg ? html`${unsafeSVG(this.svg)}` : nothing;
  }
}

if (!customElements.get('moz-illustration')) {
  customElements.define('moz-illustration', MozIllustration);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-illustration': MozIllustration;
  }
}
