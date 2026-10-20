import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import buttonTokens from '../../generated/component-tokens/button.css';
import panelMenuitemTokens from '../../generated/component-tokens/panel-menuitem.css';
import toolbarbuttonTokens from '../../generated/component-tokens/toolbarbutton.css';
import type { IconName } from '../../generated/icons';
import type { BadgeType } from '../moz-badge/moz-badge';
import '../moz-badge/moz-badge';
import '../moz-checkbox-visual/moz-checkbox-visual';
import '../moz-icon/moz-icon';
import styles from './moz-panel-item.css';

/** The slice of `<moz-panel-list>` a submenu row drives, kept structural so the
 * row and the list don't import each other. */
interface SubmenuList extends HTMLElement {
  open: boolean;
  show(triggeringEvent?: Event, target?: HTMLElement): void;
  hide(): void;
}

/** Semantic category of a row, mapping to its ARIA role. */
export type PanelItemType = 'button' | 'checkbox';

/** Row height and leading-icon step, from Figma's MenuItem `Size` variants. */
export type PanelItemSize = 'default' | 'large';

const isRtl = (el: Element) => getComputedStyle(el).direction === 'rtl';

/**
 * One row of a `<moz-panel-list>`: a button, or a link when `href` is set. The
 * label goes in the default slot, with an optional `description` beneath it and
 * a `hint` (a shortcut, a status) trailing it.
 *
 * `icon-end` adds a trailing icon inside the row, activating with the row. Give
 * it an `icon-end-label` as well and it becomes a control of its own beside the
 * row — Firefox's combined-buttons shape, where the row's highlight stops at the
 * action's hit area — firing `moz-panel-item:action` rather than the row's click.
 *
 * `type="checkbox"` makes the row a `menuitemcheckbox` with a real checkbox in
 * the gutter, and it toggles itself. That diverges from Firefox's `panel-item`,
 * which draws a bare checkmark and leaves `checked` to the consumer.
 *
 * Give it `submenu` and slot a nested `<moz-panel-list slot="submenu">` to make
 * it open a submenu on hover, or on Right (Left in RTL).
 *
 * @slot - the row's label.
 * @slot submenu - a nested `<moz-panel-list>`, when `submenu` is set.
 * @csspart button - the `<button>` (or `<a>` in link mode).
 * @csspart gutter - the leading icon/checkbox column.
 * @csspart label - the label text.
 * @csspart description - the secondary line.
 * @csspart hint - the trailing hint text.
 * @csspart icon-end - the trailing icon, when one is shown.
 * @csspart action - the trailing action button, when `icon-end-label` is set.
 * @fires moz-panel-item:action - the trailing action button was pressed.
 */
export class MozPanelItem extends MozLitElement {
  static styles = [
    shared,
    buttonTokens,
    panelMenuitemTokens,
    toolbarbuttonTokens,
    styles,
  ];

  /** Semantic category; `checkbox` makes the row a `menuitemcheckbox`. */
  @property({ reflect: true }) type: PanelItemType = 'button';

  /** Row height and leading-icon size. */
  @property({ reflect: true }) size: PanelItemSize = 'default';

  /** Whether a `checkbox` row is checked. Toggled by activating the row. */
  @property({ type: Boolean, reflect: true }) checked = false;

  /** Whether the row can be chosen. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Icon rendered before the label. */
  @property({ attribute: 'icon-start' }) iconStart?: IconName;

  /** Icon rendered after the label, inside the row. */
  @property({ attribute: 'icon-end' }) iconEnd?: IconName;

  /**
   * Accessible name for `icon-end`, which makes it a control of its own beside
   * the row instead of part of it; pass a localized string.
   */
  @property({ attribute: 'icon-end-label' }) iconEndLabel?: string;

  /** Secondary line under the label. */
  @property() description?: string;

  /** Trailing text — a keyboard shortcut, or a short status. */
  @property() hint?: string;

  /** Whether to mark the row with an accent dot. */
  @property({ type: Boolean, reflect: true }) badged = false;

  /** Label for a `<moz-badge>` rendered after the row's label. */
  @property() badge?: string;

  /** Visual type of that badge. */
  @property({ attribute: 'badge-type' }) badgeType: BadgeType = 'default';

  /** Whether the row owns the `<moz-panel-list>` in its `submenu` slot. */
  @property({ type: Boolean, reflect: true }) submenu = false;

  /** If set, render as a link (`<a href>`) styled as a row. */
  @property() href?: string;

  /** Link target (link mode only), e.g. `_blank`. */
  @property() target?: string;

  /** Whether the list is reserving gutter space on every row. Managed by `<moz-panel-list>`. */
  @state() gutter = false;

  /**
   * Whether the list is a menu, so the row is a `menuitem`. Managed by
   * `<moz-panel-list>`.
   */
  @state() menu = true;

  /** Whether `icon-end` is a control of its own rather than part of the row. */
  get #hasAction(): boolean {
    return !!this.iconEnd && !!this.iconEndLabel && !this.submenu;
  }

  /** Whether this row has anything of its own to put in the gutter. */
  get needsGutter(): boolean {
    return !!this.iconStart || this.type === 'checkbox' || this.badged;
  }

  /** Whether this row's submenu is open. */
  get submenuOpen(): boolean {
    return !!this.#submenuList?.open;
  }

  get #submenuList(): SubmenuList | null {
    const slot = this.renderRoot?.querySelector<HTMLSlotElement>(
      'slot[name="submenu"]',
    );
    const found = slot
      ?.assignedElements({ flatten: true })
      .find((el) => el.localName === 'moz-panel-list');
    return (found as SubmenuList | undefined) ?? null;
  }

  get #control(): HTMLElement | null {
    return this.renderRoot?.querySelector('.item') ?? null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('pointerenter', this.#onPointerEnter);
    // The submenu's own state drives this row's aria-expanded.
    this.addEventListener('moz-panel-list:shown', this.#onSubmenuToggle);
    this.addEventListener('moz-panel-list:hidden', this.#onSubmenuToggle);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('pointerenter', this.#onPointerEnter);
    this.removeEventListener('moz-panel-list:shown', this.#onSubmenuToggle);
    this.removeEventListener('moz-panel-list:hidden', this.#onSubmenuToggle);
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    // A listener on the row gives the host a node of its own in the a11y tree,
    // which would break the menu's ownership of the button inside it (Firefox
    // bug 995064) — so the host stands aside and the shadow controls are the
    // menuitems. With a trailing action there are two of them, and a menu may
    // own a `group`, so that is what holds the pair.
    this.setAttribute('role', this.menu && this.#hasAction ? 'group' : 'none');
  }

  /** Focus the row. */
  focus(options?: FocusOptions) {
    this.#control?.focus(options);
  }

  /** Activate the row. */
  click() {
    this.#control?.click();
  }

  /** Close this row's submenu, if it has one open. */
  closeSubmenu() {
    this.#submenuList?.hide();
  }

  #onSubmenuToggle = () => this.requestUpdate();

  #openSubmenu(event: Event) {
    const submenu = this.#submenuList;
    if (!submenu || submenu.open) return;
    submenu.show(event, this);
  }

  #onPointerEnter = (event: PointerEvent) => {
    for (const sibling of this.parentElement?.children ?? []) {
      if (sibling !== this && sibling instanceof MozPanelItem) {
        sibling.closeSubmenu();
      }
    }
    if (this.submenu && !this.disabled) this.#openSubmenu(event);
  };

  #onClick = (event: MouseEvent) => {
    if (this.submenu) {
      // A submenu row is a disclosure, so its activation must not also travel
      // on as a choice the consumer acts on.
      event.preventDefault();
      this.#openSubmenu(event);
      return;
    }
    // Updated before the event reaches the list, so a listener there already
    // sees the new state.
    if (this.type === 'checkbox') this.checked = !this.checked;
  };

  #onAction = (event: Event) => {
    // The action is its own choice, not the row's.
    event.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('moz-panel-item:action', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  #onKeydown = (event: KeyboardEvent) => {
    if (!this.submenu) return;
    const rtl = isRtl(this);
    const openKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const closeKey = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === openKey) {
      event.preventDefault();
      event.stopPropagation();
      this.#openSubmenu(event);
    } else if (event.key === closeKey && this.submenuOpen) {
      event.preventDefault();
      event.stopPropagation();
      this.closeSubmenu();
    }
  };

  #gutterTemplate() {
    if (this.type === 'checkbox') {
      return html`<span class="gutter" part="gutter">
        <moz-checkbox-visual ?checked=${this.checked}></moz-checkbox-visual>
      </span>`;
    }
    return html`<span class="gutter" part="gutter">
      ${
        this.iconStart
          ? html`<moz-icon
            name=${this.iconStart}
            size=${this.size === 'large' ? 'large' : 'small'}
          ></moz-icon>`
          : nothing
      }
      ${this.badged ? html`<span class="badged"></span>` : nothing}
    </span>`;
  }

  #contentTemplate() {
    // A submenu's chevron is the affordance for the submenu, so it wins over a
    // trailing icon the consumer set for another reason.
    const iconEnd = this.submenu
      ? isRtl(this)
        ? 'chevron-left'
        : 'chevron-right'
      : this.#hasAction
        ? undefined
        : this.iconEnd;
    return html`
      ${this.gutter ? this.#gutterTemplate() : nothing}
      <span class="labels">
        <span class="label" part="label"><slot></slot></span>
        ${
          this.description
            ? html`<span class="description" part="description"
              >${this.description}</span
            >`
            : nothing
        }
      </span>
      ${
        this.badge
          ? html`<moz-badge class="badge" type=${this.badgeType}
            >${this.badge}</moz-badge
          >`
          : nothing
      }
      ${this.hint ? html`<span class="hint" part="hint">${this.hint}</span>` : nothing}
      ${
        iconEnd
          ? html`<moz-icon
            class="icon-end"
            part="icon-end"
            name=${iconEnd}
          ></moz-icon>`
          : nothing
      }
    `;
  }

  render() {
    const role = this.type === 'checkbox' ? 'menuitemcheckbox' : 'menuitem';
    const control =
      this.href && !this.disabled
        ? html`<a
            class="item"
            part="button"
            role=${ifDefined(this.menu ? role : undefined)}
            href=${this.href}
            target=${ifDefined(this.target)}
            rel=${ifDefined(this.target === '_blank' ? 'noopener' : undefined)}
            aria-checked=${ifDefined(this.type === 'checkbox' ? String(this.checked) : undefined)}
            aria-haspopup=${ifDefined(this.submenu ? 'menu' : undefined)}
            aria-expanded=${ifDefined(this.submenu ? String(this.submenuOpen) : undefined)}
            @click=${this.#onClick}
            @keydown=${this.#onKeydown}
            >${this.#contentTemplate()}</a
          >`
        : html`<button
            class="item"
            part="button"
            type="button"
            role=${ifDefined(this.menu ? role : undefined)}
            ?disabled=${this.disabled}
            aria-checked=${ifDefined(this.type === 'checkbox' ? String(this.checked) : undefined)}
            aria-haspopup=${ifDefined(this.submenu ? 'menu' : undefined)}
            aria-expanded=${ifDefined(this.submenu ? String(this.submenuOpen) : undefined)}
            @click=${this.#onClick}
            @keydown=${this.#onKeydown}
          >
            ${this.#contentTemplate()}
          </button>`;

    return html`${control}
      ${
        this.#hasAction
          ? html`<button
            class="action"
            part="action"
            type="button"
            role=${ifDefined(this.menu ? 'menuitem' : undefined)}
            ?disabled=${this.disabled}
            @click=${this.#onAction}
          >
            <moz-icon name=${this.iconEnd as IconName}></moz-icon>
            <span class="visually-hidden">${this.iconEndLabel}</span>
          </button>`
          : nothing
      }
      <slot name="submenu"></slot>`;
  }
}

/**
 * A `<moz-panel-list>` row that isn't itself a choice: a label plus controls,
 * like the app menu's zoom row. Ported from Firefox, which builds that row as a
 * `toolbaritem` carrying the same `.subviewbutton` styling as a real menu row,
 * with the interactive parts as children — so activating one doesn't dismiss
 * the panel.
 *
 * Belongs in a `<moz-panel-list type="slot">`: arbitrary controls aren't valid
 * children of a menu, whose own may only be rows and separators.
 *
 * @slot - the row's label.
 * @slot actions - the row's controls, inside the row box.
 * @csspart row - the row box.
 * @csspart label - the label text.
 */
export class MozPanelRow extends MozLitElement {
  static styles = [shared, buttonTokens, panelMenuitemTokens, styles];

  /** Row height and leading-icon size. */
  @property({ reflect: true }) size: PanelItemSize = 'default';

  /** Icon rendered before the label. */
  @property({ attribute: 'icon-start' }) iconStart?: IconName;

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'none');
  }

  render() {
    return html`<div class="item" part="row">
      ${
        this.iconStart
          ? html`<span class="gutter" part="gutter"
            ><moz-icon
              name=${this.iconStart}
              size=${this.size === 'large' ? 'large' : 'small'}
            ></moz-icon
          ></span>`
          : nothing
      }
      <span class="labels"
        ><span class="label" part="label"><slot></slot></span
      ></span>
      <span class="actions"><slot name="actions"></slot></span>
    </div>`;
  }
}

if (!customElements.get('moz-panel-item')) {
  customElements.define('moz-panel-item', MozPanelItem);
}
if (!customElements.get('moz-panel-row')) {
  customElements.define('moz-panel-row', MozPanelRow);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-panel-item': MozPanelItem;
    'moz-panel-row': MozPanelRow;
  }
}
