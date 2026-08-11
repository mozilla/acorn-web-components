/* Generated from vendored Firefox Nova tokens. Do not edit. */
import { css } from 'lit';

export default css`
  :host {
  --toolbox-background-color-inactive: transparent;
  --toolbox-background-color: light-dark(rgb(234, 234, 237), var(--color-gray-90));
  --toolbox-background-color-gradient-leading: light-dark(var(--color-violet-10), var(--color-violet-desaturated-70));
  --toolbox-background-color-gradient-trailing: light-dark(var(--color-orange-10), var(--color-orange-70));
  --toolbox-text-color: light-dark(var(--color-gray-100), var(--color-gray-0));
  --toolbox-text-color-inactive: var(--text-color-deemphasized);
  --toolbox-background-nova-gradient: linear-gradient(96deg, color-mix(var(--toolbox-background-color-gradient-leading) 50%, transparent) 39.84%, color-mix(var(--toolbox-background-color-gradient-trailing) 50%, transparent) 101.72%); /** This gradient is only used for Nova */
  }
  @media (forced-colors: active) {
    :host {
    --toolbox-background-color-gradient-leading: Canvas;
    --toolbox-background-color-gradient-trailing: Canvas;
    --toolbox-background-nova-gradient: image(transparent);
    }
  }
`;
