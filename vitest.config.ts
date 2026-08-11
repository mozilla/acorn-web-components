import { resolve } from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Storybook-driven tests: every story runs as a test in a real browser, with
// its `play` function as an interaction test and the a11y addon running axe.

// v8 coverage only instruments Chromium, so a --coverage run is Chromium-only.
// The visual run (VISUAL=1, see scripts/CI) is also Chromium-only, since its
// baselines are pixel-specific to one browser. A plain `vitest` run adds Firefox
// for cross-browser confidence.
const withCoverage = process.argv.includes('--coverage');
const visual = process.env.VISUAL === '1';
const chromiumOnly = withCoverage || visual;

export default defineConfig({
  plugins: [storybookTest({ configDir: '.storybook' })],
  // __VISUAL__ gates the toMatchScreenshot helper: screenshots run only in the
  // visual pass, so normal test/coverage runs stay fast and platform-agnostic.
  define: { __VISUAL__: JSON.stringify(visual) },
  // The run logs "Multiple versions of Lit loaded" — a known upstream Storybook
  // bug (storybookjs/storybook#31507), dev/test-only and harmless.
  test: {
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: chromiumOnly
        ? [{ browser: 'chromium' }]
        : [{ browser: 'chromium' }, { browser: 'firefox' }],
      // Keep baselines out of src/: collect them under tests/visual/<component>/
      // instead of a __screenshots__ dir beside each story. Still namespaced by
      // browser + platform, so the Linux baselines never collide with local ones.
      resolveScreenshotPath: ({
        arg,
        ext,
        root,
        testFileName,
        browserName,
      }) => {
        const component = testFileName.replace(/\.stories\.tsx?$/, '');
        return resolve(
          root,
          'tests/visual',
          component,
          `${arg}-${browserName}-${process.platform}${ext}`,
        );
      },
    },
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: [
        'src/generated/**',
        'src/**/*.stories.ts',
        'src/**/index.ts',
        'src/index.ts',
        'src/react/**',
        'src/test-support/**',
      ],
      // A regression floor just under current coverage; ratchet up as the
      // suite grows.
      thresholds: {
        statements: 92,
        lines: 92,
        functions: 100,
        branches: 72,
      },
    },
  },
});
