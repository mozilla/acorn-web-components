import type { Preview } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../src/generated/tokens.css';
import '../src/base.css';
import '../src/components/moz-provider/moz-provider';

const preview: Preview = {
  initialGlobals: {
    theme: 'auto',
    contrast: 'normal',
  },
  globalTypes: {
    theme: {
      description: 'Nova colour scheme',
      toolbar: {
        title: 'Scheme',
        icon: 'circlehollow',
        items: ['light', 'dark', 'auto'],
        dynamicTitle: true,
      },
    },
    contrast: {
      // Preview approximation: high contrast applies prefers-contrast AND
      // forced-colors together (they ship as separate @media layers in prod).
      description: 'High contrast (prefers-contrast + forced-colors)',
      toolbar: {
        title: 'Contrast',
        icon: 'contrast',
        items: [
          { value: 'normal', title: 'Normal' },
          { value: 'high', title: 'High contrast' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (story, context) => {
      const { theme, contrast } = context.globals;
      // Fill the viewport in the story canvas, but hug content in docs so each
      // embedded example is sized to its content rather than 100vh tall.
      const minHeight = context.viewMode === 'docs' ? 'auto' : '100vh';
      // Drive the real provider so the preview is faithful (foundation +
      // component token overrides), not an attribute approximation. The provider
      // owns the themed canvas, so Storybook's backgrounds/grid/outline tools are
      // disabled in parameters (they'd paint over it or no-op through shadow DOM).
      return html`<moz-provider
        theme=${theme}
        .contrast=${contrast === 'high' ? 'high' : 'auto'}
      >
        <div
          style="background: var(--background-color-canvas); color: var(--text-color); padding: 1.5rem; min-height: ${minHeight}; box-sizing: border-box;"
        >
          ${story()}
        </div>
      </moz-provider>`;
    },
  ],
  parameters: {
    a11y: { test: 'error' },
    // Full-bleed canvas: the decorator supplies its own padding, so drop
    // Storybook's default padded layout.
    layout: 'fullscreen',
    // The provider owns the themed canvas + light/dark, so disable the tools
    // that would conflict with it (backgrounds/grid) or no-op through shadow
    // DOM (outline). Use the Scheme toggle instead.
    backgrounds: { disable: true, grid: { disable: true } },
    outline: { disable: true },
    docs: {
      // Show only the component usage in "Show code", not the provider/theme
      // wrapper the decorators add. Does not affect how stories render.
      source: { excludeDecorators: true },
    },
  },
};

export default preview;
