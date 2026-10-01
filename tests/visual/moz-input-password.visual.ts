import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-input-password/moz-input-password';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// One column covering: empty with placeholder, filled (masked), revealed,
// description, required, reveal hidden, reveal + clear, error, and disabled.
const inputs = html`<div
  style="display:flex;flex-direction:column;gap:16px;inline-size:320px;"
>
  <moz-input-password label="Password" placeholder="••••••••"></moz-input-password>
  <moz-input-password label="Password" value="hunter2"></moz-input-password>
  <moz-input-password
    label="Revealed"
    value="hunter2"
    .revealed=${true}
  ></moz-input-password>
  <moz-input-password
    label="New password"
    autocomplete="new-password"
    description="At least 12 characters."
  ></moz-input-password>
  <moz-input-password label="Password" required></moz-input-password>
  <moz-input-password
    label="Confirm password"
    value="hunter2"
    hide-reveal
  ></moz-input-password>
  <moz-input-password label="Password" value="hunter2" clearable></moz-input-password>
  <moz-input-password
    label="Password"
    value="short"
    error="That password is too short."
  ></moz-input-password>
  <moz-input-password label="Password" value="hunter2" disabled></moz-input-password>
</div>`;

test('password states', () => snapshot('password-states', inputs));

test('password dark', () => snapshotDark('password-dark', inputs));

test('password high-contrast', () =>
  snapshotContrast('password-high-contrast', inputs));
