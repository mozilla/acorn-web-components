import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { litCssPlugin } from './litcss.ts';

// Visual-regression run (`npm run test:visual`), separate from the Storybook
// tests: Vitest anchors baselines to the test file's directory, so specs live in
// tests/visual/ to keep baselines out of src/. Chromium-only, Linux-authoritative;
// refresh with `npm run test:visual:update:docker`.
export default defineConfig({
  plugins: [litCssPlugin()],
  resolve: {
    dedupe: ['lit', '@lit/context'],
  },
  test: {
    include: ['tests/visual/**/*.visual.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
