import type { LitElement, PropertyDeclarations, PropertyValues } from 'lit';
import { state } from 'lit/decorators.js';
import { MozLitElement } from './moz-lit-element';

/**
 * The contract a {@link SelectControlBaseElement} needs from its options. Item
 * classes provide these (see {@link SelectControlItemMixin}).
 */
export interface SelectControlItem extends HTMLElement {
  value: string;
  checked: boolean;
  disabled: boolean;
  isDisabled: boolean;
  position: number;
  itemTabIndex: number;
  name?: string;
  focus(): void;
  updateComplete: Promise<boolean>;
}

/**
 * Base for a single-selection group whose options live in separate shadow roots,
 * so the browser can't group them natively. It owns the selected `value`,
 * mirrors it to the options' `checked` (and back), and manages a roving tab stop
 * with arrow-key navigation (selection follows focus, wrapping around the ends).
 *
 * Ported from Firefox's `lit-select-control`. Subclasses set
 * {@link childElementName}, render a default `<slot>` wired to
 * {@link handleSlotChange} / {@link handleChange}, and pair with options that use
 * {@link SelectControlItemMixin}.
 */
export abstract class SelectControlBaseElement extends MozLitElement {
  /** Tag name of the option element (e.g. `moz-radio`). */
  static childElementName: string;

  // Declared via static properties (not decorators) so `value` can keep its
  // custom accessor while still being observed as an attribute.
  static properties: PropertyDeclarations = {
    orientation: { type: String, reflect: true },
    name: { type: String, reflect: true },
    value: { type: String },
  };

  /** Layout and arrow-key axis; also exposed as `aria-orientation`. */
  orientation: 'vertical' | 'horizontal' = 'vertical';

  /** Shared form name, applied to every option. */
  name?: string;

  #value?: string;
  #checkedIndex?: number;
  #focusedIndex?: number;
  #childElements?: SelectControlItem[];

  /** The selected option's value; setting it checks the matching option. */
  get value(): string | undefined {
    return this.#value;
  }

  set value(newValue: string | undefined) {
    const old = this.#value;
    this.#value = newValue;
    // Clear first; the scan re-establishes it, so an unmatched (or disabled)
    // value doesn't leave a stale option as the tab stop.
    this.#checkedIndex = undefined;
    for (const [index, item] of this.childElements.entries()) {
      const isChecked = newValue !== undefined && newValue === item.value;
      item.checked = isChecked;
      if (isChecked && !item.isDisabled) this.#checkedIndex = index;
    }
    this.syncFocusState();
    this.requestUpdate('value', old);
  }

  get hasValue(): boolean {
    return this.#value !== undefined;
  }

  get checkedIndex(): number | undefined {
    return this.#checkedIndex;
  }

  set checkedIndex(newIndex: number | undefined) {
    if (this.#checkedIndex === newIndex) return;
    this.#checkedIndex = newIndex;
    this.syncFocusState();
  }

  set focusedIndex(newIndex: number | undefined) {
    if (this.#focusedIndex === newIndex) return;
    this.#focusedIndex = newIndex;
    this.syncFocusState();
  }

  get focusableIndex(): number {
    if (this.#checkedIndex !== undefined && this.hasValue) {
      return this.#checkedIndex;
    }
    return this.childElements.findIndex((item) => !item.isDisabled);
  }

  get childElements(): SelectControlItem[] {
    if (!this.#childElements) {
      const name = (this.constructor as typeof SelectControlBaseElement)
        .childElementName;
      const slot =
        this.renderRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
      this.#childElements = (slot?.assignedElements({ flatten: true }) ?? [])
        .filter((el): el is SelectControlItem => el.localName === name)
        .map((el) => {
          customElements.upgrade(el);
          return el;
        });
    }
    return this.#childElements;
  }

  constructor() {
    super();
    this.addEventListener('blur', this.#onBlur, true);
    this.addEventListener('keydown', this.#onKeydown);
  }

  protected firstUpdated(changed: PropertyValues<this>): void {
    super.firstUpdated(changed);
    this.syncStateToChildElements();
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await Promise.all(this.childElements.map((item) => item.updateComplete));
    return result;
  }

  syncStateToChildElements(): void {
    for (const [index, item] of this.childElements.entries()) {
      item.position = index;
      item.name = this.name;
      if (item.checked && this.#value === undefined) this.#value = item.value;
    }
    // Deliberate self-assignment: runs the value setter to mirror the resolved value onto the options.
    this.value = this.#value;
  }

  syncFocusState(): void {
    const focusable = this.focusableIndex;
    for (const [index, item] of this.childElements.entries()) {
      item.itemTabIndex = index === focusable ? 0 : -1;
    }
  }

  #onBlur = (event: FocusEvent) => {
    if (this.contains(event.relatedTarget as Node)) return;
    this.focusedIndex = undefined;
  };

  #onKeydown = (event: KeyboardEvent) => {
    if (!this.childElements.includes(event.target as SelectControlItem)) return;
    const rtl = getComputedStyle(this).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    switch (event.key) {
      case 'ArrowDown':
      case forward:
        event.preventDefault();
        this.#navigate(1);
        break;
      case 'ArrowUp':
      case backward:
        event.preventDefault();
        this.#navigate(-1);
        break;
    }
  };

  #navigate(step: number): void {
    const items = this.childElements;
    const current = this.focusableIndex;
    for (let i = 1; i <= items.length; i++) {
      const next = items[(current + items.length + step * i) % items.length];
      if (next && !next.isDisabled) {
        this.value = next.value;
        next.focus();
        // Setting value fires no native change, so emit one (as a click would)
        // for the group re-dispatch and per-option listeners.
        next.dispatchEvent(
          new Event('change', { bubbles: true, composed: true }),
        );
        return;
      }
    }
  }

  protected willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate?.(changed);
    if (changed.has('name')) {
      for (const item of this.childElements) item.name = this.name;
    }
  }

  // Re-dispatch an option's change from the group so consumers listen in one
  // place; ignore change from nested slot content (not a selection move).
  handleChange = (event: Event): void => {
    if (!this.childElements.includes(event.target as SelectControlItem)) return;
    event.stopPropagation();
    this.dispatchEvent(new Event(event.type, event));
  };

  handleSlotChange = (): void => {
    this.#childElements = undefined;
    this.#checkedIndex = undefined;
    this.#focusedIndex = undefined;
    this.syncStateToChildElements();
  };
}

// Abstract so the mixin can wrap abstract bases like MozBaseInputElement.
// biome-ignore lint/suspicious/noExplicitAny: mixin constructor constraint.
type Constructor<T> = abstract new (...args: any[]) => T;

/**
 * Public surface {@link SelectControlItemMixin} adds. The return type names this
 * interface rather than the inner class so declaration emit doesn't leak the
 * superclass's protected members into an anonymous type (TS4094).
 */
export interface SelectControlItemMixinInterface {
  value: string;
  checked: boolean;
  disabled: boolean;
  parentDisabled: boolean;
  isDisabled: boolean;
  name?: string;
  itemTabIndex: number;
  position: number;
  readonly controller: SelectControlBaseElement | undefined;
  handleClick: () => void;
}

/**
 * Adds the option side of the select-control contract to a control class: the
 * roving `itemTabIndex`, its `position`, a reference to the owning group, and —
 * crucially — reactive coordination. Setting `checked` directly (not just via a
 * DOM `change`) tells the group to update its value and uncheck the previous
 * option, so single-selection holds however selection is driven.
 *
 * The superclass must supply `value`, `checked`, `disabled`, `parentDisabled`,
 * `isDisabled`, and `name` (e.g. `MozBaseInputElement`).
 */
export const SelectControlItemMixin = <T extends Constructor<LitElement>>(
  superClass: T,
) => {
  abstract class SelectControlItemElement extends superClass {
    declare value: string;
    declare checked: boolean;
    declare disabled: boolean;
    declare parentDisabled: boolean;
    declare isDisabled: boolean;
    declare name?: string;

    /** The group's roving tab stop; 0 for the active option, -1 otherwise. */
    @state() itemTabIndex = 0;
    /** This option's index within the group. */
    @state() position = 0;

    #controller?: SelectControlBaseElement;

    // Lazy so an option that connects before its group upgrades (SSR, or
    // moz-radio defined first) still resolves once the group is present.
    get controller(): SelectControlBaseElement | undefined {
      if (!this.#controller) {
        const host =
          this.parentElement ?? (this.getRootNode() as ShadowRoot).host;
        if (host instanceof SelectControlBaseElement) this.#controller = host;
      }
      return this.#controller;
    }

    // biome-ignore lint/suspicious/noExplicitAny: mixin constructor signature.
    constructor(...args: any[]) {
      super(...args);
      this.addEventListener('focus', () => {
        if (!this.isDisabled && this.controller) {
          this.controller.focusedIndex = this.position;
        }
      });
    }

    connectedCallback(): void {
      super.connectedCallback?.();
      if (this.controller?.hasValue) {
        this.checked = this.value === this.controller.value;
      }
    }

    disconnectedCallback(): void {
      super.disconnectedCallback?.();
      // Drop the cache so reparenting re-resolves to the new group on reconnect.
      this.#controller = undefined;
    }

    protected willUpdate(changed: PropertyValues<this>): void {
      super.willUpdate?.(changed);
      const controller = this.controller;
      if (!controller) return;

      // Compare against the previous value so deselecting still clears the group
      // even when checked and value change in the same update.
      if (changed.has('checked') || changed.has('value')) {
        const prevValue = changed.has('value')
          ? (changed.get('value') as string | undefined)
          : this.value;
        if (this.checked) {
          if (controller.value !== this.value) controller.value = this.value;
        } else if (controller.value === prevValue) {
          controller.value = undefined;
        }
      }

      // Key off `disabled`, not `isDisabled`: the base's formDisabled lags the
      // reflected attribute and reads stale during a re-enable here.
      if (changed.has('disabled')) {
        if (this.disabled && controller.checkedIndex === this.position) {
          controller.checkedIndex = undefined;
        } else if (!this.disabled && !this.parentDisabled && this.checked) {
          controller.checkedIndex = this.position;
        } else {
          controller.syncFocusState();
        }
      }
    }

    // Update the group synchronously on click (before the native `change`), so
    // listeners see settled group state and the previous option is unchecked.
    handleClick = (): void => {
      const controller = this.controller;
      if (this.isDisabled || this.checked || !controller) return;
      controller.value = this.value;
    };
  }
  return SelectControlItemElement as Constructor<SelectControlItemMixinInterface> &
    T;
};
