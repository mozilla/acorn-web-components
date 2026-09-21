import { property } from 'lit/decorators.js';
import { MozInputText } from '../moz-input-text/moz-input-text';
import styles from './moz-input-search.css';

export interface InputSearchEventDetail {
  query: string;
}

/**
 * Search input: a `moz-input-text` preset to `type="search"` with a leading
 * search icon and a clear button. It fires `moz-input-search:search` with the
 * current query — debounced while typing, immediately once the field is emptied
 * — so consumers can react to searches without wiring their own debounce.
 *
 * @fires moz-input-search:search - `{ query }` once typing settles (or on clear).
 * @csspart field - the bordered field box.
 * @csspart input - the native `<input type="search">`.
 */
export class MozInputSearch extends MozInputText {
  static styles = [...MozInputText.styles, styles];

  /** Debounce before the search event fires, in ms. */
  @property({ type: Number }) debounce = 500;

  #searchTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    super();
    this.iconStart = 'search';
    this.clearable = true;
    // The base re-dispatches a composed `input` from the host, so debounce off
    // that instead of its bound (non-overridable) handleInput field.
    this.addEventListener('input', this.#onInput);
  }

  protected get inputType(): string {
    return 'search';
  }

  #onInput = () => {
    this.#clearTimer();
    // An emptied field (cleared or deleted) resets results now, no debounce.
    if (!this.value) {
      this.#dispatchSearch();
      return;
    }
    this.#searchTimer = setTimeout(() => this.#dispatchSearch(), this.debounce);
  };

  #clearTimer() {
    if (this.#searchTimer) clearTimeout(this.#searchTimer);
    this.#searchTimer = undefined;
  }

  #dispatchSearch() {
    this.dispatchEvent(
      new CustomEvent<InputSearchEventDetail>('moz-input-search:search', {
        bubbles: true,
        composed: true,
        detail: { query: this.value },
      }),
    );
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#clearTimer();
  }

  /** Clear the value and fire a search immediately. */
  clear(): void {
    this.#clearTimer();
    if (this.value) {
      this.value = '';
      this.#dispatchSearch();
    }
  }
}

if (!customElements.get('moz-input-search')) {
  customElements.define('moz-input-search', MozInputSearch);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-input-search': MozInputSearch;
  }
}
