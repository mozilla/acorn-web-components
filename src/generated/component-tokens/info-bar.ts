/* Generated from vendored Firefox Nova tokens. Do not edit. */
import { css } from 'lit';

export default css`
  :host {
  --info-bar-margin-block-start: 4px;
  --info-bar-margin-block-end: 4px;
  --info-bar-margin-block-nova-end: 0;
  --info-bar-margin-inline: 4px;
  --info-bar-border-color: light-dark(var(--color-violet-desaturated-20), var(--color-gray-60));
  }
  @media (prefers-contrast: more) {
    :host {
    --info-bar-border-color: CanvasText;
    }
  }
  :host([data-contrast='high']) {
    --info-bar-border-color: CanvasText;
  }
`;
