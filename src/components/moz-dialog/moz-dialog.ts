import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { iconButton } from '../../base/icon-button';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import { slotHasContent } from '../../base/slots';
import '../moz-button/moz-button';
import '../moz-icon/moz-icon';
import type { IconName } from '../../generated/icons';
import styles from './moz-dialog.css';

export type DialogVariant = 'inline' | 'modal';

/**
 * Nova dialog built on the native `<dialog>` element. Two variants via `variant`:
 * `modal` (default) overlays the page with a dimmed, blurred `::backdrop`, traps
 * focus and closes on Escape (`showModal()`); `inline` renders in normal flow
 * with no backdrop (`show()`). Body goes in the default slot; `heading`
 * (attribute or slot) labels it, `icon-start` sits before the heading, and
 * `actions` holds footer buttons. `dismissable` adds a close button and, in
 * the modal variant, enables Escape / backdrop-click close. Mark any slotted control
 * with `data-dismiss` (e.g. a Cancel button) to close the dialog on click.
 *
 * Focus: opening a modal stores the active element, moves focus into the dialog,
 * and restores it on close.
 *
 * @slot - dialog body.
 * @slot heading - heading content (overrides the `heading` attribute).
 * @slot actions - footer buttons.
 * @csspart dialog - the dialog panel (the native `<dialog>`).
 * @fires moz-dialog:open - the dialog opened.
 * @fires moz-dialog:dismiss - cancelable; a close was requested (close button,
 *   Escape, backdrop click, or a `[data-dismiss]` control). If prevented, the
 *   dialog stays open.
 */
export class MozDialog extends MozLitElement {
  static styles = [shared, styles];

  /** Whether the dialog is open. Reflected for two-way binding. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** `modal` overlays with a backdrop; `inline` renders in normal flow. */
  @property({ reflect: true }) variant: DialogVariant = 'modal';

  /** Heading text; alternatively use the `heading` slot. */
  @property() heading?: string;

  /** Leading icon shown before the heading. */
  @property({ attribute: 'icon-start' }) iconStart?: IconName;

  /** Shows a close button and enables Escape / backdrop-click close in modal. */
  @property({ type: Boolean, reflect: true }) dismissable = false;

  /** Accessible name for the close button; pass a localized string. */
  @property({ attribute: 'dismiss-label' }) dismissLabel = 'Close';

  @state() private hasHeadingSlot = false;
  @state() private hasActions = false;

  // Element focused before a modal opened, restored on close.
  #previouslyFocused: HTMLElement | null = null;

  get #dialog(): HTMLDialogElement | null {
    return this.renderRoot?.querySelector('dialog') ?? null;
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (changed.has('open')) this.#syncOpen();
  }

  // Drive the native dialog from the `open` property.
  #syncOpen() {
    const dialog = this.#dialog;
    if (!dialog) return;
    if (this.open && !dialog.open) {
      if (this.variant === 'modal') {
        this.#previouslyFocused = document.activeElement as HTMLElement | null;
        dialog.showModal();
        this.#focusInitial();
      } else {
        dialog.show();
      }
      this.dispatchEvent(
        new CustomEvent('moz-dialog:open', { bubbles: true, composed: true }),
      );
    } else if (!this.open && dialog.open) {
      dialog.close();
    }
  }

  // Move focus into the modal: honor a slotted [autofocus], else the dialog.
  #focusInitial() {
    const dialog = this.#dialog;
    if (!dialog) return;
    const autofocusEl = this.querySelector<HTMLElement>('[autofocus]');
    (autofocusEl ?? dialog).focus();
  }

  // Escape (modal only): take over from the native close so we can honor
  // `dismissable` and a prevented close event.
  #onCancel(event: Event) {
    event.preventDefault();
    if (this.dismissable) this.#requestClose();
  }

  #onClick(event: MouseEvent) {
    // A slotted control marked [data-dismiss] (e.g. a Cancel button) requests a
    // close, regardless of variant or `dismissable`.
    const closer = event
      .composedPath()
      .find(
        (n): n is HTMLElement =>
          n instanceof HTMLElement && n.hasAttribute('data-dismiss'),
      );
    if (closer) {
      this.#requestClose();
      return;
    }
    // Backdrop click: the event target is the dialog itself (content sits in a
    // child wrapper), so only true backdrop clicks reach here.
    if (this.variant !== 'modal' || !this.dismissable) return;
    if (event.target === this.#dialog) this.#requestClose();
  }

  // Native dialog closed: reflect state and restore focus.
  #onClose() {
    if (this.open) this.open = false;
    const previous = this.#previouslyFocused;
    this.#previouslyFocused = null;
    previous?.focus();
  }

  // Dispatch a cancelable dismiss request; close unless a listener prevents it.
  #requestClose() {
    const event = new CustomEvent('moz-dialog:dismiss', {
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    this.dispatchEvent(event);
    if (!event.defaultPrevented) this.open = false;
  }

  #onHeadingSlotChange(event: Event) {
    this.hasHeadingSlot = slotHasContent(event.target as HTMLSlotElement);
  }

  #onActionsSlotChange(event: Event) {
    this.hasActions = slotHasContent(event.target as HTMLSlotElement);
  }

  render() {
    const hasHeading = !!this.heading || this.hasHeadingSlot;
    const showHeader = hasHeading || this.dismissable || !!this.iconStart;
    return html`
      <dialog
        part="dialog"
        tabindex="-1"
        aria-labelledby=${ifDefined(hasHeading ? 'heading' : undefined)}
        @cancel=${this.#onCancel}
        @close=${this.#onClose}
        @click=${this.#onClick}
      >
        <div class="content">
          <header class="header" ?hidden=${!showHeader}>
            ${
              this.iconStart
                ? html`<moz-icon name=${this.iconStart} size="medium"></moz-icon>`
                : nothing
            }
            <h2 id="heading" class="heading">
              <slot name="heading" @slotchange=${this.#onHeadingSlotChange}
                >${this.heading ?? nothing}</slot
              >
            </h2>
            ${
              this.dismissable
                ? iconButton({
                    icon: 'close',
                    label: this.dismissLabel,
                    onClick: () => this.#requestClose(),
                    class: 'close',
                  })
                : nothing
            }
          </header>
          <div class="body"><slot></slot></div>
          <footer class="actions" ?hidden=${!this.hasActions}>
            <slot name="actions" @slotchange=${this.#onActionsSlotChange}></slot>
          </footer>
        </div>
      </dialog>
    `;
  }
}

if (!customElements.get('moz-dialog')) {
  customElements.define('moz-dialog', MozDialog);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-dialog': MozDialog;
  }
}
