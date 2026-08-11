/// <reference types="@vitest/browser/context" />
import { expect } from 'vitest';

// Injected by vitest.config.ts: true only in the VISUAL run.
declare const __VISUAL__: boolean;

/**
 * Take a visual snapshot of an element, but only in the VISUAL run (Chromium, in
 * the pinned Playwright/Linux container). A no-op in normal `test` / `coverage`
 * runs, so those stay fast and platform-independent. Baselines are named
 * `<name>-chromium-linux.png` and committed; refresh them with
 * `npm run test:visual:update:docker`.
 */
export async function matchScreenshot(
  element: HTMLElement,
  name: string,
): Promise<void> {
  if (!__VISUAL__) return;
  // Fonts affect text rendering, so wait for them before capturing.
  await document.fonts.ready;
  await expect.element(element).toMatchScreenshot(name, {
    comparatorName: 'pixelmatch',
    comparatorOptions: { allowedMismatchedPixelRatio: 0.01 },
  });
}

/**
 * Wait for every `<moz-icon>` in a subtree to finish its async load, so an
 * icon-heavy story is stable before a screenshot.
 */
export async function settleIcons(root: ParentNode): Promise<void> {
  const icons = [...root.querySelectorAll('moz-icon')];
  await Promise.all(icons.map((el) => el.updateComplete));
  for (let i = 0; i < 50; i++) {
    if (icons.every((el) => el.shadowRoot?.querySelector('svg'))) return;
    await new Promise((r) => setTimeout(r, 20));
  }
}
