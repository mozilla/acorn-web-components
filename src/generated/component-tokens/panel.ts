/* Generated from vendored Firefox Nova tokens. Do not edit. */
import { css } from 'lit';

export default css`
  :host {
  --panel-border-color: light-dark(rgb(240, 240, 244), rgb(82, 82, 94));
  --panel-box-shadow-margin: 4px;
  --panel-padding: 16px;
  --panel-padding-block: 4px;
  --panel-separator-color: color-mix(in srgb, currentColor 25%, transparent);
  --panel-separator-padding-block: 4px;
  --panel-separator-padding-inline: 8px;
  --panel-width: initial;
  --panel-background-color: light-dark(var(--color-white), rgb(66, 65, 77));
  --panel-background-color-dimmed: var(--background-color-dimmed);
  --panel-background-color-dimmed-further: var(--background-color-dimmed-further);
  --panel-box-shadow: 0 0 var(--panel-box-shadow-margin) hsla(0, 0%, 0%, 0.2);
  --panel-separator-padding: var(--panel-separator-padding-block) var(--panel-separator-padding-inline);
  --panel-text-color: light-dark(var(--color-black), rgb(251, 251, 254));
  --panel-border-radius: 24px;
  }
  @media (prefers-contrast: more) {
    :host {
    --panel-separator-color: currentColor;
    }
  }
  @media (forced-colors: active) {
    :host {
    --panel-background-color: Menu;
    --panel-separator-color: var(--border-color);
    --panel-text-color: MenuText;
    }
  }
  :host([data-contrast='high']) {
    --panel-separator-color: currentColor;
  }
`;
