import { html } from 'lit';
import { test } from 'vitest';
import '../../src/components/moz-page-nav/moz-page-nav';
import { snapshot, snapshotContrast, snapshotDark } from './snapshot';

// Page nav: side-nav with a heading, view buttons (one current), icons, and a
// secondary external link below the separator.
const pageNav = html`<div style="inline-size:240px;">
  <moz-page-nav heading="Settings" current="privacy">
    <moz-page-nav-button value="general" icon-start="settings"
      >General</moz-page-nav-button
    >
    <moz-page-nav-button value="privacy" icon-start="shield"
      >Privacy &amp; Security</moz-page-nav-button
    >
    <moz-page-nav-button value="sync" icon-start="sync"
      >Sync</moz-page-nav-button
    >
    <moz-page-nav-button
      slot="secondary"
      href="https://support.mozilla.org"
      icon-start="help"
      >Get help</moz-page-nav-button
    >
  </moz-page-nav>
</div>`;

test('page-nav', () => snapshot('page-nav', pageNav));

test('page-nav dark', () => snapshotDark('page-nav-dark', pageNav));

test('page-nav high-contrast', () =>
  snapshotContrast('page-nav-high-contrast', pageNav));
