/// <reference types="@vitest/browser/context" />
import { page } from '@vitest/browser/context';
import { html, render, type TemplateResult } from 'lit';
import { expect, test } from 'vitest';
// Foundation styles (litCss leaves these as global stylesheets); components.
import '../../src/generated/tokens.css';
import '../../src/base.css';
import '../../src/components/moz-badge/moz-badge';
import '../../src/components/moz-button/moz-button';
import '../../src/components/moz-icon/moz-icon';
import '../../src/components/moz-message-bar/moz-message-bar';
import '../../src/components/moz-provider/moz-provider';
import type { BadgeType } from '../../src/components/moz-badge/moz-badge';
import type {
  ButtonSize,
  ButtonVariant,
} from '../../src/components/moz-button/moz-button';
import type { MessageBarType } from '../../src/components/moz-message-bar/moz-message-bar';
import { iconColors, iconSizes } from '../../src/generated/icon-options';

// Render a matrix inside a themed provider on the token surface, let it settle,
// and snapshot it. Baselines: tests/visual/__screenshots__/snapshots.visual.ts/
// <name>-chromium-linux.png.
async function snapshot(
  name: string,
  content: TemplateResult,
  contrast: 'auto' | 'high' = 'auto',
): Promise<void> {
  // Widen the tester iframe (it defaults to ~333px) so wide matrices don't wrap
  // or clip, then let inline-block shrink-wrap the host tightly to its content
  // (no blank padding on the right).
  await page.viewport(1200, 800);
  const host = document.createElement('div');
  host.style.display = 'inline-block';
  document.body.append(host);
  render(
    html`<moz-provider theme="light" .contrast=${contrast}>
      <div
        style="padding:1rem;background:var(--background-color-canvas);color:var(--text-color);"
      >
        ${content}
      </div>
    </moz-provider>`,
    host,
  );
  // Fonts and async-loaded icon modules affect the pixels; wait for both.
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 100));
  await expect.element(host).toMatchScreenshot(name, {
    comparatorName: 'pixelmatch',
    comparatorOptions: { allowedMismatchedPixelRatio: 0.01 },
  });
  host.remove();
}

const snapshotContrast = (name: string, content: TemplateResult) =>
  snapshot(name, content, 'high');

const badgeTypes: BadgeType[] = ['default', 'beta', 'new'];
const variants: ButtonVariant[] = [
  'default',
  'primary',
  'destructive',
  'ghost',
  'muted',
];
const sizes: ButtonSize[] = ['small', 'medium', 'large'];
const messageTypes: MessageBarType[] = [
  'info',
  'warning',
  'success',
  'error',
  'critical',
];

test('badge types', () =>
  snapshot(
    'badge-types',
    html`<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
      ${badgeTypes.map((t) => html`<moz-badge type=${t}>${t}</moz-badge>`)}
      <moz-badge type="new" icon-start="check">verified</moz-badge>
    </div>`,
  ));

test('button variants', () =>
  snapshot(
    'button-variants',
    html`<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
      ${variants.map((v) => html`<moz-button variant=${v}>${v}</moz-button>`)}
    </div>`,
  ));

test('button sizes', () =>
  snapshot(
    'button-sizes',
    html`<div style="display:flex;gap:12px;align-items:center;">
      ${sizes.map((s) => html`<moz-button size=${s}>${s}</moz-button>`)}
    </div>`,
  ));

test('icon sizes', () =>
  snapshot(
    'icon-sizes',
    html`<div style="display:flex;gap:16px;align-items:flex-end;">
      ${iconSizes.map((s) => html`<moz-icon name="edit" size=${s}></moz-icon>`)}
    </div>`,
  ));

test('icon colors', () =>
  snapshot(
    'icon-colors',
    html`<div style="display:flex;gap:16px;align-items:center;">
      ${iconColors.map(
        (c) => html`<moz-icon name="info" size="large" color=${c}></moz-icon>`,
      )}
    </div>`,
  ));

test('message-bar types', () =>
  snapshot(
    'message-bar-types',
    html`<div
      style="display:flex;flex-direction:column;gap:12px;inline-size:600px;"
    >
      ${messageTypes.map(
        (t) =>
          html`<moz-message-bar type=${t} heading=${t}
            >The quick brown fox jumps over the lazy dog.</moz-message-bar
          >`,
      )}
    </div>`,
  ));

const srOnly =
  'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);';

test('message-bar dismissable', () =>
  snapshot(
    'message-bar-dismissable',
    html`<div style="inline-size:520px;">
      <moz-message-bar type="info" heading="Heads up" dismissable
        >Your changes have been saved.</moz-message-bar
      >
    </div>`,
  ));

// High-contrast (app-driven): type colours drop to a plain border.
test('message-bar high-contrast', () =>
  snapshotContrast(
    'message-bar-high-contrast',
    html`<div style="display:flex;flex-direction:column;gap:12px;inline-size:600px;">
      ${messageTypes.map(
        (t) =>
          html`<moz-message-bar type=${t} heading=${t}
            >The quick brown fox.</moz-message-bar
          >`,
      )}
    </div>`,
  ));

test('icon buttons', () =>
  snapshot(
    'icon-buttons',
    html`<div style="display:flex;gap:12px;align-items:center;">
      ${sizes.map(
        (s) =>
          html`<moz-button icon variant="ghost" size=${s} icon-start="close"
            ><span style=${srOnly}>Close</span></moz-button
          >`,
      )}
    </div>`,
  ));
