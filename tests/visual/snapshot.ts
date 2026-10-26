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
  /**
   * Run against the rendered markup before the screenshot — to open a popup, say.
   * Awaited, so it can wait for whatever it triggered to settle.
   */
  act?: (root: HTMLElement) => void | Promise<void>;
  /**
   * Capture the viewport rather than the rendered box, and size it to these
   * dimensions. Needed for anything drawn in the top layer — a popover, a modal
   * — which paints outside the host's box however large that box is.
   */
  viewport?: [width: number, height: number];
}

// Render a matrix inside a themed provider on the token surface, let it settle,
// and snapshot it. Baselines live per spec file:
// tests/visual/__screenshots__/<spec>.visual.ts/<name>-chromium-linux.png.
export async function snapshot(
  name: string,
  content: TemplateResult,
  { theme = 'light', contrast = 'auto', act, viewport }: SnapshotOptions = {},
): Promise<void> {
  // Widen the tester iframe (it defaults to ~333px) so wide matrices don't wrap
  // or clip, then let inline-block shrink-wrap the host tightly to its content
  // (no blank padding on the right).
  await page.viewport(...(viewport ?? [1200, 800]));
  const host = document.createElement('div');
  // Shrink-wrapped normally, so the capture has no blank padding on the right;
  // full-bleed when capturing the page, so the themed surface reaches the edges
  // instead of leaving the area around the popup unthemed.
  host.style.display = viewport ? 'block' : 'inline-block';
  // Capturing the page means capturing the body's box, which otherwise stops at
  // the content and would clip a popup hanging below it.
  const bodyStyle = document.body.getAttribute('style');
  if (viewport) {
    document.body.style.margin = '0';
    document.body.style.minInlineSize = `${viewport[0]}px`;
    document.body.style.minBlockSize = `${viewport[1]}px`;
  }
  document.body.append(host);
  render(
    html`<moz-provider theme=${theme} .contrast=${contrast}>
      <div
        style="padding:1rem;background:var(--background-color-canvas);color:var(--text-color);${
          viewport ? 'min-block-size:100vh;box-sizing:border-box;' : ''
        }"
      >
        ${content}
      </div>
    </moz-provider>`,
    host,
  );
  // Fonts and async-loaded icon modules affect the pixels; wait for both.
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 100));
  if (act) {
    await act(host);
    await new Promise((r) => setTimeout(r, 100));
  }
  // Assert once (plain expect, not the retrying expect.element): the render has
  // already settled above, so a mismatch fails immediately instead of retrying
  // screenshots until a timeout — and still writes the reference/actual
  // attachments the HTML report renders.
  try {
    await expect(viewport ? document.body : host).toMatchScreenshot(name, {
      comparatorName: 'pixelmatch',
      // Whichever snapshot runs first in a page rasterizes a glyph or icon edge
      // a shade differently from the same capture in a warm page, so a spec run
      // on its own disagrees with the full-suite baselines by a few antialiasing
      // pixels. Neither a longer settle nor a warm-up render fixes it. 20 of
      // ~134k pixels absorbs that; anything real (a missing icon, a shifted row,
      // a wrong color) runs to thousands.
      comparatorOptions: { allowedMismatchedPixels: 20 },
    });
  } finally {
    // Tests in a spec share one page, so a host left behind by a failure — or
    // by the run that first writes the baselines — lands in the next capture.
    host.remove();
    // Put back exactly what was there: the test harness sets styles of its own
    // on the body, and clearing them would change what the next test renders.
    if (viewport) {
      if (bodyStyle === null) document.body.removeAttribute('style');
      else document.body.setAttribute('style', bodyStyle);
    }
  }
}

// Each spec covers its component in the default light theme plus at least one
// dark and one high-contrast variant, the two ambient modes the provider drives.
export const snapshotDark = (
  name: string,
  content: TemplateResult,
  options: Omit<SnapshotOptions, 'theme'> = {},
) => snapshot(name, content, { ...options, theme: 'dark' });

export const snapshotContrast = (
  name: string,
  content: TemplateResult,
  options: Omit<SnapshotOptions, 'contrast'> = {},
) => snapshot(name, content, { ...options, contrast: 'high' });
