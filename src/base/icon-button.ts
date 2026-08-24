import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { IconName } from '../generated/icons';

/**
 * The shared close / dismiss / back control: a ghost, icon-only `moz-button`
 * with a visually-hidden label. The consuming component must import moz-button
 * and include `shared.css` (for `.visually-hidden`).
 */
export function iconButton(opts: {
  icon: IconName;
  label: string;
  onClick: (event: Event) => void;
  class?: string;
}) {
  return html`<moz-button
    class=${ifDefined(opts.class)}
    icon-only
    variant="ghost"
    icon-start=${opts.icon}
    @click=${opts.onClick}
    ><span class="visually-hidden">${opts.label}</span></moz-button
  >`;
}
