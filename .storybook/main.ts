import type { StorybookConfig } from '@storybook/web-components-vite';
import { mergeConfig } from 'vite';
import { litCssPlugin } from '../litcss.js';

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
  // Transform component `*.css` imports (Storybook and the Vitest run reuse this).
  viteFinal: async (cfg) => mergeConfig(cfg, { plugins: [litCssPlugin()] }),
};

export default config;
