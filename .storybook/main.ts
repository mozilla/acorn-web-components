import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
  // CSS handling (litCssPlugin for component `*.css` imports, plus the
  // LightningCSS config that preserves `light-dark()`) lives in the root
  // vite.config.ts, which Storybook's Vite builder loads and merges.
};

export default config;
