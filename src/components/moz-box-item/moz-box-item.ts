import { html } from 'lit';
import { state } from 'lit/decorators.js';
import { MozBoxRow } from '../../base/box-row';
import boxRow from '../../base/box-row.css';
import shared from '../../base/shared.css';
import { slotHasContent } from '../../base/slots';
import boxTokens from '../../generated/component-tokens/box.css';
import styles from './moz-box-item.css';

/**
 * Nova box item: a content row, standalone or inside a moz-box-group. Shows an
 * optional leading icon, label, and description, with `actions-start` and
 * `actions-end` slots at either end. The default slot replaces the text content
 * for fully custom rows. Presentational — use moz-box-button/-link for actions.
 *
 * @slot - custom row content, shown in place of the label/description text.
 * @slot actions-start - controls shown before the content (e.g. a button).
 * @slot actions-end - controls shown after the content (e.g. a button).
 */
export class MozBoxItem extends MozBoxRow {
  static styles = [shared, boxTokens, boxRow, styles];

  @state() private hasActionsStart = false;
  @state() private hasActionsEnd = false;

  #onActionsStart(event: Event) {
    this.hasActionsStart = slotHasContent(event.target as HTMLSlotElement);
  }

  #onActionsEnd(event: Event) {
    this.hasActionsEnd = slotHasContent(event.target as HTMLSlotElement);
  }

  render() {
    return html`
      <div class="box-container">
        <span class="actions" ?hidden=${!this.hasActionsStart}>
          <slot name="actions-start" @slotchange=${this.#onActionsStart}></slot>
        </span>
        <div class="box-content">
          ${this.label ? this.renderText() : html`<slot></slot>`}
        </div>
        <span class="actions" ?hidden=${!this.hasActionsEnd}>
          <slot name="actions-end" @slotchange=${this.#onActionsEnd}></slot>
        </span>
      </div>
    `;
  }
}

if (!customElements.get('moz-box-item')) {
  customElements.define('moz-box-item', MozBoxItem);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-box-item': MozBoxItem;
  }
}
