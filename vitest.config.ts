import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Storybook-driven tests: every story runs as a test in a real browser, with
// its `play` function as an interaction test and the a11y addon running axe.

// v8 coverage only instruments Chromium, so a --coverage run is Chromium-only;
// a plain `vitest` run adds Firefox for cross-browser confidence. (Visual
// regression is a separate run — see vitest.visual.config.ts.)
const withCoverage = process.argv.includes('--coverage');
const chromiumOnly = withCoverage;

export default defineConfig({
  plugins: [storybookTest({ configDir: '.storybook' })],
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
