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
      // Fill the canvas, but hug content in docs so each example isn't 100vh.
      const minHeight = context.viewMode === 'docs' ? 'auto' : '100vh';
      // Drive the real provider for a faithful preview, and let it own the
      // themed canvas (Storybook's backgrounds/grid/outline are disabled below).
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
    // The decorator supplies its own padding, so drop Storybook's padded layout.
    layout: 'fullscreen',
    // The provider owns the canvas + light/dark, so disable the tools that
    // conflict (backgrounds/grid) or no-op through shadow DOM (outline).
    backgrounds: { disable: true, grid: { disable: true } },
    outline: { disable: true },
    // "Show code" shows just the component usage, not the decorator wrappers.
    docs: { source: { excludeDecorators: true } },
    options: {
      storySort: {
        method: 'alphabetical',
      },
    },
  },
};

export default preview;
