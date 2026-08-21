import { html, render, type TemplateResult } from 'lit';
import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
// Foundation styles (litCss leaves these as global stylesheets); components.
import '../../src/generated/tokens.css';
import '../../src/base.css';
import '../../src/components/moz-badge/moz-badge';
import '../../src/components/moz-box-button/moz-box-button';
import '../../src/components/moz-box-group/moz-box-group';
import '../../src/components/moz-box-item/moz-box-item';
import '../../src/components/moz-box-link/moz-box-link';
import '../../src/components/moz-breadcrumb/moz-breadcrumb';
import '../../src/components/moz-button/moz-button';
import '../../src/components/moz-card/moz-card';
import '../../src/components/moz-details/moz-details';
import '../../src/components/moz-icon/moz-icon';
import '../../src/components/moz-message-bar/moz-message-bar';
import '../../src/components/moz-provider/moz-provider';
import '../../src/components/moz-segmented-control/moz-segmented-control';
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
    comparatorOptions: { allowedMismatchedPixelRatio: 20 },
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
      <moz-badge type="new" icon-start="checkmark">verified</moz-badge>
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
        (c) =>
          html`<moz-icon name="information" size="large" color=${c}></moz-icon>`,
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

// Inline SVG data URI keeps the cover image deterministic (no network/fonts).
const cardMedia =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='96'%3E%3Crect width='280' height='96' fill='%230060df'/%3E%3C/svg%3E";

test('card spacing', () =>
  snapshot(
    'card-spacing',
    html`<div style="display:flex;gap:16px;align-items:flex-start;">
      <moz-card heading="Default" style="inline-size:240px;"
        >A card groups related content about a single subject.</moz-card
      >
      <moz-card heading="Compact" spacing="compact" style="inline-size:240px;"
        >Compact pulls the scale in for denser layouts.</moz-card
      >
    </div>`,
  ));

test('card media and actions', () =>
  snapshot(
    'card-media-actions',
    html`<moz-card heading="Featured" style="inline-size:280px;">
      <img slot="media" src=${cardMedia} alt="" />
      Media, body, and a footer of actions together in one surface.
      <div slot="actions" style="display:flex;gap:8px;">
        <moz-button variant="primary">Save</moz-button>
        <moz-button variant="ghost">Cancel</moz-button>
      </div>
    </moz-card>`,
  ));

test('card icon', () =>
  snapshot(
    'card-icon',
    html`<moz-card
      heading="With icon"
      icon-start="information"
      style="inline-size:280px;"
    >
      A leading icon sits before the heading.
    </moz-card>`,
  ));

test('card accordion', () =>
  snapshot(
    'card-accordion',
    html`<div
      style="display:flex;flex-direction:column;gap:16px;inline-size:320px;"
    >
      <moz-card type="accordion" heading="Collapsed"
        >Hidden until expanded.</moz-card
      >
      <moz-card type="accordion" expanded heading="Expanded">
        Body revealed when expanded.
        <moz-button slot="actions" size="small">Action</moz-button>
      </moz-card>
    </div>`,
  ));

test('details states', () =>
  snapshot(
    'details-states',
    html`<div
      style="display:flex;flex-direction:column;gap:12px;inline-size:360px;"
    >
      <moz-details heading="Collapsed">Hidden content.</moz-details>
      <moz-details heading="Expanded" open
        >Revealed content in the disclosure body.</moz-details
      >
    </div>`,
  ));

// High contrast (app-driven): borderless normally, gains a border here.
test('details high-contrast', () =>
  snapshotContrast(
    'details-high-contrast',
    html`<div style="inline-size:360px;">
      <moz-details heading="High contrast" open
        >Gains a visible border in high contrast.</moz-details
      >
    </div>`,
  ));

// Standard width: the group hugs its content.
test('segmented-control', () =>
  snapshot(
    'segmented-control',
    html`<moz-segmented-control label="Date range" value="week">
      <moz-segmented-control-item
        value="day"
        label="Day"
      ></moz-segmented-control-item>
      <moz-segmented-control-item
        value="week"
        label="Week"
      ></moz-segmented-control-item>
      <moz-segmented-control-item
        value="month"
        label="Month"
      ></moz-segmented-control-item>
    </moz-segmented-control>`,
  ));

// Fill width: spans the container with equally-sized segments.
test('segmented-control fill', () =>
  snapshot(
    'segmented-control-fill',
    html`<div style="inline-size:420px;">
      <moz-segmented-control label="Date range" value="week" fill>
        <moz-segmented-control-item
          value="day"
          label="Day"
        ></moz-segmented-control-item>
        <moz-segmented-control-item
          value="week"
          label="Week"
        ></moz-segmented-control-item>
        <moz-segmented-control-item
          value="month"
          label="Month"
        ></moz-segmented-control-item>
      </moz-segmented-control>
    </div>`,
  ));

// Sizes: large (40px, default) and small (32px) total heights.
test('segmented-control sizes', () =>
  snapshot(
    'segmented-control-sizes',
    html`<div
      style="display:flex;flex-direction:column;gap:12px;align-items:flex-start;"
    >
      <moz-segmented-control label="Large" value="week">
        <moz-segmented-control-item
          value="day"
          label="Day"
        ></moz-segmented-control-item>
        <moz-segmented-control-item
          value="week"
          label="Week"
        ></moz-segmented-control-item>
      </moz-segmented-control>
      <moz-segmented-control label="Small" value="week" size="small">
        <moz-segmented-control-item
          value="day"
          label="Day"
        ></moz-segmented-control-item>
        <moz-segmented-control-item
          value="week"
          label="Week"
        ></moz-segmented-control-item>
      </moz-segmented-control>
    </div>`,
  ));

// Icon-only segments render as circles.
test('segmented-control icon-only', () =>
  snapshot(
    'segmented-control-icon-only',
    html`<moz-segmented-control label="Formatting" value="edit">
      <moz-segmented-control-item
        value="edit"
        icon="edit"
        label="Edit"
        icon-only
      ></moz-segmented-control-item>
      <moz-segmented-control-item
        value="copy"
        icon="copy"
        label="Copy"
        icon-only
      ></moz-segmented-control-item>
      <moz-segmented-control-item
        value="close"
        icon="close"
        label="Close"
        icon-only
      ></moz-segmented-control-item>
    </moz-segmented-control>`,
  ));

// Disabled: the whole control dims.
test('segmented-control disabled', () =>
  snapshot(
    'segmented-control-disabled',
    html`<moz-segmented-control label="Date range" value="week" disabled>
      <moz-segmented-control-item
        value="day"
        label="Day"
      ></moz-segmented-control-item>
      <moz-segmented-control-item
        value="week"
        label="Week"
      ></moz-segmented-control-item>
      <moz-segmented-control-item
        value="month"
        label="Month"
      ></moz-segmented-control-item>
    </moz-segmented-control>`,
  ));

// Deck: the control (tied via deck/id) drives the visible content panel.
test('segmented-control deck', () =>
  snapshot(
    'segmented-control-deck',
    html`<div>
      <moz-segmented-control label="View" value="activity" deck="vis-deck">
        <moz-segmented-control-item
          value="overview"
          label="Overview"
        ></moz-segmented-control-item>
        <moz-segmented-control-item
          value="activity"
          label="Activity"
        ></moz-segmented-control-item>
      </moz-segmented-control>
      <moz-segmented-control-deck id="vis-deck" style="margin-block-start:1rem;">
        <div name="overview">Overview panel content.</div>
        <div name="activity">Activity panel content.</div>
      </moz-segmented-control-deck>
    </div>`,
  ));

const breadcrumbTrail = html`
  <moz-breadcrumb href="#">Home</moz-breadcrumb>
  <moz-breadcrumb href="#">Extensions</moz-breadcrumb>
  <moz-breadcrumb>Details</moz-breadcrumb>
`;

test('breadcrumb', () =>
  snapshot(
    'breadcrumb',
    html`<moz-breadcrumb-group>${breadcrumbTrail}</moz-breadcrumb-group>`,
  ));

// High contrast (app-driven): exercises the breadcrumb link a11y layer.
test('breadcrumb high-contrast', () =>
  snapshotContrast(
    'breadcrumb-high-contrast',
    html`<moz-breadcrumb-group>${breadcrumbTrail}</moz-breadcrumb-group>`,
  ));

// Box family: a group composes the outer border + dividers; rows carry the
// label/description/icon layout, states, and trailing nav icons.
const boxSettings = html`
  <moz-box-group label="Settings">
    <moz-box-button label="General" icon-start="settings"></moz-box-button>
    <moz-box-button
      label="Privacy & Security"
      description="Cookies, permissions, and data"
      icon-start="shield"
    ></moz-box-button>
    <moz-box-button label="Extensions" icon-start="extension"></moz-box-button>
    <moz-box-button label="Sync (signed out)" disabled></moz-box-button>
  </moz-box-group>
`;

const boxWidth = (content: TemplateResult) =>
  html`<div style="inline-size:420px">${content}</div>`;

test('box-group buttons', () =>
  snapshot('box-group-buttons', boxWidth(boxSettings)));

test('box-group buttons high-contrast', () =>
  snapshotContrast('box-group-buttons-high-contrast', boxWidth(boxSettings)));

test('box-group mixed', () =>
  snapshot(
    'box-group-mixed',
    boxWidth(html`
      <moz-box-group label="Account">
        <moz-box-item
          label="Firefox Account"
          description="user@example.com"
          icon-start="information"
        ></moz-box-item>
        <moz-box-link
          label="Learn more"
          href="https://www.mozilla.org"
        ></moz-box-link>
        <moz-box-button
          label="Manage account"
          icon-start="settings"
        ></moz-box-button>
      </moz-box-group>
    `),
  ));

test('box standalone rows', () =>
  snapshot(
    'box-standalone',
    html`<div
      style="display:flex;flex-direction:column;gap:1rem;inline-size:420px"
    >
      <moz-box-item
        label="Item"
        description="A standalone item"
        icon-start="information"
      >
        <moz-button slot="actions-end" variant="ghost" icon-start="edit"
          >Edit</moz-button
        >
      </moz-box-item>
      <moz-box-button
        label="Button"
        description="A standalone button"
        icon-start="settings"
      ></moz-box-button>
      <moz-box-link
        label="Link"
        href="https://www.mozilla.org"
      ></moz-box-link>
    </div>`,
  ));

test('box item layouts', () =>
  snapshot(
    'box-item-layouts',
    html`<div
      style="display:flex;flex-direction:column;gap:1rem;inline-size:420px"
    >
      <moz-box-item
        label="Default"
        description="16px icon"
        icon-start="shield"
      ></moz-box-item>
      <moz-box-item
        label="Medium icon"
        description="24px icon"
        icon-start="shield"
        layout="medium-icon"
      ></moz-box-item>
      <moz-box-item
        label="Large icon"
        description="32px icon"
        icon-start="shield"
        layout="large-icon"
      ></moz-box-item>
    </div>`,
  ));
