/* Generated from vendored Firefox Nova tokens. Do not edit. */
import { css } from 'lit';

export default css`
  :host {
  --table-background-color: light-dark(#f8f8fa, rgb(35, 34, 43));
  --table-border-color: color-mix(in srgb, currentColor 41%, transparent);
  --table-header-text-color: light-dark(var(--color-white), var(--color-gray-100));
  --table-row-background-color-alternate: light-dark(var(--color-gray-20), var(--color-gray-65)); /** TODO Bug 1821203 - Gray use needs to be consolidated */
  --table-header-background-color: var(--color-accent-primary);
  --table-row-background-color: var(--background-color-canvas);
  }
  @media (forced-colors: active) {
    :host {
    --table-background-color: Canvas;
    --table-border-color: CanvasText;
    --table-header-background-color: AccentColor;
    --table-header-text-color: AccentColorText;
    --table-row-background-color-alternate: var(--background-color-canvas);
    }
  }
`;
