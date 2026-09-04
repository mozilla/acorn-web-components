import { html, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import fieldWidth from '../../base/field-width.css';
import { MozLitElement } from '../../base/moz-lit-element';
import shared from '../../base/shared.css';
import styles from './moz-fieldset.css';

/**
 * Groups related form controls under a shared label, optional description, and
 * a group-level error. Renders a real `<fieldset>`/`<legend>` for semantics.
 *
 * `disabled` propagates to slotted Acorn form controls via their
 * `parentDisabled`, so lifting it restores each control's own state. (A shadow
 * `<fieldset disabled>` can't reach slotted light-DOM controls on its own.)
 *
 * @slot - the grouped form controls.
 * @csspart fieldset - the `<fieldset>` element.
 * @csspart legend - the group label.
 * @csspart description - the helper-text region.
 * @csspart error - the group-level error message.
 */
export class MozFieldset extends MozLitElement {
  static styles = [shared, fieldWidth, styles];

  /** Group label, rendered as the `<legend>`. */
  @property() label?: string;

  /** Fill the container instead of the default 320px width. */
  @property({ type: Boolean, reflect: true, attribute: 'full-width' })
  fullWidth = false;

  /** Helper text below the legend. */
  @property() description?: string;

  /** Group-level error message, announced when it appears. */
  @property() error?: string;

  /** Disable every control in the group. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  protected updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('disabled')) this.#propagateDisabled();
  }

  // Controls we last propagated `disabled` onto, so we can hand their own
  // state back when they leave the group instead of stranding them disabled.
  #propagated = new Set<Element & { parentDisabled: boolean }>();

  #propagateDisabled() {
    const current = new Set(this.#controls);
    for (const prev of this.#propagated)
      if (!current.has(prev)) prev.parentDisabled = false;
    for (const control of current) control.parentDisabled = this.disabled;
    this.#propagated = current;
  }

  // Any slotted control that opts into container disabling via `parentDisabled`
  // (MozBaseInputElement controls and moz-radio-group).
  get #controls(): Array<Element & { parentDisabled: boolean }> {
    const slot =
      this.renderRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    return (slot?.assignedElements({ flatten: true }) ?? []).filter(
      (el): el is Element & { parentDisabled: boolean } =>
        'parentDisabled' in el,
    );
  }

  render() {
    const describedBy =
      [this.description && 'description', this.error && 'error']
        .filter(Boolean)
        .join(' ') || undefined;
    return html`<fieldset
      part="fieldset"
      ?disabled=${this.disabled}
      aria-describedby=${ifDefined(describedBy)}
      aria-invalid=${ifDefined(this.error ? 'true' : undefined)}
    >
      ${
        this.label
          ? html`<legend part="legend">${this.label}</legend>`
          : nothing
      }
      ${
        this.description
          ? html`<p part="description" id="description" class="description">${this.description}</p>`
          : nothing
      }
      <div class="controls">
        <slot @slotchange=${this.#propagateDisabled}></slot>
      </div>
      ${
        this.error
          ? html`<p part="error" id="error" class="error" role="alert">${this.error}</p>`
          : nothing
      }
    </fieldset>`;
  }
}

if (!customElements.get('moz-fieldset')) {
  customElements.define('moz-fieldset', MozFieldset);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-fieldset': MozFieldset;
  }
}
