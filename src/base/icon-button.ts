import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../components/moz-button/moz-button';
import type { ButtonSize } from '../components/moz-button/moz-button';
import type { IconName } from '../generated/icons';

/**
 * The shared close / dismiss / back / clear control: a ghost, icon-only
 * `moz-button` with a visually-hidden label. Renders into the caller's shadow
 * root, so that component must compose `shared.css` (for `.visually-hidden`)
 * into its styles, as our components do by default.
 */
export function iconButton(opts: {
  icon: IconName;
  label: string;
  onClick: (event: Event) => void;
  size?: ButtonSize;
  class?: string;
}) {
  return html`<moz-button
    class=${ifDefined(opts.class)}
    icon-only
    variant="ghost"
    size=${ifDefined(opts.size)}
    icon-start=${opts.icon}
    @click=${opts.onClick}
    ><span class="visually-hidden">${opts.label}</span></moz-button
  >`;
}
