import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-fieldset/moz-fieldset';
import '../../src/components/moz-input/moz-input';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

const fieldset = html`<moz-fieldset
  style="inline-size:360px;"
  label="Contact details"
  description="How reviewers can reach you about this add-on."
  error="Enter at least one way to reach you."
>
  <moz-input label="Name" name="name"></moz-input>
  <moz-input label="Email" name="email" type="email"></moz-input>
</moz-fieldset>`;

test('fieldset states', () => snapshot('fieldset-states', fieldset));

test('fieldset dark', () => snapshotDark('fieldset-dark', fieldset));

test('fieldset high-contrast', () =>
  snapshotContrast('fieldset-high-contrast', fieldset));
