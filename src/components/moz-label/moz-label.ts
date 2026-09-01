import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { labelContent } from '../../base/label-content';
import labelContentCss from '../../base/label-content.css';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import { slotHasContent } from '../../base/slots';
import type { IconName } from '../../generated/icons';
import styles from './moz-label.css';

/**
 * Standalone label for a form control that has no built-in label of its own.
 * Slot the control as a child; clicking the label text activates it. Native
 * `for=` can't cross the shadow boundary, so association is by slotting the
 * control here rather than by id.
 *
 * Shares its label appearance (icon, text, required marker) with the built-in
 * labels on `moz-input-text` and friends via the `labelContent` helper.
 *
 * @slot - the labelled control.
 * @slot description - rich helper text, as an alternative to the attribute.
 * @csspart label - the `<label>` element.
 * @csspart label-content - the icon + text + required marker.
 * @csspart description - the helper-text region.
 */
export class MozLabel extends MozLitElement {
  static styles = [shared, labelContentCss, styles];

  /** Label text. */
  @property() label?: string;

  /** Optional leading icon, shown before the text. */
  @property({ attribute: 'label-icon' }) labelIcon?: IconName;

  /** Show a required indicator after the text. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Dim the label (and suppress click-to-activate); set the control disabled too. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Helper text below the label (or use the `description` slot). */
  @property() description?: string;

  #slottedDescription = false;

  #activate = (event: MouseEvent) => {
    const control = this.#control;
    // Skip when disabled, or when the click already reached the control (so it
    // activates once).
    if (this.disabled || !control || event.composedPath().includes(control)) {
      return;
    }
    control.focus?.();
    control.click?.();
  };

  get #control(): HTMLElement | null {
    const slot =
      this.renderRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    return (
      (slot?.assignedElements({ flatten: true })[0] as HTMLElement) ?? null
    );
  }

  #onDescriptionSlotChange = (event: Event) => {
    this.#slottedDescription = slotHasContent(event.target as HTMLSlotElement);
    this.requestUpdate();
  };

  render() {
    return html`<label part="label" @click=${this.#activate}>
        ${labelContent({
          label: this.label,
          icon: this.labelIcon,
          required: this.required,
        })}
        <slot></slot>
      </label>
      <div
        part="description"
        class="description"
        ?hidden=${!(this.description || this.#slottedDescription)}
      >
        ${
          this.description ??
          html`<slot
          name="description"
          @slotchange=${this.#onDescriptionSlotChange}
        ></slot>`
        }
      </div>`;
  }
}

if (!customElements.get('moz-label')) {
  customElements.define('moz-label', MozLabel);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-label': MozLabel;
  }
}
