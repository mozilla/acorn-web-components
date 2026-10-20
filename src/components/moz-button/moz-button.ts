import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import buttonTokens from '../../generated/component-tokens/button.css';
import '../moz-icon/moz-icon';
import type { IconName } from '../../generated/icons';
import styles from './moz-button.css';

export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'destructive'
  | 'ghost'
  | 'muted';
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * The slice of `<moz-panel-list>` a trigger needs. Structural rather than an
 * import, so that a button which opens no menu doesn't pull one into its
 * bundle — and so the list can keep depending on the button's tokens.
 */
interface MenuTarget extends HTMLElement {
  open: boolean;
  toggle(triggeringEvent?: Event, target?: HTMLElement): void;
}

/**
 * Nova button. Appearance is driven entirely by the scoped `--button-*` tokens
 * (added via `buttonTokens`), selected by the `variant` and `size` attributes.
 * Label goes in the default slot; `icon-start` / `icon-end` render a moz-icon.
 *
 * Form-associated: with `type="submit"` or `type="reset"` it drives the
 * associated light-DOM form, even though the real `<button>` lives in the shadow
 * tree.
 *
 * With `href` set it renders a real `<a>` (styled identically) so it gets link
 * semantics — new-tab, context menu, screen-reader "link". A disabled button
 * with `href` stays a `<button>`, since a disabled link isn't a real state.
 *
 * `menu-id` makes it the trigger for a `<moz-panel-list>`: clicking toggles
 * that list anchored to this button, and the button carries the matching
 * `aria-haspopup` / `aria-expanded` on the real control in its shadow tree.
 *
 * @slot - button label.
 * @csspart button - the `<button>` (or `<a>` in link mode).
 */
export class MozButton extends MozLitElement {
  static styles = [shared, buttonTokens, styles];

  static shadowRootOptions = {
    ...super.shadowRootOptions,
    delegatesFocus: true,
  };

  static formAssociated = true;

  #internals = this.attachInternals();

  /** Visual variant, selecting a `--button-*` token set. */
  @property({ reflect: true }) variant: ButtonVariant = 'default';

  /** Size step. */
  @property({ reflect: true }) size: ButtonSize = 'medium';

  /** Whether the button is disabled. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /**
   * Whether to render as a compact icon-only square (`--button-size-icon`
   * scale), with the icon coming from `icon-start`. Give it a string
   * (`icon-only="Close"`) and that becomes the button's accessible name,
   * rendered visually hidden; as a bare boolean, supply the name yourself as
   * visually-hidden slotted text.
   */
  @property({
    reflect: true,
    attribute: 'icon-only',
    converter: {
      fromAttribute: (value: string | null) =>
        value === null ? false : value || true,
      toAttribute: (value: string | boolean) =>
        value === false ? null : value === true ? '' : value,
    },
  })
  iconOnly: string | boolean = false;

  /** Native button type. */
  @property() type: 'button' | 'submit' | 'reset' = 'button';

  /** Icon rendered before the label. */
  @property({ attribute: 'icon-start' }) iconStart?: IconName;

  /** Icon rendered after the label. */
  @property({ attribute: 'icon-end' }) iconEnd?: IconName;

  /** If set, render as a link (`<a href>`) styled as a button. */
  @property() href?: string;

  /** Link target (link mode only), e.g. `_blank`. */
  @property() target?: string;

  /** Link `rel` (link mode only); defaults to `noopener` when `target="_blank"`. */
  @property() rel?: string;

  /** `id` of a `<moz-panel-list>` this button opens as its menu. */
  @property({ attribute: 'menu-id' }) menuId?: string;

  @state() private menuOpen = false;

  #menu: MenuTarget | null = null;

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (changed.has('menuId')) this.#bindMenu();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#unbindMenu();
  }

  #bindMenu() {
    this.#unbindMenu();
    if (!this.menuId) return;
    const root = this.getRootNode() as Document | ShadowRoot;
    const menu = root.getElementById?.(this.menuId) as MenuTarget | null;
    if (!menu || typeof menu.toggle !== 'function') return;
    this.#menu = menu;
    menu.addEventListener('moz-panel-list:shown', this.#syncMenuOpen);
    menu.addEventListener('moz-panel-list:hidden', this.#syncMenuOpen);
    this.menuOpen = !!menu.open;
  }

  #unbindMenu() {
    this.#menu?.removeEventListener('moz-panel-list:shown', this.#syncMenuOpen);
    this.#menu?.removeEventListener(
      'moz-panel-list:hidden',
      this.#syncMenuOpen,
    );
    this.#menu = null;
    this.menuOpen = false;
  }

  #syncMenuOpen = () => {
    this.menuOpen = !!this.#menu?.open;
  };

  #handleClick() {
    if (this.disabled) return;
    if (this.menuId) {
      // The menu may have been rendered after this button bound to it.
      if (!this.#menu) this.#bindMenu();
      this.#menu?.toggle(undefined, this);
    }
    // The shadow-DOM <button> can't reach the light-DOM form, so forward it.
    if (this.type === 'submit') this.#internals.form?.requestSubmit();
    else if (this.type === 'reset') this.#internals.form?.reset();
  }

  #content() {
    const hiddenLabel = typeof this.iconOnly === 'string' ? this.iconOnly : '';
    return html`
      ${
        this.iconStart
          ? html`<moz-icon name=${this.iconStart}></moz-icon>`
          : nothing
      }
      ${
        hiddenLabel
          ? html`<span class="visually-hidden">${hiddenLabel}</span>`
          : nothing
      }
      <slot></slot>
      ${this.iconEnd ? html`<moz-icon name=${this.iconEnd}></moz-icon>` : nothing}
    `;
  }

  render() {
    // A disabled link isn't a real state, so keep the <button> for that case.
    if (this.href && !this.disabled) {
      const rel =
        this.rel ?? (this.target === '_blank' ? 'noopener' : undefined);
      return html`
        <a
          part="button"
          href=${this.href}
          target=${ifDefined(this.target)}
          rel=${ifDefined(rel)}
        >
          ${this.#content()}
        </a>
      `;
    }
    return html`
      <button
        part="button"
        type=${this.type}
        ?disabled=${this.disabled}
        aria-haspopup=${ifDefined(this.menuId ? 'menu' : undefined)}
        aria-expanded=${ifDefined(this.menuId ? String(this.menuOpen) : undefined)}
        @click=${this.#handleClick}
      >
        ${this.#content()}
      </button>
    `;
  }
}

if (!customElements.get('moz-button')) {
  customElements.define('moz-button', MozButton);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-button': MozButton;
  }
}
