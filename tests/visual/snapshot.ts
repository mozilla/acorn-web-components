import { html, render, type TemplateResult } from 'lit';
import { expect } from 'vitest';
import { page } from 'vitest/browser';
// Foundation styles (litCss leaves these as global stylesheets) plus the provider
// every snapshot renders into.
import '../../src/generated/tokens.css';
import '../../src/base.css';
import '../../src/components/moz-provider/moz-provider';

interface SnapshotOptions {
  /** `dark` flips `color-scheme` so the token layer's `light-dark()` values resolve dark. */
  theme?: 'light' | 'dark';
  /** `high` drives the app-controlled high-contrast token set. */
  contrast?: 'auto' | 'high';
}

// Render a matrix inside a themed provider on the token surface, let it settle,
// and snapshot it. Baselines live per spec file:
// tests/visual/__screenshots__/<spec>.visual.ts/<name>-chromium-linux.png.
export async function snapshot(
  name: string,
  content: TemplateResult,
  { theme = 'light', contrast = 'auto' }: SnapshotOptions = {},
): Promise<void> {
  // Widen the tester iframe (it defaults to ~333px) so wide matrices don't wrap
  // or clip, then let inline-block shrink-wrap the host tightly to its content
  // (no blank padding on the right).
  await page.viewport(1200, 800);
  const host = document.createElement('div');
  host.style.display = 'inline-block';
  document.body.append(host);
  render(
    html`<moz-provider theme=${theme} .contrast=${contrast}>
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
  // Cap the retry window: on a mismatch (e.g. an intended visual change)
  // toMatchScreenshot otherwise retries for expect.element's 15s default before
  // failing. A matching snapshot still passes on the first poll.
  await expect.element(host, { timeout: 3000 }).toMatchScreenshot(name, {
    comparatorName: 'pixelmatch',
    comparatorOptions: { allowedMismatchedPixelRatio: 0 },
  });
  host.remove();
}

// Each spec covers its component in the default light theme plus at least one
// dark and one high-contrast variant, the two ambient modes the provider drives.
export const snapshotDark = (name: string, content: TemplateResult) =>
  snapshot(name, content, { theme: 'dark' });

export const snapshotContrast = (name: string, content: TemplateResult) =>
  snapshot(name, content, { contrast: 'high' });
