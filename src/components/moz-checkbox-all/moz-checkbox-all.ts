import type { PropertyValues } from 'lit';
import { MozCheckbox } from '../moz-checkbox/moz-checkbox';
import styles from './moz-checkbox-all.css';

/**
 * A "select all" checkbox that governs the sibling {@link MozCheckbox}es in its
 * container (a `moz-fieldset`, or any parent). It reflects their combined
 * state — checked when all are checked, `indeterminate` when only some are,
 * unchecked when none are — and toggling it drives them all to match.
 *
 * It coordinates itself from its parent, so it needs no wiring: drop it in
 * alongside the checkboxes it should control. Disabled checkboxes are left out
 * of both the tally and the toggle. Give it no `name` (the default) so it stays
 * a UI control and submits nothing.
 */
export class MozCheckboxAll extends MozCheckbox {
  static styles = [...MozCheckbox.styles, styles];

  #scope: HTMLElement | null = null;
  #observer?: MutationObserver;

  connectedCallback(): void {
    super.connectedCallback();
    this.#scope = this.parentElement;
    // Child toggles bubble to the container; recompute our state from them.
    this.#scope?.addEventListener('change', this.#onChildChange);
    this.#observer = new MutationObserver(this.#sync);
    if (this.#scope)
      this.#observer.observe(this.#scope, { childList: true, subtree: true });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#scope?.removeEventListener('change', this.#onChildChange);
    this.#observer?.disconnect();
  }

  protected firstUpdated(changed: PropertyValues<this>) {
    super.firstUpdated(changed);
    this.#sync();
  }

  // The controlled checkboxes: our direct siblings (not nested sub-options, and
  // never another select-all, which is a different tag).
  #targets(): MozCheckbox[] {
    if (!this.#scope) return [];
    return Array.from(
      this.#scope.querySelectorAll<MozCheckbox>('moz-checkbox'),
    ).filter((el) => el.parentElement === this.#scope);
  }

  #onChildChange = (event: Event) => {
    // Ignore our own re-emitted change; only react to the children's.
    if (event.target === this) return;
    this.#sync();
  };

  #sync = () => {
    const items = this.#targets().filter((el) => !el.isDisabled);
    const checked = items.filter((el) => el.checked).length;
    this.checked = items.length > 0 && checked === items.length;
    this.indeterminate = checked > 0 && checked < items.length;
  };

  // Overrides the base re-emit; it's an arrow field so there's no super to call — replicate its composed dispatch.
  protected handleChange = (event: Event) => {
    event.stopPropagation();
    // Snapshot the target state: each child's change re-enters #sync, which
    // rewrites this.checked mid-loop, so read it once up front.
    const on = this.checked;
    for (const child of this.#targets()) {
      if (child.isDisabled || child.checked === on) continue;
      child.checked = on;
      child.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  };
}

if (!customElements.get('moz-checkbox-all')) {
  customElements.define('moz-checkbox-all', MozCheckboxAll);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-checkbox-all': MozCheckboxAll;
  }
}
