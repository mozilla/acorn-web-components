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
  /** Access key; its first occurrence in the label is underlined. */
  accessKey?: string;
}

// Underline the first (case-insensitive) occurrence of the access key so it's
// discoverable, the way Firefox's moz-label does.
function labelText(label: string, accessKey?: string): unknown {
  const i = accessKey
    ? label.toLowerCase().indexOf(accessKey.toLowerCase())
    : -1;
  if (i < 0) return label;
  return html`${label.slice(0, i)}<u>${label[i]}</u>${label.slice(i + 1)}`;
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
  accessKey,
}: LabelContentOptions): TemplateResult | typeof nothing {
  if (!label && !icon) return nothing;
  return html`<span part="label-content" class="label-content">
    ${
      icon
        ? html`<moz-icon class="label-icon" name=${icon} size="small"></moz-icon>`
        : nothing
    }
    ${
      label
        ? html`<span class="label-text">${labelText(label, accessKey)}</span>`
        : nothing
    }
    ${
      required
        ? html`<span class="label-required" aria-hidden="true">*</span>`
        : nothing
    }
  </span>`;
}
