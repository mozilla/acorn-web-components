/* Generated from vendored Firefox Nova tokens. Do not edit. */
import { css } from 'lit';

export default css`
  :host {
  --toolbar-padding-inline: 6px;
  --toolbar-background-color: light-dark(#f9f9fb, rgb(43, 42, 51));
  --toolbar-field-border-color: light-dark(var(--color-gray-20), var(--color-gray-60));
  --toolbar-field-background-color: light-dark(rgba(0, 0, 0, 0.05), var(--color-black-alpha-30));
  --toolbar-field-background-color-focus: light-dark(var(--color-white), rgb(66, 65, 77));
  --toolbar-field-text-color: light-dark(var(--color-violet-desaturated-70), var(--color-violet-desaturated-10));
  --toolbar-field-text-color-focus: light-dark(var(--color-black), var(--color-gray-0));
  --toolbar-text-color: light-dark(var(--color-gray-100), var(--color-gray-0));
  --toolbar-field-border-color-focus: var(--focus-outline-color);
  }
  @media (prefers-contrast: more) {
    :host {
    --toolbar-field-background-color: Field;
    --toolbar-field-border-color: light-dark(#a6a4a9, #949297);
    --toolbar-field-text-color: FieldText;
    }
  }
  @media (forced-colors: active) {
    :host {
    --toolbar-background-color: Canvas;
    --toolbar-field-border-color: ButtonText;
    --toolbar-field-text-color: var(--text-color);
    }
  }
  :host([data-contrast='high']) {
    --toolbar-field-background-color: Field;
    --toolbar-field-border-color: light-dark(#a6a4a9, #949297);
    --toolbar-field-text-color: FieldText;
  }
`;
