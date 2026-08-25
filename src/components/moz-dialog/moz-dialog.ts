import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import '../moz-button/moz-button';
import styles from './moz-dialog.css';

export type DialogMode = 'inline' | 'modal';

/**
 * Nova dialog built on the native `<dialog>` element. Two modes via `mode`:
 * `modal` (default) overlays the page with a dimmed, blurred `::backdrop`, traps
 * focus and closes on Escape (`showModal()`); `inline` renders in normal flow
 * with no backdrop (`show()`). Body goes in the default slot; `heading`
 * (attribute or slot) labels it, an optional `icon` slot sits before the heading,
 * and `actions` holds footer buttons. `dismissable` adds a close button and, in
 * modal mode, enables Escape / backdrop-click close. Mark any slotted control
 * with `data-close` (e.g. a Cancel button) to close the dialog on click.
 *
 * Focus: opening a modal stores the active element, moves focus into the dialog,
 * and restores it on close.
 *
 * @slot - dialog body.
 * @slot heading - heading content (overrides the `heading` attribute).
 * @slot icon - an icon shown before the heading.
 * @slot actions - footer buttons.
 * @fires moz-dialog:open - the dialog opened.
 * @fires moz-dialog:close - cancelable; a close was requested (close button,
 *   Escape, backdrop click, or a `[data-close]` control). If prevented, the
 *   dialog stays open.
 */
export class MozDialog extends MozLitElement {
  static styles = [shared, styles];

  /** Whether the dialog is open. Reflected for two-way binding. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** `modal` overlays with a backdrop; `inline` renders in normal flow. */
  @property({ reflect: true }) mode: DialogMode = 'modal';

  /** Heading text; alternatively use the `heading` slot. */
  @property() heading?: string;

  /** Shows a close button and enables Escape / backdrop-click close in modal. */
  @property({ type: Boolean }) dismissable = false;

  /** Accessible name for the close button; pass a localized string. */
  @property({ attribute: 'dismiss-label' }) dismissLabel = 'Close';

  @state() private hasHeadingSlot = false;
  @state() private hasActions = false;
  @state() private hasIcon = false;

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
      if (this.mode === 'modal') {
        this.#previouslyFocused = document.activeElement as HTMLElement | null;
        dialog.showModal();
        this.#focusInitial();
      } else {
        dialog.show();
      }
      this.dispatchEvent(new CustomEvent('moz-dialog:open', { bubbles: true }));
    } else if (!this.open && dialog.open) {
      dialog.close();
    }
  }

  // Move focus into the modal: honour a slotted [autofocus], else the dialog.
  #focusInitial() {
    const dialog = this.#dialog;
    if (!dialog) return;
    const autofocusEl = this.querySelector<HTMLElement>('[autofocus]');
    (autofocusEl ?? dialog).focus();
  }

  // Escape (modal only): take over from the native close so we can honour
  // `dismissable` and a prevented close event.
  #onCancel(event: Event) {
    event.preventDefault();
    if (this.dismissable) this.#requestClose();
  }

  #onClick(event: MouseEvent) {
    // A slotted control marked [data-close] (e.g. a Cancel button) requests a
    // close, regardless of mode or `dismissable`.
    const closer = event
      .composedPath()
      .find(
        (n): n is HTMLElement =>
          n instanceof HTMLElement && n.hasAttribute('data-close'),
      );
    if (closer) {
      this.#requestClose();
      return;
    }
    // Backdrop click: the event target is the dialog itself (content sits in a
    // child wrapper), so only true backdrop clicks reach here.
    if (this.mode !== 'modal' || !this.dismissable) return;
    if (event.target === this.#dialog) this.#requestClose();
  }

  // Native dialog closed: reflect state and restore focus.
  #onClose() {
    if (this.open) this.open = false;
    const previous = this.#previouslyFocused;
    this.#previouslyFocused = null;
    previous?.focus();
  }

  // Dispatch a cancelable close request; close unless a listener prevents it.
  #requestClose() {
    const event = new CustomEvent('moz-dialog:close', {
      bubbles: true,
      cancelable: true,
    });
    this.dispatchEvent(event);
    if (!event.defaultPrevented) this.open = false;
  }

  #onHeadingSlotChange(event: Event) {
    const slot = event.target as HTMLSlotElement;
    this.hasHeadingSlot = slot
      .assignedNodes({ flatten: true })
      .some((n) => (n.textContent ?? '').trim() !== '');
  }

  #onActionsSlotChange(event: Event) {
    const slot = event.target as HTMLSlotElement;
    this.hasActions = slot.assignedElements().length > 0;
  }

  #onIconSlotChange(event: Event) {
    const slot = event.target as HTMLSlotElement;
    this.hasIcon = slot.assignedElements().length > 0;
  }

  render() {
    const hasHeading = !!this.heading || this.hasHeadingSlot;
    const showHeader = hasHeading || this.dismissable || this.hasIcon;
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
            <slot
              name="icon"
              ?hidden=${!this.hasIcon}
              @slotchange=${this.#onIconSlotChange}
            ></slot>
            <h2 id="heading" class="heading">
              <slot name="heading" @slotchange=${this.#onHeadingSlotChange}
                >${this.heading ?? nothing}</slot
              >
            </h2>
            ${
              this.dismissable
                ? html`<moz-button
                    class="close"
                    icon
                    variant="ghost"
                    icon-start="close"
                    @click=${this.#requestClose}
                    ><span class="visually-hidden"
                      >${this.dismissLabel}</span
                    ></moz-button
                  >`
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
