import { html, nothing, type TemplateResult } from 'lit';
import '../components/moz-icon/moz-icon';
import type { IconName } from '../generated/icons';

export interface LabelContentOptions {
  /** Label text. */
  label?: string;
  /** Optional leading icon, shown before the text. */
  icon?: IconName;
  /** Whether to append the required marker. */
  required?: boolean;
}

/**
 * Inner content shared by every label surface — the form-control label in
 * `MozBaseInputElement` and the standalone `moz-label` — so the two can't drift:
 * an optional leading icon, the text, and a required marker. Styled by
 * `label-content.css`, which both consumers compose.
 */
export function labelContent({
  label,
  icon,
  required,
}: LabelContentOptions): TemplateResult | typeof nothing {
  if (!label && !icon) return nothing;
  return html`<span part="label-content" class="label-content">
    ${
      icon
        ? html`<moz-icon class="label-icon" name=${icon} size="small"></moz-icon>`
        : nothing
    }
    ${label ? html`<span class="label-text">${label}</span>` : nothing}
    ${
      required
        ? html`<span class="label-required" aria-hidden="true">*</span>`
        : nothing
    }
  </span>`;
}
