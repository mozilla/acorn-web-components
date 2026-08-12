import type { ReactiveController, ReactiveControllerHost } from 'lit';

type DisclosureHost = ReactiveControllerHost & EventTarget;

interface DisclosureConfig {
  /** Read the host's current expanded state. */
  get: () => boolean;
  /** Apply a new expanded state to the host. */
  set: (open: boolean) => void;
  /** Event dispatched on user toggle (bubbles + composed); detail: { open }. */
  eventType: string;
  /** Optional: when true, toggling is blocked. */
  isDisabled?: () => boolean;
}

/**
 * Shared disclosure toggle behaviour for native `<details>`/`<summary>`
 * elements (moz-details, moz-card's accordion type). Wire `handleSummaryClick`
 * and `handleSummaryKeydown` onto the `<summary>`; the host owns its open state.
 */
export class DisclosureController implements ReactiveController {
  #host: DisclosureHost;
  #config: DisclosureConfig;

  constructor(host: DisclosureHost, config: DisclosureConfig) {
    this.#host = host;
    this.#config = config;
    host.addController(this);
  }

  hostConnected() {
    // Registered for host lifecycle; no work needed yet.
  }

  toggle() {
    if (this.#config.isDisabled?.()) return;
    const open = !this.#config.get();
    this.#config.set(open);
    this.#host.dispatchEvent(
      new CustomEvent(this.#config.eventType, {
        bubbles: true,
        composed: true,
        detail: { open },
      }),
    );
  }

  handleSummaryClick = (event: MouseEvent) => {
    event.preventDefault();
    this.toggle();
  };

  handleSummaryKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.toggle();
  };
}
