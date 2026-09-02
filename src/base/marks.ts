import { html } from 'lit';

// The checkbox marks, drawn from the Figma checkbox spec — their own sizes and
// weight, distinct from moz-icon. `currentColor` lets each host recolor them
// (e.g. the on-accent foreground, or a darker tone in dark mode).
export const checkMark = html`<svg
  class="mark check"
  width="11"
  height="9"
  viewBox="0 0 11 9"
  fill="none"
  aria-hidden="true"
>
  <path
    d="M9.5 1 4 7.5 1 4.5"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>`;

export const dashMark = html`<svg
  class="mark dash"
  width="10"
  height="2"
  viewBox="0 0 10 2"
  fill="none"
  aria-hidden="true"
>
  <path
    d="M9 1 1 1"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>`;
