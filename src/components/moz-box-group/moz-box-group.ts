import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import boxTokens from '../../generated/component-tokens/box.css';
import styles from './moz-box-group.css';

// Rows that take focus directly: buttons/links, or an item made focusable.
const NAVIGABLE =
  'moz-box-button, moz-box-link, moz-box-item[tabindex]:not([tabindex="-1"])';

/**
 * Nova box group: a bordered container that stacks moz-box-item / -button /
 * -link rows into a single list — outer border, dividers between rows, and
 * rounded top/bottom corners. Rows keep their natural tab order (each is its own
 * tab stop) and Arrow Up/Down + Home/End also move focus between them. Drag-to-
 * reorder is out of scope.
 */
export class MozBoxGroup extends MozLitElement {
  static styles = [shared, boxTokens, styles];

  /** Accessible name for the group. */
  @property() label?: string;

  #navigableRows(): HTMLElement[] {
    const slot = this.renderRoot.querySelector('slot');
    return (slot?.assignedElements() ?? []).filter((el) =>
      el.matches(NAVIGABLE),
    ) as HTMLElement[];
  }

  #onKeydown(event: KeyboardEvent) {
    // Leave arrows to controls that use them (text fields, selects, etc.).
    const usesArrows = event
      .composedPath()
      .some(
        (node) =>
          node instanceof HTMLElement &&
          /^(input|textarea|select)$/i.test(node.tagName),
      );
    if (usesArrows) return;

    const rows = this.#navigableRows();
    const current = rows.findIndex(
      (row) => row === event.target || row.contains(event.target as Node),
    );
    if (current === -1) return;

    const last = rows.length - 1;
    let next: number;
    switch (event.key) {
      case 'ArrowDown':
        next = Math.min(current + 1, last);
        break;
      case 'ArrowUp':
        next = Math.max(current - 1, 0);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    rows[next]?.focus();
  }

  render() {
    return html`
      <div
        class="group"
        role="group"
        aria-label=${ifDefined(this.label)}
        @keydown=${this.#onKeydown}
      >
        <slot></slot>
      </div>
    `;
  }
}

if (!customElements.get('moz-box-group')) {
  customElements.define('moz-box-group', MozBoxGroup);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-box-group': MozBoxGroup;
  }
}
